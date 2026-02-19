const fs = require('fs');
const path = require('path');

// 1. Extender expiración de JWT en config/env.js
const envPath = path.join(__dirname, 'src/config/env.js');
if (fs.existsSync(envPath)) {
    let content = fs.readFileSync(envPath, 'utf8');
    content = content.replace(/jwtExpiresIn: process\.env\.JWT_EXPIRES_IN \|\| '15m'/, "jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h'");
    fs.writeFileSync(envPath, content);
    console.log('✅ JWT expiration extended to 24h');
}

// 2. Asegurar que el matchService cree el chat o mensaje de sistema
const matchServicePath = path.join(__dirname, 'src/services/matchService.js');
if (fs.existsSync(matchServicePath)) {
    let content = fs.readFileSync(matchServicePath, 'utf8');
    
    // Añadir importación de Message si no existe
    if (!content.includes("const { Match, Like, User, Message }")) {
        content = content.replace("const { Match, Like, User } = require('../models');", "const { Match, Like, User, Message } = require('../models');");
    }

    // Modificar lógica de darLike para crear un mensaje inicial
    if (content.includes("await match.populate('usuarios', 'nombre fotos');") && !content.includes("Message.create")) {
        const messageInclusion = `
      await match.populate('usuarios', 'nombre fotos');
      
      // Crear mensaje de sistema inicial para activar el chat
      try {
        await Message.create({
          match: match._id,
          remitente: null,
          contenido: '¡Habéis hecho un match! Ya podéis empezar a hablar.',
          tipo: 'sistema'
        });
      } catch (e) { console.error("Error al crear mensaje inicial:", e); }
`;
        content = content.replace("await match.populate('usuarios', 'nombre fotos');", messageInclusion);
        fs.writeFileSync(matchServicePath, content);
        console.log('✅ Match service patched to create initial message');
    }
}
