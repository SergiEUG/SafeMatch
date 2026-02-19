const express = require('express');
const router = express.Router();
const callController = require('../controllers/callController');
const { autenticar } = require('../middleware/authMiddleware');
const { verificarMatch } = require('../middleware/matchMiddleware');
const { validarObjectId } = require('../middleware/validationMiddleware');

// Todas las rutas requieren autenticacion
router.use(autenticar);

/**
 * @route   POST /api/calls/:matchId/request
 * @desc    Solicitar consentimiento para llamada
 * @access  Privado
 */
router.post('/:matchId/request',
  validarObjectId('matchId'),
  verificarMatch,
  callController.solicitarLlamada
);

/**
 * @route   POST /api/calls/:matchId/accept
 * @desc    Aceptar solicitud de llamada
 * @access  Privado
 */
router.post('/:matchId/accept',
  validarObjectId('matchId'),
  verificarMatch,
  callController.aceptarLlamada
);

/**
 * @route   POST /api/calls/:matchId/reject
 * @desc    Rechazar solicitud de llamada
 * @access  Privado
 */
router.post('/:matchId/reject',
  validarObjectId('matchId'),
  verificarMatch,
  callController.rechazarLlamada
);

/**
 * @route   GET /api/calls/:matchId/active
 * @desc    Obtener llamada activa de un match
 * @access  Privado
 */
router.get('/:matchId/active',
  validarObjectId('matchId'),
  verificarMatch,
  callController.obtenerLlamadaActiva
);

/**
 * @route   GET /api/calls/:matchId/history
 * @desc    Obtener historial de llamadas
 * @access  Privado
 */
router.get('/:matchId/history',
  validarObjectId('matchId'),
  verificarMatch,
  callController.obtenerHistorial
);

module.exports = router;
