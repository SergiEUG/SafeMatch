# 🚀 Guía de Despliegue - SafeMatch

## 📋 Índice
1. [Requisitos Previos](#requisitos-previos)
2. [Configuración Inicial](#configuración-inicial)
3. [Despliegue con Docker](#despliegue-con-docker)
4. [Despliegue en Servidor Linux](#despliegue-en-servidor-linux)
5. [Configuración SSL/HTTPS](#configuración-ssl-https)
6. [Gestión con PM2](#gestión-con-pm2)
7. [Troubleshooting](#troubleshooting)

---

## 📦 Requisitos Previos

### Software Necesario
- **Docker** (v20.10+) y **Docker Compose** (v2.0+)
- **Node.js** (v18+) - solo si vas a ejecutar sin Docker
- **MongoDB** (v6+) - solo si vas a ejecutar sin Docker
- **Nginx** (v1.20+) - para producción
- Servidor Linux (Ubuntu 20.04+ recomendado)

### Puertos Requeridos
- **80**: HTTP (Nginx)
- **443**: HTTPS (Nginx)
- **3000**: Backend API (interno, no expuesto)
- **27017**: MongoDB (interno, no expuesto)

---

## ⚙️ Configuración Inicial

### 1. Clonar el Repositorio
\`\`\`bash
git clone <tu-repositorio>
cd safematch
\`\`\`

### 2. Configurar Variables de Entorno

#### Backend
\`\`\`bash
cd backend
cp .env.example .env
nano .env  # o usa tu editor preferido
\`\`\`

**Variables CRÍTICAS a cambiar:**
\`\`\`env
# IMPORTANTE: Genera un secret seguro
# Ejecuta: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=tu_secret_generado_aqui

# MongoDB (para Docker usa este)
MONGODB_URI=mongodb://mongo:27017/safematch

# En producción con MongoDB Atlas:
# MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/safematch

# CORS (tu dominio en producción)
CORS_ORIGIN=https://tudominio.com
\`\`\`

#### Frontend (opcional)
\`\`\`bash
cd ../frontend
cp .env .env.local
\`\`\`

---

## 🐳 Despliegue con Docker (RECOMENDADO)

### Opción 1: Desarrollo Local

\`\`\`bash
# Desde la raíz del proyecto
docker-compose up -d

# Ver logs en tiempo real
docker-compose logs -f

# Parar servicios
docker-compose down

# Parar y eliminar volúmenes (¡CUIDADO! Borra la base de datos)
docker-compose down -v
\`\`\`

**Acceso:**
- Frontend: http://localhost
- API: http://localhost/api
- WebSockets: ws://localhost/socket.io

### Opción 2: Producción

\`\`\`bash
# 1. Asegúrate de tener un .env con JWT_SECRET seguro
# 2. Construir imágenes
docker-compose build

# 3. Iniciar en modo producción
docker-compose up -d

# 4. Ver estado
docker-compose ps

# 5. Ver logs del backend
docker-compose logs -f backend
\`\`\`

### Comandos Útiles Docker

\`\`\`bash
# Entrar en el contenedor del backend
docker exec -it safematch-app sh

# Entrar en MongoDB
docker exec -it safematch-mongo mongosh

# Ver uso de recursos
docker stats

# Reiniciar un servicio específico
docker-compose restart backend

# Ver logs de un servicio
docker-compose logs -f nginx
\`\`\`

---

## 🖥️ Despliegue en Servidor Linux (Sin Docker)

### 1. Instalar Dependencias del Sistema

\`\`\`bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Instalar MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt update
sudo apt install -y mongodb-org

# Iniciar MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Instalar Nginx
sudo apt install -y nginx

# Instalar PM2 globalmente
sudo npm install -g pm2
\`\`\`

### 2. Configurar el Backend

\`\`\`bash
cd backend

# Instalar dependencias
npm install --production

# Configurar .env (ver sección anterior)
nano .env

# Crear directorio de logs
mkdir -p logs

# Iniciar con PM2
pm2 start ecosystem.config.js --env production

# Guardar configuración de PM2
pm2 save

# Configurar PM2 para iniciarse al arrancar
pm2 startup
# Ejecuta el comando que PM2 te muestre
\`\`\`

### 3. Configurar el Frontend

\`\`\`bash
cd ../frontend

# Instalar dependencias
npm install

# Build para producción
npm run build

# Los archivos estáticos estarán en: dist/
\`\`\`

### 4. Configurar Nginx

\`\`\`bash
# Copiar configuración
sudo cp ../nginx.conf /etc/nginx/sites-available/safematch

# Crear enlace simbólico
sudo ln -s /etc/nginx/sites-available/safematch /etc/nginx/sites-enabled/

# Eliminar configuración por defecto
sudo rm /etc/nginx/sites-enabled/default

# Verificar configuración
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
\`\`\`

---

## 🔒 Configuración SSL/HTTPS (PRODUCCIÓN)

### Opción 1: Let's Encrypt (GRATIS - Recomendado)

\`\`\`bash
# Instalar Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtener certificado (sustituye por tu dominio)
sudo certbot --nginx -d tudominio.com -d www.tudominio.com

# Certbot configurará Nginx automáticamente
# Los certificados se renovarán automáticamente
\`\`\`

### Opción 2: Certificado Autofirmado (SOLO DESARROLLO)

\`\`\`bash
# Crear directorio
mkdir -p ssl

# Generar certificado (válido 365 días)
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/key.pem -out ssl/cert.pem

# Descomentar sección HTTPS en nginx.conf
# Actualizar rutas de certificados
\`\`\`

### Configurar nginx.conf para HTTPS

Edita `nginx.conf` y descomenta la sección del servidor HTTPS (líneas marcadas como comentario).

---

## 🔧 Gestión con PM2

### Comandos Básicos

\`\`\`bash
# Ver aplicaciones corriendo
pm2 list

# Ver logs en tiempo real
pm2 logs safematch-api

# Reiniciar aplicación
pm2 restart safematch-api

# Parar aplicación
pm2 stop safematch-api

# Eliminar aplicación
pm2 delete safematch-api

# Monitorizar recursos
pm2 monit

# Ver información detallada
pm2 show safematch-api
\`\`\`

### Ver Logs

\`\`\`bash
# Todos los logs
pm2 logs

# Solo errores
pm2 logs --err

# Últimas 100 líneas
pm2 logs --lines 100

# Limpiar logs
pm2 flush
\`\`\`

### Reiniciar sin Downtime

\`\`\`bash
# Reload (sin downtime)
pm2 reload safematch-api

# Restart (con downtime mínimo)
pm2 restart safematch-api
\`\`\`

---

## 🐛 Troubleshooting

### Problema: Backend no conecta con MongoDB

**Síntomas:**
\`\`\`
MongooseServerSelectionError: connect ECONNREFUSED
\`\`\`

**Solución:**
\`\`\`bash
# Verificar que MongoDB está corriendo
sudo systemctl status mongod

# Ver logs de MongoDB
sudo tail -f /var/log/mongodb/mongod.log

# En Docker:
docker-compose logs mongo

# Verificar MONGODB_URI en .env
cat backend/.env | grep MONGODB_URI
\`\`\`

### Problema: WebSockets no funcionan

**Síntomas:**
- Chat no funciona
- Llamadas no conectan

**Solución:**
1. Verificar configuración Nginx (importante la sección `/socket.io/`)
2. Verificar que el frontend usa la URL correcta
3. Comprobar logs:
\`\`\`bash
# Logs del backend
pm2 logs safematch-api
# o en Docker:
docker-compose logs backend

# Logs de Nginx
sudo tail -f /var/log/nginx/error.log
\`\`\`

### Problema: Error 502 Bad Gateway

**Síntomas:**
- Nginx devuelve error 502

**Solución:**
\`\`\`bash
# Verificar que el backend está corriendo
pm2 list
# o en Docker:
docker-compose ps

# Verificar que el puerto 3000 está escuchando
sudo netstat -tlnp | grep 3000

# Reiniciar servicios
pm2 restart safematch-api
sudo systemctl restart nginx
\`\`\`

### Problema: Certificado SSL no válido

**Síntomas:**
- Navegador muestra advertencia de certificado

**Solución:**
\`\`\`bash
# Verificar certificados
sudo certbot certificates

# Renovar certificados
sudo certbot renew --dry-run

# Si usas certificado autofirmado, es normal (solo para desarrollo)
\`\`\`

### Problema: Alta utilización de memoria

**Síntomas:**
- PM2 muestra alto uso de RAM
- Aplicación se reinicia sola

**Solución:**
\`\`\`bash
# Ver uso de memoria
pm2 monit

# Ajustar límite en ecosystem.config.js:
# max_memory_restart: '500M'  // Aumentar si es necesario

# Reiniciar aplicación
pm2 restart safematch-api
\`\`\`

---

## 📊 Monitorización

### Logs del Sistema

\`\`\`bash
# Logs de PM2
pm2 logs

# Logs de Nginx (acceso)
sudo tail -f /var/log/nginx/access.log

# Logs de Nginx (errores)
sudo tail -f /var/log/nginx/error.log

# Logs del sistema
sudo journalctl -f
\`\`\`

### Verificar Estado de Servicios

\`\`\`bash
# Nginx
sudo systemctl status nginx

# MongoDB
sudo systemctl status mongod

# PM2
pm2 status

# Docker (si usas Docker)
docker-compose ps
\`\`\`

---

## 🔄 Actualizar la Aplicación

### Con Docker

\`\`\`bash
# 1. Obtener últimos cambios
git pull

# 2. Reconstruir imágenes
docker-compose build

# 3. Reiniciar servicios
docker-compose down
docker-compose up -d
\`\`\`

### Sin Docker (PM2)

\`\`\`bash
# 1. Obtener últimos cambios
git pull

# 2. Actualizar dependencias backend
cd backend
npm install --production

# 3. Reiniciar con PM2
pm2 restart safematch-api

# 4. Build frontend (si cambió)
cd ../frontend
npm install
npm run build

# 5. Copiar archivos al directorio de Nginx si es necesario
\`\`\`

---

## 📝 Checklist de Despliegue a Producción

- [ ] Variables de entorno configuradas (.env)
- [ ] JWT_SECRET generado de forma segura
- [ ] CORS_ORIGIN apunta a tu dominio
- [ ] MongoDB configurado (local o Atlas)
- [ ] Certificado SSL instalado (Let's Encrypt)
- [ ] Nginx configurado correctamente
- [ ] PM2 configurado para auto-restart
- [ ] PM2 configurado para inicio automático
- [ ] Firewall configurado (solo puertos 80 y 443 abiertos)
- [ ] Backup de base de datos configurado
- [ ] Logs rotando correctamente
- [ ] Monitorización activa

---

## 🆘 Soporte

Si encuentras problemas:
1. Revisa esta guía de troubleshooting
2. Consulta los logs (PM2, Nginx, MongoDB)
3. Verifica la configuración (nginx.conf, .env, ecosystem.config.js)
4. Contacta con el equipo de desarrollo
