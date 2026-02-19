const authService = require('../services/authService');
const { User } = require('../models');

/**
 * Middleware para verificar autenticacion JWT
 */
const autenticar = async (req, res, next) => {
  try {
    // Obtener token del header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        exito: false,
        mensaje: 'No autorizado. Token no proporcionado.',
      });
    }

    const token = authHeader.split(' ')[1];

    // Verificar token
    const decoded = authService.verificarAccessToken(token);

    // Buscar usuario
    const usuario = await User.findById(decoded.id);
    
    if (!usuario) {
      return res.status(401).json({
        exito: false,
        mensaje: 'Usuario no encontrado.',
      });
    }

    if (usuario.estado === 'eliminado') {
      return res.status(401).json({
        exito: false,
        mensaje: 'Esta cuenta ha sido eliminada.',
      });
    }

    // Adjuntar usuario a la request
    req.usuario = usuario;
    req.userId = usuario._id;

    next();
  } catch (error) {
    return res.status(401).json({
      exito: false,
      mensaje: 'Token invalido o expirado.',
    });
  }
};

/**
 * Middleware opcional de autenticacion (no falla si no hay token)
 */
const autenticarOpcional = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = authService.verificarAccessToken(token);
      const usuario = await User.findById(decoded.id);
      
      if (usuario && usuario.estado !== 'eliminado') {
        req.usuario = usuario;
        req.userId = usuario._id;
      }
    }
    
    next();
  } catch (error) {
    // Continuar sin autenticacion
    next();
  }
};

/**
 * Middleware para verificar que el usuario tiene cuenta activa
 */
const cuentaActiva = (req, res, next) => {
  if (req.usuario && req.usuario.estado !== 'activo') {
    return res.status(403).json({
      exito: false,
      mensaje: 'Tu cuenta esta pausada. Reactiva tu cuenta para continuar.',
    });
  }
  next();
};

module.exports = {
  autenticar,
  autenticarOpcional,
  cuentaActiva,
};
