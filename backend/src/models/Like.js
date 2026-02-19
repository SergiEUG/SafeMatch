const mongoose = require('mongoose');

const likeSchema = new mongoose.Schema({
  de: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  para: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  tipo: {
    type: String,
    enum: ['like', 'dislike'],
    required: true,
  },
}, {
  timestamps: true,
});

// Indice compuesto unico para evitar duplicados
likeSchema.index({ de: 1, para: 1 }, { unique: true });

// Indice para buscar likes recibidos
likeSchema.index({ para: 1, tipo: 1 });

// Metodo estatico para verificar si existe un like mutuo
likeSchema.statics.verificarMatchMutuo = async function(userId1, userId2) {
  const likes = await this.find({
    $or: [
      { de: userId1, para: userId2, tipo: 'like' },
      { de: userId2, para: userId1, tipo: 'like' },
    ],
  });
  
  // Si hay 2 likes (uno de cada usuario), es match mutuo
  return likes.length === 2;
};

// Metodo estatico para obtener usuarios que le dieron like
likeSchema.statics.obtenerLikesRecibidos = async function(userId) {
  return await this.find({
    para: userId,
    tipo: 'like',
  }).populate('de', 'nombre fotos edad');
};

// Metodo estatico para verificar si ya se interactuo con un usuario
likeSchema.statics.yaInteractuo = async function(userId, targetId) {
  const interaccion = await this.findOne({
    de: userId,
    para: targetId,
  });
  return !!interaccion;
};

const Like = mongoose.model('Like', likeSchema);

module.exports = Like;
