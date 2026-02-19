const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { autenticar, cuentaActiva } = require('../middleware/authMiddleware');
const { 
  validarActualizacionPerfil, 
  validarObjectId, 
  sanitizarBody 
} = require('../middleware/validationMiddleware');

// Todas las rutas requieren autenticacion
router.use(autenticar);

/**
 * @route   GET /api/users/discover
 * @desc    Descubrir usuarios potenciales para matching
 * @access  Privado
 */
router.get('/discover', cuentaActiva, userController.descubrir);

/**
 * @route   GET /api/users/:id
 * @desc    Obtener perfil de un usuario (requiere match)
 * @access  Privado
 */
router.get('/:id', validarObjectId('id'), userController.obtenerPerfil);

/**
 * @route   PUT /api/users/profile
 * @desc    Actualizar perfil propio
 * @access  Privado
 */
router.put('/profile', 
  sanitizarBody, 
  validarActualizacionPerfil, 
  userController.actualizarPerfil
);

/**
 * @route   PUT /api/users/status
 * @desc    Cambiar estado de cuenta (pausar/activar)
 * @access  Privado
 */
router.put('/status', sanitizarBody, userController.cambiarEstado);

/**
 * @route   DELETE /api/users/account
 * @desc    Eliminar cuenta
 * @access  Privado
 */
router.delete('/account', userController.eliminarCuenta);

/**
 * @route   POST /api/users/share-contact
 * @desc    Compartir informacion de contacto (telefono) con un match
 * @access  Privado
 */
router.post('/share-contact', cuentaActiva, userController.compartirContacto);

module.exports = router;
