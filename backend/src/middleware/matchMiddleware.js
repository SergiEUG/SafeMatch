const { Match } = require('../models');

/**
 * Middleware para verificar que los usuarios tienen un match activo
 */
const verificarMatch = async (req, res, next) => {
  try {
    const matchId = req.params.matchId;
    const userId = req.userId;

    if (!matchId) {
      return res.status(400).json({
        exito: false,
        mensaje: 'ID de match requerido',
      });
    }

    const match = await Match.findById(matchId);

    if (!match) {
      return res.status(404).json({
        exito: false,
        mensaje: 'Match no encontrado',
      });
    }

    if (match.estado !== 'activo') {
      return res.status(403).json({
        exito: false,
        mensaje: 'Este match ya no esta activo',
      });
    }

    // Verificar que el usuario es parte del match
    const esParteDelMatch = match.usuarios.some(
      u => u.toString() === userId.toString()
    );

    if (!esParteDelMatch) {
      return res.status(403).json({
        exito: false,
        mensaje: 'No tienes permiso para acceder a este match',
      });
    }

    // Adjuntar match a la request para uso posterior
    req.match = match;
    req.otroUsuarioId = match.usuarios.find(
      u => u.toString() !== userId.toString()
    );

    next();
  } catch (error) {
    return res.status(500).json({
      exito: false,
      mensaje: 'Error al verificar match',
    });
  }
};

/**
 * Middleware para verificar match entre dos usuarios por ID
 */
const verificarMatchEntreUsuarios = async (req, res, next) => {
  try {
    const userId = req.userId;
    const targetId = req.params.userId || req.params.id;

    if (!targetId) {
      return res.status(400).json({
        exito: false,
        mensaje: 'ID de usuario requerido',
      });
    }

    const match = await Match.tienenMatch(userId, targetId);

    if (!match) {
      return res.status(403).json({
        exito: false,
        mensaje: 'Necesitas tener un match con este usuario para continuar',
      });
    }

    req.match = match;
    next();
  } catch (error) {
    return res.status(500).json({
      exito: false,
      mensaje: 'Error al verificar match',
    });
  }
};

module.exports = {
  verificarMatch,
  verificarMatchEntreUsuarios,
};
