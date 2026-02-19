const { User, Like, Match } = require('../models');

class UserService {
  /**
   * Obtener usuarios para descubrir (potenciales matches)
   */
  async descubrirUsuarios(userId, opciones = {}) {
    const { pagina = 1, limite = 10 } = opciones;
    const skip = (pagina - 1) * limite;

    // Obtener usuario actual con sus preferencias
    const usuarioActual = await User.findById(userId);
    if (!usuarioActual) {
      throw new Error('Usuario no encontrado');
    }

    // Obtener IDs de usuarios con los que ya interactuo
    const interacciones = await Like.find({ de: userId }).select('para');
    const idsInteractuados = interacciones.map(i => i.para);

    // Obtener IDs de usuarios con match
    const matches = await Match.find({
      usuarios: userId,
      estado: 'activo',
    });
    const idsConMatch = matches.flatMap(m => 
      m.usuarios.filter(u => u.toString() !== userId.toString())
    );

    // IDs a excluir (el propio usuario + interactuados + matches)
    const idsExcluir = [userId, ...idsInteractuados, ...idsConMatch];

    // Construir query de busqueda
    const query = {
      _id: { $nin: idsExcluir },
      estado: 'activo',
    };

    // Filtrar por genero buscado
    if (usuarioActual.busco && !usuarioActual.busco.includes('todos')) {
      query.genero = { $in: usuarioActual.busco };
    }

    // Filtrar por rango de edad
    const hoy = new Date();
    const edadMin = usuarioActual.configuracion?.rangoEdad?.min || 18;
    const edadMax = usuarioActual.configuracion?.rangoEdad?.max || 99;

    const fechaMaxNacimiento = new Date(
      hoy.getFullYear() - edadMin,
      hoy.getMonth(),
      hoy.getDate()
    );
    const fechaMinNacimiento = new Date(
      hoy.getFullYear() - edadMax - 1,
      hoy.getMonth(),
      hoy.getDate()
    );

    query.fechaNacimiento = {
      $gte: fechaMinNacimiento,
      $lte: fechaMaxNacimiento,
    };

    // Buscar usuarios
    const usuarios = await User.find(query)
      .select('nombre fechaNacimiento genero fotos biografia intereses ubicacion.ciudad')
      .skip(skip)
      .limit(limite)
      .lean();

    // Añadir edad calculada a cada usuario
    const usuariosConEdad = usuarios.map(u => ({
      ...u,
      edad: this.calcularEdad(u.fechaNacimiento),
    }));

    // Contar total
    const total = await User.countDocuments(query);

    return {
      usuarios: usuariosConEdad,
      paginacion: {
        pagina,
        limite,
        total,
        paginas: Math.ceil(total / limite),
      },
    };
  }

  /**
   * Obtener perfil de usuario (solo si hay match)
   */
  async obtenerPerfil(userId, targetId) {
    // Verificar si hay match entre los usuarios
    const match = await Match.tienenMatch(userId, targetId);
    
    if (!match && userId.toString() !== targetId.toString()) {
      throw new Error('No tienes permiso para ver este perfil');
    }

    const usuario = await User.findById(targetId)
      .select('-refreshToken -password');

    if (!usuario) {
      throw new Error('Usuario no encontrado');
    }

    return {
      ...usuario.toObject(),
      edad: usuario.calcularEdad(),
    };
  }

