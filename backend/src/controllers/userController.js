const userService = require('../services/userService');

/**
 * Controlador de usuarios
 */
const userController = {
  /**
   * GET /api/users/discover
   * Descubrir usuarios potenciales
   */
  async descubrir(req, res) {
    try {
      const { pagina, limite } = req.query;
      const resultado = await userService.descubrirUsuarios(req.userId, {
        pagina: parseInt(pagina, 10) || 1,
        limite: parseInt(limite, 10) || 10,
      });

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
   * GET /api/users/:id
   * Obtener perfil de usuario
   */
  async obtenerPerfil(req, res) {
    try {
      const usuario = await userService.obtenerPerfil(req.userId, req.params.id);

      res.json({
        exito: true,
        datos: { usuario },
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
   * PUT /api/users/profile
   * Actualizar perfil propio
   */
  async actualizarPerfil(req, res) {
    try {
      const usuario = await userService.actualizarPerfil(req.userId, req.body);

      res.json({
        exito: true,
        mensaje: 'Perfil actualizado exitosamente',
        datos: { usuario },
      });
    } catch (error) {
      res.status(400).json({
        exito: false,
        mensaje: error.message,
      });
    }
  },

  /**
   * DELETE /api/users/account
   * Eliminar cuenta
   */
  async eliminarCuenta(req, res) {
    try {
      const resultado = await userService.eliminarCuenta(req.userId);

      res.json({
        exito: true,
        mensaje: resultado.mensaje,
      });
    } catch (error) {
      res.status(500).json({
        exito: false,
        mensaje: error.message,
      });
    }
  },

  /**
   * PUT /api/users/status
   * Cambiar estado de cuenta (pausar/activar)
   */
  async cambiarEstado(req, res) {
    try {
      const { estado } = req.body;
      const usuario = await userService.cambiarEstadoCuenta(req.userId, estado);

      res.json({
        exito: true,
        mensaje: `Cuenta ${estado === 'activo' ? 'activada' : 'pausada'} exitosamente`,
        datos: { usuario },
      });
    } catch (error) {
      res.status(400).json({
        exito: false,
        mensaje: error.message,
      });
    }
  },

  /**
   * POST /api/users/share-contact
   * Compartir informacion de contacto (telefono) con un match
   */
  async compartirContacto(req, res) {
    try {
      const { matchId } = req.body;
      const io = req.app.get('io'); // Get the io instance
      const resultado = await userService.compartirContactoConMatch(req.userId, matchId, io);

      res.json({
        exito: true,
        mensaje: resultado.mensaje,
        datos: resultado.datos,
      });
    } catch (error) {
      const status = error.message.includes('encontrado') || error.message.includes('match no valido') ? 404 : 400;
      res.status(status).json({
        exito: false,
        mensaje: error.message,
      });
    }
  },
};

module.exports = userController;
