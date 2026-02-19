/**
 * Configuración de PM2 para SafeMatch Backend
 * 
 * PM2 es un gestor de procesos para Node.js que:
 * - Mantiene la aplicación siempre en ejecución
 * - Reinicia automáticamente si hay errores
 * - Gestiona logs
 * - Permite ejecutar múltiples instancias (cluster mode)
 */

module.exports = {
  apps: [{
    // Nombre de la aplicación en PM2
    name: 'safematch-api',
    
    // Archivo principal a ejecutar
    script: './src/app.js',
    
    // Modo de ejecución
    // - 'fork': Una sola instancia (desarrollo)
    // - 'cluster': Múltiples instancias (producción)
    exec_mode: 'fork',
    
    // Número de instancias
    // - 1: Para desarrollo
    // - 'max': Usa todos los cores de CPU disponibles
    instances: 1,
    
    // Auto-restart cuando el proceso se cae
    autorestart: true,
    
    // Esperar a que la app esté lista antes de considerarla 'online'
    wait_ready: true,
    
    // Timeout para señal de 'ready'
    listen_timeout: 10000,
    
    // Tiempo máximo para que la app se cierre gracefully
    kill_timeout: 5000,
    
    // Variables de entorno
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    
    // Configuración de logs
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    error_file: '/dev/stderr', // Cambiado de './logs/error.log'
    out_file: '/dev/stdout',   // Cambiado de './logs/out.log'
    
    // Configuración de logs adicionales si se desea un archivo separado para logs de PM2
    // pm2_homedir: '/app/.pm2', // PM2 home directory

    // Deshabilitar combine_logs y merge_logs cuando se redirige a stdout/stderr
    // combine_logs: true,
    // merge_logs: true,
    
    // Reinicio automático si el uso de memoria excede el límite
    max_memory_restart: '500M',
    
    // Reiniciar la app cada X requests (evita memory leaks)
    max_restarts: 10,
    
    // Tiempo mínimo entre reinicios
    min_uptime: '10s',
    
    // Esperar entre reinicios después de un crash
    restart_delay: 4000,
    
    // Ignorar archivos al hacer watch (útil en desarrollo)
    watch: false,
    ignore_watch: ['node_modules', 'logs', '.git'],
    
    // Source map support para mejor debugging
    source_map_support: true,
    
    // Configuración de cron restart (opcional)
    // cron_restart: '0 0 * * *', // Reiniciar cada día a medianoche
  }]
};
