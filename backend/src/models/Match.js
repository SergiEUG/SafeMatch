const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  usuarios: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  }],
  estado: {
    type: String,
    enum: ['activo', 'bloqueado', 'eliminado'],
    default: 'activo',
  },
  // Registro de quien dio like primero
  likes: [{
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    fecha: {
      type: Date,
      default: Date.now,
    },
  }],
  fechaMatch: {
    type: Date,
    default: Date.now,
  },
  // Permisos de contacto compartido
  contactoCompartido: {
    solicitadoPor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    aceptadoPor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    compartido: {
      type: Boolean,
      default: false,
    },
    fechaSolicitud: Date,
    fechaAceptacion: Date,
  },
  // Permisos de llamada
  callPermissions: {
    type: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      status: {
        type: String,
        enum: ['PENDING', 'ACCEPTED', 'DECLINED'],
        default: 'PENDING',
        required: true,
      },
    }],
    default: [],
  },
  ultimaActividad: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Indice compuesto para buscar matches de un usuario
matchSchema.index({ usuarios: 1 });

// Indice para ordenar por ultima actividad
matchSchema.index({ ultimaActividad: -1 });

// Metodo estatico para verificar si dos usuarios tienen match
matchSchema.statics.tienenMatch = async function(userId1, userId2) {
  const match = await this.findOne({
    usuarios: { $all: [userId1, userId2] },
    estado: 'activo',
  });
  return match;
};

// Metodo estatico para obtener matches de un usuario
matchSchema.statics.obtenerMatchesDeUsuario = async function(userId) {
  return await this.find({
    usuarios: userId,
    estado: 'activo',
  })
  .populate('usuarios', 'nombre fotos ultimaConexion contacto.telefono') // Only select contacto.telefono and other fields
  .sort({ ultimaActividad: -1 });
};

// Metodo para obtener el otro usuario del match
matchSchema.methods.obtenerOtroUsuario = function(userId) {
  return this.usuarios.find(u => u._id.toString() !== userId.toString());
};

const Match = mongoose.model('Match', matchSchema);

module.exports = Match;
