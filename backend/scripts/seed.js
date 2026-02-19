/**
 * SafeMatch - Script de Seed
 * Crea usuarios de prueba en la base de datos
 * Ejecutar con: npm run seed
 */

require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// Modelos
const User = require("../src/models/User");
const Match = require("../src/models/Match");
const Message = require("../src/models/Message");
const Like = require("../src/models/Like");

// Configuracion
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/safematch";

// Datos de usuarios de prueba
const testUsers = [
  {
    email: "ana@test.com",
    password: "password123",
    profile: {
      name: "Ana Garcia",
      age: 25,
      gender: "female",
      interestedIn: ["male"],
      bio: "Amante de la musica y los viajes. Buscando alguien con quien compartir aventuras.",
      location: {
        city: "Madrid",
        country: "Espana",
      },
      interests: ["musica", "viajes", "fotografia", "cine"],
      photos: ["https://randomuser.me/api/portraits/women/1.jpg"],
    },
  },
  {
    email: "carlos@test.com",
    password: "password123",
    profile: {
      name: "Carlos Martinez",
      age: 28,
      gender: "male",
      interestedIn: ["female"],
      bio: "Ingeniero de software, amante del deporte y la buena comida.",
      location: {
        city: "Barcelona",
        country: "Espana",
      },
      interests: ["tecnologia", "futbol", "cocina", "senderismo"],
      photos: ["https://randomuser.me/api/portraits/men/1.jpg"],
    },
  },
  {
    email: "lucia@test.com",
    password: "password123",
    profile: {
      name: "Lucia Fernandez",
      age: 24,
      gender: "female",
      interestedIn: ["male", "female"],
      bio: "Disenadora grafica con pasion por el arte y la naturaleza.",
      location: {
        city: "Valencia",
        country: "Espana",
      },
      interests: ["arte", "diseno", "yoga", "naturaleza"],
      photos: ["https://randomuser.me/api/portraits/women/2.jpg"],
    },
  },
  {
    email: "miguel@test.com",
    password: "password123",
    profile: {
      name: "Miguel Lopez",
      age: 30,
      gender: "male",
      interestedIn: ["female"],
      bio: "Chef profesional buscando a alguien que aprecie una buena cena.",
      location: {
        city: "Sevilla",
        country: "Espana",
      },
      interests: ["gastronomia", "vinos", "viajes", "lectura"],
      photos: ["https://randomuser.me/api/portraits/men/2.jpg"],
    },
  },
  {
    email: "sofia@test.com",
    password: "password123",
    profile: {
      name: "Sofia Rodriguez",
      age: 26,
      gender: "female",
      interestedIn: ["male"],
      bio: "Medica residente, amante de los animales y las series.",
      location: {
        city: "Bilbao",
        country: "Espana",
      },
      interests: ["medicina", "series", "mascotas", "running"],
      photos: ["https://randomuser.me/api/portraits/women/3.jpg"],
    },
  },
  {
    email: "david@test.com",
    password: "password123",
    profile: {
      name: "David Sanchez",
      age: 27,
      gender: "male",
      interestedIn: ["female"],
      bio: "Musico y profesor de guitarra. La vida es mejor con musica.",
      location: {
        city: "Madrid",
        country: "Espana",
      },
      interests: ["musica", "guitarra", "conciertos", "cafe"],
      photos: ["https://randomuser.me/api/portraits/men/3.jpg"],
    },
  },
];

// Funcion principal de seed
async function seed() {
  try {
    console.log("Conectando a MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("Conectado a MongoDB");

    // Preguntar si limpiar datos existentes
    console.log("\nLimpiando datos existentes...");
    await Promise.all([
      User.deleteMany({}),
      Match.deleteMany({}),
      Message.deleteMany({}),
      Like.deleteMany({}),
    ]);
    console.log("Datos eliminados");

    // Crear usuarios
    console.log("\nCreando usuarios de prueba...");
    const createdUsers = [];

    for (const userData of testUsers) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const user = new User({
        email: userData.email,
        password: hashedPassword,
        profile: userData.profile,
        isVerified: true,
        isActive: true,
      });
      await user.save();
      createdUsers.push(user);
      console.log(`  - Usuario creado: ${userData.profile.name}`);
    }

    // Crear algunos matches de ejemplo
    console.log("\nCreando matches de ejemplo...");

    // Ana y Carlos hacen match
    const like1 = new Like({
      fromUser: createdUsers[0]._id,
      toUser: createdUsers[1]._id,
      type: "like",
    });
    await like1.save();

    const like2 = new Like({
      fromUser: createdUsers[1]._id,
      toUser: createdUsers[0]._id,
      type: "like",
    });
    await like2.save();

    const match1 = new Match({
      users: [createdUsers[0]._id, createdUsers[1]._id],
      status: "active",
      matchedAt: new Date(),
    });
    await match1.save();
    console.log("  - Match creado: Ana y Carlos");

    // Crear mensajes de ejemplo
    console.log("\nCreando mensajes de ejemplo...");

    const messages = [
      {
        match: match1._id,
        sender: createdUsers[0]._id,
        content: "Hola Carlos! Vi que te gusta el senderismo, a mi tambien!",
        type: "text",
      },
      {
        match: match1._id,
        sender: createdUsers[1]._id,
        content:
          "Hola Ana! Si, me encanta. Conoces alguna ruta buena por Madrid?",
        type: "text",
      },
      {
        match: match1._id,
        sender: createdUsers[0]._id,
        content: "Si! La Pedriza es increible. Podriamos ir algun dia.",
        type: "text",
      },
    ];

    for (const msgData of messages) {
      const message = new Message(msgData);
      await message.save();
    }
    console.log(`  - ${messages.length} mensajes creados`);

    // Actualizar ultimo mensaje del match
    match1.lastMessage = {
      content: messages[messages.length - 1].content,
      sender: messages[messages.length - 1].sender,
      timestamp: new Date(),
    };
    await match1.save();

    console.log("\n========================================");
    console.log("Seed completado exitosamente!");
    console.log("========================================");
    console.log("\nUsuarios de prueba creados:");
    console.log("----------------------------------------");
    for (const userData of testUsers) {
      console.log(`Email: ${userData.email}`);
      console.log(`Password: ${userData.password}`);
      console.log(`Nombre: ${userData.profile.name}`);
      console.log("----------------------------------------");
    }

    process.exit(0);
  } catch (error) {
    console.error("Error durante el seed:", error);
    process.exit(1);
  }
}

// Ejecutar seed
seed();
