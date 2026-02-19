const chatService = require('../services/chatService');
const { Match } = require('../models');
const { estaConectado } = require('../config/socket');

/**
 * Configurar handlers de chat para Socket.io
 */
const configurarChatSocket = (io) => {
  io.on('connection', (socket) => {
    const userId = socket.userId;

    /**
     * Enviar mensaje
     * Evento: chat:send
     * Datos: { matchId, contenido, tipo? }
     */
    socket.on('chat:send', async (datos, callback) => {
      try {
        const { matchId, contenido, tipo = 'texto' } = datos;

        if (!matchId || !contenido) {
          return callback?.({
            exito: false,
            error: 'matchId y contenido son requeridos',
          });
        }

        // Verificar que el usuario esta en la sala del match
        const sala = `match:${matchId}`;
        if (!socket.rooms.has(sala)) {
          // Verificar match y unir a sala
          const match = await Match.findById(matchId);
          if (!match || !match.usuarios.includes(userId)) {
            return callback?.({
              exito: false,
              error: 'No tienes permiso para este chat',
            });
          }
          socket.join(sala);
        }

        // Enviar mensaje
        const resultado = await chatService.enviarMensaje(
          matchId,
          userId,
          contenido,
          tipo
        );

        // Emitir mensaje a la sala (todos los participantes)
        io.to(sala).emit('chat:receive', {
          mensaje: resultado.mensaje,
          matchId,
        });

        // Si fue filtrado, notificar solo al remitente
        if (resultado.fueFiltrado) {
          socket.emit('chat:filtered', {
            matchId,
            advertencia: resultado.advertencia,
          });
        }

        callback?.({
          exito: true,
          mensaje: resultado.mensaje,
          fueFiltrado: resultado.fueFiltrado,
        });

      } catch (error) {
        console.error('Error al enviar mensaje:', error);
        callback?.({
          exito: false,
          error: error.message,
        });
      }
    });

    /**
     * Usuario escribiendo
     * Evento: chat:typing
     * Datos: { matchId, escribiendo: boolean }
     */
    socket.on('chat:typing', (datos) => {
      const { matchId, escribiendo } = datos;

      if (!matchId) return;

      const sala = `match:${matchId}`;
      
      // Emitir a la sala excepto al remitente
      socket.to(sala).emit('chat:typing', {
        userId: userId,
        matchId,
        escribiendo,
      });
    });

    /**
     * Marcar mensajes como leidos
     * Evento: chat:read
     * Datos: { matchId }
     */
    socket.on('chat:read', async (datos, callback) => {
      try {
        const { matchId } = datos;

        if (!matchId) {
          return callback?.({
            exito: false,
            error: 'matchId es requerido',
          });
        }

        await chatService.marcarComoLeidos(matchId, userId);

        // Notificar al otro usuario que los mensajes fueron leidos
        const sala = `match:${matchId}`;
        socket.to(sala).emit('chat:messages_read', {
          userId: userId,
          matchId,
          timestamp: new Date(),
        });

        callback?.({ exito: true });

      } catch (error) {
        console.error('Error al marcar como leidos:', error);
        callback?.({
          exito: false,
          error: error.message,
        });
      }
    });

    /**
     * Unirse a sala de chat
     * Evento: chat:join
     * Datos: { matchId }
     */
    socket.on('chat:join', async (datos, callback) => {
      try {
        const { matchId } = datos;

        // Verificar match
        const match = await Match.findById(matchId);
        if (!match || match.estado !== 'activo') {
          return callback?.({
            exito: false,
            error: 'Match no encontrado',
          });
        }

        // Verificar permiso
        const tienePermiso = match.usuarios.some(
          u => u.toString() === userId
        );
        if (!tienePermiso) {
          return callback?.({
            exito: false,
            error: 'No tienes permiso para este chat',
          });
        }

        // Unirse a la sala
        const sala = `match:${matchId}`;
        socket.join(sala);

        // Notificar al otro usuario
        socket.to(sala).emit('chat:user_joined', {
          userId: userId,
          matchId,
        });

        // Obtener otro usuario del match
        const otroUsuarioId = match.usuarios.find(
          u => u.toString() !== userId
        );

        callback?.({
          exito: true,
          otroUsuarioOnline: estaConectado(otroUsuarioId?.toString()),
        });

      } catch (error) {
        console.error('Error al unirse a sala:', error);
        callback?.({
          exito: false,
          error: error.message,
        });
      }
    });

    /**
     * Salir de sala de chat
     * Evento: chat:leave
     * Datos: { matchId }
     */
    socket.on('chat:leave', (datos) => {
      const { matchId } = datos;
      const sala = `match:${matchId}`;
      
      socket.leave(sala);
      
      socket.to(sala).emit('chat:user_left', {
        userId: userId,
        matchId,
      });
    });

    /**
     * Eliminar mensaje
     * Evento: chat:delete
     * Datos: { mensajeId, matchId }
     */
    socket.on('chat:delete', async (datos, callback) => {
      try {
        const { mensajeId, matchId } = datos;

        await chatService.eliminarMensaje(mensajeId, userId);

        // Notificar a la sala
        const sala = `match:${matchId}`;
        io.to(sala).emit('chat:message_deleted', {
          mensajeId,
          matchId,
        });

        callback?.({ exito: true });

      } catch (error) {
        console.error('Error al eliminar mensaje:', error);
        callback?.({
          exito: false,
          error: error.message,
        });
      }
    });
  });
};

module.exports = configurarChatSocket;
