/**
 * Middleware de validacion para requests
 */

/**
 * Validar datos de registro
 */
const validarRegistro = (req, res, next) => {
  const { email, password, nombre, fechaNacimiento, genero } = req.body;
  const errores = [];

  // Validar email
  if (!email) {
    errores.push('El email es requerido');
  } else if (!/^\S+@\S+\.\S+$/.test(email)) {
    errores.push('El email no es valido');
  }

  // Validar password
  if (!password) {
    errores.push('La contrasena es requerida');
  } else if (password.length < 6) {
    errores.push('La contrasena debe tener al menos 6 caracteres');
  }

  // Validar nombre
  if (!nombre) {
    errores.push('El nombre es requerido');
  } else if (nombre.length > 50) {
    errores.push('El nombre no puede tener mas de 50 caracteres');
  }

  // Validar fecha de nacimiento
  if (!fechaNacimiento) {
    errores.push('La fecha de nacimiento es requerida');
  } else {
    const fecha = new Date(fechaNacimiento);
    if (isNaN(fecha.getTime())) {
      errores.push('La fecha de nacimiento no es valida');
    }
  }

  // Validar genero
  const generosValidos = ['masculino', 'femenino', 'otro', 'prefiero_no_decir'];
  if (!genero) {
    errores.push('El genero es requerido');
  } else if (!generosValidos.includes(genero)) {
    errores.push('El genero no es valido');
  }

  if (errores.length > 0) {
    return res.status(400).json({
      exito: false,
      mensaje: 'Error de validacion',
      errores,
    });
  }

  next();
};

/**
 * Validar datos de login
 */
const validarLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errores = [];

  if (!email) {
    errores.push('El email es requerido');
  }

  if (!password) {
    errores.push('La contrasena es requerida');
  }

  if (errores.length > 0) {
    return res.status(400).json({
      exito: false,
      mensaje: 'Error de validacion',
      errores,
    });
  }

  next();
};

/**
 * Validar actualizacion de perfil
 */
const validarActualizacionPerfil = (req, res, next) => {
  const { nombre, biografia, fotos, intereses } = req.body;
  const errores = [];

  if (nombre !== undefined && nombre.length > 50) {
    errores.push('El nombre no puede tener mas de 50 caracteres');
  }

  if (biografia !== undefined && biografia.length > 500) {
    errores.push('La biografia no puede tener mas de 500 caracteres');
  }

  if (fotos !== undefined && fotos.length > 6) {
    errores.push('No puedes tener mas de 6 fotos');
  }

  if (intereses !== undefined && intereses.length > 10) {
    errores.push('No puedes tener mas de 10 intereses');
  }

  if (errores.length > 0) {
    return res.status(400).json({
      exito: false,
      mensaje: 'Error de validacion',
      errores,
    });
  }

  next();
};

/**
 * Validar ObjectId de MongoDB
 */
const validarObjectId = (paramName) => (req, res, next) => {
  const id = req.params[paramName];
  
  if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
    return res.status(400).json({
      exito: false,
      mensaje: `ID invalido: ${paramName}`,
    });
  }

  next();
};

/**
 * Sanitizar entrada de texto
 */
const sanitizarTexto = (texto) => {
  if (typeof texto !== 'string') return texto;
  return texto
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '');
};

/**
 * Middleware para sanitizar body
 */
const sanitizarBody = (req, res, next) => {
  if (req.body) {
    for (const key of Object.keys(req.body)) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = sanitizarTexto(req.body[key]);
      }
    }
  }
  next();
};

module.exports = {
  validarRegistro,
  validarLogin,
  validarActualizacionPerfil,
  validarObjectId,
  sanitizarTexto,
  sanitizarBody,
};
