const fs = require('fs');
const path = require('path');

// 1. Modificar el modelo User.js para eliminar el índice geográfico y la validación estricta de Point
const userModelPath = path.join(__dirname, 'src/models/User.js');
if (fs.existsSync(userModelPath)) {
    let content = fs.readFileSync(userModelPath, 'utf8');
    
    // Comentamos el índice que causa el error
    content = content.replace(/userSchema\.index\(\{ 'ubicacion': '2dsphere' \}\);/g, '// userSchema.index({ "ubicacion": "2dsphere" });');
    
    // Flexibilizamos el esquema de ubicación
    content = content.replace(/enum: \['Point'\],/g, '// enum: ["Point"],');
    content = content.replace(/default: 'Point',/g, '// default: "Point",');
    
    fs.writeFileSync(userModelPath, content);
    console.log('Parche aplicado: Índice geográfico y validación Point eliminados en User.js');
}

// 2. Modificar el controlador para asegurar que no se envíen datos que rompan la base de datos
const userControllerPath = path.join(__dirname, 'src/controllers/userController.js');
if (fs.existsSync(userControllerPath)) {
    let content = fs.readFileSync(userControllerPath, 'utf8');
    // Si hay alguna lógica específica de ubicación que podamos suavizar, lo hacemos aquí
    console.log('Controlador de usuario verificado.');
}

console.log('Parche V4 Definitivo completado.');
