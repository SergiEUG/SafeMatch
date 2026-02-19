const { Message, Match } = require('../models');
const filterService = require('./filterService');

class ChatService {
  /**
   * Enviar mensaje en un chat
   */
  async enviarMensaje(matchId, remitenteId, contenido, tipo = 'texto') {
    // Verificar match activo
    const match = await Match.findById(matchId);
    if (!match || match.estado !== 'activo') {
      throw new Error('Match no encontrado o no activo');
    }

    // Verificar que el remitente es parte del match
    const esParteDelMatch = match.usuarios.some(
      u => u.toString() === remitenteId.toString()
    );
    if (!esParteDelMatch) {
      throw new Error('No tienes permiso para enviar mensajes en este chat');
    }

    // Filtrar contenido ofensivo
    const resultadoFiltro = filterService.verificarContenido(contenido);
    let contenidoFinal = contenido;
    let fueFiltrado = false;
    let contenidoOriginal = null;

    if (resultadoFiltro.esOfensivo) {
      const censurado = filterService.censurarContenido(contenido);
      contenidoOriginal = contenido;
      contenidoFinal = censurado.textoCensurado;
      fueFiltrado = true;
    }

    // Crear mensaje
    const mensaje = await Message.create({
      match: matchId,
      remitente: remitenteId,
      contenido: contenidoFinal,
      tipo,
      filtrado: fueFiltrado,
      contenidoOriginal: fueFiltrado ? contenidoOriginal : null,
    });

    // Actualizar ultima actividad del match
    match.ultimaActividad = new Date();
    await match.save();

    // Poblar remitente
    await mensaje.populate('remitente', 'nombre fotos');

    return {
      mensaje,
      fueFiltrado,
      advertencia: fueFiltrado 
        ? 'Tu mensaje contenia contenido inapropiado y fue modificado' 
        : null,
    };
  }

  /**
   * Obtener historial de mensajes
   */
  async obtenerHistorial(matchId, userId, opciones = {}) {
    const { limite = 50, antes = null } = opciones;

    // Verificar match
    const match = await Match.findById(matchId);
    if (!match) {
      throw new Error('Match no encontrado');
    }

    // Verificar permisos
    const esParteDelMatch = match.usuarios.some(
      u => u.toString() === userId.toString()
    );
    if (!esParteDelMatch) {
      throw new Error('No tienes permiso para ver este chat');
    }

    // Obtener mensajes
    const mensajes = await Message.obtenerHistorial(matchId, { limite, antes });

    // Marcar mensajes como leidos
    await Message.marcarComoLeidos(matchId, userId);

    return {
      mensajes: mensajes.reverse(), // Ordenar del mas antiguo al mas reciente
      hayMas: mensajes.length === limite,
    };
  }

  /**
   * Obtener todas las conversaciones de un usuario
   */
  async getConversations(userId) {
    const matches = await Match.find({
      usuarios: userId,
      estado: 'activo',
    }).populate('usuarios', 'nombre fotos');

    const conversations = await Promise.all(
      matches.map(async (match) => {
        const lastMessage = await Message.findOne({ match: match._id })
          .sort({ createdAt: -1 })
          .lean();
        
        const otherUser = match.usuarios.find(
          (user) => user._id.toString() !== userId.toString()
        );

        const unreadCount = await Message.countDocuments({
          match: match._id,
          remitente: { $ne: userId },
          'leidoPor.usuario': { $ne: userId }
        });

        return {
          matchId: match._id,
          otherUser,
          lastMessage,
          unreadCount,
          ultimaActividad: match.ultimaActividad,
        };
      })
    );

    // Filtrar conversaciones sin mensajes y ordenarlas
    const sortedConversations = conversations
      .filter(c => c.lastMessage) // Solo incluir conversaciones con al menos un mensaje
      .sort((a, b) => new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt));

    return sortedConversations;
  }

  /**
   * Marcar mensajes como leidos
   */
  async marcarComoLeidos(matchId, userId) {
    const resultado = await Message.marcarComoLeidos(matchId, userId);
    return { mensajesActualizados: resultado.modifiedCount };
  }

  /**
   * Contar mensajes no leidos de un usuario
   */
  async contarNoLeidos(userId) {
    // Obtener todos los matches del usuario
    const matches = await Match.find({
      usuarios: userId,
      estado: 'activo',
    });

    let totalNoLeidos = 0;
    const noLeidosPorMatch = [];

    for (const match of matches) {
      const noLeidos = await Message.contarNoLeidos(match._id, userId);
      if (noLeidos > 0) {
        noLeidosPorMatch.push({
          matchId: match._id,
          noLeidos,
        });
        totalNoLeidos += noLeidos;
      }
    }

    return {
      total: totalNoLeidos,
      porMatch: noLeidosPorMatch,
    };
  }

  /**
   * Eliminar mensaje (soft delete)
   */
  async eliminarMensaje(mensajeId, userId) {
    const mensaje = await Message.findById(mensajeId);

    if (!mensaje) {
      throw new Error('Mensaje no encontrado');
    }

    // Solo el remitente puede eliminar su mensaje
    if (mensaje.remitente.toString() !== userId.toString()) {
      throw new Error('No puedes eliminar este mensaje');
    }

    // Verificar que el mensaje no es muy antiguo (24 horas)
    const limiteHoras = 24;
    const tiempoLimite = new Date(Date.now() - limiteHoras * 60 * 60 * 1000);
    if (mensaje.createdAt < tiempoLimite) {
      throw new Error('No puedes eliminar mensajes de hace mas de 24 horas');
    }

    mensaje.metadata.eliminado = true;
    mensaje.metadata.fechaEliminacion = new Date();
    mensaje.contenido = '[Mensaje eliminado]';
    await mensaje.save();

    return { mensaje: 'Mensaje eliminado' };
  }

  /**
   * Crear mensaje de sistema
   */
  async crearMensajeSistema(matchId, contenido) {
    const mensaje = await Message.create({
      match: matchId,
      remitente: null,
      contenido,
      tipo: 'sistema',
      estado: 'entregado',
    });

    return mensaje;
  }
}

module.exports = new ChatService();