  /**
   * Actualizar perfil propio
   */
  async actualizarPerfil(userId, datosActualizados) {
    // Campos que se pueden actualizar
    const camposPermitidos = [
      'nombre',
      'biografia',
      'fotos',
      'intereses',
      'ubicacion',
      'busco',
      'configuracion',
      'contacto',
    ];

    // Filtrar solo campos permitidos
    const actualizacion = {};
    for (const campo of camposPermitidos) {
      if (datosActualizados[campo] !== undefined) {
        actualizacion[campo] = datosActualizados[campo];
      }
    }

    // Normalizar ubicacion para compatibilidad con indices geoespaciales existentes en la BD.
    // Si llega solo { ciudad }, mantener coordinates actuales si existen, o setear defaults validos.
    if (actualizacion.ubicacion !== undefined) {
      const incoming = actualizacion.ubicacion || {};
      const current = await User.findById(userId).select('ubicacion').lean();
      const prevUbicacion = current?.ubicacion || {};

      const merged = {
        type: incoming.type || prevUbicacion.type || 'Point',
        coordinates: Array.isArray(incoming.coordinates)
          ? incoming.coordinates
          : (Array.isArray(prevUbicacion.coordinates) ? prevUbicacion.coordinates : [0, 0]),
        ciudad: incoming.ciudad !== undefined ? incoming.ciudad : (prevUbicacion.ciudad || ''),
      };

      // Coerción mínima de seguridad: si coordinates viene mal, usar default.
      if (
        !Array.isArray(merged.coordinates) ||
        merged.coordinates.length !== 2 ||
        merged.coordinates.some(n => typeof n !== 'number' || Number.isNaN(n))
      ) {
        merged.coordinates = [0, 0];
      }

      actualizacion.ubicacion = merged;
    }

    const usuario = await User.findByIdAndUpdate(
      userId,
      { $set: actualizacion },
      { new: true, runValidators: true }
    ).select('-refreshToken -password');

    if (!usuario) {
      throw new Error('Usuario no encontrado');
    }

    return usuario;
  }

  /**
   * Eliminar cuenta
   */
  async eliminarCuenta(userId) {
    const usuario = await User.findByIdAndUpdate(
      userId,
      {
        estado: 'eliminado',
        email: `deleted_${userId}@deleted.com`,
        nombre: 'Usuario Eliminado',
        fotos: [],
        biografia: '',
        intereses: [],
        refreshToken: null,
      },
      { new: true }
    );

    if (!usuario) {
      throw new Error('Usuario no encontrado');
    }

    // Marcar todos los matches como eliminados
    await Match.updateMany(
      { usuarios: userId },
      { estado: 'eliminado' }
    );

    return { mensaje: 'Cuenta eliminada exitosamente' };
  }

  /**
   * Pausar/reactivar cuenta
   */
  async cambiarEstadoCuenta(userId, nuevoEstado) {
    if (!['activo', 'pausado'].includes(nuevoEstado)) {
      throw new Error('Estado invalido');
    }

    const usuario = await User.findByIdAndUpdate(
      userId,
      { estado: nuevoEstado },
      { new: true }
    ).select('-refreshToken -password');

    if (!usuario) {
      throw new Error('Usuario no encontrado');
    }

    return usuario;
  }

