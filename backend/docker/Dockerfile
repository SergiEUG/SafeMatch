# ============================================
# SafeMatch Backend - Dockerfile
# ============================================
# Imagen optimizada para el proyecto DAW

# Stage 1: Dependencias
FROM node:20-alpine AS dependencies

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar solo dependencias de producción usando install para mayor compatibilidad
RUN npm install --omit=dev

# ============================================
# Stage 2: Producción
# ============================================
FROM node:20-alpine AS production

# Crear usuario no-root para seguridad
RUN addgroup -g 1001 -S nodejs
RUN adduser -S safematch -u 1001

WORKDIR /app

# Copiar dependencias del stage anterior
COPY --from=dependencies /app/node_modules ./node_modules

# Copiar el resto del código fuente
COPY --chown=safematch:nodejs . .

# Crear directorio de logs y establecer permisos ANTES de cambiar de usuario
RUN mkdir -p logs && chown safematch:nodejs logs

# Cambiar a usuario no-root
USER safematch

# Comando de inicio con PM2
# --no-daemon: PM2 corre en primer plano (necesario para Docker)
# ecosystem.config.js: Archivo de configuración de PM2
CMD ["npx", "pm2-runtime", "start", "ecosystem.config.js", "--env", "production"]
