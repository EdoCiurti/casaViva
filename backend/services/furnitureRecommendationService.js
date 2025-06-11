/**
 * Backend service for furniture recommendations
 * CommonJS version of the frontend service
 */

/**
 * Finds matching products based on detected room colors
 * @param {Array} products - Array of products to filter
 * @param {Array} detectedColors - Colors detected from the room image
 * @param {string} furnitureType - Type of furniture
 * @param {string} userRequirements - User requirements string
 * @returns {Array} Filtered and scored products
 */
function findMatchingProducts(products, detectedColors, furnitureType, userRequirements = "") {
  console.log("Colori rilevati della stanza:", detectedColors);
  console.log("Categoria richiesta:", furnitureType);
  console.log("Requisiti utente:", userRequirements);

  // Converti i colori rilevati in nomi leggibili
  const detectedColorNames = detectedColors.map(color => getReadableColorName(color));
  console.log("Nomi colori rilevati:", detectedColorNames);
  // Colori neutri che si abbinano sempre - lista estesa
  const neutralColors = [
    'bianco', 'nero', 'grigio', 'beige', 'naturale', 'crema', 'avorio',
    'grigio scuro', 'grigio chiaro', 'antracite', 'tortora', 'sabbia',
    'perla', 'latte', 'ghiaccio', 'argento', 'platino', 'champagne',
    'ecru', 'lino', 'panna', 'cenere', 'pietra', 'talpa'
  ];
  return products
    .filter((product) => {
      // Filtro primario per categoria
      if (
        furnitureType &&
        !product.category
          ?.toLowerCase()
          .includes(furnitureType.toLowerCase()) &&
        !product.name?.toLowerCase().includes(furnitureType.toLowerCase())
      ) {
        return false;
      }

      // FILTRO RIGOROSO PER COLORE: il prodotto DEVE avere un colore compatibile
      if (detectedColorNames.length > 0) {
        // Cerca colori nel nome e descrizione del prodotto (non nel campo color che non esiste)
        const productText = `${product.name} ${product.description}`.toLowerCase();
        
        // Controlla se il prodotto ha un colore che corrisponde alla palette rilevata
        const hasMatchingColor = detectedColorNames.some(detectedColor => 
          productText.includes(detectedColor.toLowerCase())
        );
        
        // Controlla se è un colore neutro (sempre compatibile)
        const isNeutralColor = neutralColors.some(neutral => 
          productText.includes(neutral.toLowerCase())
        );
        
        // Il prodotto deve avere O un colore della palette O essere neutro
        if (!hasMatchingColor && !isNeutralColor) {
          console.log(`ESCLUSO: ${product.name} - testo "${productText}" non contiene colori della palette [${detectedColorNames.join(', ')}] o colori neutri`);
          return false;
        }
        
        console.log(`INCLUSO: ${product.name} - trovato colore compatibile in "${productText}"`);
      }

      return true;
    })    .map((product) => {
      let score = 0;
      
      // Punteggio base per categoria corretta
      if (product.category?.toLowerCase().includes(furnitureType.toLowerCase()) ||
          product.name?.toLowerCase().includes(furnitureType.toLowerCase())) {
        score += 50;
      }

      // Punteggio per corrispondenza colori rilevati (cerca nel testo del prodotto)
      if (detectedColorNames.length > 0) {
        const productText = `${product.name} ${product.description}`.toLowerCase();
        
        detectedColorNames.forEach((detectedColor, index) => {
          if (productText.includes(detectedColor.toLowerCase())) {
            // Colori più dominanti (primi nell'array) hanno punteggio maggiore
            score += (detectedColorNames.length - index) * 30;
            console.log(`MATCH PERFETTO: ${product.name} - testo contiene colore ${detectedColor}`);
          }
        });
      }

      // Bonus per colori neutri che si abbinano sempre
      const productText = `${product.name} ${product.description}`.toLowerCase();
      if (neutralColors.some(neutral => productText.includes(neutral.toLowerCase()))) {
        score += 15; // Punteggio moderato per neutri
        console.log(`NEUTRO: ${product.name} - contiene colore neutro`);
      }

      return { ...product, compatibilityScore: score };
    })
    .filter(product => product.compatibilityScore > 0) // Solo prodotti con punteggio > 0
    .sort((a, b) => b.compatibilityScore - a.compatibilityScore);
}

/**
 * Generates a reason why a product matches the detected room colors
 * @param {Object} product - Product object
 * @param {Array} detectedColors - Colors detected from the room image
 * @param {string} furnitureType - Type of furniture
 * @returns {string} Explanation string
 */