  /**
   * Compartir informacion de contacto (telefono) con un match
   */
  async compartirContactoConMatch(solicitanteId, matchId, io) {
    // 1. Validar que el match existe y esta activo
    const match = await Match.findOne({
      _id: matchId,
      usuarios: solicitanteId,
      estado: 'activo',
    });

    if (!match) {
      throw new Error('Match no encontrado o no valido.');
    }

    // 2. Identificar el ID del otro usuario en el match
    const targetId = match.usuarios.find(
      (id) => id.toString() !== solicitanteId.toString()
    );

    // 3. Obtener los datos del usuario solicitante
    const solicitante = await User.findById(solicitanteId).select('contacto.telefono');
    if (!solicitante || !solicitante.contacto.telefono) {
      throw new Error('Tu numero de telefono no esta disponible para compartir. Por favor, agregalo en tu perfil.');
    }

    // Lógica de doble verificación para compartir contacto
    if (match.contactoCompartido.compartido) {
      // Ya se ha compartido, devolver el numero del solicitante
      const targetUser = await User.findById(targetId).select('contacto.telefono');
      
      const responseData = {
        mensaje: 'El contacto ya ha sido compartido mutuamente.',
        datos: { telefono: solicitante.contacto.telefono, telefonoMatch: targetUser.contacto.telefono },
      };

      // Emitir el estado actual por WS para consistencia si se recarga (redundante pero seguro)
      if (io) {
        const room = `match:${match._id}`;
        io.to(room).emit('contact:status-update', {
          matchId: match._id,
          contactoCompartido: match.contactoCompartido,
          currentUserId: solicitanteId, // Context for the frontend
          otherUserName: (await User.findById(targetId).select('nombre'))?.nombre || 'Alguien', // Other user's name
          myPhoneNumber: solicitante.contacto.telefono,
          otherUserPhoneNumber: targetUser.contacto.telefono,
        });
      }
      return responseData;
    }

    let resultMessage = '';
    let updatedMatchContactoCompartido = { ...match.contactoCompartido };
    const solicitanteUser = await User.findById(solicitanteId).select('nombre');
    let solicitanteNombre = solicitanteUser ? solicitanteUser.nombre : 'Alguien';
    const targetUserInMatch = await User.findById(targetId).select('nombre');
    let targetUserName = targetUserInMatch ? targetUserInMatch.nombre : 'Alguien';
    let myPhoneNumber = ''; // Phone number of the user making the request
    let otherUserPhoneNumber = ''; // Phone number of the other user in the match

    if (
      match.contactoCompartido.solicitadoPor &&
      match.contactoCompartido.solicitadoPor.toString() === targetId.toString()
    ) {
      // The other user already requested, this is the accept.
      updatedMatchContactoCompartido.aceptadoPor = solicitanteId;
      updatedMatchContactoCompartido.compartido = true;
      updatedMatchContactoCompartido.fechaAceptacion = Date.now();
      match.contactoCompartido = updatedMatchContactoCompartido; // Update match object
      await match.save();

      const targetUser = await User.findById(targetId).select('contacto.telefono'); // This is the user who initiated the first request
      
      myPhoneNumber = solicitante.contacto.telefono; // My phone
      otherUserPhoneNumber = targetUser.contacto.telefono; // Other user's phone
      resultMessage = '¡Contacto compartido mutuamente!';

    } else if (
      match.contactoCompartido.solicitadoPor &&
      match.contactoCompartido.solicitadoPor.toString() === solicitanteId.toString()
    ) {
      // Request already sent by the same user
      resultMessage = 'Ya enviaste una solicitud para compartir contacto. Esperando respuesta.';
      // No change to match.contactoCompartido, but emit current status for consistency
    } else {
      // New request
      updatedMatchContactoCompartido.solicitadoPor = solicitanteId;
      updatedMatchContactoCompartido.fechaSolicitud = Date.now();
      match.contactoCompartido = updatedMatchContactoCompartido; // Update match object
      await match.save();
      resultMessage = 'Solicitud para compartir contacto enviada. Esperando que el otro usuario acepte.';
    }

    // Prepare WebSocket event payload
    const eventPayload = {
      matchId: match._id,
      contactoCompartido: match.contactoCompartido, // Send the full updated object
      currentUserId: solicitanteId, // The user who just performed an action
      otherUserName: targetUserName, // Name of the other user in the match
      solicitanteNombre: solicitanteNombre, // Name of the user who initiated the action (for messages)
    };

    if (match.contactoCompartido.compartido) {
      eventPayload.myPhoneNumber = myPhoneNumber;
      eventPayload.otherUserPhoneNumber = otherUserPhoneNumber;
    }

    // Emitir evento WebSocket a ambos usuarios en la sala del match
    if (io) {
      const room = `match:${match._id}`;
      io.to(room).emit('contact:status-update', eventPayload);
    }

    // Return the appropriate message and data to the requesting client
    const responseData = { mensaje: resultMessage };
    if (match.contactoCompartido.compartido) {
      responseData.datos = {
        miTelefono: myPhoneNumber,
        telefonoMatch: otherUserPhoneNumber,
      };
    }
    return responseData;      }
  /**
   * Calcular edad desde fecha de nacimiento
   */
  calcularEdad(fechaNacimiento) {
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();

    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }

    return edad;
  }

  /**
   * Actualizar ultima conexion
   */
  async actualizarUltimaConexion(userId) {
    await User.findByIdAndUpdate(userId, {
      ultimaConexion: new Date(),
    });
  }
}

module.exports = new UserService();

