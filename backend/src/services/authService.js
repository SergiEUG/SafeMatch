const jwt = require('jsonwebtoken');
const { User } = require('../models');
const config = require('../config/env');

class AuthService {
  /**
   * Generar token de acceso JWT
   */
  generarAccessToken(usuario) {
    return jwt.sign(
      {
        id: usuario._id,
        email: usuario.email,
        nombre: usuario.nombre,
      },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );
  }

  /**
   * Generar token de refresco JWT
   */
  generarRefreshToken(usuario) {
    return jwt.sign(
      { id: usuario._id },
      config.jwtRefreshSecret,
      { expiresIn: config.jwtRefreshExpiresIn }
    );
  }

  /**
   * Verificar token de acceso
   */
  verificarAccessToken(token) {
    try {
      return jwt.verify(token, config.jwtSecret);
    } catch (error) {
      throw new Error('Token invalido o expirado');
    }
  }

  /**
   * Verificar token de refresco
   */
  verificarRefreshToken(token) {
    try {
      return jwt.verify(token, config.jwtRefreshSecret);
    } catch (error) {
      throw new Error('Refresh token invalido o expirado');
    }
  }

  /**
   * Registrar nuevo usuario
   */
  async registrar(datosUsuario) {
    const { email, password, nombre, fechaNacimiento, genero, telefono } = datosUsuario;

    // Verificar si el email ya existe
    const usuarioExistente = await User.findOne({ email });
    if (usuarioExistente) {
      throw new Error('El email ya esta registrado');
    }

    // Verificar si el telefono ya existe
    const telefonoExistente = await User.findOne({ 'contacto.telefono': telefono });
    if (telefonoExistente) {
      throw new Error('El numero de telefono ya esta registrado');
    }

    // Validar edad minima (18 años)
    const fechaNac = new Date(fechaNacimiento);
    const hoy = new Date();
    let edad = hoy.getFullYear() - fechaNac.getFullYear();
    const mes = hoy.getMonth() - fechaNac.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNac.getDate())) {
      edad--;
    }
    if (edad < 18) {
      throw new Error('Debes tener al menos 18 años para registrarte');
    }

    // Crear usuario
    const usuario = await User.create({
      email,
      password,
      nombre,
      fechaNacimiento: fechaNac,
      genero,
      contacto: { telefono },
    });

    // Generar tokens
    const accessToken = this.generarAccessToken(usuario);
    const refreshToken = this.generarRefreshToken(usuario);

    // Guardar refresh token en el usuario
    usuario.refreshToken = refreshToken;
    await usuario.save();

    return {
      usuario: {
        id: usuario._id,
        email: usuario.email,
        nombre: usuario.nombre,
        genero: usuario.genero,
      },
      accessToken,
      refreshToken,
    };
  }

  /**
   * Iniciar sesion
   */
  async login(email, password) {
    // Buscar usuario incluyendo password
    const usuario = await User.findOne({ email }).select('+password');
    
    if (!usuario) {
      throw new Error('Credenciales invalidas');
    }

    // Verificar password
    const passwordValido = await usuario.compararPassword(password);
    if (!passwordValido) {
      throw new Error('Credenciales invalidas');
    }

    // Verificar estado del usuario
    if (usuario.estado === 'eliminado') {
      throw new Error('Esta cuenta ha sido eliminada');
    }

    // Generar tokens
    const accessToken = this.generarAccessToken(usuario);
    const refreshToken = this.generarRefreshToken(usuario);

    // Actualizar refresh token y ultima conexion
    usuario.refreshToken = refreshToken;
    usuario.ultimaConexion = new Date();
    await usuario.save();

    return {
      usuario: {
        id: usuario._id,
        email: usuario.email,
        nombre: usuario.nombre,
        genero: usuario.genero,
        fotos: usuario.fotos,
      },
      accessToken,
      refreshToken,
    };
  }

  /**
   * Refrescar tokens
   */
  async refrescarTokens(refreshToken) {
    // Verificar refresh token
    const decoded = this.verificarRefreshToken(refreshToken);

    // Buscar usuario y verificar que el refresh token coincida
    const usuario = await User.findById(decoded.id).select('+refreshToken');
    
    if (!usuario || usuario.refreshToken !== refreshToken) {
      throw new Error('Refresh token invalido');
    }

    // Generar nuevos tokens
    const nuevoAccessToken = this.generarAccessToken(usuario);
    const nuevoRefreshToken = this.generarRefreshToken(usuario);

    // Actualizar refresh token
    usuario.refreshToken = nuevoRefreshToken;
    await usuario.save();

    return {
      accessToken: nuevoAccessToken,
      refreshToken: nuevoRefreshToken,
    };
  }

  /**
   * Cerrar sesion
   */
  async logout(userId) {
    await User.findByIdAndUpdate(userId, { refreshToken: null });
    return { mensaje: 'Sesion cerrada exitosamente' };
  }

  /**
   * Obtener usuario actual
   */
  async obtenerUsuarioActual(userId) {
    const usuario = await User.findById(userId)
      .select('email nombre fechaNacimiento genero busco biografia fotos intereses ubicacion configuracion contacto.telefono estado ultimaConexion verificado createdAt updatedAt'); // Explicitly select all expected fields including contacto.telefono
    
    if (!usuario) {
      throw new Error('Usuario no encontrado');
    }

    console.log('User retrieved in authService.obtenerUsuarioActual:', usuario); // ADDED LOG

    return usuario;
  }
}

module.exports = new AuthService();
