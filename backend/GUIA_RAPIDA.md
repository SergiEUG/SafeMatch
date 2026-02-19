# Guia Rapida de Instalacion - SafeMatch

## Requisitos Previos

**Opcion A: Docker (Recomendado)**
- Docker Desktop: https://www.docker.com/products/docker-desktop/

**Opcion B: Instalacion Manual**
- Node.js 18+: https://nodejs.org/
- MongoDB: https://www.mongodb.com/try/download/community

---

## INSTRUCCIONES PASO A PASO

### OPCION A: Con Docker (Recomendado)

```bash
# 1. Navega a la carpeta del backend
cd backend

# 2. Inicia todos los servicios
docker-compose up -d

# 3. (Opcional) Cargar usuarios de prueba
docker-compose exec app npm run seed

# 4. Listo! 
```

**Para ver los logs:**
```bash
docker-compose logs -f app
```

**Para parar todo:**
```bash
docker-compose down
```

---

### OPCION B: Sin Docker (Manual)

```bash
# 1. Asegurate de que MongoDB esta corriendo
# Windows: El servicio se inicia automaticamente
# Mac: brew services start mongodb-community
# Linux: sudo systemctl start mongod

# 1.1 Configura variables de entorno (recomendado)
# Copia backend/env.example a backend/.env y ajusta MONGODB_URI si usas Atlas o Docker.

# 2. Navega a la carpeta del backend
cd backend

# 3. Instala las dependencias
npm install

# 4. Inicia el servidor
npm run dev

# 5. (Opcional) Cargar usuarios de prueba
npm run seed
```

---

## TODAS LAS RUTAS DEL PROYECTO

### Backend API

| Ruta | Metodo | Descripcion |
|------|--------|-------------|
| `http://localhost/api/health` | GET | Health check |
| `http://localhost/api/auth/register` | POST | Registro |
| `http://localhost/api/auth/login` | POST | Login |
| `http://localhost/api/auth/logout` | POST | Logout |
| `http://localhost/api/auth/me` | GET | Perfil actual |
| `http://localhost/api/auth/refresh` | POST | Refresh token |
| `http://localhost/api/users/discover` | GET | Descubrir usuarios |
| `http://localhost/api/users/:id` | GET | Ver perfil |
| `http://localhost/api/users/profile` | PUT | Actualizar perfil |
| `http://localhost/api/matches` | GET | Listar matches |
| `http://localhost/api/matches/like/:userId` | POST | Dar like |
| `http://localhost/api/matches/dislike/:userId` | POST | Dar dislike |
| `http://localhost/api/messages/:matchId` | GET | Obtener mensajes |
| `http://localhost/api/messages/:matchId` | POST | Enviar mensaje |

> **Nota:** Si usas la opcion manual (sin Docker), reemplaza `localhost` por `localhost:3000`

### Frontend (Next.js)

| Ruta | Descripcion |
|------|-------------|
| `http://localhost:3000` | Pagina principal |
| `http://localhost:3000/login` | Inicio de sesion |
| `http://localhost:3000/register` | Registro |
| `http://localhost:3000/discover` | Descubrir y hacer swipe |
| `http://localhost:3000/matches` | Lista de matches |
| `http://localhost:3000/matches/[id]` | Chat individual |
| `http://localhost:3000/profile` | Ver perfil |
| `http://localhost:3000/profile/edit` | Editar perfil |
| `http://localhost:3000/profile/settings` | Configuracion |

### Herramientas (Solo con Docker)

| Ruta | Descripcion |
|------|-------------|
| `http://localhost:8081` | Mongo Express (GUI de MongoDB) |

> Usuario: admin / Password: admin123

---

## Verificar que Funciona

Abre en el navegador:
```
http://localhost/api/health
```

Deberia mostrar:
```json
{
  "success": true,
  "message": "SafeMatch API funcionando correctamente"
}
```

---

## Usuarios de Prueba

Despues de ejecutar `npm run seed`:

| Email | Password |
|-------|----------|
| usuario1@test.com | Password123! |
| usuario2@test.com | Password123! |
| ... | ... |
| usuario10@test.com | Password123! |

---

## Errores Comunes

| Error | Solucion |
|-------|----------|
| "MongoDB connection failed" | Verifica que MongoDB esta corriendo |
| "EADDRINUSE: port already in use" | Cambia el puerto o cierra el proceso que lo usa |
| "Cannot find module" | Ejecuta `npm install` |
| Docker no inicia | Asegurate de que Docker Desktop esta corriendo |

---

## Comandos Utiles

```bash
# Desarrollo con recarga automatica
npm run dev

# Produccion
npm start

# Cargar datos de prueba
npm run seed

# Ver logs de Docker
docker-compose logs -f

# Reiniciar servicios
docker-compose restart

# Limpiar todo (borra datos)
docker-compose down -v
```
