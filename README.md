# 💕 SafeMatch - Aplicación de Citas con Enfoque en Seguridad

## 📝 Descripción

SafeMatch es una aplicación web de citas moderna que prioriza la **seguridad** y el **consentimiento explícito** de los usuarios. Inspirada en Tinder pero con mejoras significativas en protección y privacidad.

### ✨ Características Principales

- 🔐 **Autenticación segura** con JWT y hash de contraseñas
- ❤️ **Sistema de matching** - Like/Dislike con detección de coincidencias
- 💬 **Chat en tiempo real** con WebSockets y filtrado de contenido ofensivo
- 📞 **Videollamadas/Llamadas de voz** con WebRTC y consentimiento obligatorio
- 📱 **Compartir contacto** con sistema de doble verificación
- 🛡️ **Rate limiting** y protección contra ataques
- 🐳 **Dockerizado** para despliegue fácil
- 🚀 **PM2** para gestión de procesos

---

## 🏗️ Arquitectura

\`\`\`
┌──────────┐
│ Cliente  │ (Vue.js 3 + TypeScript)
└────┬─────┘
     │
     ▼
┌─────────────┐
│   Nginx     │ (Proxy Inverso + SSL)
└──┬────┬─────┘
   │    │
   │    └──────────────┐
   │                   │
   ▼                   ▼
┌──────────┐      ┌──────────┐
│ Frontend │      │ Backend  │ (Node.js + Express + Socket.io)
│ (Static) │      │  (PM2)   │
└──────────┘      └────┬─────┘
                       │
                       ▼
                  ┌──────────┐
                  │ MongoDB  │
                  └──────────┘
\`\`\`

---

## 🛠️ Stack Tecnológico

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Base de datos**: MongoDB con Mongoose
- **Tiempo real**: Socket.io (WebSockets)
- **Videollamadas**: WebRTC
- **Autenticación**: JWT (JSON Web Tokens)
- **Seguridad**: Helmet, bcryptjs, express-rate-limit
- **Gestión de procesos**: PM2

### Frontend
- **Framework**: Vue.js 3
- **Language**: TypeScript
- **Estilo**: Tailwind CSS
- **Estado**: Pinia
- **Router**: Vue Router

### DevOps
- **Contenedores**: Docker + Docker Compose
- **Proxy inverso**: Nginx
- **SSL**: Let's Encrypt / Certbot
- **Control de versiones**: Git

---

## 🚀 Inicio Rápido

### Requisitos Previos

- Docker y Docker Compose
- Node.js 18+ (solo si vas a ejecutar sin Docker)
- Git

### Instalación con Docker (Recomendado)

1. **Clonar el repositorio**
\`\`\`bash
git clone <tu-repositorio>
cd safematch
\`\`\`

2. **Configurar variables de entorno**
\`\`\`bash
cd backend
cp .env.example .env
# Edita .env y cambia JWT_SECRET (IMPORTANTE)
\`\`\`

3. **Iniciar servicios**
\`\`\`bash
cd ..
docker-compose up -d
\`\`\`

4. **Acceder a la aplicación**
- Frontend: http://localhost
- API: http://localhost/api
- Health check: http://localhost/api/health

### Instalación Manual (Sin Docker)

Ver [Guía de Despliegue](docs/GUIA_DESPLEGAMENT.md) para instrucciones detalladas.

---

## 📚 Documentación

- **[Guía de Despliegue](docs/GUIA_DESPLEGAMENT.md)** - Instalación, configuración y despliegue
- **[Guía de Uso](docs/GUIA_USO.md)** - Arquitectura, flujos técnicos y explicaciones
- **[Documentación Técnica](docs/DOCUMENTACION_PROYECTO_SAFEMATCH.md)** - Diseño completo del proyecto
- **[Informe de Uso de IA](docs/INFORME_USO_IA.md)** - Registro de herramientas de IA utilizadas

---

## 🔑 Variables de Entorno Principales

### Backend (.env)

\`\`\`env
# Obligatorias
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb://mongo:27017/safematch
JWT_SECRET=<genera-uno-seguro-con-crypto>

# Opcionales
CORS_ORIGIN=https://tudominio.com
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
\`\`\`

**⚠️ IMPORTANTE**: Genera un JWT_SECRET seguro:
\`\`\`bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
\`\`\`

---

## 📡 API Endpoints

### Autenticación
- `POST /api/auth/register` - Registrar nuevo usuario
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/me` - Obtener usuario actual
- `POST /api/auth/logout` - Cerrar sesión

### Usuarios
- `GET /api/users/discover` - Obtener perfiles para hacer match
- `GET /api/users/:id` - Obtener perfil de usuario
- `PUT /api/users/profile` - Actualizar perfil propio

### Matches
- `POST /api/matches/like/:userId` - Dar like a un usuario
- `POST /api/matches/dislike/:userId` - Dar dislike
- `GET /api/matches` - Obtener todos los matches

### Mensajes
- `GET /api/messages/:matchId` - Obtener historial de chat

### Llamadas
- `POST /api/calls/:matchId/request` - Solicitar llamada
- `POST /api/calls/:matchId/accept` - Aceptar llamada
- `POST /api/calls/:matchId/reject` - Rechazar llamada

