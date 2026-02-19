const { Match, User } = require('../models');

/**
 * Servicio para gestionar el intercambio de contacto
 * 
 * Sistema de DOBLE VERIFICACIÓN:
 * 1. Usuario A hace clic "Compartir contacto"
 * 2. Sistema pregunta "¿Estás seguro?" (primera verificación)
 * 3. Usuario A confirma
 * 4. Se envía solicitud a Usuario B
 * 5. Usuario B acepta o rechaza
 * 6. Si acepta, ambos reciben el contacto del otro
 */

class ContactShareService {
  /**
   * Solicitar compartir contacto (después de primera confirmación)
   * @param {string} matchId - ID del match
   * @param {string} userId - ID del usuario que solicita
   * @returns {Object} Datos de la solicitud
   */
  async solicitarCompartirContacto(matchId, userId) {
    // Verificar que existe el match
    const match = await Match.findById(matchId);
    if (!match || match.estado !== 'activo') {
      throw new Error('Match no encontrado o no está activo');
    }

    // Verificar que el usuario está en el match
    const estaEnMatch = match.usuarios.some(u => u.toString() === userId);
    if (!estaEnMatch) {
      throw new Error('No tienes permiso para este match');
    }

    // Verificar si ya está compartido
    if (match.contactoCompartido.compartido) {
      throw new Error('El contacto ya ha sido compartido en este match');
    }

    // Verificar si ya hay una solicitud pendiente
    if (match.contactoCompartido.solicitadoPor && 
        !match.contactoCompartido.aceptadoPor) {
      throw new Error('Ya hay una solicitud de contacto pendiente');
    }

    // Crear solicitud
    match.contactoCompartido.solicitadoPor = userId;
    match.contactoCompartido.fechaSolicitud = new Date();
    match.contactoCompartido.aceptadoPor = null;
    match.contactoCompartido.compartido = false;

    await match.save();

    // Obtener datos del solicitante
    const solicitante = await User.findById(userId).select('nombre fotos');

    return {
      matchId: match._id,
      solicitante: {
        id: solicitante._id,
        nombre: solicitante.nombre,
      },
      fechaSolicitud: match.contactoCompartido.fechaSolicitud,
    };
  }

  /**
   * Aceptar solicitud de compartir contacto
   * @param {string} matchId - ID del match
   * @param {string} userId - ID del usuario que acepta
   * @returns {Object} Datos del contacto intercambiado
   */
  async aceptarCompartirContacto(matchId, userId) {
    const match = await Match.findById(matchId);
    if (!match || match.estado !== 'activo') {
      throw new Error('Match no encontrado o no está activo');
    }

    // Verificar que hay una solicitud pendiente
    if (!match.contactoCompartido.solicitadoPor) {
      throw new Error('No hay solicitud de contacto pendiente');
    }

    // Verificar que el que acepta NO es el que solicitó
    if (match.contactoCompartido.solicitadoPor.toString() === userId) {
      throw new Error('No puedes aceptar tu propia solicitud');
    }

    // Verificar que el usuario está en el match
    const estaEnMatch = match.usuarios.some(u => u.toString() === userId);
    if (!estaEnMatch) {
      throw new Error('No tienes permiso para este match');
    }

    // Marcar como compartido
    match.contactoCompartido.aceptadoPor = userId;
    match.contactoCompartido.fechaAceptacion = new Date();
    match.contactoCompartido.compartido = true;

    await match.save();

    // Obtener datos de contacto de ambos usuarios
    const [usuario1, usuario2] = await Promise.all([
      User.findById(match.contactoCompartido.solicitadoPor)
        .select('nombre email contacto'),
      User.findById(userId)
        .select('nombre email contacto'),
    ]);

    return {
      matchId: match._id,
      compartido: true,
      usuarios: [
        {
          id: usuario1._id,
          nombre: usuario1.nombre,
          email: usuario1.email,
          telefono: usuario1.contacto.telefono,
          instagram: usuario1.contacto.instagram,
          whatsapp: usuario1.contacto.whatsapp,
        },
        {
          id: usuario2._id,
          nombre: usuario2.nombre,
          email: usuario2.email,
          telefono: usuario2.contacto.telefono,
          instagram: usuario2.contacto.instagram,
          whatsapp: usuario2.contacto.whatsapp,
        },
      ],
    };
  }

  /**
   * Rechazar solicitud de compartir contacto
   * @param {string} matchId - ID del match
   * @param {string} userId - ID del usuario que rechaza
   */
  async rechazarCompartirContacto(matchId, userId) {
    const match = await Match.findById(matchId);
    if (!match || match.estado !== 'activo') {
      throw new Error('Match no encontrado o no está activo');
    }

    // Verificar que hay una solicitud pendiente
    if (!match.contactoCompartido.solicitadoPor) {
      throw new Error('No hay solicitud de contacto pendiente');
    }

    // Verificar que el que rechaza NO es el que solicitó
    if (match.contactoCompartido.solicitadoPor.toString() === userId) {
      throw new Error('No puedes rechazar tu propia solicitud');
    }

    // Limpiar solicitud
    match.contactoCompartido.solicitadoPor = null;
    match.contactoCompartido.fechaSolicitud = null;
    match.contactoCompartido.aceptadoPor = null;
    match.contactoCompartido.compartido = false;

    await match.save();

    return {
      matchId: match._id,
      rechazado: true,
    };
  }

  /**
   * Cancelar solicitud de compartir contacto (por el solicitante)
   * @param {string} matchId - ID del match
   * @param {string} userId - ID del usuario que cancela
   */
  async cancelarSolicitudContacto(matchId, userId) {
    const match = await Match.findById(matchId);
    if (!match || match.estado !== 'activo') {
      throw new Error('Match no encontrado o no está activo');
    }

    // Verificar que el usuario es quien solicitó
    if (!match.contactoCompartido.solicitadoPor || 
        match.contactoCompartido.solicitadoPor.toString() !== userId) {
      throw new Error('No tienes una solicitud pendiente para cancelar');
    }

    // Limpiar solicitud
    match.contactoCompartido.solicitadoPor = null;
    match.contactoCompartido.fechaSolicitud = null;

    await match.save();

    return {
      matchId: match._id,
      cancelado: true,
    };
  }

  /**
   * Obtener estado de compartir contacto para un match
   * @param {string} matchId - ID del match
   * @param {string} userId - ID del usuario
   */
  async obtenerEstadoContacto(matchId, userId) {
    const match = await Match.findById(matchId);
    if (!match || match.estado !== 'activo') {
      throw new Error('Match no encontrado o no está activo');
    }

    // Verificar permiso
    const estaEnMatch = match.usuarios.some(u => u.toString() === userId);
    if (!estaEnMatch) {
      throw new Error('No tienes permiso para este match');
    }

    return {
      compartido: match.contactoCompartido.compartido,
      hayPendiente: !!match.contactoCompartido.solicitadoPor && !match.contactoCompartido.aceptadoPor,
      solicitadoPorMi: match.contactoCompartido.solicitadoPor?.toString() === userId,
      fechaSolicitud: match.contactoCompartido.fechaSolicitud,
      fechaAceptacion: match.contactoCompartido.fechaAceptacion,
    };
  }
}

module.exports = new ContactShareService();
