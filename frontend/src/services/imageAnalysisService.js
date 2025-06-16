import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
// import ml5 from 'ml5'; // Temporaneamente disabilitato per il deploy

let mobileNetModel = null;
let cocoModel = null;
// let colorExtractor = null; // Temporaneamente disabilitato

/**
 * Carica i modelli necessari per l'analisi
 */
export const loadModels = async () => {
  try {
    // Carica il modello MobileNet per la classificazione generale
    if (!mobileNetModel) {
      mobileNetModel = await mobilenet.load();
    }
    
    // Carica il modello COCO-SSD per il rilevamento degli oggetti
    if (!cocoModel) {
      cocoModel = await cocoSsd.load();
    }
    
    // Inizializza l'estrattore di colori con ML5 - TEMPORANEAMENTE DISABILITATO
    // if (!colorExtractor) {
    //   colorExtractor = ml5.extractColor;
    // }
    
    return true;
  } catch (error) {
    console.error('Errore nel caricamento dei modelli:', error);
    return false;
  }
};

/**
 * Analizza un'immagine per estrarre informazioni rilevanti
 */
export const analyzeImage = async (imageElement) => {
  try {
    // Assicurati che i modelli siano caricati
    await loadModels();
    
    // Analizza l'immagine con MobileNet per la classificazione generale
    const classifications = await mobileNetModel.classify(imageElement);
    
    // Rileva oggetti con COCO-SSD
    const objects = await cocoModel.detect(imageElement);
      // Estrai i colori dominanti - TEMPORANEAMENTE DISABILITATO
    // const colors = await new Promise((resolve) => {
    //   colorExtractor(imageElement, 5, (colors) => {
    //     resolve(colors);
    //   });
    // });
    
    // Colori di fallback temporanei
    const colors = [
      { r: 150, g: 150, b: 150 },
      { r: 100, g: 100, b: 100 }
    ];
    
    // Elabora i risultati per estrapolare lo stile della stanza
    const roomStyle = determineRoomStyle(classifications, objects);
    
    // Determina la palette di colori consigliata
    const colorPalette = determineColorPalette(colors);
    
    return {
      classifications: classifications.map(c => ({ label: c.className, confidence: c.probability })),
      detectedObjects: objects.map(obj => ({ name: obj.class, confidence: obj.score })),
      dominantColors: colors,
      roomStyle,
      colorPalette
    };
  } catch (error) {
    console.error('Errore durante l\'analisi dell\'immagine:', error);
    throw new Error('Errore durante l\'analisi dell\'immagine');
  }
};

/**
 * Determina lo stile della stanza in base alle classificazioni
 */
function determineRoomStyle(classifications, objects) {
  // Lista di stili comuni
  const styles = {
    modern: ['contemporary', 'modern', 'minimalist', 'sleek', 'urban'],
    rustic: ['rustic', 'country', 'vintage', 'wood', 'cottage'],
    industrial: ['industrial', 'warehouse', 'metal', 'loft', 'factory'],
    scandinavian: ['scandinavian', 'nordic', 'minimal', 'white', 'light'],
    bohemian: ['bohemian', 'boho', 'ethnic', 'colorful', 'eclectic'],
    classic: ['classic', 'traditional', 'elegant', 'antique', 'victorian']
  };
  
  // Punteggio per ogni stile
  const styleScores = {
    modern: 0,
    rustic: 0,
    industrial: 0,
    scandinavian: 0,
    bohemian: 0,
    classic: 0
  };
  
  // Analizza le classificazioni
  classifications.forEach(item => {
    const label = item.className.toLowerCase();
    const confidence = item.probability;
    
    Object.keys(styles).forEach(style => {
      if (styles[style].some(keyword => label.includes(keyword))) {
        styleScores[style] += confidence;
      }
    });
  });
  
  // Analizza gli oggetti rilevati
  objects.forEach(obj => {
    const label = obj.class.toLowerCase();
    
    // Oggetti che suggeriscono stili specifici
    if (['wood', 'wooden'].some(k => label.includes(k))) styleScores.rustic += 0.2;
    if (['metal', 'steel'].some(k => label.includes(k))) styleScores.industrial += 0.2;
    if (['plant', 'carpet', 'rug'].some(k => label.includes(k))) styleScores.bohemian += 0.2;
    if (['white', 'lamp', 'clean'].some(k => label.includes(k))) styleScores.scandinavian += 0.2;
    if (['sofa', 'minimalist', 'tv'].some(k => label.includes(k))) styleScores.modern += 0.2;
    if (['vase', 'painting', 'antique'].some(k => label.includes(k))) styleScores.classic += 0.2;
  });
  
  // Trova lo stile con il punteggio più alto
  let dominantStyle = 'modern'; // default
  let highestScore = 0;
  
  Object.keys(styleScores).forEach(style => {
    if (styleScores[style] > highestScore) {
      highestScore = styleScores[style];
      dominantStyle = style;
    }
  });
  
  return dominantStyle;
}

