const contactShareService = require('../services/contactShareService');
const { Match } = require('../models');
const { obtenerSocketsDeUsuario } = require('../config/socket');

/**
 * Configurar handlers de compartir contacto para Socket.io
 * 
 * Eventos en tiempo real para notificar solicitudes y respuestas
 */
const configurarContactSocket = (io) => {
  io.on('connection', (socket) => {
    const userId = socket.userId;

    /**
     * Notificar solicitud de contacto recibida
     * (Se emite desde el backend cuando alguien hace la solicitud)
     */
    socket.on('contact:request', async (datos, callback) => {
      try {
        const { matchId } = datos;

        // Solicitar compartir contacto
        const resultado = await contactShareService.solicitarCompartirContacto(
          matchId,
          userId
        );

        // Obtener el otro usuario del match
        const match = await Match.findById(matchId);
        const otroUsuarioId = match.usuarios.find(
          u => u.toString() !== userId
        );

        // Notificar al otro usuario en tiempo real
        const socketsReceptor = obtenerSocketsDeUsuario(otroUsuarioId.toString());
        for (const socketId of socketsReceptor) {
          io.to(socketId).emit('contact:request_received', {
            matchId: resultado.matchId,
            solicitante: resultado.solicitante,
            fechaSolicitud: resultado.fechaSolicitud,
          });
        }

        callback?.({
          exito: true,
          data: resultado,
        });

      } catch (error) {
        console.error('Error al solicitar contacto:', error);
        callback?.({
          exito: false,
          error: error.message,
        });
      }
    });

    /**
     * Aceptar solicitud de contacto
     */
    socket.on('contact:accept', async (datos, callback) => {
      try {
        const { matchId } = datos;

        // Aceptar solicitud
        const resultado = await contactShareService.aceptarCompartirContacto(
          matchId,
          userId
        );

        // Notificar al solicitante
        const match = await Match.findById(matchId);
        const solicitanteId = match.contactoCompartido.solicitadoPor.toString();

        const socketsSolicitante = obtenerSocketsDeUsuario(solicitanteId);
        
        // Emitir a ambos usuarios con sus respectivos contactos
        for (const socketId of socketsSolicitante) {
          io.to(socketId).emit('contact:accepted', {
            matchId: resultado.matchId,
            compartido: true,
            contacto: resultado.usuarios.find(u => u.id.toString() !== solicitanteId),
          });
        }

        // Emitir al que aceptó también
        socket.emit('contact:shared', {
          matchId: resultado.matchId,
          compartido: true,
          contacto: resultado.usuarios.find(u => u.id.toString() !== userId),
        });

        callback?.({
          exito: true,
          data: resultado,
        });

      } catch (error) {
        console.error('Error al aceptar contacto:', error);
        callback?.({
          exito: false,
          error: error.message,
        });
      }
    });

    /**
     * Rechazar solicitud de contacto
     */
    socket.on('contact:reject', async (datos, callback) => {
      try {
        const { matchId } = datos;

        const match = await Match.findById(matchId);
        const solicitanteId = match.contactoCompartido.solicitadoPor?.toString();

        // Rechazar solicitud
        await contactShareService.rechazarCompartirContacto(matchId, userId);

        // Notificar al solicitante
        if (solicitanteId) {
          const socketsSolicitante = obtenerSocketsDeUsuario(solicitanteId);
          for (const socketId of socketsSolicitante) {
            io.to(socketId).emit('contact:rejected', {
              matchId,
            });
          }
        }

        callback?.({
          exito: true,
        });

      } catch (error) {
        console.error('Error al rechazar contacto:', error);
        callback?.({
          exito: false,
          error: error.message,
        });
      }
    });

    /**
     * Cancelar solicitud de contacto
     */
    socket.on('contact:cancel', async (datos, callback) => {
      try {
        const { matchId } = datos;

        const match = await Match.findById(matchId);
        const receptorId = match.usuarios.find(
          u => u.toString() !== userId
        );

        // Cancelar solicitud
        await contactShareService.cancelarSolicitudContacto(matchId, userId);

        // Notificar al receptor
        if (receptorId) {
          const socketsReceptor = obtenerSocketsDeUsuario(receptorId.toString());
          for (const socketId of socketsReceptor) {
            io.to(socketId).emit('contact:cancelled', {
              matchId,
            });
          }
        }

        callback?.({
          exito: true,
        });

      } catch (error) {
        console.error('Error al cancelar contacto:', error);
        callback?.({
          exito: false,
          error: error.message,
        });
      }
    });
  });
};

module.exports = configurarContactSocket;
