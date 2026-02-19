const authService = require('../services/authService');

/**
 * Controlador de autenticacion
 */
const authController = {
  /**
   * POST /api/auth/register
   * Registrar nuevo usuario
   */
  async registrar(req, res) {
    try {
      const resultado = await authService.registrar(req.body);

      res.status(201).json({
        exito: true,
        mensaje: 'Usuario registrado exitosamente',
        datos: resultado,
      });
    } catch (error) {
      console.error(error); // Added for debugging
      res.status(400).json({
        exito: false,
        mensaje: error.message,
      });
    }
  },

  /**
   * POST /api/auth/login
   * Iniciar sesion
   */
  async login(req, res) {
    try {
      const { email, password } = req.body;
      const resultado = await authService.login(email, password);

      res.json({
        exito: true,
        mensaje: 'Inicio de sesion exitoso',
        datos: resultado,
      });
    } catch (error) {
      res.status(401).json({
        exito: false,
        mensaje: error.message,
      });
    }
  },

  /**
   * POST /api/auth/refresh
   * Refrescar tokens
   */
  async refrescarTokens(req, res) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          exito: false,
          mensaje: 'Refresh token es requerido',
        });
      }

      const resultado = await authService.refrescarTokens(refreshToken);

      res.json({
        exito: true,
        mensaje: 'Tokens refrescados exitosamente',
        datos: resultado,
      });
    } catch (error) {
      res.status(401).json({
        exito: false,
        mensaje: error.message,
      });
    }
  },

  /**
   * POST /api/auth/logout
   * Cerrar sesion
   */
  async logout(req, res) {
    try {
      await authService.logout(req.userId);

      res.json({
        exito: true,
        mensaje: 'Sesion cerrada exitosamente',
      });
    } catch (error) {
      res.status(500).json({
        exito: false,
        mensaje: error.message,
      });
    }
  },

  /**
   * GET /api/auth/me
   * Obtener usuario actual
   */
  async obtenerUsuarioActual(req, res) {
    try {
      const usuario = await authService.obtenerUsuarioActual(req.userId);

      const usuarioCompleto = {
        id: usuario._id,
        email: usuario.email,
        nombre: usuario.nombre,
        fechaNacimiento: usuario.fechaNacimiento,
        genero: usuario.genero,
        busco: usuario.busco,
        biografia: usuario.biografia,
        fotos: usuario.fotos,
        intereses: usuario.intereses,
        ubicacion: usuario.ubicacion,
        configuracion: usuario.configuracion,
        contacto: usuario.contacto,
        estado: usuario.estado,
        ultimaConexion: usuario.ultimaConexion,
        verificado: usuario.verificado,
        createdAt: usuario.createdAt,
        updatedAt: usuario.updatedAt,
        edad: usuario.calcularEdad()
      };

      console.log(usuarioCompleto);
      res.json({
        exito: true,
        datos: {
          usuario: usuarioCompleto,
        },
      });
    } catch (error) {
      res.status(404).json({
        exito: false,
        mensaje: error.message,
      });
    }
  },
};

module.exports = authController;
