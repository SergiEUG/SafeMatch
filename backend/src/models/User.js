const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'El email es requerido'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Por favor ingresa un email valido'],
  },
  password: {
    type: String,
    required: [true, 'La contrasena es requerida'],
    minlength: [6, 'La contrasena debe tener al menos 6 caracteres'],
    select: false, // No incluir en queries por defecto
  },
  nombre: {
    type: String,
    required: [true, 'El nombre es requerido'],
    trim: true,
    maxlength: [50, 'El nombre no puede tener mas de 50 caracteres'],
  },
  fechaNacimiento: {
    type: Date,
    required: [true, 'La fecha de nacimiento es requerida'],
  },
  genero: {
    type: String,
    enum: ['masculino', 'femenino', 'otro', 'prefiero_no_decir'],
    required: [true, 'El genero es requerido'],
  },
  busco: {
    type: [String],
    enum: ['masculino', 'femenino', 'otro', 'todos'],
    default: ['todos'],
  },
  biografia: {
    type: String,
    maxlength: [500, 'La biografia no puede tener mas de 500 caracteres'],
    default: '',
  },
  fotos: {
    type: [String], // URLs de las fotos
    validate: {
      validator: function(v) {
        return v.length <= 6;
      },
      message: 'No puedes tener mas de 6 fotos',
    },
    default: [],
  },
  intereses: {
    type: [String],
    validate: {
      validator: function(v) {
        return v.length <= 10;
      },
      message: 'No puedes tener mas de 10 intereses',
    },
    default: [],
  },
  ubicacion: {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point",
    },
    coordinates: {
      type: [Number], // [longitud, latitud]
      default: [0, 0],
    },
    ciudad: {
      type: String,
      default: '',
    },
  },
  configuracion: {
    distanciaMaxima: {
      type: Number,
      default: 50, // km
      min: 1,
      max: 500,
    },
    rangoEdad: {
      min: {
        type: Number,
        default: 18,
        min: 18,
      },
      max: {
        type: Number,
        default: 99,
        max: 120,
      },
    },
    notificaciones: {
      type: Boolean,
      default: true,
    },
  },
  contacto: {
    telefono: {
      type: String,
      default: '',
    },
    instagram: {
      type: String,
      default: '',
    },
    whatsapp: {
      type: String,
      default: '',
    },
  },
  estado: {
    type: String,
    enum: ['activo', 'pausado', 'eliminado'],
    default: 'activo',
  },
  ultimaConexion: {
    type: Date,
    default: Date.now,
  },
  verificado: {
    type: Boolean,
    default: false,
  },
  refreshToken: {
    type: String,
    select: false,
  },
}, {
  timestamps: true, // createdAt y updatedAt automaticos
});

// Indice geoespacial para busquedas por ubicacion
// userSchema.index({ "ubicacion": "2dsphere" });

// Indice para busquedas por email
// userSchema.index({ email: 1 });

// Middleware pre-save para hashear contrasena
userSchema.pre('save', async function(next) {
  // Solo hashear si la contrasena fue modificada
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Metodo para comparar contrasenas
userSchema.methods.compararPassword = async function(passwordIngresada) {
  return await bcrypt.compare(passwordIngresada, this.password);
};

// Metodo para calcular edad
userSchema.methods.calcularEdad = function() {
  const hoy = new Date();
  const nacimiento = new Date(this.fechaNacimiento);
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const mes = hoy.getMonth() - nacimiento.getMonth();
  
  if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
    edad--;
  }
  
  return edad;
};

// Virtual para edad
userSchema.virtual('edad').get(function() {
  return this.calcularEdad();
});

// Asegurar que los virtuals se incluyan en JSON
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

const User = mongoose.model('User', userSchema);

module.exports = User;
