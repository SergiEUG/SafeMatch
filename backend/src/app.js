/**
 * SafeMatch - Aplicacion Principal
 * Archivo principal que configura Express, Socket.io y todas las rutas
 */

const express = require("express");
const http = require("http");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

// Configuraciones
const { connectDB } = require("./config/database");
const { configurarSocket } = require("./config/socket");
const env = require("./config/env");

// Rutas
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const matchRoutes = require("./routes/matchRoutes");
const messageRoutes = require("./routes/messageRoutes");
const callRoutes = require("./routes/callRoutes");
const contactRoutes = require("./routes/contactRoutes");

// Crear aplicacion Express
const app = express();
const server = http.createServer(app);

// Configurar Express para confiar en encabezados de proxy (como X-Forwarded-For)
// Necesario cuando se ejecuta detras de un proxy inverso como Nginx
app.set('trust proxy', 1);

// ============================================
// MIDDLEWARE GLOBALES
// ============================================

// Seguridad con Helmet
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// CORS - Configuracion para desarrollo y produccion
app.use(
  cors({
    origin: env.CORS_ORIGIN || env.corsOrigin || "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// Parsear JSON y URL encoded
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Logging en desarrollo
if (env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Rate limiting - Limitar peticiones por IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Maximo 100 peticiones por ventana
  message: {
    success: false,
    message: "Demasiadas peticiones, intenta de nuevo mas tarde",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/", limiter);

// Rate limiting mas estricto para autenticacion
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 100, // Maximo 100 intentos de login por hora
  message: {
    success: false,
    message: "Demasiados intentos de autenticacion, intenta en 1 hora",
  },
});

app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);

// ============================================
// RUTAS DE LA API
// ============================================

// Ruta de estado/health check
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "SafeMatch API funcionando correctamente",
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  });
});

// Rutas principales
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/matches", matchRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/calls", callRoutes);
app.use("/api/contacts", contactRoutes);

// ============================================
// MANEJO DE ERRORES
// ============================================

// Ruta no encontrada
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: `Ruta ${req.originalUrl} no encontrada`,
  });
});

// Middleware de manejo de errores global
app.use((err, req, res, next) => {
  console.error("Error:", err);

  // Error de validacion de Mongoose
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      success: false,
      message: "Error de validacion",
      errors: messages,
    });
  }

  // Error de duplicado (ej: email ya existe)
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(400).json({
      success: false,
      message: `El ${field} ya esta en uso`,
    });
  }

  // Error de JWT
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      message: "Token invalido",
    });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      message: "Token expirado",
    });
  }

  // Error generico
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Error interno del servidor",
    ...(env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// ============================================
// INICIALIZACION DEL SERVIDOR
// ============================================

const startServer = async () => {
  try {
    // Conectar a MongoDB
    await connectDB();
    console.log("Base de datos conectada correctamente");

    // Inicializar Socket.io
    const io = configurarSocket(server);
    
    // IMPORTANTE: Guardar instancia de io en app para acceso desde controllers
    app.set('io', io);
    
    // Configurar handlers de Socket.io
    const configurarChatSocket = require('./sockets/chatSocket');
    const configurarCallSocket = require('./sockets/callSocket');
    const configurarContactSocket = require('./sockets/contactSocket');
    
    configurarChatSocket(io);
    configurarCallSocket(io);
    configurarContactSocket(io);
    
    console.log("Socket.io inicializado con chat, llamadas y contactos");

    // Iniciar servidor HTTP
    server.listen(env.PORT, () => {
      console.log(`
========================================
   SafeMatch Backend Server
========================================
   Entorno: ${env.NODE_ENV}
   Puerto: ${env.PORT}
   URL: http://localhost:${env.PORT}
   Health: http://localhost:${env.PORT}/api/health
========================================
      `);
    });
  } catch (error) {
    console.error("Error al iniciar el servidor:", error);
    process.exit(1);
  }
};

// Manejo de cierre graceful
process.on("SIGTERM", () => {
  console.log("SIGTERM recibido. Cerrando servidor...");
  server.close(() => {
    console.log("Servidor cerrado");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("SIGINT recibido. Cerrando servidor...");
  server.close(() => {
    console.log("Servidor cerrado");
    process.exit(0);
  });
});

// Iniciar servidor
startServer();

module.exports = { app, server };
