# SafeMatch - Documentacion Tecnica del Proyecto

## Aplicacion de Citas con Enfoque en Seguridad

---

# FASE 1 - PROPUESTA DEL PROYECTO

## 1.1 Identificacion del Problema

Las aplicaciones de citas actuales carecen de mecanismos de seguridad adecuados para los usuarios:

- **Mensajes no deseados**: Los usuarios pueden recibir mensajes antes de establecer interes mutuo
- **Compartir contacto sin consentimiento**: La informacion de contacto se comparte sin verificacion de consentimiento adecuada
- **Llamadas no solicitadas**: Las funciones de comunicacion en tiempo real (llamadas) pueden iniciarse sin aprobacion explicita de ambas partes
- **Moderacion de contenido limitada**: Falta de filtrado para mensajes ofensivos

## 1.2 Descripcion de la Idea del Proyecto

**SafeMatch** es una aplicacion web de citas simplificada que prioriza la seguridad del usuario a traves de:

- Requisito de coincidencia mutua antes de cualquier interaccion
- Sistema de doble consentimiento para llamadas y compartir contacto
- Chat en tiempo real con filtrado de contenido ofensivo
- Videollamadas/llamadas de voz basadas en WebRTC con verificacion de consentimiento

## 1.3 Objetivos SMART

| Objetivo | Especifico | Medible | Alcanzable | Relevante | Temporal |
|----------|------------|---------|------------|-----------|----------|
| Sistema de Usuarios | Implementar autenticacion JWT | Login/Registro funcionando | 2 estudiantes, Node.js basico | Caracteristica principal | Semana 1-2 |
| Matching | Like/dislike con deteccion de match | Creacion de match funciona | Algoritmo simple | Caracteristica principal | Semana 2-3 |
| Chat en Tiempo Real | Chat WebSocket entre matches | Mensajes entregados instantaneamente | Libreria Socket.io | Caracteristica principal | Semana 3-4 |
| Videollamadas | Llamadas 1-a-1 con WebRTC | Llamada conecta exitosamente | APIs WebRTC | Caracteristica de seguridad | Semana 4-5 |
| Despliegue | Docker + HTTPS | App accesible online | DevOps estandar | Requerido | Semana 5-6 |

## 1.4 Seleccion y Justificacion de Tecnologias

| Tecnologia | Proposito | Justificacion |
|------------|-----------|---------------|
| **Node.js + Express** | Framework backend | Facil de aprender, gran comunidad, bueno para apps en tiempo real |
| **MongoDB** | Base de datos | Esquema flexible, bueno para perfiles de usuario y mensajes |
| **Socket.io** | WebSockets | Simplifica comunicacion en tiempo real, maneja fallbacks |
| **JWT** | Autenticacion | Sin estado, facil de implementar, estandar de la industria |
| **Docker** | Contenedorizacion | Despliegues reproducibles, requerido por el proyecto |
| **Nginx** | Proxy inverso | Terminacion HTTPS, balanceo de carga, eleccion estandar |

## 1.5 Diagrama de Arquitectura Preliminar

