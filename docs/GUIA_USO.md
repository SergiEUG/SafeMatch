# 📖 Guía de Uso y Arquitectura - SafeMatch

## 🎯 Visión General del Proyecto

SafeMatch és una aplicació de cites amb èmfasi en **seguretat** i **consentiment explícit**. Les característiques clau són:

1. ✅ **Match obligatori** abans de qualsevol interacció
2. 💬 **Chat en temps real** amb filtratge de contingut
3. 📞 **Trucades de veu/vídeo** amb WebRTC i consentiment obligatori
4. 🔒 **Compartir contacte** amb doble verificació
5. 🛡️ **Seguretat** amb JWT, rate limiting i validació

---

## 🏗️ Arquitectura del Sistema

### Vista General

\`\`\`
┌─────────────┐
│   Cliente   │ (Navegador)
│  (Vue.js)   │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────┐
│          NGINX                  │ ← Proxy Inverso
│  - Servir frontend              │
│  - Proxy a /api/* → Backend     │
│  - Proxy a /socket.io/* → WS    │
│  - Terminación SSL/TLS          │
└──────┬──────────────────────────┘
       │
       ├────────────┬──────────────┐
       ▼            ▼              ▼
┌───────────┐ ┌──────────┐  ┌──────────┐
│ Frontend  │ │ Backend  │  │ MongoDB  │
│ (Static)  │ │ (Node.js)│  │          │
└───────────┘ └────┬─────┘  └──────────┘
                   │
             ┌─────┴──────┐
             │            │
        ┌────▼────┐  ┌───▼────┐
        │Socket.io│  │ Express│
        │  (WS)   │  │ (REST) │
        └─────────┘  └────────┘
\`\`\`

### Componentes Principales

#### 1. **Nginx** (Proxy Inverso)
**Què fa:**
- Actua com a "porter" entre Internet i els teus serveis
- Gestiona certificats SSL (HTTPS)
- Distribueix el tràfic als serveis correctes

**Per què és important:**
- Seguretat: Backend no està exposat directament
- Performance: Servir fitxers estàtics és molt ràpid
- SSL: Centralitza la gestió de certificats

#### 2. **Backend** (Node.js + Express)
**Estructura:**
\`\`\`
backend/
├── src/
│   ├── app.js              # Punt d'entrada
│   ├── config/             # Configuracions
│   │   ├── database.js     # Connexió MongoDB
│   │   ├── socket.js       # Configuració Socket.io
│   │   └── env.js          # Variables d'entorn
│   ├── models/             # Esquemes de dades
│   │   ├── User.js
│   │   ├── Match.js
│   │   ├── Message.js
│   │   └── CallPermission.js
│   ├── controllers/        # Lògica de endpoints
│   ├── services/           # Lògica de negoci
│   ├── middleware/         # Validacions i auth
│   ├── routes/             # Definició de routes
│   ├── sockets/            # Handlers WebSocket
│   └── utils/              # Utilitats
└── ecosystem.config.js     # Configuració PM2
\`\`\`

#### 3. **PM2** (Gestor de Processos)
**Què fa:**
- Manté l'aplicació sempre en execució
- Reinicia automàticament si hi ha errors
- Gestiona logs
- Pot executar múltiples instàncies (cluster)

**Comandos útils:**
\`\`\`bash
pm2 list          # Veure aplicacions
pm2 logs          # Veure logs
pm2 restart all   # Reiniciar tot
pm2 monit         # Monitoritzar recursos
\`\`\`

---

## 🔐 Sistema de Autenticación (JWT)

### Cómo Funciona

1. **Registro:**
\`\`\`
Usuario envía: { email, password, nombre, ... }
         ↓
Backend hashea password con bcrypt
         ↓
Guarda usuario en MongoDB
         ↓
Retorna: { success: true, user: {...} }
\`\`\`

2. **Login:**
\`\`\`
Usuario envía: { email, password }
         ↓
Backend busca usuario en DB
         ↓
Compara password hasheado
         ↓
Genera JWT token (válido 15min)
         ↓
Retorna: { token: "eyJhbGc...", user: {...} }
\`\`\`

3. **Peticiones Autenticadas:**
\`\`\`
Cliente envía: Authorization: Bearer <token>
         ↓
Middleware verifica token
         ↓
Si válido → req.user = { id, email, ... }
         ↓
Controller puede usar req.user.id
\`\`\`

### ¿Por qué JWT?

**Ventajas:**
- ✅ Sin estado (stateless): No requiere almacenar sesiones en servidor
- ✅ Escalable: Fácil añadir más servidores
- ✅ Seguro: Firmado criptográficamente
- ✅ Estándar: Compatible con muchas herramientas

**Desventajas:**
- ❌ No se puede invalidar (hasta que expire)
- ❌ Tamaño más grande que session ID
- ❌ Si se roba, es válido hasta expirar

**Solución a desventajas:**
- Tiempo de expiración corto (15min)
- Refresh tokens (7 días)
- Blacklist para logout

---

## 💬 Chat en Tiempo Real (Socket.io)

### Cómo Funciona WebSockets

**HTTP tradicional:**
\`\`\`
Cliente: "¿Hay mensajes nuevos?"
Servidor: "No"
(Espera 5 segundos)
Cliente: "¿Y ahora?"
Servidor: "No"
(Espera 5 segundos)
Cliente: "¿Y ahora?"
Servidor: "Sí, aquí está"
\`\`\`

**WebSocket:**
\`\`\`
Cliente: *abre conexión*
Servidor: "OK, te avisaré cuando haya algo"
...
(Llega mensaje nuevo)
Servidor: "¡Nuevo mensaje!" → Cliente
\`\`\`

### Flujo de Chat en SafeMatch

1. **Conexión:**
\`\`\`javascript
// Cliente
const socket = io('https://safematch.com', {
  auth: { token: 'mi-jwt-token' }
});

// Servidor verifica el token
// Si válido: socket.userId = '12345'
\`\`\`

2. **Unirse a Sala de Match:**
\`\`\`javascript
// Cliente
socket.emit('chat:join', { matchId: 'abc123' });

// Servidor
// - Verifica que el usuario está en el match
// - Lo une a la sala 'match:abc123'
// - Notifica al otro usuario
\`\`\`

3. **Enviar Mensaje:**
\`\`\`javascript
// Cliente
socket.emit('chat:send', {
  matchId: 'abc123',
  contenido: 'Hola!'
});

// Servidor
// 1. Filtra palabras ofensivas
// 2. Guarda en MongoDB
// 3. Emite a toda la sala
io.to('match:abc123').emit('chat:receive', {
  mensaje: { ... }
});
\`\`\`

4. **Recibir Mensaje:**
\`\`\`javascript
// Cliente
socket.on('chat:receive', (data) => {
  // Añadir mensaje a la UI
  addMessageToChat(data.mensaje);
});
\`\`\`

### Eventos Implementados

| Evento | Dirección | Descripción |
|--------|-----------|-------------|
| `chat:join` | Cliente → Servidor | Unirse a sala de chat |
| `chat:send` | Cliente → Servidor | Enviar mensaje |
| `chat:receive` | Servidor → Cliente | Recibir mensaje |
| `chat:typing` | Cliente ↔ Servidor | Usuario escribiendo |
| `chat:read` | Cliente → Servidor | Marcar mensajes como leídos |
| `chat:filtered` | Servidor → Cliente | Mensaje filtrado (ofensivo) |

---

## 📞 Llamadas con WebRTC

### ¿Qué es WebRTC?

**WebRTC** (Web Real-Time Communication) permite comunicación **directa** entre navegadores sin pasar por el servidor.

**Ventajas:**
- ✅ Baja latencia (conexión directa)
- ✅ Privacidad (no pasa por servidor)
- ✅ Calidad (no hay intermediarios)

### Fases de una Llamada WebRTC

#### Fase 1: Solicitud y Consentimiento

\`\`\`
Usuario A: "Quiero llamar a B"
      ↓
API REST: POST /api/calls/:matchId/request
      ↓
Servidor guarda en DB: CallPermission
      ↓
Socket.io: emit('call:incoming') → Usuario B
      ↓
Usuario B: "Acepto" o "Rechazo"
      ↓
API REST: POST /api/calls/:matchId/accept
      ↓
Socket.io: emit('call:accepted') → Usuario A
\`\`\`

#### Fase 2: Señalización (Intercambio de Información)

\`\`\`
Usuario A crea RTCPeerConnection
      ↓
A genera "offer" (SDP)
      ↓
Socket: emit('call:offer', { sdp }) → Servidor → B
      ↓
B genera "answer" (SDP)
      ↓
Socket: emit('call:answer', { sdp }) → Servidor → A
      ↓
Ambos intercambian ICE candidates
      ↓
Socket: emit('call:ice', { candidate }) ↔ Servidor
\`\`\`

**¿Qué es SDP?**
- Session Description Protocol
- Describe las capacidades de audio/vídeo
- Códecs soportados, resoluciones, etc.

**¿Qué son ICE Candidates?**
- Interactive Connectivity Establishment
- Direcciones IP y puertos posibles para conectar
- Incluye IP local, IP pública, servidor STUN/TURN

#### Fase 3: Conexión Directa (P2P)

\`\`\`
Usuario A ←────────────────→ Usuario B
         (Audio/Vídeo directo)
         
         (Servidor NO participa)
\`\`\`

### Código de Ejemplo (Cliente)

\`\`\`javascript
// 1. Crear conexión
const peerConnection = new RTCPeerConnection({
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' }
  ]
});

// 2. Añadir stream local (cámara/micrófono)
const localStream = await navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true
});

localStream.getTracks().forEach(track => {
  peerConnection.addTrack(track, localStream);
});

// 3. Escuchar stream remoto
peerConnection.ontrack = (event) => {
  const remoteVideo = document.getElementById('remote-video');
  remoteVideo.srcObject = event.streams[0];
};

// 4. Crear oferta (si eres el que llama)
const offer = await peerConnection.createOffer();
await peerConnection.setLocalDescription(offer);

// 5. Enviar oferta al otro usuario vía Socket.io
socket.emit('call:offer', {
  permisoId: callPermissionId,
  sdp: offer
});

// 6. Recibir respuesta
socket.on('call:answer', async (data) => {
  await peerConnection.setRemoteDescription(data.sdp);
});

// 7. Manejar ICE candidates
peerConnection.onicecandidate = (event) => {
  if (event.candidate) {
    socket.emit('call:ice', {
      permisoId: callPermissionId,
      candidate: event.candidate
    });
  }
};

socket.on('call:ice', async (data) => {
  await peerConnection.addIceCandidate(data.candidate);
});
\`\`\`

### Servidores STUN/TURN

**STUN** (Session Traversal Utilities for NAT):
- Descubre tu IP pública
- Permite conexión directa en la mayoría de casos
- Gratis (usamos servidores de Google)

**TURN** (Traversal Using Relays around NAT):
- Relay cuando conexión directa no es posible (NAT simétrico)
- Pasa tráfico por servidor
- Requiere servidor propio (cuesta $)
- SafeMatch usa solo STUN (suficiente para ~80% de casos)

---

## 🔒 Sistema de Compartir Contacto

### Flujo Completo con Doble Verificación

\`\`\`
1. Usuario A hace clic "Compartir Contacto"
         ↓
2. UI muestra: "¿Estás seguro?" (1ª verificación)
         ↓
3. Usuario A confirma
         ↓
4. Cliente: POST /api/contacts/:matchId/request
         ↓
5. Servidor guarda solicitud en Match.contactoCompartido
         ↓
6. Socket.io: emit('contact:request_received') → Usuario B
         ↓
7. UI de B muestra: "A quiere compartir contacto"
         ↓
8. Usuario B hace clic "Aceptar" o "Rechazar" (2ª verificación)
         ↓
   Si ACEPTA:
9. Cliente: POST /api/contacts/:matchId/accept
         ↓
10. Servidor marca contacto como compartido
         ↓
11. Socket.io: emit('contact:accepted') → Usuario A
    Socket.io: emit('contact:shared') → Usuario B
         ↓
12. Ambos reciben email, teléfono, Instagram, WhatsApp del otro
\`\`\`

### Endpoints API

\`\`\`
POST /api/contacts/:matchId/request
→ Solicitar compartir contacto

POST /api/contacts/:matchId/accept
→ Aceptar solicitud

POST /api/contacts/:matchId/reject
→ Rechazar solicitud

POST /api/contacts/:matchId/cancel
→ Cancelar solicitud (por el solicitante)

GET /api/contacts/:matchId/status
→ Ver estado de compartir contacto
\`\`\`

### Eventos Socket.io

\`\`\`
emit('contact:request') → Solicitar
on('contact:request_received') → Recibir solicitud

emit('contact:accept') → Aceptar
on('contact:accepted') → Notificar aceptación
on('contact:shared') → Recibir contacto

emit('contact:reject') → Rechazar
on('contact:rejected') → Notificar rechazo

emit('contact:cancel') → Cancelar
on('contact:cancelled') → Notificar cancelación
\`\`\`

---

## 🛡️ Seguridad Implementada

### 1. Autenticación y Autorización
- ✅ JWT con expiración corta (15min)
- ✅ Refresh tokens (7 días)
- ✅ Middleware de verificación en todas las rutas protegidas
- ✅ Blacklist para logout

### 2. Rate Limiting
\`\`\`javascript
// General: 100 requests / 15 minutos
app.use('/api/', limiter);

// Auth: 10 intentos / hora
app.use('/api/auth/login', authLimiter);
\`\`\`

**Por qué es importante:**
- Previene ataques de fuerza bruta
- Protege contra DDoS

### 3. Helmet (Headers de Seguridad)
\`\`\`javascript
app.use(helmet());
\`\`\`

**Qué hace:**
- X-Frame-Options: Previene clickjacking
- X-Content-Type-Options: Previene MIME sniffing
- X-XSS-Protection: Protección XSS básica

### 4. Validación de Datos
\`\`\`javascript
const { body } = require('express-validator');

// Validar email
body('email').isEmail().normalizeEmail()

// Validar contraseña
body('password').isLength({ min: 6 })
\`\`\`

### 5. Filtrado de Contenido
\`\`\`javascript
// Lista negra de palabras ofensivas
const blacklist = ['palabra1', 'palabra2'];

// Filtrar mensajes
const contieneOfensivo = (texto) =>
  blacklist.some(palabra => 
    texto.toLowerCase().includes(palabra)
  );
\`\`\`

### 6. Hash de Contraseñas
\`\`\`javascript
// Nunca guardar contraseñas en texto plano
const salt = await bcrypt.genSalt(12);
const hashedPassword = await bcrypt.hash(password, salt);
\`\`\`

---

## 📊 Monitorización y Logs

### PM2 Logs
\`\`\`bash
# Ver todos los logs
pm2 logs

# Solo errores
pm2 logs --err

# Logs de aplicación específica
pm2 logs safematch-api

# Últimas 200 líneas
pm2 logs --lines 200
\`\`\`

### Nginx Logs
\`\`\`bash
# Logs de acceso
tail -f /var/log/nginx/access.log

# Logs de errores
tail -f /var/log/nginx/error.log
\`\`\`

### MongoDB Logs
\`\`\`bash
# Docker
docker-compose logs mongo

# Sistema
tail -f /var/log/mongodb/mongod.log
\`\`\`

---

## 🧪 Testing

### Probar API con cURL

\`\`\`bash
# Health check
curl http://localhost/api/health

# Registro
curl -X POST http://localhost/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "123456",
    "nombre": "Test User",
    "fechaNacimiento": "1995-01-01",
    "genero": "masculino"
  }'

# Login
curl -X POST http://localhost/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "123456"
  }'

# Petición autenticada
curl -X GET http://localhost/api/auth/me \
  -H "Authorization: Bearer <tu-token-aqui>"
\`\`\`

### Probar WebSockets con Postman

1. Abre Postman
2. Nueva request → WebSocket Request
3. URL: `ws://localhost/socket.io/?token=<tu-jwt>`
4. Conecta
5. Envía eventos:
\`\`\`json
{
  "event": "chat:join",
  "data": { "matchId": "abc123" }
}
\`\`\`

---

## 📚 Recursos Adicionales

- [Documentación Express](https://expressjs.com/)
- [Documentación Socket.io](https://socket.io/docs/)
- [Documentación WebRTC](https://webrtc.org/getting-started/overview)
- [Documentación PM2](https://pm2.keymetrics.io/docs/)
- [Documentación Nginx](https://nginx.org/en/docs/)
- [Documentación MongoDB](https://docs.mongodb.com/)
