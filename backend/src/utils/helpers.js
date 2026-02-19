/**
 * SafeMatch - Utilidades y Helpers
 * Funciones auxiliares reutilizables
 */

/**
 * Formatea una respuesta exitosa de la API
 * @param {Object} data - Datos a enviar
 * @param {string} message - Mensaje descriptivo
 * @returns {Object} Respuesta formateada
 */
const successResponse = (data = null, message = "Operacion exitosa") => ({
  success: true,
  message,
  data,
  timestamp: new Date().toISOString(),
});

/**
 * Formatea una respuesta de error de la API
 * @param {string} message - Mensaje de error
 * @param {number} statusCode - Codigo HTTP
 * @param {Array} errors - Lista de errores detallados
 * @returns {Object} Respuesta formateada
 */
const errorResponse = (
  message = "Error interno",
  statusCode = 500,
  errors = []
) => ({
  success: false,
  message,
  statusCode,
  errors,
  timestamp: new Date().toISOString(),
});

/**
 * Calcula la edad a partir de una fecha de nacimiento
 * @param {Date} birthDate - Fecha de nacimiento
 * @returns {number} Edad en anos
 */
const calculateAge = (birthDate) => {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;
};

/**
 * Calcula la distancia entre dos coordenadas (formula Haversine)
 * @param {number} lat1 - Latitud punto 1
 * @param {number} lon1 - Longitud punto 1
 * @param {number} lat2 - Latitud punto 2
 * @param {number} lon2 - Longitud punto 2
 * @returns {number} Distancia en kilometros
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radio de la Tierra en km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Convierte grados a radianes
 * @param {number} deg - Grados
 * @returns {number} Radianes
 */
const toRad = (deg) => deg * (Math.PI / 180);

/**
 * Genera un codigo aleatorio de verificacion
 * @param {number} length - Longitud del codigo
 * @returns {string} Codigo aleatorio
 */
const generateVerificationCode = (length = 6) => {
  const chars = "0123456789";
  let code = "";
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

/**
 * Sanitiza un string para uso seguro
 * @param {string} str - String a sanitizar
 * @returns {string} String sanitizado
 */
const sanitizeString = (str) => {
  if (typeof str !== "string") return "";
  return str
    .trim()
    .replace(/[<>]/g, "") // Eliminar caracteres HTML basicos
    .substring(0, 1000); // Limitar longitud
};

/**
 * Valida formato de email
 * @param {string} email - Email a validar
 * @returns {boolean} Es valido
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Pagina un array de resultados
 * @param {Array} array - Array a paginar
 * @param {number} page - Numero de pagina (1-based)
 * @param {number} limit - Items por pagina
 * @returns {Object} Resultados paginados con metadata
 */
const paginate = (array, page = 1, limit = 10) => {
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const total = array.length;
  const totalPages = Math.ceil(total / limit);

  return {
    data: array.slice(startIndex, endIndex),
    pagination: {
      currentPage: page,
      totalPages,
      totalItems: total,
      itemsPerPage: limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
};

/**
 * Genera un slug a partir de un texto
 * @param {string} text - Texto a convertir
 * @returns {string} Slug generado
 */
const generateSlug = (text) => {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Eliminar acentos
    .replace(/[^a-z0-9]+/g, "-") // Reemplazar espacios y caracteres especiales
    .replace(/(^-|-$)/g, ""); // Eliminar guiones al inicio y final
};

/**
 * Formatea una fecha para mostrar
 * @param {Date} date - Fecha a formatear
 * @param {string} locale - Locale (default: es-ES)
 * @returns {string} Fecha formateada
 */
const formatDate = (date, locale = "es-ES") => {
  return new Date(date).toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

/**
 * Formatea tiempo relativo (hace X minutos)
 * @param {Date} date - Fecha a formatear
 * @returns {string} Tiempo relativo
 */
const timeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);

  const intervals = {
    ano: 31536000,
    mes: 2592000,
    semana: 604800,
    dia: 86400,
    hora: 3600,
    minuto: 60,
  };

  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit);
    if (interval >= 1) {
      const plural = interval > 1 ? "s" : "";
      return `hace ${interval} ${unit}${plural}`;
    }
  }

  return "hace un momento";
};

/**
 * Oculta parcialmente un email
 * @param {string} email - Email a ocultar
 * @returns {string} Email parcialmente oculto
 */
const maskEmail = (email) => {
  const [name, domain] = email.split("@");
  const maskedName =
    name.charAt(0) + "*".repeat(Math.max(0, name.length - 2)) + name.slice(-1);
  return `${maskedName}@${domain}`;
};

module.exports = {
  successResponse,
  errorResponse,
  calculateAge,
  calculateDistance,
  generateVerificationCode,
  sanitizeString,
  isValidEmail,
  paginate,
  generateSlug,
  formatDate,
  timeAgo,
  maskEmail,
};
