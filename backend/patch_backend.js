const fs = require('fs');
const path = require('path');

// 1. Add send message endpoint to messageController.js
const controllerPath = path.join(__dirname, 'src/controllers/messageController.js');
let controllerContent = fs.readFileSync(controllerPath, 'utf8');
if (!controllerContent.includes('enviarMensaje')) {
    controllerContent = controllerContent.replace(
        'const messageController = {',
        `const messageController = {
  /**
   * POST /api/messages/:matchId
   * Enviar un mensaje
   */
  async enviarMensaje(req, res) {
    try {
      const { matchId } = req.params;
      const { contenido, tipo } = req.body;
      const resultado = await chatService.enviarMensaje(matchId, req.userId, contenido, tipo);
      res.status(201).json({ exito: true, datos: resultado });
    } catch (error) {
      res.status(400).json({ exito: false, mensaje: error.message });
    }
  },`
    );
    fs.writeFileSync(controllerPath, controllerContent);
    console.log('Updated messageController.js');
}

// 2. Add route for sending message to messageRoutes.js
const routesPath = path.join(__dirname, 'src/routes/messageRoutes.js');
let routesContent = fs.readFileSync(routesPath, 'utf8');
if (!routesContent.includes("router.post('/:matchId'")) {
    routesContent = routesContent.replace(
        "router.get('/:matchId'",
        "router.post('/:matchId', validarObjectId('matchId'), verificarMatch, messageController.enviarMensaje);\nrouter.get('/:matchId'"
    );
    fs.writeFileSync(routesPath, routesContent);
    console.log('Updated messageRoutes.js');
}

// 3. Add likes recibidos endpoint to matchController.js
const matchControllerPath = path.join(__dirname, 'src/controllers/matchController.js');
let matchControllerContent = fs.readFileSync(matchControllerPath, 'utf8');
if (!matchControllerContent.includes('obtenerLikesRecibidos')) {
    matchControllerContent = matchControllerContent.replace(
        'const matchController = {',
        `const matchController = {
  /**
   * GET /api/matches/received-likes
   * Obtener usuarios que me han dado like
   */
  async obtenerLikesRecibidos(req, res) {
    try {
      const likes = await matchService.obtenerLikesRecibidos(req.userId);
      res.json({ exito: true, datos: likes });
    } catch (error) {
      res.status(500).json({ exito: false, mensaje: error.message });
    }
  },`
    );
    fs.writeFileSync(matchControllerPath, matchControllerContent);
    console.log('Updated matchController.js');
}

// 4. Add route for received likes to matchRoutes.js
const matchRoutesPath = path.join(__dirname, 'src/routes/matchRoutes.js');
let matchRoutesContent = fs.readFileSync(matchRoutesPath, 'utf8');
if (!matchRoutesContent.includes("router.get('/received-likes'")) {
    matchRoutesContent = matchRoutesContent.replace(
        "router.get('/', matchController.obtenerMatches);",
        "router.get('/received-likes', matchController.obtenerLikesRecibidos);\nrouter.get('/', matchController.obtenerMatches);"
    );
    fs.writeFileSync(matchRoutesPath, matchRoutesContent);
    console.log('Updated matchRoutes.js');
}
