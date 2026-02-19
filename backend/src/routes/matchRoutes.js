const express = require('express');
const router = express.Router();
const matchController = require('../controllers/matchController');
const { autenticar, cuentaActiva } = require('../middleware/authMiddleware');
const { verificarMatch } = require('../middleware/matchMiddleware');
const { validarObjectId } = require('../middleware/validationMiddleware');

// Todas las rutas requieren autenticacion
router.use(autenticar);

/**
 * @route   POST /api/matches/like/:userId
 * @desc    Dar like a un usuario
 * @access  Privado
 */
router.post('/like/:userId', 
  cuentaActiva, 
  validarObjectId('userId'), 
  matchController.darLike
);

/**
 * @route   POST /api/matches/dislike/:userId
 * @desc    Dar dislike a un usuario
 * @access  Privado
 */
router.post('/dislike/:userId', 
  cuentaActiva, 
  validarObjectId('userId'), 
  matchController.darDislike
);

/**
 * @route   GET /api/matches
 * @desc    Obtener todos los matches del usuario
 * @access  Privado
 */
router.get('/received-likes', matchController.obtenerLikesRecibidos);
router.get('/', matchController.obtenerMatches);

/**
 * @route   GET /api/matches/:matchId
 * @desc    Obtener un match especifico
 * @access  Privado
 */
router.get('/:matchId', 
  validarObjectId('matchId'), 
  matchController.obtenerMatch
);

/**
 * @route   DELETE /api/matches/:matchId
 * @desc    Eliminar un match (unmatch)
 * @access  Privado
 */
router.delete('/:matchId', 
  validarObjectId('matchId'), 
  matchController.eliminarMatch
);

/**
 * @route   POST /api/matches/:matchId/share-contact
 * @desc    Solicitar compartir contacto
 * @access  Privado
 */
router.post('/:matchId/share-contact', 
  validarObjectId('matchId'), 
  verificarMatch, 
  matchController.solicitarContacto
);

/**
 * @route   POST /api/matches/:matchId/confirm-contact
 * @desc    Confirmar compartir contacto
 * @access  Privado
 */
router.post('/:matchId/confirm-contact', 
  validarObjectId('matchId'), 
  verificarMatch, 
  matchController.confirmarContacto
);

/**
 * @route   GET /api/matches/:matchId/permissions/call
 * @desc    Obtener permisos de llamada para un match
 * @access  Privado
 */
router.get('/:matchId/permissions/call',
  validarObjectId('matchId'),
  verificarMatch,
  matchController.getCallPermissions
);

/**
 * @route   PUT /api/matches/:matchId/permissions/call
 * @desc    Actualizar el permiso de llamada del usuario
 * @access  Privado
 */
router.put('/:matchId/permissions/call',
  validarObjectId('matchId'),
  verificarMatch,
  matchController.updateCallPermission
);

module.exports = router;
