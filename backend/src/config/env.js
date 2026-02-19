require('dotenv').config();

// Normalizar nombres (evita bugs por usar MAYUSCULAS vs camelCase en distintos archivos)
const NODE_ENV = process.env.NODE_ENV || 'development';
const PORT = parseInt(process.env.PORT, 10) || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/safematch';
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3001';

const JWT_SECRET = process.env.JWT_SECRET || 'tu_clave_secreta_desarrollo';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'tu_clave_refresh_desarrollo';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

const config = {
  // Servidor
  NODE_ENV,
  // alias por compatibilidad (algunos módulos miraban nodeEnv)
  nodeEnv: NODE_ENV,
  PORT,

  // Base de datos
  MONGODB_URI,
  // alias por compatibilidad
  mongodbUri: MONGODB_URI,

  // JWT
  JWT_SECRET,
  JWT_EXPIRES_IN,
  JWT_REFRESH_SECRET,
  JWT_REFRESH_EXPIRES_IN,
  // aliases usados por el código actual
  jwtSecret: JWT_SECRET,
  jwtExpiresIn: JWT_EXPIRES_IN,
  jwtRefreshSecret: JWT_REFRESH_SECRET,
  jwtRefreshExpiresIn: JWT_REFRESH_EXPIRES_IN,

  // CORS
  CORS_ORIGIN,
  // alias usado por socket.js
  corsOrigin: CORS_ORIGIN,

  // WebRTC STUN/TURN servers
  stunServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

// Validar variables requeridas en produccion
if (config.NODE_ENV === 'production') {
  const required = ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'MONGODB_URI'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Variables de entorno faltantes: ${missing.join(', ')}`);
  }
}

module.exports = config;
