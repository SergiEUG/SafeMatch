const matchService = require('../services/matchService');

// Helper function to format match data for the frontend
const formatMatchForFrontend = (match, currentUserId) => {
  const otroUsuario = match.usuarios.find(
    u => u._id.toString() !== currentUserId.toString()
  );

  const formatted = {
    id: match._id.toString(), // Convert ObjectId to string
    usuario: {
      _id: otroUsuario._id.toString(), // Convert ObjectId to string
      nombre: otroUsuario.nombre,
      fotos: otroUsuario.fotos,
      edad: otroUsuario.edad,
      id: otroUsuario._id.toString() // Add string id for convenience
    },
    fechaMatch: match.fechaMatch,
    ultimaActividad: match.ultimaActividad || match.fechaMatch,
    contactoCompartido: match.contactoCompartido ? match.contactoCompartido.compartido : false,
          ultimoMensaje: {
            contenido: '¡Habéis hecho match! Di hola.',
            remitente: { id: 'system', nombre: 'Sistema' }, // Assign a system user object
            fecha: match.fechaMatch
          }  };
  console.log(`Backend: Formatted match for userId ${currentUserId}:`, formatted); // Debug log
  return formatted;
};

/**
 * Controlador de matches
 */
const matchController = {
  /**
   * GET /api/matches/received-likes
   * Obtener usuarios que me han dado like
   */
  async obtenerLikesRecibidos(req, res) {
    try {
      const likes = await matchService.obtenerLikesRecibidos(req.userId);
      res.json({ exito: true, datos: likes });
    } catch (error) {
      res.status(500).json({ exito: false, mensaje: error.message });
    }
  },
  /**
   * POST /api/matches/like/:userId
   * Dar like a un usuario
   */
  async darLike(req, res) {
    try {
      const resultado = await matchService.darLike(req.userId, req.params.userId);

      // MILLORA PROFESSIONAL: Si hi ha match, notificar via WebSocket
      if (resultado.esMatch && resultado.match) {
        const io = req.app.get('io');
        if (io) {
          const { obtenerSocketsDeUsuario } = require('../config/socket');
          
          // Notificar a ambdós usuaris
          resultado.match.usuarios.forEach(usuarioObj => {
            const userId = typeof usuarioObj === 'object' ? usuarioObj._id.toString() : usuarioObj.toString();
            const sockets = obtenerSocketsDeUsuario(userId);
            
            // Format the match object for the current recipient
            const formattedMatch = formatMatchForFrontend(resultado.match, userId);
            console.log(`Backend: Emitting 'match:nuevo' to userId ${userId} with payload:`, formattedMatch); // Debug log

            sockets.forEach(socketId => {
              io.to(socketId).emit('match:nuevo', {
                match: formattedMatch
              });
            });
          });
        }
      }

      if (resultado.esMatch) {
        res.status(201).json({
          exito: true,
          mensaje: '¡Es un match!',
          datos: {
            esMatch: true,
            match: resultado.match,
          },
        });
      } else {
        res.json({
          exito: true,
          mensaje: 'Like registrado',
          datos: {
            esMatch: false,
          },
        });
      }
    } catch (error) {
      res.status(400).json({
        exito: false,
        mensaje: error.message,
      });
    }
  },

  /**
   * POST /api/matches/dislike/:userId
   * Dar dislike a un usuario
   */
  async darDislike(req, res) {
    try {
      const resultado = await matchService.darDislike(req.userId, req.params.userId);

      res.json({
        exito: true,
        mensaje: resultado.mensaje,
      });
    } catch (error) {
      res.status(400).json({
        exito: false,
        mensaje: error.message,
      });
    }
  },

  /**
   * GET /api/matches
   * Obtener todos los matches del usuario
   */
  async obtenerMatches(req, res) {
    try {
      const matches = await matchService.obtenerMatches(req.userId);

      res.json({
        exito: true,
        datos: {
          matches,
          total: matches.length,
        },
      });
    } catch (error) {
      res.status(500).json({
        exito: false,
        mensaje: error.message,
      });
    }
  },

  /**
   * GET /api/matches/:matchId
   * Obtener un match especifico
   */
  async obtenerMatch(req, res) {
    try {
      const match = await matchService.obtenerMatch(req.params.matchId, req.userId);

      res.json({
        exito: true,
        datos: { match },
      });
    } catch (error) {
      const status = error.message.includes('permiso') ? 403 : 404;
      res.status(status).json({
        exito: false,
        mensaje: error.message,
      });
    }
  },

  /**
   * DELETE /api/matches/:matchId
   * Eliminar un match (unmatch)
   */
  async eliminarMatch(req, res) {
    try {
      const resultado = await matchService.eliminarMatch(req.params.matchId, req.userId);

      res.json({
        exito: true,
        mensaje: resultado.mensaje,
      });
    } catch (error) {
      const status = error.message.includes('permiso') ? 403 : 404;
      res.status(status).json({
        exito: false,
        mensaje: error.message,
      });
    }
  },

  /**
   * POST /api/matches/:matchId/share-contact
   * Solicitar compartir contacto
   */
  async solicitarContacto(req, res) {
    try {
      const resultado = await matchService.solicitarCompartirContacto(
        req.params.matchId,
        req.userId
      );

      res.json({
        exito: true,
        mensaje: resultado.mensaje,
      });
    } catch (error) {
      res.status(400).json({
        exito: false,
        mensaje: error.message,
      });
    }
  },

  /**
   * POST /api/matches/:matchId/confirm-contact
   * Confirmar compartir contacto
   */
  async confirmarContacto(req, res) {
    try {
      const resultado = await matchService.confirmarCompartirContacto(
        req.params.matchId,
        req.userId
      );

      res.json({
        exito: true,
        mensaje: resultado.mensaje,
        datos: {
          contactos: resultado.contactos,
        },
      });
    } catch (error) {
      res.status(400).json({
        exito: false,
        mensaje: error.message,
      });
    }
  },

  /**
   * GET /api/matches/:id/permissions/call
   * Obtener los permisos de llamada para un match
   */
  async getCallPermissions(req, res) {
    try {
      const match = await matchService.obtenerMatch(req.params.matchId, req.userId);
      res.json({
        exito: true,
        datos: {
          callPermissions: match.callPermissions,
        },
      });
    } catch (error) {
      const status = error.message.includes('permiso') ? 403 : 404;
      res.status(status).json({
        exito: false,
        mensaje: error.message,
      });
    }
  },

  /**
   * PUT /api/matches/:matchId/permissions/call
   * Actualizar el permiso de llamada del usuario para un match
   */
  async updateCallPermission(req, res) {
    try {
      const { status } = req.body;
      if (!['ACCEPTED', 'DECLINED'].includes(status)) {
        return res.status(400).json({ exito: false, mensaje: 'Estado no válido.' });
      }

      const match = await matchService.obtenerMatch(req.params.matchId, req.userId);

      console.log('Debugging callPermissions update:'); // ADDED
      console.log('Match callPermissions:', match.callPermissions); // ADDED
      console.log('Current req.userId:', req.userId); // ADDED

      const permission = match.callPermissions.find(p => {
        console.log('  Comparing p.userId:', p.userId.toString(), 'with req.userId:', req.userId); // ADDED
        return p.userId.toString() === req.userId.toString();
      });
      console.log('Found permission:', permission); // ADDED

      if (permission) {
        permission.status = status;
        match.markModified('callPermissions'); // ADDED: To tell Mongoose the array has changed
      } else {
        // This case should not happen if matches are created correctly
        match.callPermissions.push({ userId: req.userId, status });
      }

      await match.save();

      // NOTIFICACIÓN A TRAVÉS DE WEBSOCKETS
      const io = req.app.get('io');
      if (io) {
        const { obtenerSocketsDeUsuario } = require('../config/socket');
        // Notificar a ambos usuarios que el estado de los permisos ha cambiado
        match.usuarios.forEach(usuario => {
          const sockets = obtenerSocketsDeUsuario(usuario._id.toString());
          sockets.forEach(socketId => {
            io.to(socketId).emit('permissions:call:updated', {
              matchId: match._id,
              callPermissions: match.callPermissions
            });
          });
        });
      }


      res.json({
        exito: true,
        mensaje: 'Permiso de llamada actualizado.',
        datos: {
          callPermissions: match.callPermissions,
        },
      });
    } catch (error) {
      const status = error.message.includes('permiso') ? 403 : 404;
      res.status(status).json({
        exito: false,
        mensaje: error.message,
      });
    }
  },
};

module.exports = matchController;