function generateProductReason(product, detectedColors, furnitureType) {
  const detectedColorNames = detectedColors.map(color => getReadableColorName(color));
  
  // Controllo di compatibilità per colori nel testo del prodotto
  let colorMatch = false;
  let matchedColor = '';

  if (detectedColorNames.length > 0) {
    const productText = `${product.name} ${product.description}`.toLowerCase();
    
    for (const detectedColor of detectedColorNames) {
      if (productText.includes(detectedColor.toLowerCase())) {
        colorMatch = true;
        matchedColor = detectedColor;
        break;
      }
    }
  }
  
  // Controlla se è un colore neutro
  const neutralColors = ['bianco', 'nero', 'grigio', 'beige', 'naturale', 'crema', 'avorio', 'grigio scuro', 'grigio chiaro'];
  const productText = `${product.name} ${product.description}`.toLowerCase();
  const isNeutral = neutralColors.some(neutral => 
    productText.includes(neutral.toLowerCase())
  );

  // Genera una motivazione personalizzata
  if (colorMatch) {
    return `Questo ${furnitureType} è perfetto per la tua stanza! I colori del prodotto si abbinano perfettamente al ${matchedColor} che abbiamo rilevato nella tua stanza, creando un'armonia cromatica ideale.`;
  } else if (isNeutral) {
    const dominantColor = detectedColorNames[0] || 'colore dominante';
    return `Questo ${furnitureType} presenta colori neutri che si abbinano splendidamente a qualsiasi ambiente. I suoi toni neutri valorizzano il ${dominantColor} della tua stanza senza creare contrasti.`;
  } else {
    const dominantColor = detectedColorNames[0] || 'stile';
    return `Questo ${furnitureType} può creare un interessante punto focale nella tua stanza, offrendo un contrasto elegante con il ${dominantColor} rilevato nell'ambiente.`;
  }
}

/**
 * Helper function to extract color requests from text
 * @param {string} text - Input text
 * @returns {Array} Array of color names
 */
function extractColorRequests(text) {
  if (!text) return [];

  const colors = [
    "nero", "nera", "nere", "neri",
    "bianco", "bianca", "bianchi", "bianche",
    "rosso", "rossa", "rossi", "rosse",
    "blu", "azzurro", "azzurri", "azzurre",
    "verde", "verdi",
    "giallo", "gialla", "gialli", "gialle",
    "grigio", "grigia", "grigi", "grigie",
    "marrone", "marroni",
    "viola", "arancione", "arancioni"
  ];

  const lowerText = text.toLowerCase();
  return colors.filter((color) => {
    const regex = new RegExp(`\\b${color}\\b`, "i");
    return regex.test(lowerText);
  });
}

/**
 * Helper function to extract material requests from text
 * @param {string} text - Input text
 * @returns {Array} Array of material names
 */
function extractMaterialRequests(text) {
  if (!text) return [];

  const materials = [
    "legno", "vetro", "metallo", "plastica", "acciaio",
    "ferro", "alluminio", "tessuto", "pelle", "cuoio",
    "rattan", "bambù", "ceramica", "pietra", "marmo"
  ];

  const lowerText = text.toLowerCase();
  return materials.filter((material) => {
    const regex = new RegExp(`\\b${material}\\b`, "i");
    return regex.test(lowerText);
  });
}

/**
 * Extracts dominant colors from an image canvas
 * @param {HTMLCanvasElement} canvas - Canvas with the image
 * @returns {Array} Array of dominant colors in hex format
 */
function extractDominantColors(canvas) {
  const ctx = canvas.getContext('2d');
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  
  // Mappa per contare i colori
  const colorMap = new Map();
  
  // Campiona i pixel (prendi ogni 10° pixel per performance)
  for (let i = 0; i < data.length; i += 40) { // 40 = 4 bytes * 10 pixels
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    
    // Salta pixel trasparenti
    if (a < 128) continue;
    
    // Raggruppa colori simili (riduce la precisione per evitare troppi colori)
    const quantizedR = Math.floor(r / 32) * 32;
    const quantizedG = Math.floor(g / 32) * 32;
    const quantizedB = Math.floor(b / 32) * 32;
    
    const colorKey = `${quantizedR},${quantizedG},${quantizedB}`;
    colorMap.set(colorKey, (colorMap.get(colorKey) || 0) + 1);
  }
  
  // Converti in array e ordina per frequenza
  const sortedColors = Array.from(colorMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5) // Prendi i 5 colori più dominanti
    .map(([colorKey]) => {
      const [r, g, b] = colorKey.split(',').map(Number);
      return rgbToHex(r, g, b);
    });
  
  return sortedColors;
}

/**
 * Converts RGB to hex
 * @param {number} r - Red value
 * @param {number} g - Green value  
 * @param {number} b - Blue value
 * @returns {string} Hex color
 */
function rgbToHex(r, g, b) {
  return "#" + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  }).join("");
}

/**
 * Converts hex color to readable color name with improved algorithm
 * @param {string} hex - Hex color code
 * @returns {string} Readable color name
 */