\`\`\`
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENTES                                 │
│    (Navegador Web / Herramientas de Prueba API como Postman)    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    NGINX (Proxy Inverso)                        │
│              - Terminacion HTTPS (SSL/TLS)                      │
│              - Enruta /api/* a Express                          │
│              - Enruta /socket.io/* a Socket.io                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SERVIDOR EXPRESS.JS                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Rutas      │  │ Controladores│  │   Servicios  │          │
│  │  /auth/*     │  │  AuthCtrl    │  │  AuthService │          │
│  │  /users/*    │  │  UserCtrl    │  │  UserService │          │
│  │  /matches/*  │  │  MatchCtrl   │  │  MatchService│          │
│  │  /messages/* │  │  MessageCtrl │  │  ChatService │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Middleware  │  │   Socket.io  │  │   WebRTC     │          │
│  │  - JWT Auth  │  │  - Chat      │  │  - Señalizac.│          │
│  │  - Validac.  │  │  - Presencia │  │  - ICE       │          │
│  │  - Filtro    │  │  - Escribien.│  │              │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       MONGODB                                    │
│   Colecciones: users, matches, messages, call_permissions       │
└─────────────────────────────────────────────────────────────────┘
\`\`\`

## 1.6 Planificacion de Tareas para Dos Estudiantes

### Estudiante A - Autenticacion y Gestion de Usuarios
- **Semana 1-2**: Registro de usuarios, login, implementacion JWT
- **Semana 3**: Gestion de perfil, busqueda de usuarios
- **Semana 4**: Ayuda con integracion WebSocket
- **Semana 5**: Configuracion Docker
- **Semana 6**: Documentacion y pruebas

### Estudiante B - Matching y Funciones en Tiempo Real
- **Semana 1-2**: Modelos de base de datos, logica de matching
- **Semana 3-4**: Chat en tiempo real con Socket.io
- **Semana 4-5**: Implementacion videollamadas WebRTC
- **Semana 5**: Configuracion Nginx y HTTPS
- **Semana 6**: Documentacion y pruebas

---

# FASE 2 - ESTRUCTURA DEL PROYECTO Y ARQUITECTURA BACKEND

## 2.1 Estructura de Carpetas Recomendada

\`\`\`
safematch-backend/
├── src/
│   ├── config/
│   │   ├── database.js         # Conexion MongoDB
│   │   ├── socket.js           # Configuracion Socket.io
│   │   └── env.js              # Variables de entorno
│   │
│   ├── models/
│   │   ├── User.js             # Esquema de usuario
│   │   ├── Match.js            # Esquema de match
│   │   ├── Message.js          # Esquema de mensaje
│   │   └── CallPermission.js   # Esquema de consentimiento de llamada
│   │
│   ├── controllers/
│   │   ├── authController.js   # Manejadores Login/Registro
│   │   ├── userController.js   # Manejadores de perfil
│   │   ├── matchController.js  # Manejadores Like/Match
│   │   └── messageController.js# Manejadores historial chat
│   │
│   ├── services/
│   │   ├── authService.js      # Logica JWT y contraseñas
│   │   ├── userService.js      # Logica de negocio usuarios
│   │   ├── matchService.js     # Algoritmo de matching
│   │   ├── chatService.js      # Manejo de mensajes
│   │   └── filterService.js    # Filtro palabras ofensivas
│   │
│   ├── middleware/
│   │   ├── authMiddleware.js   # Verificacion JWT
│   │   ├── matchMiddleware.js  # Verificar que usuarios estan emparejados
│   │   └── validationMiddleware.js
│   │
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── userRoutes.js
│   │   ├── matchRoutes.js
│   │   └── messageRoutes.js
│   │
│   ├── sockets/
│   │   ├── chatSocket.js       # Manejadores chat tiempo real
│   │   └── callSocket.js       # Manejadores señalizacion WebRTC
│   │
│   ├── utils/
│   │   ├── blacklist.js        # Lista palabras ofensivas
│   │   └── helpers.js
│   │
│   └── app.js                  # Configuracion app Express
│
├── docker/
│   ├── Dockerfile
│   └── nginx.conf
│
├── scripts/
│   └── seed.js                 # Sembrado base de datos
│
├── docs/
│   ├── api.md
│   └── deployment.md
│
├── .env.example
├── docker-compose.yml
├── package.json
└── README.md
\`\`\`

## 2.2 Diseño de Endpoints API

### Rutas de Autenticacion (`/api/auth`)

| Metodo | Endpoint | Descripcion | Auth Requerido |
|--------|----------|-------------|----------------|
| POST | `/api/auth/register` | Crear nueva cuenta de usuario | No |
| POST | `/api/auth/login` | Login y recibir JWT | No |
| POST | `/api/auth/logout` | Invalidar token (opcional) | Si |
| GET | `/api/auth/me` | Obtener info usuario actual | Si |

### Rutas de Usuario (`/api/users`)

| Metodo | Endpoint | Descripcion | Auth Requerido |
|--------|----------|-------------|----------------|
| GET | `/api/users/discover` | Obtener matches potenciales | Si |
| GET | `/api/users/:id` | Obtener perfil usuario (si hay match) | Si |
| PUT | `/api/users/profile` | Actualizar perfil propio | Si |
| DELETE | `/api/users/account` | Eliminar cuenta | Si |

### Rutas de Match (`/api/matches`)

| Metodo | Endpoint | Descripcion | Auth Requerido |
|--------|----------|-------------|----------------|
| POST | `/api/matches/like/:userId` | Dar like a un usuario | Si |
| POST | `/api/matches/dislike/:userId` | Dar dislike a un usuario | Si |
| GET | `/api/matches` | Obtener todos los matches | Si |
| DELETE | `/api/matches/:matchId` | Desemparejar usuario | Si |

### Rutas de Mensajes (`/api/messages`)

| Metodo | Endpoint | Descripcion | Auth Requerido |
|--------|----------|-------------|----------------|
| GET | `/api/messages/:matchId` | Obtener historial de chat | Si + Match |
| POST | `/api/messages/:matchId/share-contact` | Iniciar compartir contacto | Si + Match |
| POST | `/api/messages/:matchId/confirm-contact` | Confirmar compartir contacto | Si + Match |

### Rutas de Llamadas (`/api/calls`)

| Metodo | Endpoint | Descripcion | Auth Requerido |
|--------|----------|-------------|----------------|
| POST | `/api/calls/:matchId/request` | Solicitar consentimiento llamada | Si + Match |
| POST | `/api/calls/:matchId/accept` | Aceptar consentimiento llamada | Si + Match |
| POST | `/api/calls/:matchId/reject` | Rechazar consentimiento llamada | Si + Match |

## 2.3 Eventos WebSocket

### Eventos de Chat

\`\`\`javascript
// Cliente → Servidor
'chat:send'        // Enviar un mensaje
'chat:typing'      // Usuario esta escribiendo

// Servidor → Cliente
'chat:receive'     // Recibir un mensaje
'chat:typing'      // Otro usuario esta escribiendo
'chat:filtered'    // Mensaje fue filtrado (contenido ofensivo)
\`\`\`

### Eventos de Llamada (Señalizacion WebRTC)

\`\`\`javascript
// Cliente → Servidor
'call:request'     // Solicitar iniciar llamada
'call:accept'      // Aceptar llamada entrante
'call:reject'      // Rechazar llamada entrante
'call:offer'       // Oferta WebRTC (SDP)
'call:answer'      // Respuesta WebRTC (SDP)
'call:ice'         // Candidato ICE
'call:end'         // Finalizar llamada

// Servidor → Cliente
'call:incoming'    // Notificacion llamada entrante
'call:accepted'    // Llamada fue aceptada
'call:rejected'    // Llamada fue rechazada
'call:offer'       // Recibir oferta WebRTC
'call:answer'      // Recibir respuesta WebRTC
'call:ice'         // Recibir candidato ICE
'call:ended'       // Llamada finalizada
\`\`\`

---

# FASE 3 - DOCUMENTO DE DECISIONES TECNICAS

## 3.1 ¿Por que MongoDB en lugar de PostgreSQL?

**Decision:** Usar MongoDB

**Razonamiento:**
- Los perfiles de usuario tienen datos flexibles (intereses, fotos, biografia)
- Los mensajes son estructuras tipo documento
- Mas facil de prototipar e iterar
- Buen rendimiento para operaciones de lectura intensiva
- Los estudiantes estan mas familiarizados con estructuras tipo JSON

**Compensacion:** Menos integridad de datos estricta que PostgreSQL, pero aceptable para proyecto escolar.

## 3.2 ¿Por que JWT en lugar de Sesiones?

**Decision:** Usar tokens JWT

**Razonamiento:**
- Autenticacion sin estado (no se necesita almacenamiento de sesion)
- Funciona bien con WebSockets
- Facil de implementar y entender
- Estandar de la industria para APIs modernas

**Implementacion:**
- Token de acceso: 15 minutos de expiracion
- Token de refresco: 7 dias de expiracion (opcional, se puede omitir por simplicidad)

## 3.3 ¿Por que Socket.io en lugar de WebSockets puros?

**Decision:** Usar Socket.io

**Razonamiento:**
- Manejo automatico de reconexion
- Fallback a polling si WebSocket falla
- Mensajeria basada en salas (util para matches)
- Sistema de eventos incorporado
- Gran comunidad y documentacion

## 3.4 Enfoque del Filtro de Palabras Ofensivas

**Decision:** Filtrado simple basado en lista negra

**Razonamiento:**
- No requiere IA (segun restricciones del proyecto)
- Facil de explicar e implementar
- Lista de palabras configurable
- Rendimiento rapido

**Implementacion:**
\`\`\`javascript
// Enfoque simple
const blacklist = ['palabra1', 'palabra2', ...];
const contieneOfensivo = (texto) => 
  blacklist.some(palabra => texto.toLowerCase().includes(palabra));
\`\`\`

## 3.5 Doble Consentimiento para Llamadas

**Decision:** Requerir consentimiento explicito antes de conexion WebRTC

**Flujo:**
1. Usuario A hace clic en "Iniciar Llamada"
2. Servidor envia `call:incoming` a Usuario B
3. Usuario B hace clic en "Aceptar" o "Rechazar"
4. Solo si acepta, comienza señalizacion WebRTC

**Razonamiento:** Requisito de seguridad - previene inicio de llamadas no solicitadas.

---

# FASE 4 - CONFIGURACION DE DESPLIEGUE

## 4.1 Configuracion Docker Compose

\`\`\`yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: 
      context: .
      dockerfile: docker/Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongo:27017/safematch
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - mongo
    restart: unless-stopped

  mongo:
    image: mongo:6
    volumes:
      - mongo_data:/data/db
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./docker/nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped

volumes:
  mongo_data:
\`\`\`

## 4.2 Configuracion Nginx (HTTPS)

\`\`\`nginx
# docker/nginx.conf
events {
    worker_connections 1024;
}

http {
    upstream app {
        server app:3000;
    }

    server {
        listen 80;
        server_name tudominio.com;
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl;
        server_name tudominio.com;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;

        location / {
            proxy_pass http://app;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
    }
}
\`\`\`

---

# FASE 5 - ESQUEMAS DE DOCUMENTACION

## 5.1 Esquema de Documentacion Tecnica

1. **Introduccion**
   - Vision general del proyecto
   - Tecnologias utilizadas

2. **Arquitectura**
   - Diagrama del sistema
   - Descripciones de componentes

3. **Esquema de Base de Datos**
   - Modelo de usuario
   - Modelo de match
   - Modelo de mensaje

4. **Referencia API**
   - Endpoints de autenticacion
   - Endpoints de usuario
   - Endpoints de match
   - Endpoints de mensaje

5. **Funciones en Tiempo Real**
   - Eventos WebSocket
   - Flujo WebRTC

6. **Seguridad**
   - Implementacion JWT
   - Hash de contraseñas
   - Filtrado de contenido

## 5.2 Plantilla de Informe de Uso de IA

\`\`\`markdown
# Informe de Uso de IA - Proyecto SafeMatch

## Herramientas Utilizadas
- ChatGPT / Claude / GitHub Copilot

## Tareas Donde se Uso IA
1. **Planificacion de Estructura de Codigo**
   - Se pidieron recomendaciones de estructura de proyecto Express
   - Resultado: Se adopto patron tipo MVC con capa de servicios

2. **Ayuda con Implementacion WebRTC**
   - Se pidio explicacion del flujo de señalizacion WebRTC
   - Limitacion: El codigo inicial tenia bugs con candidatos ICE
   - Correccion: Se añadio manejo de errores apropiado despues de pruebas manuales

3. **Configuracion Docker**
   - Se uso IA para generar docker-compose.yml inicial
   - Modificacion: Se ajustaron puertos y se añadieron volumenes para persistencia

## Errores Detectados
- IA sugirio sintaxis obsoleta de Socket.io (v2 en lugar de v4)
- Se corrigio verificando documentacion oficial

## Decisiones Finales Tomadas por Estudiantes
- Se eligio MongoDB sobre PostgreSQL (IA sugirio ambos)
- Se simplifico flujo de consentimiento de llamada (IA lo complico demasiado)
\`\`\`

---

# ANEXOS

## A. Variables de Entorno Requeridas

\`\`\`env
# .env.example
NODE_ENV=development
PORT=3000

# Base de datos
MONGODB_URI=mongodb://localhost:27017/safematch

# JWT
JWT_SECRET=tu_clave_secreta_muy_segura_aqui
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Cors
CORS_ORIGIN=http://localhost:3001
\`\`\`

## B. Comandos Utiles

\`\`\`bash
# Desarrollo
npm run dev          # Iniciar servidor con nodemon
npm run seed         # Sembrar base de datos con datos de prueba
npm run test         # Ejecutar pruebas

# Docker
docker-compose up -d              # Iniciar todos los servicios
docker-compose down               # Detener todos los servicios
docker-compose logs -f app        # Ver logs de la aplicacion

# SSL (desarrollo local)
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/key.pem -out ssl/cert.pem
\`\`\`

## C. Referencias y Recursos

- [Documentacion Express.js](https://expressjs.com/)
- [Documentacion MongoDB](https://docs.mongodb.com/)
- [Documentacion Socket.io](https://socket.io/docs/)
- [Documentacion JWT](https://jwt.io/)
- [Documentacion WebRTC](https://webrtc.org/)
- [Documentacion Docker](https://docs.docker.com/)
