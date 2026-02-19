/**
 * Servicio de filtrado de contenido ofensivo
 * Implementacion basada en lista negra (sin IA)
 */

// Lista de palabras ofensivas (español e ingles)
// En produccion, esta lista deberia ser mas extensa y configurable
const PALABRAS_OFENSIVAS = [
  // Español
  'idiota', 'estupido', 'imbecil', 'tonto', 'mierda', 
  'puta', 'puto', 'cabron', 'pendejo', 'gilipollas',
  'marica', 'maricon', 'joder', 'coño', 'carajo',
  // Ingles
  'fuck', 'shit', 'bitch', 'asshole', 'bastard',
  'damn', 'crap', 'dick', 'pussy', 'cock',
  'whore', 'slut', 'retard', 'idiot', 'stupid',
];

// Expresiones ofensivas (frases)
const EXPRESIONES_OFENSIVAS = [
  'hijo de puta',
  'vete a la mierda',
  'go to hell',
  'fuck you',
  'fuck off',
];

// Patrones de variaciones comunes (leetspeak y similares)
const SUSTITUCIONES = {
  'a': ['4', '@'],
  'e': ['3'],
  'i': ['1', '!'],
  'o': ['0'],
  's': ['5', '$'],
  't': ['7'],
  'l': ['1'],
};

class FilterService {
  constructor() {
    // Construir expresiones regulares para deteccion mas eficiente
    this.patronesPalabras = this.construirPatrones(PALABRAS_OFENSIVAS);
    this.patronesExpresiones = EXPRESIONES_OFENSIVAS.map(
      exp => new RegExp(this.escaparRegex(exp), 'gi')
    );
  }

  /**
   * Construir patrones regex que incluyen variaciones leetspeak
   */
  construirPatrones(palabras) {
    return palabras.map(palabra => {
      let patron = '';
      for (const char of palabra.toLowerCase()) {
        if (SUSTITUCIONES[char]) {
          // Crear grupo que acepta el caracter original o sus sustituciones
          patron += `[${char}${SUSTITUCIONES[char].join('')}]`;
        } else {
          patron += this.escaparRegex(char);
        }
      }
      // Añadir limites de palabra opcionales y permitir repeticion de caracteres
      return new RegExp(`\\b${patron}+\\b`, 'gi');
    });
  }

  /**
   * Escapar caracteres especiales de regex
   */
  escaparRegex(texto) {
    return texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Normalizar texto para comparacion
   */
  normalizarTexto(texto) {
    return texto
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Verificar si el texto contiene contenido ofensivo
   * @returns {Object} { esOfensivo: boolean, palabrasEncontradas: string[] }
   */
  verificarContenido(texto) {
    if (!texto || typeof texto !== 'string') {
      return { esOfensivo: false, palabrasEncontradas: [] };
    }

    const textoNormalizado = this.normalizarTexto(texto);
    const palabrasEncontradas = [];

    // Verificar expresiones primero
    for (const patron of this.patronesExpresiones) {
      const coincidencias = textoNormalizado.match(patron);
      if (coincidencias) {
        palabrasEncontradas.push(...coincidencias);
      }
    }

    // Verificar palabras individuales
    for (let i = 0; i < this.patronesPalabras.length; i++) {
      const patron = this.patronesPalabras[i];
      const coincidencias = textoNormalizado.match(patron);
      if (coincidencias) {
        palabrasEncontradas.push(PALABRAS_OFENSIVAS[i]);
      }
    }

    return {
      esOfensivo: palabrasEncontradas.length > 0,
      palabrasEncontradas: [...new Set(palabrasEncontradas)], // Eliminar duplicados
    };
  }

  /**
   * Censurar contenido ofensivo reemplazando con asteriscos
   * @returns {Object} { textoCensurado: string, fueCensurado: boolean }
   */
  censurarContenido(texto) {
    if (!texto || typeof texto !== 'string') {
      return { textoCensurado: texto, fueCensurado: false };
    }

    let textoCensurado = texto;
    let fueCensurado = false;

    // Censurar expresiones
    for (const patron of this.patronesExpresiones) {
      if (patron.test(textoCensurado)) {
        fueCensurado = true;
        textoCensurado = textoCensurado.replace(patron, (match) => 
          '*'.repeat(match.length)
        );
      }
    }

    // Censurar palabras
    for (const patron of this.patronesPalabras) {
      if (patron.test(textoCensurado)) {
        fueCensurado = true;
        textoCensurado = textoCensurado.replace(patron, (match) => 
          '*'.repeat(match.length)
        );
      }
    }

    return { textoCensurado, fueCensurado };
  }

  /**
   * Obtener nivel de severidad del contenido
   * @returns {string} 'bajo' | 'medio' | 'alto'
   */
  obtenerNivelSeveridad(texto) {
    const resultado = this.verificarContenido(texto);
    
    if (!resultado.esOfensivo) {
      return 'ninguno';
    }

    const cantidad = resultado.palabrasEncontradas.length;
    
    if (cantidad >= 3) {
      return 'alto';
    } else if (cantidad === 2) {
      return 'medio';
    }
    return 'bajo';
  }

  /**
   * Añadir palabra a la lista negra (en runtime)
   */
  agregarPalabra(palabra) {
    if (!PALABRAS_OFENSIVAS.includes(palabra.toLowerCase())) {
      PALABRAS_OFENSIVAS.push(palabra.toLowerCase());
      this.patronesPalabras = this.construirPatrones(PALABRAS_OFENSIVAS);
    }
  }

  /**
   * Obtener estadisticas del filtro
   */
  obtenerEstadisticas() {
    return {
      totalPalabras: PALABRAS_OFENSIVAS.length,
      totalExpresiones: EXPRESIONES_OFENSIVAS.length,
    };
  }
}

module.exports = new FilterService();