function getReadableColorName(hex) {
  // Converti HEX in RGB
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  console.log(`[Color Analysis] Analizzando ${hex}: R=${r}, G=${g}, B=${b}`);

  // Calcola la luminosità
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Calcola saturation per identificare meglio i colori
  const maxComponent = Math.max(r, g, b);
  const minComponent = Math.min(r, g, b);
  const saturation = maxComponent === 0 ? 0 : (maxComponent - minComponent) / maxComponent;

  console.log(`[Color Analysis] Luminance: ${luminance.toFixed(2)}, Saturation: ${saturation.toFixed(2)}`);

  // Controlla se è un colore neutro (saturation bassa)
  if (saturation < 0.2) {
    if (luminance < 0.15) return "nero";
    if (luminance < 0.35) return "grigio scuro";
    if (luminance < 0.65) return "grigio";
    if (luminance < 0.85) return "grigio chiaro";
    return "bianco";
  }

  // Converti in HSV per una migliore identificazione dei colori
  let hue = 0;
  if (maxComponent !== minComponent) {
    const delta = maxComponent - minComponent;
    if (maxComponent === r) {
      hue = ((g - b) / delta) % 6;
    } else if (maxComponent === g) {
      hue = ((b - r) / delta) + 2;
    } else {
      hue = ((r - g) / delta) + 4;
    }
  }
  hue = Math.round(hue * 60);
  if (hue < 0) hue += 360;

  console.log(`[Color Analysis] Hue: ${hue}°`);

  // Identifica il colore basandosi sulla hue con priorità ai colori dominanti
  if (saturation > 0.25) {  // Colori sufficientemente saturi
    // ROSSO: range esteso per catturare meglio le varianti rosse
    if ((hue >= 0 && hue < 20) || (hue >= 340 && hue < 360)) {
      if (luminance < 0.3) return "bordeaux";
      if (luminance > 0.7) return "rosa";
      return "rosso";
    }
    
    // ARANCIONE
    if (hue >= 20 && hue < 50) {
      return "arancione";
    }
    
    // GIALLO
    if (hue >= 50 && hue < 80) {
      return "giallo";
    }
    
    // VERDE
    if (hue >= 80 && hue < 160) {
      if (luminance < 0.3) return "verde scuro";
      if (luminance > 0.7) return "verde chiaro";
      return "verde";
    }
    
    // TURCHESE/CIANO
    if (hue >= 160 && hue < 200) {
      return "turchese";
    }
    
    // BLU
    if (hue >= 200 && hue < 270) {
      if (luminance < 0.3) return "blu scuro";
      if (luminance > 0.7) return "azzurro";
      return "blu";
    }
    
    // VIOLA/MAGENTA
    if (hue >= 270 && hue < 340) {
      return "viola";
    }
  }

  // Fallback: analizza il componente dominante per colori meno saturi
  const redDominance = r / Math.max(g, b, 1);
  const greenDominance = g / Math.max(r, b, 1);
  const blueDominance = b / Math.max(r, g, 1);

  console.log(`[Color Analysis] Dominance - R: ${redDominance.toFixed(2)}, G: ${greenDominance.toFixed(2)}, B: ${blueDominance.toFixed(2)}`);

  // ROSSO dominante (con soglia più bassa per catturare meglio)
  if (redDominance > 1.15 && r > 80) {  // Soglia ridotta da 1.3 a 1.15
    if (g > 0.6 * r) return "arancione";
    if (b > 0.4 * r) return "viola";
    if (luminance < 0.3) return "bordeaux";
    if (luminance > 0.7) return "rosa";
    console.log(`[Color Analysis] Identified as ROSSO (red dominance: ${redDominance.toFixed(2)})`);
    return "rosso";
  }
  
  // VERDE dominante
  if (greenDominance > 1.2 && g > 80) {
    if (r > 0.7 * g) return "giallo";
    if (b > 0.6 * g) return "turchese";
    if (luminance < 0.3) return "verde scuro";
    if (luminance > 0.7) return "verde chiaro";
    return "verde";
  }
  
  // BLU dominante
  if (blueDominance > 1.2 && b > 80) {
    if (r > 0.6 * b) return "viola";
    if (g > 0.6 * b) return "turchese";
    if (luminance < 0.3) return "blu scuro";
    if (luminance > 0.7) return "azzurro";
    return "blu";
  }

  // Se nessun colore è dominante ma c'è saturation, prova a identificare comunque
  if (saturation > 0.15) {
    if (r > g && r > b && r > 100) return "rosso";
    if (g > r && g > b && g > 100) return "verde";
    if (b > r && b > g && b > 100) return "blu";
  }

  // Fallback finale
  console.log(`[Color Analysis] Fallback to grigio for ${hex}`);
  if (luminance < 0.3) return "grigio scuro";
  if (luminance > 0.7) return "grigio chiaro";
  return "grigio";
}

module.exports = {
  findMatchingProducts,
  generateProductReason,
  extractDominantColors
};
