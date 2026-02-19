const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const { autenticar } = require('../middleware/authMiddleware');

/**
 * Rutas para compartir contacto
 * Todas requieren autenticación
 */

// Solicitar compartir contacto
router.post('/:matchId/request', autenticar, contactController.solicitarContacto);

// Aceptar solicitud de contacto
router.post('/:matchId/accept', autenticar, contactController.aceptarContacto);

// Rechazar solicitud de contacto
router.post('/:matchId/reject', autenticar, contactController.rechazarContacto);

// Cancelar solicitud de contacto
router.post('/:matchId/cancel', autenticar, contactController.cancelarContacto);

// Obtener estado de compartir contacto
router.get('/:matchId/status', autenticar, contactController.obtenerEstado);

module.exports = router;
