# Informe de Uso de Inteligencia Artificial

## Proyecto: SafeMatch - Aplicacion de Citas con Enfoque en Seguridad

**Fecha de Elaboracion:** _______________  
**Autores:** _______________

---

## 1. Introduccion

Este documento describe el uso de herramientas de Inteligencia Artificial durante el desarrollo del proyecto SafeMatch, cumpliendo con los requisitos de transparencia establecidos en las directrices del proyecto.

---

## 2. Herramientas de IA Utilizadas

| Herramienta | Version/Modelo | Proposito Principal |
|-------------|----------------|---------------------|
| ChatGPT | GPT-4 | Consultas de arquitectura y debugging |
| GitHub Copilot | - | Autocompletado de codigo |
| Claude | Claude 3 | Revision de documentacion |

---

## 3. Tareas Asistidas por IA

### 3.1 Planificacion de Arquitectura

**Consulta realizada:**
> "¿Cual es la mejor estructura de carpetas para un proyecto Node.js con Express, Socket.io y MongoDB?"

**Respuesta de IA utilizada:**
- Estructura MVC modificada con capa de servicios
- Separacion de sockets en carpeta dedicada
- Configuracion centralizada

**Modificaciones realizadas por el equipo:**
- Se añadio carpeta `utils/` para funciones auxiliares
- Se reorganizo la estructura de middleware

**Justificacion:**
La estructura propuesta por la IA era adecuada pero se adapto a las necesidades especificas del proyecto.

---

### 3.2 Implementacion de Autenticacion JWT

**Consulta realizada:**
> "¿Como implementar autenticacion JWT en Express con refresh tokens?"

**Codigo sugerido por IA:**
\`\`\`javascript
// Codigo original de IA (fragmento)
const jwt = require('jsonwebtoken');
const generateToken = (user) => {
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
};
\`\`\`

**Problemas detectados:**
- No incluia manejo de errores
- Expiracion muy larga para access token
- No consideraba refresh tokens

**Codigo final implementado:**
\`\`\`javascript
// Codigo corregido por el equipo
const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
};
\`\`\`

---

### 3.3 Señalizacion WebRTC

**Consulta realizada:**
> "Explicar el flujo de señalizacion WebRTC para videollamadas 1-a-1"

**Informacion obtenida:**
- Diagrama de flujo offer/answer
- Manejo de candidatos ICE
- Configuracion de STUN/TURN servers

**Limitaciones de la respuesta IA:**
- El codigo ejemplo no manejaba correctamente la reconexion
- Faltaba manejo de errores de permisos de camara/microfono

**Correcciones aplicadas:**
- Se añadio logica de reconexion automatica
- Se implemento manejo de errores de medios

---

### 3.4 Filtro de Contenido Ofensivo

**Consulta realizada:**
> "¿Como implementar un filtro de palabras ofensivas sin usar IA?"

**Solucion propuesta por IA:**
- Lista negra estatica de palabras
- Expresiones regulares para variaciones
- Normalizacion de texto (acentos, mayusculas)

**Implementacion adoptada:**
Se utilizo el enfoque de lista negra con las siguientes mejoras:
- Soporte para español e ingles
- Deteccion de variaciones con caracteres especiales
- Sistema de advertencias progresivas

---

### 3.5 Configuracion Docker

**Consulta realizada:**
> "Generar docker-compose.yml para Node.js, MongoDB y Nginx con HTTPS"

**Archivo generado por IA:**
- Configuracion basica funcional
- Volumenes para persistencia
- Red interna entre servicios

**Modificaciones necesarias:**
- Ajuste de variables de entorno
- Configuracion de healthchecks
- Optimizacion de imagen Docker (multi-stage build)

---

## 4. Errores Detectados en Sugerencias de IA

| Error | Contexto | Correccion |
|-------|----------|------------|
| Sintaxis obsoleta Socket.io | Uso de `socket.emit()` con callback deprecado | Actualizacion a sintaxis v4 |
| Vulnerabilidad SQL Injection | Consultas MongoDB sin sanitizar | Uso de mongoose con validacion |
| CORS mal configurado | Origen permitido como `*` | Configuracion especifica de origenes |
| Manejo incorrecto de promesas | `async/await` mezclado con `.then()` | Estandarizacion a async/await |

---

## 5. Decisiones Tomadas Independientemente de IA

Las siguientes decisiones fueron tomadas por el equipo sin asistencia de IA:

1. **Eleccion de MongoDB sobre PostgreSQL**
   - Razon: Mayor flexibilidad para datos de perfil de usuario

2. **Simplificacion del flujo de consentimiento de llamada**
   - La IA sugirio un sistema de 3 pasos; se simplifico a 2 pasos

3. **Estrategia de testing**
   - Se opto por pruebas de integracion sobre pruebas unitarias exhaustivas

4. **Diseño de la API REST**
   - Convencion de nombres y estructura de respuestas

---

## 6. Porcentaje Estimado de Codigo Asistido por IA

| Componente | % Codigo IA | % Codigo Propio | Notas |
|------------|-------------|-----------------|-------|
| Configuracion inicial | 60% | 40% | Boilerplate y setup |
| Autenticacion | 30% | 70% | Logica de negocio propia |
| Sistema de matching | 20% | 80% | Algoritmo diseñado por equipo |
| Chat en tiempo real | 40% | 60% | Integracion Socket.io |
| Videollamadas WebRTC | 50% | 50% | Señalizacion compleja |
| Despliegue Docker | 70% | 30% | Configuracion estandar |

**Promedio general:** ~40% asistido por IA, 60% desarrollo propio

---

## 7. Reflexion sobre el Uso de IA

### Beneficios Observados
- Aceleracion en la fase inicial del proyecto
- Acceso rapido a patrones de diseño establecidos
- Ayuda en debugging de errores comunes

### Limitaciones Encontradas
- Codigo generado requiere revision exhaustiva
- Sugerencias a veces desactualizadas
- No considera el contexto completo del proyecto

### Aprendizajes
- La IA es una herramienta de apoyo, no un reemplazo del conocimiento
- Es esencial validar todo codigo sugerido
- La documentacion oficial siempre tiene prioridad sobre sugerencias de IA

---

## 8. Declaracion de Originalidad

Declaramos que este proyecto, aunque ha utilizado herramientas de IA como apoyo, representa trabajo original de los autores. Todo codigo generado por IA ha sido:

1. Revisado y comprendido completamente
2. Modificado y adaptado a las necesidades del proyecto
3. Validado mediante pruebas
4. Documentado apropiadamente

**Firmas:**

Estudiante A: ___________________________ Fecha: ___________

Estudiante B: ___________________________ Fecha: ___________