/**
 * Determina una palette di colori consigliata in base ai colori dominanti
 */
function determineColorPalette(dominantColors) {
  // Converte i colori dominanti in un formato utilizzabile
  const palette = dominantColors.map(color => {
    // Se il colore è già in formato esadecimale
    if (typeof color === 'string' && color.startsWith('#')) {
      return color;
    }
    
    // Se il colore è un oggetto con valori RGB
    if (color.r !== undefined && color.g !== undefined && color.b !== undefined) {
      return rgbToHex(color.r, color.g, color.b);
    }
    
    // Se il colore è in un altro formato
    return '#CCCCCC'; // grigio di default
  });
  
  return palette;
}

/**
 * Converte valori RGB in formato esadecimale
 */
function rgbToHex(r, g, b) {
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
}

/**
 * Genera raccomandazioni in base all'analisi dell'immagine
 */
export const generateRecommendations = (analysis, furnitureType, requirements) => {
  // Estrai informazioni dall'analisi
  const { roomStyle, colorPalette, detectedObjects } = analysis;
  
  // Genera consigli in base allo stile della stanza
  let styleAdvice = '';
  let recommendedMaterials = [];
  let recommendedColors = [];
  
  switch (roomStyle) {
    case 'modern':
      styleAdvice = 'Lo stile moderno della tua stanza si abbina bene con linee pulite e design minimalista.';
      recommendedMaterials = ['metallo', 'vetro', 'legno laccato'];
      recommendedColors = ['bianco', 'nero', 'grigio', 'accenti vivaci'];
      break;
    case 'rustic':
      styleAdvice = 'L\'atmosfera rustica della tua stanza richiede materiali naturali e toni caldi.';
      recommendedMaterials = ['legno massello', 'pietra', 'tessuti naturali'];
      recommendedColors = ['marrone', 'beige', 'verde oliva', 'terracotta'];
      break;
    case 'industrial':
      styleAdvice = 'Lo stile industrial della tua stanza si abbina bene con materiali grezzi e forme funzionali.';
      recommendedMaterials = ['metallo grezzo', 'legno invecchiato', 'cemento'];
      recommendedColors = ['grigio', 'nero', 'marrone scuro', 'ruggine'];
      break;
    case 'scandinavian':
      styleAdvice = 'Lo stile nordico della tua stanza richiede semplicità, funzionalità e luminosità.';
      recommendedMaterials = ['legno chiaro', 'tessuti morbidi', 'materiali naturali'];
      recommendedColors = ['bianco', 'grigio chiaro', 'beige', 'pastello'];
      break;
    case 'bohemian':
      styleAdvice = 'Lo stile bohémien della tua stanza permette colori vibranti e texture ricche.';
      recommendedMaterials = ['rattan', 'tessuti etnici', 'legno', 'macramè'];
      recommendedColors = ['toni caldi', 'mix di pattern', 'terracotta', 'verde'];
      break;
    case 'classic':
      styleAdvice = 'Lo stile classico della tua stanza si abbina bene con dettagli eleganti e materiali di qualità.';
      recommendedMaterials = ['legno nobile', 'marmo', 'tessuti pregiati'];
      recommendedColors = ['blu scuro', 'bordeaux', 'oro', 'avorio'];
      break;
    default:
      styleAdvice = 'La tua stanza ha uno stile versatile che si presta a diverse opzioni di arredo.';
      recommendedMaterials = ['legno', 'tessuto', 'metallo'];
      recommendedColors = ['neutri', 'toni naturali'];
  }
  
  // Personalizza i consigli in base al tipo di arredamento
  let specificAdvice = '';
  switch (furnitureType) {
    case 'divano':
      specificAdvice = `Per un ${furnitureType} perfetto in questa stanza, cerca un modello che si integri con ${styleAdvice.toLowerCase()} Materiali consigliati: ${recommendedMaterials.join(', ')}.`;
      break;
    case 'tavolo':
      specificAdvice = `Un ${furnitureType} ideale per questa stanza dovrebbe rispecchiare ${styleAdvice.toLowerCase()} Punta su materiali come ${recommendedMaterials.slice(0, 2).join(' o ')}.`;
      break;
    // Aggiungi altri casi per altri tipi di arredamento
    default:
      specificAdvice = `Per scegliere un ${furnitureType} in armonia con questa stanza, considera ${styleAdvice.toLowerCase()} Materiali consigliati: ${recommendedMaterials.join(', ')}.`;
  }
  
  // Genera una interpretazione strutturata
  const interpretation = {
    roomStyle: roomStyle,
    styleDescription: styleAdvice,
    colorPalette: colorPalette.slice(0, 3), // Prendi solo i primi 3 colori
    suggestedMaterials: recommendedMaterials,
    keyFeatures: [
      specificAdvice,
      `I colori consigliati sono: ${recommendedColors.join(', ')}`,
      `Cerca un design che complementi gli oggetti esistenti nella stanza`,
    ]
  };
  
  return interpretation;
};