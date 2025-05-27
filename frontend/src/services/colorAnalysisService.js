/**
 * Estrae i colori dominanti da un'immagine utilizzando la Canvas API
 * @param {HTMLImageElement} image - L'elemento immagine da analizzare
 * @param {number} sampleSize - Dimensione del campionamento (default: 10)
 * @returns {Array} Array di colori dominanti in formato HEX
 */
export const extractDominantColors = (image, sampleSize = 10) => {
  // Crea un canvas per l'analisi dell'immagine
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d', { willReadFrequently: true });
  
  // Ridimensiona l'immagine per un'analisi più veloce
  const maxDimension = 200;
  let width = image.width;
  let height = image.height;
  
  if (width > height && width > maxDimension) {
    height = Math.round(height * (maxDimension / width));
    width = maxDimension;
  } else if (height > maxDimension) {
    width = Math.round(width * (maxDimension / height));
    height = maxDimension;
  }
  
  canvas.width = width;
  canvas.height = height;
  
  // Disegna l'immagine sul canvas
  context.drawImage(image, 0, 0, width, height);
  
  // Ottieni i dati dei pixel
  const imageData = context.getImageData(0, 0, width, height).data;
  
  // Campiona i colori dall'immagine
  const colorCounts = {};
  const pixelCount = imageData.length / 4; // RGBA = 4 valori per pixel
  
  // Campiona i pixel a intervalli regolari
  const step = Math.max(1, Math.floor(pixelCount / (sampleSize * sampleSize)));
  
  for (let i = 0; i < pixelCount; i += step) {
    const offset = i * 4;
    const r = imageData[offset];
    const g = imageData[offset + 1];
    const b = imageData[offset + 2];
    
    // Quantizza i colori per raggrupparli (riduce variazioni minime)
    const quantizedR = Math.round(r / 32) * 32;
    const quantizedG = Math.round(g / 32) * 32;
    const quantizedB = Math.round(b / 32) * 32;
    
    const rgb = `rgb(${quantizedR},${quantizedG},${quantizedB})`;
    
    if (!colorCounts[rgb]) {
      colorCounts[rgb] = 0;
    }
    colorCounts[rgb]++;
  }
  
  // Converti i conteggi in una lista ordinata
  const colorList = Object.keys(colorCounts).map(color => {
    // Estrai i valori RGB dalla stringa
    const match = color.match(/rgb\((\d+),(\d+),(\d+)\)/);
    const [, r, g, b] = match.map(Number);
    
    return {
      color,
      hex: rgbToHex(r, g, b),
      count: colorCounts[color],
      r, g, b
    };
  });
  
  // Ordina per frequenza e prendi i top 5
  colorList.sort((a, b) => b.count - a.count);
  
  // Filtra colori troppo simili
  const filteredColors = [];
  for (const color of colorList) {
    // Verifica che questo colore sia sufficientemente diverso da quelli già scelti
    if (!filteredColors.some(c => colorDistance(c, color) < 40)) {
      filteredColors.push(color);
      if (filteredColors.length >= 5) break;
    }
  }
  
  return filteredColors.map(c => c.hex);
};

/**
 * Calcola la distanza euclidea tra due colori nello spazio RGB
 */
function colorDistance(color1, color2) {
  return Math.sqrt(
    Math.pow(color1.r - color2.r, 2) +
    Math.pow(color1.g - color2.g, 2) +
    Math.pow(color1.b - color2.b, 2)
  );
}

/**
 * Converte valori RGB in formato esadecimale
 */
function rgbToHex(r, g, b) {
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
}

/**
 * Ottiene una descrizione testuale del colore
 */
export const getColorDescription = (hex) => {
  // Converti HEX in RGB
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  
  // Determinazione della luminosità (formula approssimativa)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Determina il colore di base
  let colorName;
  
  // Controlla se è un tono di grigio
  const isGray = Math.abs(r - g) < 20 && Math.abs(g - b) < 20 && Math.abs(r - b) < 20;
  
  if (isGray) {
    if (luminance < 0.2) return "nero";
    if (luminance < 0.5) return "grigio scuro";
    if (luminance < 0.8) return "grigio";
    return "bianco";
  }
  
  // Determina il colore base
  if (r > g && r > b) {
    if (g > 0.6 * r) return "arancione";
    return "rosso";
  } else if (g > r && g > b) {
    if (r > 0.6 * g) return "giallo-verde";
    if (b > 0.6 * g) return "verde acqua";
    return "verde";
  } else if (b > r && b > g) {
    if (r > 0.6 * b) return "viola";
    if (g > 0.6 * b) return "azzurro";
    return "blu";
  }
  
  // Fallback
  if (luminance < 0.3) return "scuro";
  if (luminance > 0.7) return "chiaro";
  return "medio";
};