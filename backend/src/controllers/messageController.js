const chatService = require('../services/chatService');

/**
 * Controlador de mensajes (para endpoints REST complementarios)
 */
const messageController = {
  /**
   * GET /api/messages
   * Listar todas las conversaciones
   */
  async listConversations(req, res) {
    try {
      const conversations = await chatService.getConversations(req.userId);
      res.json({ exito: true, datos: conversations });
    } catch (error) {
      res.status(500).json({ exito: false, mensaje: error.message });
    }
  },

  /**
   * POST /api/messages/:matchId
   * Enviar un mensaje
   */
  async enviarMensaje(req, res) {
    try {
      const { matchId } = req.params;
      const { contenido, tipo } = req.body;
      const resultado = await chatService.enviarMensaje(matchId, req.userId, contenido, tipo);
      res.status(201).json({ exito: true, datos: resultado });
    } catch (error) {
      res.status(400).json({ exito: false, mensaje: error.message });
    }
  },
  /**
   * GET /api/messages/:matchId
   * Obtener historial de mensajes
   */
  async obtenerHistorial(req, res) {
    try {
      const { matchId } = req.params;
      const { limite, antes } = req.query;

      const resultado = await chatService.obtenerHistorial(
        matchId,
        req.userId,
        {
          limite: parseInt(limite, 10) || 50,
          antes: antes ? new Date(antes) : null,
        }
      );

      res.json({
        exito: true,
        datos: resultado,
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
   * GET /api/messages/unread/count
   * Obtener conteo de mensajes no leidos
   */
  async contarNoLeidos(req, res) {
    try {
      const resultado = await chatService.contarNoLeidos(req.userId);

      res.json({
        exito: true,
        datos: resultado,
      });
    } catch (error) {
      res.status(500).json({
        exito: false,
        mensaje: error.message,
      });
    }
  },

  /**
   * POST /api/messages/:matchId/read
   * Marcar mensajes como leidos
   */
  async marcarComoLeidos(req, res) {
    try {
      const { matchId } = req.params;

      const resultado = await chatService.marcarComoLeidos(matchId, req.userId);

      res.json({
        exito: true,
        datos: resultado,
      });
    } catch (error) {
      res.status(400).json({
        exito: false,
        mensaje: error.message,
      });
    }
  },

  /**
   * DELETE /api/messages/:mensajeId
   * Eliminar un mensaje
   */
  async eliminarMensaje(req, res) {
    try {
      const { mensajeId } = req.params;

      const resultado = await chatService.eliminarMensaje(mensajeId, req.userId);

      res.json({
        exito: true,
        mensaje: resultado.mensaje,
      });
    } catch (error) {
      const status = error.message.includes('No puedes') ? 403 : 404;
      res.status(status).json({
        exito: false,
        mensaje: error.message,
      });
    }
  },
};

module.exports = messageController;
