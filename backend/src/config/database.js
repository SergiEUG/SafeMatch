const mongoose = require('mongoose');
const config = require('./env');

const connectDB = async () => {
  try {
    const mongoUri = config.MONGODB_URI || config.mongodbUri || process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI no está definida. Crea un .env o exporta la variable de entorno.');
    }

    const conn = await mongoose.connect(mongoUri, {
      // Opciones de conexion modernas de Mongoose 6+
    });

    console.log(`MongoDB Conectado: ${conn.connection.host}`);
    
    // Manejar eventos de conexion
    mongoose.connection.on('error', (err) => {
      console.error(`Error de MongoDB: ${err}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB desconectado');
    });

    // Manejar cierre graceful
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('Conexion MongoDB cerrada por finalizacion de app');
      process.exit(0);
    });

    return conn;
  } catch (error) {
    console.error(`Error conectando a MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = {connectDB};
