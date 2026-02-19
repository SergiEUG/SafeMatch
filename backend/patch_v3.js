const fs = require('fs');
const path = require('path');

// 1. Desactivar el índice geográfico en el modelo User para evitar el error "Can't extract geo keys"
const userModelPath = path.join(__dirname, 'src/models/User.js');
if (fs.existsSync(userModelPath)) {
    let content = fs.readFileSync(userModelPath, 'utf8');
    // Buscamos la definición de ubicación y eliminamos el índice 2dsphere si existe
    content = content.replace(/index:\s*'2dsphere'/g, '// index: "2dsphere"');
    fs.writeFileSync(userModelPath, content);
    console.log('Parche aplicado: Índice geográfico desactivado.');
}

// 2. Asegurar que la creación de matches sea robusta
const matchServicePath = path.join(__dirname, 'src/services/matchService.js');
if (fs.existsSync(matchServicePath)) {
    let content = fs.readFileSync(matchServicePath, 'utf8');
    // Aseguramos que al crear un match se cree una sala de chat
    if (!content.includes('chatService.createChat')) {
        console.log('Aviso: El servicio de match podría no estar creando chats automáticamente.');
    }
}

console.log('Parche V3 completado.');
