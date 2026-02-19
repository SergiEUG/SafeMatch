const mongoose = require('mongoose');

const callPermissionSchema = new mongoose.Schema({
  match: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match',
    required: true,
  },
  solicitante: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  receptor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  estado: {
    type: String,
    enum: ['pendiente', 'aceptada', 'rechazada', 'expirada', 'cancelada'],
    default: 'pendiente',
  },
  tipoLlamada: {
    type: String,
    enum: ['audio', 'video'],
    default: 'video',
  },
  fechaSolicitud: {
    type: Date,
    default: Date.now,
  },
  fechaRespuesta: {
    type: Date,
  },
  expiraEn: {
    type: Date,
    default: function() {
      // Expira en 5 minutos
      return new Date(Date.now() + 5 * 60 * 1000);
    },
  },
  // Datos de la llamada si fue aceptada
  datosLlamada: {
    iniciada: {
      type: Date,
    },
    finalizada: {
      type: Date,
    },
    duracion: {
      type: Number, // en segundos
      default: 0,
    },
    finalizadaPor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
}, {
  timestamps: true,
});

// Indice para buscar permisos de un match
callPermissionSchema.index({ match: 1, estado: 1 });

// Indice para buscar permisos pendientes de un usuario
callPermissionSchema.index({ receptor: 1, estado: 1 });

// TTL index para limpiar permisos expirados automaticamente
callPermissionSchema.index({ expiraEn: 1 }, { expireAfterSeconds: 0 });

// Metodo estatico para verificar si hay un permiso activo
callPermissionSchema.statics.tienePermisoActivo = async function(matchId) {
  const permiso = await this.findOne({
    match: matchId,
    estado: 'aceptada',
    'datosLlamada.finalizada': { $exists: false },
  });
  return !!permiso;
};

// Metodo estatico para crear solicitud de llamada
callPermissionSchema.statics.crearSolicitud = async function(matchId, solicitanteId, receptorId, tipo = 'video') {
  // Cancelar solicitudes pendientes anteriores
  await this.updateMany(
    {
      match: matchId,
      estado: 'pendiente',
    },
    {
      estado: 'cancelada',
    }
  );
  
  // Crear nueva solicitud
  return await this.create({
    match: matchId,
    solicitante: solicitanteId,
    receptor: receptorId,
    tipoLlamada: tipo,
  });
};

// Metodo para aceptar la solicitud
callPermissionSchema.methods.aceptar = async function() {
  this.estado = 'aceptada';
  this.fechaRespuesta = new Date();
  return await this.save();
};

// Metodo para rechazar la solicitud
callPermissionSchema.methods.rechazar = async function() {
  this.estado = 'rechazada';
  this.fechaRespuesta = new Date();
  return await this.save();
};

// Metodo para iniciar la llamada
callPermissionSchema.methods.iniciarLlamada = async function() {
  this.datosLlamada.iniciada = new Date();
  return await this.save();
};

// Metodo para finalizar la llamada
callPermissionSchema.methods.finalizarLlamada = async function(finalizadoPorId) {
  const ahora = new Date();
  this.datosLlamada.finalizada = ahora;
  this.datosLlamada.finalizadaPor = finalizadoPorId;
  
  if (this.datosLlamada.iniciada) {
    this.datosLlamada.duracion = Math.floor(
      (ahora - this.datosLlamada.iniciada) / 1000
    );
  }
  
  return await this.save();
};

const CallPermission = mongoose.model('CallPermission', callPermissionSchema);

module.exports = CallPermission;
