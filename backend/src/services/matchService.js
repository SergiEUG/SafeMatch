const { Match, Like, User, Message } = require('../models');

class MatchService {
  /**
   * Dar like a un usuario
   * @returns {Object} { esMatch: boolean, match?: Match }
   */
  async darLike(userId, targetId) {
    // Verificar que no sea el mismo usuario
    if (userId.toString() === targetId.toString()) {
      throw new Error('No puedes darte like a ti mismo');
    }

    // Verificar que el usuario objetivo existe y esta activo
    const usuarioObjetivo = await User.findById(targetId);
    if (!usuarioObjetivo || usuarioObjetivo.estado !== 'activo') {
      throw new Error('Usuario no encontrado o no disponible');
    }

    // Verificar si ya existe interaccion
    const interaccionExistente = await Like.findOne({
      de: userId,
      para: targetId,
    });

    if (interaccionExistente) {
      throw new Error('Ya has interactuado con este usuario');
    }

    // Crear el like
    await Like.create({
      de: userId,
      para: targetId,
      tipo: 'like',
    });

    // Verificar si hay match mutuo
    const likeMutuo = await Like.findOne({
      de: targetId,
      para: userId,
      tipo: 'like',
    });

    if (likeMutuo) {
      // Crear match
      const match = await Match.create({
        usuarios: [userId, targetId],
        likes: [
          { usuario: targetId, fecha: likeMutuo.createdAt },
          { usuario: userId, fecha: new Date() },
        ],
        callPermissions: [
          { userId: userId, status: 'PENDING' },
          { userId: targetId, status: 'PENDING' }
        ],
      });

      // Poblar datos del match
      
      await match.populate('usuarios', 'nombre fotos');
      
      // Crear mensaje de sistema inicial para activar el chat
      try {
        await Message.create({
          match: match._id,
          remitente: null,
          contenido: '¡Habéis hecho un match! Ya podéis empezar a hablar.',
          tipo: 'sistema'
        });
      } catch (e) { console.error("Error al crear mensaje inicial:", e); }


      return {
        esMatch: true,
        match,
      };
    }

    return {
      esMatch: false,
    };
  }

  /**
   * Dar dislike a un usuario
   */
  async darDislike(userId, targetId) {
    // Verificar que no sea el mismo usuario
    if (userId.toString() === targetId.toString()) {
      throw new Error('No puedes darte dislike a ti mismo');
    }

    // Verificar si ya existe interaccion
    const interaccionExistente = await Like.findOne({
      de: userId,
      para: targetId,
    });

    if (interaccionExistente) {
      throw new Error('Ya has interactuado con este usuario');
    }

    // Crear el dislike
    await Like.create({
      de: userId,
      para: targetId,
      tipo: 'dislike',
    });

    return { mensaje: 'Dislike registrado' };
  }

  /**
   * Obtener todos los matches de un usuario
   */
  async obtenerMatches(userId) {
    const matches = await Match.obtenerMatchesDeUsuario(userId);

    return matches; // Return the raw, populated matches array
  }

  /**
   * Obtener un match especifico
   */
  async obtenerMatch(matchId, userId) {
    const match = await Match.findById(matchId)
      .populate('usuarios', 'nombre fotos biografia intereses ultimaConexion');

    if (!match) {
      throw new Error('Match no encontrado');
    }

    // Verificar que el usuario es parte del match
    const esParteDelMatch = match.usuarios.some(
      u => u._id.toString() === userId.toString()
    );

    if (!esParteDelMatch) {
      throw new Error('No tienes permiso para ver este match');
    }

    return match;
  }

  /**
   * Eliminar match (unmatch)
   */
  async eliminarMatch(matchId, userId) {
    const match = await Match.findById(matchId);

    if (!match) {
      throw new Error('Match no encontrado');
    }

    // Verificar que el usuario es parte del match
    const esParteDelMatch = match.usuarios.some(
      u => u.toString() === userId.toString()
    );

    if (!esParteDelMatch) {
      throw new Error('No tienes permiso para eliminar este match');
    }

    // Cambiar estado a eliminado
    match.estado = 'eliminado';
    await match.save();

    return { mensaje: 'Match eliminado exitosamente' };
  }

  /**
   * Solicitar compartir contacto
   */
  async solicitarCompartirContacto(matchId, userId) {
    const match = await Match.findById(matchId);

    if (!match || match.estado !== 'activo') {
      throw new Error('Match no encontrado o no activo');
    }

    // Verificar que el usuario es parte del match
    const esParteDelMatch = match.usuarios.some(
      u => u.toString() === userId.toString()
    );

    if (!esParteDelMatch) {
      throw new Error('No tienes permiso para esta accion');
    }

    // Verificar si ya se compartio contacto
    if (match.contactoCompartido.compartido) {
      throw new Error('El contacto ya ha sido compartido');
    }

    // Verificar si ya hay solicitud pendiente
    if (match.contactoCompartido.solicitadoPor) {
      throw new Error('Ya hay una solicitud de contacto pendiente');
    }

    // Registrar solicitud
    match.contactoCompartido.solicitadoPor = userId;
    match.contactoCompartido.fechaSolicitud = new Date();
    await match.save();

    return { mensaje: 'Solicitud de contacto enviada' };
  }

  /**
   * Confirmar compartir contacto
   */
  async confirmarCompartirContacto(matchId, userId) {
    const match = await Match.findById(matchId);

    if (!match || match.estado !== 'activo') {
      throw new Error('Match no encontrado o no activo');
    }

    // Verificar que el usuario es parte del match
    const esParteDelMatch = match.usuarios.some(
      u => u.toString() === userId.toString()
    );

    if (!esParteDelMatch) {
      throw new Error('No tienes permiso para esta accion');
    }

    // Verificar que hay solicitud pendiente y no es del mismo usuario
    if (!match.contactoCompartido.solicitadoPor) {
      throw new Error('No hay solicitud de contacto pendiente');
    }

    if (match.contactoCompartido.solicitadoPor.toString() === userId.toString()) {
      throw new Error('No puedes confirmar tu propia solicitud');
    }

    // Confirmar compartir contacto
    match.contactoCompartido.aceptadoPor = userId;
    match.contactoCompartido.compartido = true;
    match.contactoCompartido.fechaAceptacion = new Date();
    await match.save();

    // Obtener datos de contacto de ambos usuarios
    const usuarios = await User.find({
      _id: { $in: match.usuarios },
    }).select('nombre contacto');

    return {
      mensaje: 'Contacto compartido exitosamente',
      contactos: usuarios.map(u => ({
        id: u._id,
        nombre: u.nombre,
        contacto: u.contacto,
      })),
    };
  }

  /**
   * Verificar si dos usuarios tienen match activo
   */
  async verificarMatch(userId1, userId2) {
    const match = await Match.tienenMatch(userId1, userId2);
    return !!match;
  }

  /**
   * Obtener usuarios que te dieron like (para funcion premium)
   */
  async obtenerLikesRecibidos(userId) {
    const likes = await Like.obtenerLikesRecibidos(userId);
    return likes;
  }
}

module.exports = new MatchService();
