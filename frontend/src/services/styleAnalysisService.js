import { extractDominantColors, getColorDescription } from './colorAnalysisService';

/**
 * Analizza lo stile di una stanza basandosi su caratteristiche reali dell'immagine
 * @param {HTMLImageElement} imageElement - L'elemento immagine da analizzare
 * @returns {Object} Risultati dell'analisi
 */
export const analyzeRoomStyle = async (imageElement) => {
  // Estrai i colori dominanti dalla stanza
  const dominantColors = extractDominantColors(imageElement);
  
  // Calcola le caratteristiche di colore
  const colorFeatures = analyzeColorScheme(dominantColors);
  
  // Determina lo stile in base alle caratteristiche
  const styleData = determineStyle(colorFeatures);
  
  // Genera palette di colori complementari in base allo stile
  const complementaryPalette = generateComplementaryPalette(dominantColors, styleData.style);
  
  return {
    dominantColors,
    colorFeatures,
    styleData,
    complementaryPalette,
  };
};

/**
 * Analizza lo schema colore per estrarre caratteristiche
 */
function analyzeColorScheme(colorHexArray) {
  // Calcola la luminosità media
  let totalLuminance = 0;
  
  const colorData = colorHexArray.map(hex => {
    // Converti HEX in RGB
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    
    // Calcola luminanza (formula adattata dall'algoritmo WCAG)
    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    totalLuminance += luminance;
    
    // Calcola saturazione (approssimazione)
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;
    const saturation = max === 0 ? 0 : delta / max;
    
    // Determina se il colore è freddo o caldo
    const isCool = b > r;
    
    // Determina se è un colore neutro
    const isNeutral = saturation < 0.15;
    
    return { hex, r, g, b, luminance, saturation, isCool, isNeutral };
  });
  
  // Caratteristiche dello schema colore
  const averageLuminance = totalLuminance / colorHexArray.length;
  const averageSaturation = colorData.reduce((sum, c) => sum + c.saturation, 0) / colorData.length;
  const coolColors = colorData.filter(c => c.isCool).length;
  const warmColors = colorData.filter(c => !c.isCool && !c.isNeutral).length;
  const neutralColors = colorData.filter(c => c.isNeutral).length;
  
  // Contrasto (differenza tra colore più scuro e più chiaro)
  const lightestColor = Math.max(...colorData.map(c => c.luminance));
  const darkestColor = Math.min(...colorData.map(c => c.luminance));
  const contrast = lightestColor - darkestColor;
  
  return {
    brightness: averageLuminance,
    saturation: averageSaturation,
    contrast,
    colorBalance: { cool: coolColors, warm: warmColors, neutral: neutralColors },
    palette: colorData.map(c => c.hex)
  };
}

/**
 * Determina lo stile della stanza in base alle caratteristiche di colore
 */