### Contacto
- `POST /api/contacts/:matchId/request` - Solicitar compartir contacto
- `POST /api/contacts/:matchId/accept` - Aceptar solicitud
- `POST /api/contacts/:matchId/reject` - Rechazar solicitud
- `GET /api/contacts/:matchId/status` - Estado de compartir contacto

---

## 🔌 Eventos WebSocket

### Chat
- `chat:join` - Unirse a sala de chat
- `chat:send` - Enviar mensaje
- `chat:receive` - Recibir mensaje
- `chat:typing` - Usuario escribiendo
- `chat:read` - Marcar mensajes como leídos

### Llamadas (WebRTC)
- `call:request` - Solicitar llamada
- `call:incoming` - Llamada entrante
- `call:accept` - Aceptar llamada
- `call:accepted` - Llamada aceptada
- `call:offer` - Enviar oferta SDP
- `call:answer` - Enviar respuesta SDP
- `call:ice` - Enviar candidato ICE
- `call:end` - Finalizar llamada

### Contacto
- `contact:request` - Solicitar contacto
- `contact:request_received` - Solicitud recibida
- `contact:accept` - Aceptar solicitud
- `contact:accepted` - Solicitud aceptada
- `contact:reject` - Rechazar solicitud
- `contact:rejected` - Solicitud rechazada

---

## 🔧 Comandos Útiles

### Docker

\`\`\`bash
# Iniciar servicios
docker-compose up -d

# Ver logs
docker-compose logs -f

# Ver logs de un servicio específico
docker-compose logs -f backend

# Parar servicios
docker-compose down

# Reconstruir imágenes
docker-compose build

# Entrar en contenedor backend
docker exec -it safematch-app sh
\`\`\`

### PM2 (si no usas Docker)

\`\`\`bash
# Iniciar aplicación
npm run pm2:start

# Ver estado
pm2 list

# Ver logs
pm2 logs safematch-api

# Reiniciar
pm2 restart safematch-api

# Parar
pm2 stop safematch-api

# Monitorizar recursos
pm2 monit
\`\`\`

### Backend

\`\`\`bash
cd backend

# Modo desarrollo
npm run dev

# Sembrar base de datos
npm run seed

# Tests
npm test

# Linter
npm run lint
\`\`\`

---

## 🔒 Seguridad

### Implementado

- ✅ Hash de contraseñas con bcrypt (salt rounds: 12)
- ✅ JWT con expiración corta (15 minutos)
- ✅ Refresh tokens (7 días)
- ✅ Rate limiting (100 req/15min general, 10 req/hora auth)
- ✅ Helmet para headers de seguridad
- ✅ Validación de datos con express-validator
- ✅ Filtrado de contenido ofensivo en chat
- ✅ CORS configurado
- ✅ HTTPS/SSL en producción
- ✅ Blacklist de tokens en logout

### Recomendaciones para Producción

- 🔐 Usar MongoDB Atlas con autenticación
- 🔐 Certificados SSL de Let's Encrypt
- 🔐 Variables de entorno en secretos (no en código)
- 🔐 Firewall configurado (solo puertos 80 y 443)
- 🔐 Backups automáticos de base de datos
- 🔐 Logs rotativos con PM2
- 🔐 Monitorización con herramientas como Sentry

---

## 🧪 Testing

### Probar API

\`\`\`bash
# Health check
curl http://localhost/api/health

# Registro
curl -X POST http://localhost/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456","nombre":"Test","fechaNacimiento":"1995-01-01","genero":"masculino"}'

# Login
curl -X POST http://localhost/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456"}'
\`\`\`

---

## 📊 Monitorización

### Logs

\`\`\`bash
# PM2
pm2 logs

# Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Docker
docker-compose logs -f
\`\`\`

### Métricas

\`\`\`bash
# PM2 monitoring
pm2 monit

# Docker stats
docker stats
\`\`\`

---

## 🤝 Contribución

Este es un proyecto académico del Ciclo Formativo de Grado Superior en Desarrollo de Aplicaciones Web (DAW).

### Estudiantes
- Estudiante A: Autenticación, gestión de usuarios, Docker
- Estudiante B: Matching, WebSockets, WebRTC, Nginx

### Profesor/Tutor
[Nombre del profesor]

---

## 📄 Licencia

Este proyecto está desarrollado con fines educativos como parte del proyecto final de DAW.

---

## 🆘 Troubleshooting

### Problema: Backend no conecta con MongoDB

\`\`\`bash
# Verificar que MongoDB está corriendo
docker-compose ps
# o
sudo systemctl status mongod

# Ver logs
docker-compose logs mongo
\`\`\`

### Problema: Error 502 Bad Gateway

\`\`\`bash
# Verificar que el backend está corriendo
pm2 list
# o
docker-compose ps

# Verificar configuración Nginx
sudo nginx -t
\`\`\`

### Problema: WebSockets no funcionan

1. Verificar configuración Nginx (sección `/socket.io/`)
2. Comprobar que el token JWT es válido
3. Ver logs del backend: `pm2 logs` o `docker-compose logs backend`

Para más detalles, consulta la [Guía de Despliegue](docs/GUIA_DESPLEGAMENT.md).

---

## 📞 Contacto

Para preguntas sobre el proyecto académico:
- Email: [tu-email@estudiante.com]
- GitHub: [tu-usuario]

---

**Desarrollado con ❤️ como proyecto final de DAW 2023-2024**
