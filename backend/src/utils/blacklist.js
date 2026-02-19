/**
 * SafeMatch - Lista de Palabras Prohibidas
 * Lista de palabras ofensivas para el filtro de contenido
 *
 * NOTA: Esta lista es un ejemplo educativo simplificado.
 * En produccion, se recomienda usar una lista mas completa
 * y considerar diferentes idiomas y variaciones.
 */

// Palabras ofensivas en espanol (lista reducida para ejemplo)
const spanishOffensiveWords = [
  "idiota",
  "imbecil",
  "estupido",
  "tonto",
  "gilipollas",
  "cabron",
  "puta",
  "puto",
  "mierda",
  "joder",
  "coño",
  "hostia",
  "capullo",
  "subnormal",
  "retrasado",
  "zorra",
  "marica",
  "maricon",
  "nenaza",
  "basura",
  "escoria",
  "asco",
  "asqueroso",
  "cerdo",
  "guarro",
  "hijo de puta",
  "hdp",
  "hp",
  "ctm",
  "maldito",
  "maldita",
  "desgraciado",
  "miserable",
  "inutil",
  "tarado",
  "mongolo",
  "anormal",
];

// Palabras ofensivas en ingles (lista reducida para ejemplo)
const englishOffensiveWords = [
  "idiot",
  "stupid",
  "dumb",
  "moron",
  "jerk",
  "asshole",
  "bastard",
  "bitch",
  "shit",
  "fuck",
  "fucking",
  "damn",
  "crap",
  "dick",
  "cock",
  "pussy",
  "whore",
  "slut",
  "fag",
  "faggot",
  "retard",
  "retarded",
  "nigger",
  "nigga",
  "cunt",
  "twat",
  "wanker",
  "prick",
  "douche",
  "loser",
  "pathetic",
  "scum",
  "trash",
  "worthless",
];

// Patrones de acoso
const harassmentPatterns = [
  "te voy a matar",
  "voy a matarte",
  "te mato",
  "muere",
  "muérete",
  "ojalá te mueras",
  "te odio",
  "eres basura",
  "no vales nada",
  "kill yourself",
  "kys",
  "go die",
  "i hate you",
  "youre trash",
  "youre worthless",
];

// Patrones de spam/estafa
const spamPatterns = [
  "gana dinero",
  "trabaja desde casa",
  "inversion garantizada",
  "premio",
  "has ganado",
  "click aqui",
  "enlace",
  "www.",
  "http",
  ".com",
  ".es",
  "whatsapp",
  "telegram",
  "instagram",
  "dame tu numero",
  "pasame tu numero",
  "agregame",
  "sigueme",
  "onlyfans",
  "sugar daddy",
  "sugar mommy",
];

// Combinar todas las listas
const blacklist = [
  ...spanishOffensiveWords,
  ...englishOffensiveWords,
  ...harassmentPatterns,
  ...spamPatterns,
];

// Exportar listas separadas para flexibilidad
module.exports = {
  blacklist,
  spanishOffensiveWords,
  englishOffensiveWords,
  harassmentPatterns,
  spamPatterns,
};
