const callService = require('../services/callService');
const { Match } = require('../models');
const { estaConectado, obtenerSocketsDeUsuario } = require('../config/socket');
const config = require('../config/env');

/**
 * Configurar handlers de llamadas WebRTC para Socket.io
 */
const configurarCallSocket = (io) => {
  io.on('connection', (socket) => {
    const userId = socket.userId;

    /**
     * Solicitar llamada
     * Evento: call:request
     * Datos: { matchId, tipo: 'audio' | 'video' }
     */
    socket.on('call:request', async (datos, callback) => {
      try {
        const { matchId, tipo = 'video' } = datos;

        if (!matchId) {
          return callback?.({
            exito: false,
            error: 'matchId es requerido',
          });
        }

        // Verificar que el otro usuario esta conectado
        const match = await Match.findById(matchId);
        if (!match) {
          return callback?.({
            exito: false,
            error: 'Match no encontrado',
          });
        }

        const otroUsuarioId = match.usuarios.find(
          u => u.toString() !== userId
        );

        if (!estaConectado(otroUsuarioId.toString())) {
          return callback?.({
            exito: false,
            error: 'El otro usuario no esta en linea',
          });
        }

        // Crear solicitud de llamada
        const permiso = await callService.solicitarLlamada(matchId, userId, tipo);

        // Notificar al receptor
        const socketsReceptor = obtenerSocketsDeUsuario(otroUsuarioId.toString());
        for (const socketId of socketsReceptor) {
          io.to(socketId).emit('call:incoming', {
            permisoId: permiso._id,
            matchId,
            solicitante: permiso.solicitante,
            tipo: permiso.tipoLlamada,
            expiraEn: permiso.expiraEn,
          });
        }

        callback?.({
          exito: true,
          permisoId: permiso._id,
          expiraEn: permiso.expiraEn,
        });

      } catch (error) {
        console.error('Error al solicitar llamada:', error);
        callback?.({
          exito: false,
          error: error.message,
        });
      }
    });

    /**
     * Aceptar llamada
     * Evento: call:accept
     * Datos: { permisoId }
     */
    socket.on('call:accept', async (datos, callback) => {
      try {
        const { permisoId } = datos;

        const permiso = await callService.aceptarLlamada(permisoId, userId);

        // Notificar al solicitante
        const socketsSolicitante = obtenerSocketsDeUsuario(
          permiso.solicitante.toString()
        );
        for (const socketId of socketsSolicitante) {
          io.to(socketId).emit('call:accepted', {
            permisoId: permiso._id,
            matchId: permiso.match,
          });
        }

        // Enviar configuracion de ICE servers
        callback?.({
          exito: true,
          iceServers: config.stunServers,
        });

      } catch (error) {
        console.error('Error al aceptar llamada:', error);
        callback?.({
          exito: false,
          error: error.message,
        });
      }
    });

    /**
     * Rechazar llamada
     * Evento: call:reject
     * Datos: { permisoId }
     */
    socket.on('call:reject', async (datos, callback) => {
      try {
        const { permisoId } = datos;

        const permiso = await callService.rechazarLlamada(permisoId, userId);

        // Notificar al solicitante
        const socketsSolicitante = obtenerSocketsDeUsuario(
          permiso.solicitante.toString()
        );
        for (const socketId of socketsSolicitante) {
          io.to(socketId).emit('call:rejected', {
            permisoId: permiso._id,
            matchId: permiso.match,
          });
        }

        callback?.({ exito: true });

      } catch (error) {
        console.error('Error al rechazar llamada:', error);
        callback?.({
          exito: false,
          error: error.message,
        });
      }
    });

    /**
     * Cancelar solicitud de llamada
     * Evento: call:cancel
     * Datos: { permisoId }
     */
    socket.on('call:cancel', async (datos, callback) => {
      try {
        const { permisoId } = datos;

        const permiso = await callService.cancelarLlamada(permisoId, userId);

        // Notificar al receptor
        const socketsReceptor = obtenerSocketsDeUsuario(
          permiso.receptor.toString()
        );
        for (const socketId of socketsReceptor) {
          io.to(socketId).emit('call:cancelled', {
            permisoId: permiso._id,
            matchId: permiso.match,
          });
        }

        callback?.({ exito: true });

      } catch (error) {
        console.error('Error al cancelar llamada:', error);
        callback?.({
          exito: false,
          error: error.message,
        });
      }
    });

    /**
     * Enviar oferta WebRTC (SDP)
     * Evento: call:offer
     * Datos: { permisoId, sdp }
     */
    socket.on('call:offer', async (datos) => {
      try {
        const { permisoId, sdp } = datos;

        const CallPermissionModel = require('../models').CallPermission; // Get model directly
        const permiso = await CallPermissionModel.findById(permisoId);

        if (!permiso || (permiso.solicitante.toString() !== userId && permiso.receptor.toString() !== userId)) {
          console.warn('Call:offer received for invalid or unauthorized permisoId:', permisoId);
          return; // Invalid or unauthorized permission
        }

        // Determinar receptor del SDP (the other user in the CallPermission)
        const receptorId = permiso.solicitante.toString() === userId
          ? permiso.receptor.toString()
          : permiso.solicitante.toString();

        const socketsReceptor = obtenerSocketsDeUsuario(receptorId);
        console.log('Call:offer - ReceptorId:', receptorId); // ADDED
        console.log('Call:offer - SocketsReceptor:', socketsReceptor); // ADDED
        console.log('Call:offer - Emitting permisoId:', permisoId); // ADDED
        // console.log('Call:offer - Emitting sdp:', sdp); // Uncomment if needed, but SDP can be very large
        for (const socketId of socketsReceptor) {
          console.log('Call:offer - Emitting to socketId:', socketId); // ADDED
          io.to(socketId).emit('call:offer', {
            permisoId,
            sdp,
          });
        }

      } catch (error) {
        console.error('Error al enviar oferta:', error);
      }
    });

    /**
     * Enviar respuesta WebRTC (SDP)
     * Evento: call:answer
     * Datos: { permisoId, sdp }
     */
    socket.on('call:answer', async (datos) => {
      try {
        const { permisoId, sdp } = datos;

        const CallPermission = require('../models').CallPermission;
        const permiso = await CallPermission.findById(permisoId);

        if (!permiso || permiso.estado !== 'aceptada') {
          return;
        }

        // Marcar como iniciada
        await callService.iniciarLlamada(permisoId, userId);

        // Determinar receptor del SDP
        const receptorId = permiso.solicitante.toString() === userId
          ? permiso.receptor.toString()
          : permiso.solicitante.toString();

        const socketsReceptor = obtenerSocketsDeUsuario(receptorId);
        for (const socketId of socketsReceptor) {
          io.to(socketId).emit('call:answer', {
            permisoId,
            sdp,
          });
        }

      } catch (error) {
        console.error('Error al enviar respuesta:', error);
      }
    });

    /**
     * Enviar candidato ICE
     * Evento: call:ice
     * Datos: { permisoId, candidate }
     */
    socket.on('call:ice', async (datos) => {
      try {
        const { permisoId, candidate } = datos;

        const CallPermission = require('../models').CallPermission;
        const permiso = await CallPermission.findById(permisoId);

        if (!permiso) {
          return;
        }

        // Determinar receptor del candidato
        const receptorId = permiso.solicitante.toString() === userId
          ? permiso.receptor.toString()
          : permiso.solicitante.toString();

        const socketsReceptor = obtenerSocketsDeUsuario(receptorId);
        for (const socketId of socketsReceptor) {
          io.to(socketId).emit('call:ice', {
            permisoId,
            candidate,
          });
        }

      } catch (error) {
        console.error('Error al enviar candidato ICE:', error);
      }
    });

    /**
     * Finalizar llamada
     * Evento: call:end
     * Datos: { permisoId }
     */
    socket.on('call:end', async (datos, callback) => {
      try {
        const { permisoId } = datos;

        const permiso = await callService.finalizarLlamada(permisoId, userId);

        // Notificar a ambos usuarios
        const otroUsuarioId = permiso.solicitante.toString() === userId
          ? permiso.receptor.toString()
          : permiso.solicitante.toString();

        const socketsOtro = obtenerSocketsDeUsuario(otroUsuarioId);
        for (const socketId of socketsOtro) {
          io.to(socketId).emit('call:ended', {
            permisoId,
            duracion: permiso.datosLlamada.duracion,
            finalizadaPor: userId,
          });
        }

        callback?.({
          exito: true,
          duracion: permiso.datosLlamada.duracion,
        });

      } catch (error) {
        console.error('Error al finalizar llamada:', error);
        callback?.({
          exito: false,
          error: error.message,
        });
      }
    });
  });
};

module.exports = configurarCallSocket;
