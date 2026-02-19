const { CallPermission, Match } = require('../models');

class CallService {
  /**
   * Solicitar permiso para llamada
   */
  async solicitarLlamada(matchId, solicitanteId, tipo = 'video') {
    // Verificar match activo
    const match = await Match.findById(matchId);
    if (!match || match.estado !== 'activo') {
      throw new Error('Match no encontrado o no activo');
    }

    // Verificar que el solicitante es parte del match
    const esParteDelMatch = match.usuarios.some(
      u => u.toString() === solicitanteId.toString()
    );
    if (!esParteDelMatch) {
      throw new Error('No tienes permiso para esta accion');
    }

    // Obtener el receptor
    const receptorId = match.usuarios.find(
      u => u.toString() !== solicitanteId.toString()
    );

    // Verificar consentimiento mutuo para llamadas
    const solicitantePermiso = match.callPermissions.find(p => p.userId.toString() === solicitanteId.toString());
    const receptorPermiso = match.callPermissions.find(p => p.userId.toString() === receptorId.toString());

    if (!solicitantePermiso || !receptorPermiso || solicitantePermiso.status !== 'ACCEPTED' || receptorPermiso.status !== 'ACCEPTED') {
      throw new Error('Ambos usuarios deben aceptar recibir llamadas para poder iniciar una.');
    }

    // Verificar si ya hay una llamada activa
    const llamadaActiva = await CallPermission.tienePermisoActivo(matchId);
    if (llamadaActiva) {
      throw new Error('Ya hay una llamada activa en este match');
    }

    // Crear solicitud de llamada
    const permiso = await CallPermission.crearSolicitud(
      matchId,
      solicitanteId,
      receptorId,
      tipo
    );

    await permiso.populate('solicitante', 'nombre fotos');
    await permiso.populate('receptor', 'nombre fotos');

    return permiso;
  }

  /**
   * Aceptar solicitud de llamada
   */
  async aceptarLlamada(permisoId, userId) {
    const permiso = await CallPermission.findById(permisoId);

    if (!permiso) {
      throw new Error('Solicitud de llamada no encontrada');
    }

    // Verificar que el usuario es el receptor
    if (permiso.receptor.toString() !== userId.toString()) {
      throw new Error('No puedes aceptar esta solicitud');
    }

    // Verificar estado
    if (permiso.estado !== 'pendiente') {
      throw new Error('Esta solicitud ya fue procesada o expiro');
    }

    // Verificar expiracion
    if (new Date() > permiso.expiraEn) {
      permiso.estado = 'expirada';
      await permiso.save();
      throw new Error('La solicitud de llamada ha expirado');
    }

    // Aceptar
    await permiso.aceptar();

    return permiso;
  }

  /**
   * Rechazar solicitud de llamada
   */
  async rechazarLlamada(permisoId, userId) {
    const permiso = await CallPermission.findById(permisoId);

    if (!permiso) {
      throw new Error('Solicitud de llamada no encontrada');
    }

    // Verificar que el usuario es el receptor
    if (permiso.receptor.toString() !== userId.toString()) {
      throw new Error('No puedes rechazar esta solicitud');
    }

    // Verificar estado
    if (permiso.estado !== 'pendiente') {
      throw new Error('Esta solicitud ya fue procesada');
    }

    // Rechazar
    await permiso.rechazar();

    return permiso;
  }

  /**
   * Cancelar solicitud de llamada (por el solicitante)
   */
  async cancelarLlamada(permisoId, userId) {
    const permiso = await CallPermission.findById(permisoId);

    if (!permiso) {
      throw new Error('Solicitud de llamada no encontrada');
    }

    // Verificar que el usuario es el solicitante
    if (permiso.solicitante.toString() !== userId.toString()) {
      throw new Error('No puedes cancelar esta solicitud');
    }

    // Verificar estado
    if (permiso.estado !== 'pendiente') {
      throw new Error('Esta solicitud ya fue procesada');
    }

    permiso.estado = 'cancelada';
    await permiso.save();

    return permiso;
  }

  /**
   * Iniciar la llamada (despues de aceptada)
   */
  async iniciarLlamada(permisoId, userId) {
    const permiso = await CallPermission.findById(permisoId);

    if (!permiso) {
      throw new Error('Permiso de llamada no encontrado');
    }

    // Verificar que el usuario es parte de la llamada
    const esParte = [permiso.solicitante.toString(), permiso.receptor.toString()]
      .includes(userId.toString());
    if (!esParte) {
      throw new Error('No eres parte de esta llamada');
    }

    // Verificar que fue aceptada
    if (permiso.estado !== 'aceptada') {
      throw new Error('La llamada no ha sido aceptada');
    }

    // Iniciar
    await permiso.iniciarLlamada();

    return permiso;
  }

  /**
   * Finalizar llamada
   */
  async finalizarLlamada(permisoId, userId) {
    const permiso = await CallPermission.findById(permisoId);

    if (!permiso) {
      throw new Error('Llamada no encontrada');
    }

    // Verificar que el usuario es parte de la llamada
    const esParte = [permiso.solicitante.toString(), permiso.receptor.toString()]
      .includes(userId.toString());
    if (!esParte) {
      throw new Error('No eres parte de esta llamada');
    }

    // Finalizar
    await permiso.finalizarLlamada(userId);

    return permiso;
  }

  /**
   * Obtener llamada activa de un match
   */
  async obtenerLlamadaActiva(matchId) {
    const llamada = await CallPermission.findOne({
      match: matchId,
      estado: 'aceptada',
      'datosLlamada.finalizada': { $exists: false },
    }).populate('solicitante receptor', 'nombre fotos');

    return llamada;
  }

  /**
   * Obtener historial de llamadas de un match
   */
  async obtenerHistorialLlamadas(matchId, limite = 20) {
    const llamadas = await CallPermission.find({
      match: matchId,
      estado: { $in: ['aceptada', 'rechazada', 'cancelada'] },
    })
    .sort({ createdAt: -1 })
    .limit(limite)
    .populate('solicitante receptor', 'nombre');

    return llamadas;
  }
}

module.exports = new CallService();
