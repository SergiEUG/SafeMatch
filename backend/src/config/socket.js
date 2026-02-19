const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const config = require('./env');
const { User, Match } = require('../models');

// Almacen de usuarios conectados
// { odId: { odId: string, sockets: Set<socketId> } }
const usuariosConectados = new Map();

/**
 * Configurar Socket.io
 */
const configurarSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: config.corsOrigin,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Middleware de autenticacion para Socket.io
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;

      if (!token) {
        return next(new Error('Token no proporcionado'));
      }

      // Verificar JWT
      const decoded = jwt.verify(token, config.jwtSecret);

      // Buscar usuario
      const usuario = await User.findById(decoded.id);
      if (!usuario || usuario.estado === 'eliminado') {
        return next(new Error('Usuario no autorizado'));
      }

      // Adjuntar usuario al socket
      socket.userId = usuario._id.toString();
      socket.usuario = {
        id: usuario._id,
        nombre: usuario.nombre,
      };

      next();
    } catch (error) {
      next(new Error('Token invalido'));
    }
  });

  // Manejar conexiones
  io.on('connection', async (socket) => {
    const userId = socket.userId;
    console.log(`Usuario conectado: ${userId}`);

    // Registrar usuario conectado
    if (!usuariosConectados.has(userId)) {
      usuariosConectados.set(userId, {
        userId: socket.usuario.id.toString(),
        sockets: new Set(),
      });
    }
    usuariosConectados.get(userId).sockets.add(socket.id);

    // Unir a salas de sus matches activos
    await unirseASalasDeMatches(socket, userId);

    // Actualizar ultima conexion
    await User.findByIdAndUpdate(userId, { ultimaConexion: new Date() });

    // Emitir estado online a matches
    emitirEstadoAMatches(io, userId, 'online');

    // Manejar desconexion
    socket.on('disconnect', async () => {
      console.log(`Usuario desconectado: ${userId}`);

      const userSockets = usuariosConectados.get(userId);
      if (userSockets) {
        userSockets.sockets.delete(socket.id);
        
        // Si no quedan sockets, el usuario esta offline
        if (userSockets.sockets.size === 0) {
          usuariosConectados.delete(userId);
          
          // Actualizar ultima conexion
          await User.findByIdAndUpdate(userId, { ultimaConexion: new Date() });
          
          // Emitir estado offline
          emitirEstadoAMatches(io, userId, 'offline');
        }
      }
    });

    // Error handler
    socket.on('error', (error) => {
      console.error(`Error en socket ${socket.id}:`, error);
    });
  });

  return io;
};

/**
 * Unir socket a salas de todos sus matches activos
 */
async function unirseASalasDeMatches(socket, userId) {
  try {
    const matches = await Match.find({
      usuarios: userId,
      estado: 'activo',
    });

    for (const match of matches) {
      const sala = `match:${match._id}`;
      socket.join(sala);
    }
  } catch (error) {
    console.error('Error al unirse a salas:', error);
  }
}

/**
 * Emitir estado de conexion a todos los matches del usuario
 */
async function emitirEstadoAMatches(io, userId, estado) {
  try {
    const matches = await Match.find({
      usuarios: userId,
      estado: 'activo',
    });

    for (const match of matches) {
      io.to(`match:${match._id}`).emit('user:status', {
        userId: userId,
        estado,
        timestamp: new Date(),
      });
    }
  } catch (error) {
    console.error('Error al emitir estado:', error);
  }
}

/**
 * Verificar si un usuario esta conectado
 */
const estaConectado = (userId) => {
  return usuariosConectados.has(userId);
};

/**
 * Obtener sockets de un usuario
 */
const obtenerSocketsDeUsuario = (userId) => {
  const userSockets = usuariosConectados.get(userId);
  return userSockets ? Array.from(userSockets.sockets) : [];
};

module.exports = {
  configurarSocket,
  estaConectado,
  obtenerSocketsDeUsuario,
  usuariosConectados,
};
