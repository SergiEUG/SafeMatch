const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { autenticar } = require('../middleware/authMiddleware');
const { verificarMatch } = require('../middleware/matchMiddleware');
const { validarObjectId } = require('../middleware/validationMiddleware');

// Todas las rutas requieren autenticacion
router.use(autenticar);

/**
 * @route   GET /api/messages
 * @desc    Listar todas las conversaciones
 * @access  Privado
 */
router.get('/', messageController.listConversations);

/**
 * @route   GET /api/messages/unread/count
 * @desc    Obtener conteo de mensajes no leidos
 * @access  Privado
 */
router.get('/unread/count', messageController.contarNoLeidos);

/**
 * @route   GET /api/messages/:matchId
 * @desc    Obtener historial de mensajes de un match
 * @access  Privado
 */
router.post('/:matchId', validarObjectId('matchId'), verificarMatch, messageController.enviarMensaje);
router.get('/:matchId', 
  validarObjectId('matchId'), 
  verificarMatch, 
  messageController.obtenerHistorial
);

/**
 * @route   POST /api/messages/:matchId/read
 * @desc    Marcar mensajes como leidos
 * @access  Privado
 */
router.post('/:matchId/read', 
  validarObjectId('matchId'), 
  verificarMatch, 
  messageController.marcarComoLeidos
);

/**
 * @route   DELETE /api/messages/:mensajeId
 * @desc    Eliminar un mensaje
 * @access  Privado
 */
router.delete('/:mensajeId', 
  validarObjectId('mensajeId'), 
  messageController.eliminarMensaje
);

module.exports = router;