function determineStyle(colorFeatures) {
  const { brightness, saturation, contrast, colorBalance } = colorFeatures;
  
  // Punteggio per ogni stile
  const styleScores = {
    moderno: 0,
    scandinavo: 0,
    industriale: 0,
    rustico: 0,
    minimalista: 0,
    bohemian: 0,
    classico: 0,
  };
  
  // Stile moderno: contrasto medio-alto, saturazione medio-alta
  styleScores.moderno += contrast * 50;
  styleScores.moderno += saturation * 30;
  styleScores.moderno += (colorBalance.cool > colorBalance.warm) ? 10 : 0;
  
  // Stile scandinavo: luminoso, bassa saturazione, colori freddi
  styleScores.scandinavo += brightness * 60;
  styleScores.scandinavo += (1 - saturation) * 30;
  styleScores.scandinavo += colorBalance.cool * 5;
  styleScores.scandinavo += colorBalance.neutral * 5;
  
  // Stile industriale: bassa luminosità, bassa saturazione, alto contrasto
  styleScores.industriale += (1 - brightness) * 50;
  styleScores.industriale += (1 - saturation) * 20;
  styleScores.industriale += contrast * 30;
  
  // Stile rustico: media luminosità, colori caldi, media saturazione
  styleScores.rustico += (brightness > 0.3 && brightness < 0.6) ? 30 : 0;
  styleScores.rustico += colorBalance.warm * 10;
  styleScores.rustico += (saturation > 0.2 && saturation < 0.5) ? 20 : 0;
  
  // Stile minimalista: alta luminosità, bassa saturazione, alta componente neutra
  styleScores.minimalista += brightness * 30;
  styleScores.minimalista += (1 - saturation) * 40;
  styleScores.minimalista += colorBalance.neutral * 10;
  styleScores.minimalista += (1 - contrast) * 20;
  
  // Stile bohemian: alta saturazione, molti colori caldi
  styleScores.bohemian += saturation * 60;
  styleScores.bohemian += colorBalance.warm * 15;
  styleScores.bohemian += contrast * 20;
  
  // Stile classico: media luminosità, media saturazione, colori neutri + caldi
  styleScores.classico += (brightness > 0.4 && brightness < 0.7) ? 30 : 0;
  styleScores.classico += (saturation > 0.1 && saturation < 0.4) ? 30 : 0;
  styleScores.classico += (colorBalance.neutral + colorBalance.warm) * 5;
  
  // Trova lo stile con il punteggio più alto
  let highestScore = 0;
  let dominantStyle = 'moderno';
  
  for (const [style, score] of Object.entries(styleScores)) {
    if (score > highestScore) {
      highestScore = score;
      dominantStyle = style;
    }
  }
  
  // Ottieni stili affini (con punteggio almeno 80% rispetto al dominante)
  const relatedStyles = [];
  for (const [style, score] of Object.entries(styleScores)) {
    if (style !== dominantStyle && score > highestScore * 0.8) {
      relatedStyles.push(style);
    }
  }
  
  // Genera una descrizione dello stile
  const styleDescription = generateStyleDescription(dominantStyle);
  
  // Suggerimenti di materiali in base allo stile
  const suggestedMaterials = getMaterialSuggestions(dominantStyle);
  
  return {
    style: dominantStyle,
    relatedStyles: relatedStyles.slice(0, 2),
    styleDescription,
    suggestedMaterials
  };
}

/**
 * Genera una palette di colori complementari in base ai colori dominanti
 * e allo stile della stanza
 */
function generateComplementaryPalette(dominantColors, style) {
  // Estrai il colore principale (il primo colore dominante)
  const mainColor = dominantColors[0];
  
  // Converti HEX in RGB
  const r = parseInt(mainColor.slice(1, 3), 16);
  const g = parseInt(mainColor.slice(3, 5), 16);
  const b = parseInt(mainColor.slice(5, 7), 16);
  
  // Calcola la luminosità
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Base per colori complementari in base allo stile
  const complementaryOptions = {
    moderno: [
      // Contrasto e palette monocromatica
      shiftColor(mainColor, 0, 0, luminance > 0.5 ? -30 : 30),
      getComplementaryColor(mainColor),
      getAnalogousColor(mainColor, 30)
    ],
    scandinavo: [
      // Colori pastello e neutri
      "#FFFFFF",
      "#F5F5F5",
      shiftColor(mainColor, 0, -20, 20)
    ],
    industriale: [
      // Toni scuri e grigi
      "#333333",
      "#555555",
      "#8B4513" // Marrone
    ],
    rustico: [
      // Toni naturali e terrosi
      "#8B4513", // Marrone
      "#A0522D", // Sienna
      "#DEB887"  // Beige
    ],
    minimalista: [
      // Neutri e tocchi di colore
      "#FFFFFF",
      "#F0F0F0",
      shiftColor(mainColor, 0, -10, 10)
    ],
    bohemian: [
      // Colori vivaci e complementari
      getComplementaryColor(mainColor),
      getAnalogousColor(mainColor, 60),
      getAnalogousColor(mainColor, -60)
    ],
    classico: [
      // Elegante e raffinato
      "#DEB887", // Beige
      "#8B0000", // Bordeaux
      "#DAA520"  // Oro
    ]
  };
  
  return complementaryOptions[style] || complementaryOptions.moderno;
}

/**
 * Sposta un colore nello spazio RGB
 */
