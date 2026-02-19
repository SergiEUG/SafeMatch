const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { autenticar } = require('../middleware/authMiddleware');
const { 
  validarRegistro, 
  validarLogin, 
  sanitizarBody 
} = require('../middleware/validationMiddleware');

/**
 * @route   POST /api/auth/register
 * @desc    Registrar nuevo usuario
 * @access  Publico
 */
router.post('/register', 
  sanitizarBody, 
  validarRegistro, 
  authController.registrar
);

/**
 * @route   POST /api/auth/login
 * @desc    Iniciar sesion
 * @access  Publico
 */
router.post('/login', 
  sanitizarBody, 
  validarLogin, 
  authController.login
);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refrescar tokens JWT
 * @access  Publico
 */
router.post('/refresh', authController.refrescarTokens);

/**
 * @route   POST /api/auth/logout
 * @desc    Cerrar sesion
 * @access  Privado
 */
router.post('/logout', autenticar, authController.logout);

/**
 * @route   GET /api/auth/me
 * @desc    Obtener usuario autenticado
 * @access  Privado
 */
router.get('/me', autenticar, authController.obtenerUsuarioActual);

module.exports = router;
