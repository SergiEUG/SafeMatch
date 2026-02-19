const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  match: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match',
    required: true,
  },
  remitente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() { return this.tipo !== 'sistema'; }, // Only required if not a system message
  },
  contenido: {
    type: String,
    required: [true, 'El mensaje no puede estar vacio'],
    maxlength: [1000, 'El mensaje no puede tener mas de 1000 caracteres'],
    trim: true,
  },
  tipo: {
    type: String,
    enum: ['texto', 'imagen', 'sistema'],
    default: 'texto',
  },
  estado: {
    type: String,
    enum: ['enviado', 'entregado', 'leido'],
    default: 'enviado',
  },
  filtrado: {
    type: Boolean,
    default: false,
  },
  contenidoOriginal: {
    type: String,
    default: null,
    select: false, // Solo admins pueden ver
  },
  metadata: {
    editado: {
      type: Boolean,
      default: false,
    },
    fechaEdicion: Date,
    eliminado: {
      type: Boolean,
      default: false,
    },
    fechaEliminacion: Date,
  },
}, {
  timestamps: true,
});

// Indice compuesto para obtener mensajes de un match ordenados
messageSchema.index({ match: 1, createdAt: -1 });

// Indice para buscar mensajes no leidos
messageSchema.index({ match: 1, remitente: 1, estado: 1 });

// Metodo estatico para obtener historial de chat
messageSchema.statics.obtenerHistorial = async function(matchId, options = {}) {
  const { limite = 50, antes = null } = options;
  
  const query = { 
    match: matchId,
    'metadata.eliminado': false,
  };
  
  if (antes) {
    query.createdAt = { $lt: antes };
  }
  
  return await this.find(query)
    .populate('remitente', 'nombre fotos')
    .sort({ createdAt: -1 })
    .limit(limite);
};

// Metodo estatico para marcar mensajes como leidos
messageSchema.statics.marcarComoLeidos = async function(matchId, userId) {
  return await this.updateMany(
    {
      match: matchId,
      remitente: { $ne: userId },
      estado: { $ne: 'leido' },
    },
    {
      $set: { estado: 'leido' },
    }
  );
};

// Metodo estatico para contar mensajes no leidos
messageSchema.statics.contarNoLeidos = async function(matchId, userId) {
  return await this.countDocuments({
    match: matchId,
    remitente: { $ne: userId },
    estado: { $ne: 'leido' },
  });
};

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