function shiftColor(hex, deltaH, deltaS, deltaL) {
  // Implementazione semplificata di shift colore
  // In una implementazione reale convertiremmo in HSL, modificheremmo, e riconvertiremmo
  
  // Per ora facciamo una semplice modifica RGB
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  
  const newR = Math.min(255, Math.max(0, r + deltaL));
  const newG = Math.min(255, Math.max(0, g + deltaL));
  const newB = Math.min(255, Math.max(0, b + deltaL));
  
  return rgbToHex(newR, newG, newB);
}

/**
 * Ottiene il colore complementare
 */
function getComplementaryColor(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  
  // Complementare semplice (inverso)
  return rgbToHex(255 - r, 255 - g, 255 - b);
}

/**
 * Ottiene un colore analogo
 */
function getAnalogousColor(hex, degrees) {
  // Implementazione semplificata
  // In una vera implementazione convertiremmo in HSL, ruoteremmo la tonalità, e riconvertiremmo
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  
  // Approssimazione di uno shift di tonalità
  if (degrees > 0) {
    return rgbToHex(g, b, r); // Shift approssimato
  } else {
    return rgbToHex(b, r, g); // Shift opposto
  }
}

/**
 * Genera una descrizione dello stile
 */
function generateStyleDescription(style) {
  const descriptions = {
    moderno: "La tua stanza ha uno stile moderno caratterizzato da linee pulite, forme semplici e un mix equilibrato di materiali. Un arredo contemporaneo con dettagli minimalisti si integrerà perfettamente.",
    scandinavo: "Il tuo ambiente mostra uno stile scandinavo luminoso e arioso, caratterizzato da colori neutri e materiali naturali. Un arredo dalle linee semplici e funzionali sarà perfetto.",
    industriale: "La tua stanza ha un'estetica industriale, con toni scuri e materiali grezzi. Un mobile con finiture metalliche, legno recuperato o cemento si integrerà perfettamente.",
    rustico: "Il tuo spazio ha un carattere rustico e accogliente, con toni caldi e materiali naturali. Un arredo in legno massello con finiture artigianali sarà la scelta ideale.",
    minimalista: "La tua stanza segue uno stile minimalista essenziale, con colori neutri e pochi elementi decorativi. Scegli un arredo dalle linee pulite con un design sobrio ed elegante.",
    bohemian: "Il tuo ambiente ha un'atmosfera bohémien vivace e creativa. Un mobile colorato con dettagli etnici o artigianali aggiungerà carattere al tuo spazio eclettico.",
    classico: "La tua stanza ha uno stile classico ed elegante, con toni caldi e materiali tradizionali. Un arredo con dettagli raffinati e linee armoniose sarà la scelta perfetta."
  };
  
  return descriptions[style] || descriptions.moderno;
}

/**
 * Ottiene suggerimenti di materiali in base allo stile
 */
function getMaterialSuggestions(style) {
  const materialsByStyle = {
    moderno: ['metallo cromato', 'vetro', 'legno laccato', 'pelle', 'materiali tecnici'],
    scandinavo: ['legno chiaro', 'lino', 'cotone', 'lana', 'feltro'],
    industriale: ['metallo grezzo', 'legno recuperato', 'cemento', 'pelle invecchiata', 'tela'],
    rustico: ['legno massello', 'pietra', 'terracotta', 'cotone pesante', 'iuta'],
    minimalista: ['legno chiaro', 'metallo satinato', 'vetro', 'tessuti monocromatici', 'cemento levigato'],
    bohemian: ['rattan', 'bambù', 'tessuti stampati', 'legno intagliato', 'ceramica dipinta'],
    classico: ['legno nobile', 'marmo', 'ottone', 'tessuti damascati', 'pelle']
  };
  
  return materialsByStyle[style] || materialsByStyle.moderno;
}

/**
 * Converte valori RGB in formato esadecimale
 */
function rgbToHex(r, g, b) {
  return '#' + ((1 << 24) + (Math.round(r) << 16) + (Math.round(g) << 8) + Math.round(b)).toString(16).slice(1).toUpperCase();
}