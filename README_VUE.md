# SafeMatch - Migración a Vue 3 (DAW)

Este proyecto es una reconstrucción completa del frontend de SafeMatch utilizando **Vue 3** y **TypeScript**, manteniendo el backend original intacto.

## 🚀 Cómo iniciar todo con Docker

Para levantar la aplicación completa (Frontend, Backend y Base de Datos), sigue estos pasos:

1.  **Limpiar contenedores previos (Opcional pero recomendado):**
    ```bash
    docker-compose down -v
    ```
    *Nota: El flag `-v` borra los datos de la base de datos. Úsalo solo si quieres empezar de cero.*

2.  **Construir e iniciar:**
    ```bash
    docker-compose up --build
    ```

3.  **Acceso:**
    *   **Frontend:** `http://localhost:8080`
    *   **Backend API:** `http://localhost:3000/api`

## 🛠 Solución a problemas comunes

### 1. No se guardan los usuarios al registrar
He implementado la lógica real en `RegisterView.vue`. Ahora, el formulario envía los datos al backend en lugar de solo simular el proceso. Los usuarios registrados se guardarán correctamente en MongoDB.

### 2. Error de conexión con la base de datos
El `docker-compose.yml` ahora incluye un `healthcheck` para MongoDB. Esto asegura que el backend espere a que la base de datos esté lista antes de intentar conectarse, evitando fallos en el arranque.

### 3. Comunicación Frontend-Backend (Proxy)
He configurado Nginx en el contenedor del frontend para que actúe como proxy. Todas las peticiones a `http://localhost:8080/api/*` se redirigen internamente al backend. Esto elimina cualquier error de conexión o de "CORS".

## 📁 Estructura del Proyecto
*   `/frontend`: Código fuente de Vue 3 (Composition API).
*   `/backend`: Código original de Node.js (Sin cambios en lógica).
*   `docker-compose.yml`: Orquestación de servicios.
