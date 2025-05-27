import { analyzeRoomStyle } from "./styleAnalysisService";

/**
 * Genera raccomandazioni basate su un'analisi reale dell'immagine della stanza
 * @param {HTMLImageElement} imageElement - Elemento immagine
 * @param {string} furnitureType - Tipo di arredo desiderato
 * @param {string} requirements - Requisiti dell'utente
 * @returns {Object} Raccomandazioni personalizzate
 */
export async function generateRecommendations(
  imageElement,
  furnitureType,
  requirements
) {
  try {
    // Analizza lo stile della stanza in base all'immagine caricata
    const styleAnalysis = await analyzeRoomStyle(imageElement);

    // Estrai informazioni chiave dall'analisi
    const { dominantColors, colorFeatures, styleData, complementaryPalette } =
      styleAnalysis;

    // Genera consigli specifici per il tipo di arredamento richiesto
    const furnitureSpecificAdvice = generateFurnitureSpecificAdvice(
      furnitureType,
      styleData.style,
      dominantColors,
      complementaryPalette,
      requirements
    );

    return {
      roomStyle: styleData.style,
      styleDescription: styleData.styleDescription,
      colorPalette: complementaryPalette,
      dominantRoomColors: dominantColors.slice(0, 3),
      suggestedMaterials: styleData.suggestedMaterials,
      keyFeatures: furnitureSpecificAdvice,
    };
  } catch (error) {
    console.error("Errore nella generazione delle raccomandazioni:", error);
    throw error;
  }
}

/**
 * Genera consigli specifici per il tipo di arredamento
 */
function generateFurnitureSpecificAdvice(
  furnitureType,
  style,
  dominantColors,
  complementaryPalette,
  requirements
) {
  // Normalizza il tipo di arredamento
  const normalizedType = furnitureType.toLowerCase();

  // Consigli di base in base al tipo di arredamento
  const baseAdvice = {
    divano: [
      `Un divano in tonalità ${getReadableColorName(
        complementaryPalette[0]
      )} si integrerà perfettamente con i colori dominanti della tua stanza`,
      `Per il tuo stile ${style}, cerca un divano con linee ${getStyleLines(
        style
      )} e dettagli ${getStyleDetails(style)}`,
      `I materiali consigliati includono ${getRecommendedMaterials(
        style,
        "divano"
      ).join(", ")}`,
    ],
    tavolo: [
      `Un tavolo in ${
        getRecommendedMaterials(style, "tavolo")[0]
      } con finiture ${getFinishByStyle(
        style
      )} si abbinerà perfettamente ai colori della tua stanza`,
      `Data la palette di colori, cerca un tavolo con tonalità che si armonizzino con ${getReadableColorName(
        dominantColors[0]
      )}`,
      `La forma ideale per il tuo spazio sarebbe ${getShapeByStyle(
        style,
        "tavolo"
      )}`,
    ],
    sedia: [
      `Scegli sedie con struttura in ${
        getRecommendedMaterials(style, "sedia")[0]
      } e ${
        getRecommendedMaterials(style, "sedia")[1]
      } per una perfetta integrazione`,
      `Le tonalità ideali per le tue sedie sono ${getReadableColorName(
        complementaryPalette[0]
      )} o ${getReadableColorName(complementaryPalette[1])}`,
      `Considerando lo stile ${style} della stanza, opta per sedie con uno schienale ${getShapeByStyle(
        style,
        "sedia"
      )}`,
    ],
    letto: [
      `Un letto con testiera in ${
        getRecommendedMaterials(style, "letto")[0]
      } e finiture ${getFinishByStyle(style)} valorizzerà il tuo spazio`,
      `I colori che si abbineranno meglio sono ${getReadableColorName(
        complementaryPalette[0]
      )} per la struttura e ${getReadableColorName(
        complementaryPalette[1]
      )} per la biancheria`,
      `Lo stile della testiera dovrebbe essere ${getHeadboardStyle(
        style
      )} per armonizzarsi con il resto della stanza`,
    ],
    armadio: [
      `Un armadio con ante in finitura ${getFinishByStyle(
        style
      )} e dettagli in ${
        getRecommendedMaterials(style, "armadio")[1]
      } sarà perfetto`,
      `Opta per tonalità ${getReadableColorName(
        complementaryPalette[0]
      )} che si integreranno con i colori esistenti`,
      `Data l'estetica ${style} della stanza, scegli un armadio con linee ${getStyleLines(
        style
      )} e maniglie ${getHandlesByStyle(style)}`,
    ],
    libreria: [
      `Una libreria in ${
        getRecommendedMaterials(style, "libreria")[0]
      } con dettagli in ${
        getRecommendedMaterials(style, "libreria")[1]
      } si abbinerà perfettamente`,
      `Considerando i colori della stanza, una finitura ${getFinishByStyle(
        style
      )} in tonalità ${getReadableColorName(
        complementaryPalette[2]
      )} creerà un contrasto armonioso`,
      `Scegli una struttura ${getStyleLines(style)} con scaffali ${
        style === "industriale" ? "regolabili" : "fissi"
      } per un look coerente`,
    ],
    "mobile-tv": [
      `Un mobile TV basso in ${
        getRecommendedMaterials(style, "mobile-tv")[0]
      } con elementi in ${
        getRecommendedMaterials(style, "mobile-tv")[1]
      } si integrerà con il tuo arredamento`,
      `Opta per una finitura ${getFinishByStyle(
        style
      )} in tonalità ${getReadableColorName(complementaryPalette[0])}`,
      `Per lo stile ${style}, scegli un design ${getStyleLines(
        style
      )} con vani ${
        style === "moderno" || style === "minimalista"
          ? "a giorno e chiusi"
          : "principalmente chiusi"
      }`,
    ],
    lampada: [
      `Una lampada con struttura in ${
        getRecommendedMaterials(style, "lampada")[0]
      } e paralume in ${
        getRecommendedMaterials(style, "lampada")[1]
      } sarà perfetta`,
      `Considerando i colori della stanza, scegli tonalità ${getReadableColorName(
        complementaryPalette[1]
      )} o ${getReadableColorName(complementaryPalette[2])}`,
      `Il design dovrebbe essere ${getLampStyle(
        style
      )} per completare l'estetica ${style} del tuo ambiente`,
    ],
  };

  // Trova il tipo di arredo corretto o usa un default
  let adviceList = [];

  for (const key in baseAdvice) {
    if (normalizedType.includes(key)) {
      adviceList = baseAdvice[key];
      break;
    }
  }

  // Se non troviamo consigli specifici, usa consigli generici
  if (adviceList.length === 0) {
    adviceList = [
      `Scegli un ${furnitureType} in linea con lo stile ${style} della tua stanza, con tonalità che si abbinino a ${getReadableColorName(
        dominantColors[0]
      )}`,
      `I materiali consigliati includono ${getRecommendedMaterials(
        style,
        "generico"
      ).join(", ")}`,
      `Opta per linee ${getStyleLines(style)} e finiture ${getFinishByStyle(
        style
      )} per una perfetta integrazione`,
    ];
  }

  // Aggiungi un consiglio personalizzato in base ai requisiti dell'utente
  if (requirements && requirements.trim()) {
    const requirementWords = requirements.toLowerCase().split(" ");

    // Controlla parole chiave nei requisiti
    if (
      requirementWords.some((word) =>
        ["design", "moderno", "contemporaneo"].includes(word)
      )
    ) {
      adviceList.push(
        `Per soddisfare la tua richiesta di un design moderno, privilegia linee pulite e materiali contemporanei`
      );
    } else if (
      requirementWords.some((word) =>
        ["classico", "tradizionale", "elegante"].includes(word)
      )
    ) {
      adviceList.push(
        `Per ottenere l'eleganza classica che desideri, cerca dettagli raffinati e materiali di qualità`
      );
    } else if (
      requirementWords.some((word) =>
        ["piccolo", "compatto", "spazio"].includes(word)
      )
    ) {
      adviceList.push(
        `Per ottimizzare lo spazio come richiesto, considera un ${furnitureType} multifunzionale o dalle dimensioni contenute`
      );
    } else {
      adviceList.push(
        `Considerando le tue richieste specifiche, cerca un ${furnitureType} che bilanci estetica e funzionalità nel rispetto dello stile della stanza`
      );
    }
  }

  return adviceList;
}

/**
 * Ottiene un nome leggibile per un colore HEX
 */
function getReadableColorName(hex) {
  // Converti HEX in RGB
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  // Calcola la luminosità
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Controlla se è bianco/nero/grigio
  if (Math.abs(r - g) < 20 && Math.abs(g - b) < 20 && Math.abs(r - b) < 20) {
    if (luminance < 0.15) return "nero";
    if (luminance < 0.5) return "grigio scuro";
    if (luminance < 0.75) return "grigio";
    return "bianco";
  }

  // Identifica il colore dominante
  if (r > g && r > b) {
    if (g > 0.7 * r) return luminance < 0.5 ? "marrone" : "arancione";
    return luminance < 0.5 ? "bordeaux" : "rosso";
  } else if (g > r && g > b) {
    if (r > 0.7 * g && b > 0.7 * g) return "oliva";
    return luminance < 0.5 ? "verde scuro" : "verde";
  } else {
    if (r > 0.7 * b) return "viola";
    return luminance < 0.5 ? "blu scuro" : "blu";
  }
}

/**
 * Restituisce le linee stilistiche in base allo stile
 */
function getStyleLines(style) {
  switch (style) {
    case "moderno":
      return "pulite e minimali";
    case "scandinavo":
      return "semplici e funzionali";
    case "industriale":
      return "robuste e funzionali";
    case "rustico":
      return "naturali e organiche";
    case "minimalista":
      return "essenziali e geometriche";
    case "bohemian":
      return "sinuose e creative";
    case "classico":
      return "eleganti e proporzionate";
    default:
      return "armoniose";
  }
}

/**
 * Restituisce i dettagli stilistici in base allo stile
 */
function getStyleDetails(style) {
  switch (style) {
    case "moderno":
      return "minimalisti";
    case "scandinavo":
      return "discreti e funzionali";
    case "industriale":
      return "a vista e tecnici";
    case "rustico":
      return "artigianali e texturizzati";
    case "minimalista":
      return "quasi assenti";
    case "bohemian":
      return "elaborati e decorativi";
    case "classico":
      return "raffinati e ben proporzionati";
    default:
      return "equilibrati";
  }
}

/**
 * Restituisce la finitura consigliata in base allo stile
 */
function getFinishByStyle(style) {
  switch (style) {
    case "moderno":
      return "lucide o opache uniformi";
    case "scandinavo":
      return "naturali opache";
    case "industriale":
      return "grezze o leggermente usurate";
    case "rustico":
      return "naturali con venature a vista";
    case "minimalista":
      return "opache uniformi";
    case "bohemian":
      return "lavorate a mano o vintage";
    case "classico":
      return "lucide e raffinate";
    default:
      return "neutre";
  }
}

/**
 * Restituisce la forma consigliata in base allo stile
 */
function getShapeByStyle(style, item) {
  if (item === "tavolo") {
    switch (style) {
      case "moderno":
        return "rettangolare con bordi sottili";
      case "scandinavo":
        return "rotonda con gambe affusolate";
      case "industriale":
        return "rettangolare con base in metallo";
      case "rustico":
        return "rettangolare con legno massello";
      case "minimalista":
        return "essenziale, quadrata o rotonda";
      case "bohemian":
        return "organica con dettagli unici";
      case "classico":
        return "ovale o rettangolare con dettagli eleganti";
      default:
        return "versatile e funzionale";
    }
  } else if (item === "sedia") {
    switch (style) {
      case "moderno":
        return "lineare ed ergonomico";
      case "scandinavo":
        return "avvolgente e compatto";
      case "industriale":
        return "essenziale e funzionale";
      case "rustico":
        return "accogliente con doghe in legno";
      case "minimalista":
        return "basso e discreto";
      case "bohemian":
        return "elaborato e decorativo";
      case "classico":
        return "alto e ben proporzionato";
      default:
        return "comodo e pratico";
    }
  }

  return "armonioso e funzionale";
}

/**
 * Restituisce lo stile della testiera in base allo stile
 */
function getHeadboardStyle(style) {
  switch (style) {
    case "moderno":
      return "minimale e lineare";
    case "scandinavo":
      return "semplice in legno chiaro";
    case "industriale":
      return "metallica o in legno recuperato";
    case "rustico":
      return "in legno massello con venature naturali";
    case "minimalista":
      return "bassa e geometrica";
    case "bohemian":
      return "decorativa, possibilmente in rattan o intagliata";
    case "classico":
      return "imbottita con capitonné o eleganti modanature";
    default:
      return "proporzionata e funzionale";
  }
}

/**
 * Restituisce lo stile delle maniglie in base allo stile
 */
function getHandlesByStyle(style) {
  switch (style) {
    case "moderno":
      return "sottili e minimali o a gola";
    case "scandinavo":
      return "discrete in legno o assenti con sistema push-pull";
    case "industriale":
      return "in metallo anticato o tipo factory";
    case "rustico":
      return "in ferro battuto o legno naturale";
    case "minimalista":
      return "quasi invisibili o assenti";
    case "bohemian":
      return "decorative, possibilmente in ceramica o metalli lavorati";
    case "classico":
      return "elaborate in ottone o finiture pregiate";
    default:
      return "funzionali e comode";
  }
}

/**
 * Restituisce lo stile della lampada in base allo stile
 */
function getLampStyle(style) {
  switch (style) {
    case "moderno":
      return "geometrico e minimalista";
    case "scandinavo":
      return "semplice con materiali naturali";
    case "industriale":
      return "tecnico con metalli a vista";
    case "rustico":
      return "artigianale con materiali naturali";
    case "minimalista":
      return "essenziale con forme pure";
    case "bohemian":
      return "creativo con tessuti colorati o materiali intrecciati";
    case "classico":
      return "elegante con base scolpita e paralume in tessuto";
    default:
      return "equilibrato tra forma e funzione";
  }
}

/**
 * Restituisce materiali consigliati in base allo stile e al tipo di arredamento
 */
function getRecommendedMaterials(style, itemType) {
  const materialMap = {
    moderno: {
      divano: ["tessuto tecnico", "pelle", "microfibra", "metallo cromato"],
      tavolo: ["vetro", "legno laccato", "ceramica", "metallo"],
      sedia: ["plastica design", "metallo", "tessuto tecnico", "legno curvato"],
      letto: ["tessuto", "pelle", "legno laccato", "metallo"],
      armadio: ["legno laccato", "vetro", "metallo", "specchio"],
      libreria: ["legno laccato", "metallo", "vetro temperato"],
      "mobile-tv": ["legno laccato", "vetro", "metallo"],
      lampada: ["metallo", "vetro", "plastica design"],
      generico: ["legno laccato", "metallo", "vetro", "tessuti tecnici"],
    },
    scandinavo: {
      divano: ["tessuto naturale", "lana", "legno chiaro", "cotone"],
      tavolo: ["legno chiaro", "laminato bianco", "compensato", "linoleum"],
      sedia: [
        "legno chiaro",
        "tessuto naturale",
        "cuoio",
        "compensato curvato",
      ],
      letto: ["legno chiaro", "tessuto naturale", "lino", "cotone"],
      armadio: [
        "legno chiaro",
        "laccato bianco",
        "laminato",
        "maniglie in legno",
      ],
      libreria: ["legno chiaro", "laccato bianco", "compensato"],
      "mobile-tv": ["legno chiaro", "laccato bianco", "laminato"],
      lampada: ["legno chiaro", "metallo bianco", "carta", "tessuto naturale"],
      generico: [
        "legno chiaro",
        "tessuti naturali",
        "lino",
        "feltro",
        "ceramica",
      ],
    },
    industriale: {
      divano: ["pelle invecchiata", "canvas", "velluto resistente", "metallo"],
      tavolo: ["legno recuperato", "metallo", "acciaio", "cemento"],
      sedia: [
        "metallo",
        "legno recuperato",
        "pelle invecchiata",
        "tela grezza",
      ],
      letto: ["metallo", "legno recuperato", "pelle invecchiata"],
      armadio: ["metallo", "legno recuperato", "vetro industriale", "acciaio"],
      libreria: ["metallo", "tubi idraulici", "legno recuperato"],
      "mobile-tv": ["metallo", "legno recuperato", "cemento"],
      lampada: ["metallo", "ottone invecchiato", "vetro industriale"],
      generico: ["metallo", "legno recuperato", "cemento", "vetro industriale"],
    },
    rustico: {
      divano: ["tessuto pesante", "cotone", "lino", "pelle naturale"],
      tavolo: ["legno massello", "ceramica", "pietra", "ferro battuto"],
      sedia: ["legno massello", "paglia intrecciata", "tessuto naturale"],
      letto: ["legno massello", "ferro battuto", "tessuto naturale"],
      armadio: ["legno massello", "legno anticato", "ferro battuto"],
      libreria: ["legno massello", "ferro battuto"],
      "mobile-tv": ["legno massello", "ceramica", "ferro battuto"],
      lampada: ["ceramica", "legno", "ferro battuto", "tessuto naturale"],
      generico: ["legno massello", "pietra", "terracotta", "ferro battuto"],
    },
    minimalista: {
      divano: ["tessuto monocolore", "pelle", "microfibra", "legno"],
      tavolo: ["legno chiaro", "vetro", "cemento levigato", "metallo"],
      sedia: ["legno", "metallo", "tessuto monocolore", "plastica design"],
      letto: ["legno", "tessuto monocolore", "pelle"],
      armadio: ["legno", "laccato opaco", "vetro satinato"],
      libreria: ["legno", "metallo", "laccato opaco"],
      "mobile-tv": ["legno", "laccato opaco", "vetro satinato"],
      lampada: ["metallo", "vetro opalino", "ceramica"],
      generico: ["legno", "vetro", "metallo", "cemento levigato"],
    },
    bohemian: {
      divano: ["velluto", "tessuti colorati", "cotone stampato", "patchwork"],
      tavolo: ["legno intagliato", "rattan", "bambù", "ottone"],
      sedia: ["legno intagliato", "rattan", "velluto", "tessuti colorati"],
      letto: ["legno intagliato", "rattan", "tessuti stampati", "velluto"],
      armadio: ["legno anticato", "legno dipinto", "bambù", "rattan"],
      libreria: ["legno intagliato", "bambù", "rattan"],
      "mobile-tv": ["legno intagliato", "rattan", "legno anticato"],
      lampada: [
        "ottone",
        "ceramica dipinta",
        "vetro colorato",
        "tessuti stampati",
      ],
      generico: ["rattan", "legno intagliato", "tessuti colorati", "ceramica"],
    },
    classico: {
      divano: ["velluto", "damascato", "pelle", "tessuti pregiati"],
      tavolo: ["legno nobile", "marmo", "vetro", "ottone"],
      sedia: ["legno nobile", "tessuti pregiati", "velluto", "pelle"],
      letto: ["legno nobile", "tessuti pregiati", "velluto", "pelle"],
      armadio: ["legno nobile", "legno intarsiato", "specchi molati"],
      libreria: ["legno nobile", "vetro", "ottone"],
      "mobile-tv": ["legno nobile", "marmo", "ottone"],
      lampada: ["ottone", "cristallo", "ceramica", "seta"],
      generico: ["legno nobile", "marmo", "ottone", "tessuti pregiati"],
    },
  };

  return materialMap[style] && materialMap[style][itemType]
    ? materialMap[style][itemType]
    : materialMap.moderno.generico;
}

/**
 * Trova il prodotto ideale in base alle caratteristiche
 * @param {Array} products - Lista di prodotti disponibili
 * @param {Object} styleAnalysis - Analisi dello stile
 * @param {string} furnitureType - Tipo di arredamento
 * @returns {Array} Prodotti ordinati per compatibilità
 */
export const findMatchingProducts = (
  products,
  styleAnalysis,
  furnitureType,
  userRequirements = ""
) => {
  console.log("Analisi della stanza:", styleAnalysis);
  console.log("Requisiti utente:", userRequirements);

  // Estrai parametri importanti dai requisiti utente
  const userColorRequests = extractColorRequests(userRequirements);
  const userMaterialRequests = extractMaterialRequests(userRequirements);

  console.log("Colori richiesti dall'utente:", userColorRequests);
  console.log("Materiali richiesti dall'utente:", userMaterialRequests);

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

      // Se l'utente ha specificato colori espliciti, filtra drasticamente
      if (userColorRequests.length > 0) {
        const productText =
          `${product.name} ${product.description} ${product.color}`.toLowerCase();
        const hasRequestedColor = userColorRequests.some((color) =>
          productText.includes(color.toLowerCase())
        );
        if (!hasRequestedColor) return false;
      }

      // Se l'utente ha specificato materiali espliciti, filtra drasticamente
      if (userMaterialRequests.length > 0) {
        const productText =
          `${product.name} ${product.description} ${product.material}`.toLowerCase();
        const hasRequestedMaterial = userMaterialRequests.some((material) =>
          productText.includes(material.toLowerCase())
        );
        if (!hasRequestedMaterial) return false;
      }

      return true;
    })
    .map((product) => {
      // Calcolo punteggio solo sui prodotti già pre-filtrati
      let score = 40;
      // ... resto della logica esistente
      return { ...product, compatibilityScore: score };
    })
    .sort((a, b) => b.compatibilityScore - a.compatibilityScore);
};

// Funzioni helper migliorate
function extractColorRequests(text) {
  if (!text) return [];

  const colors = [
    "nero",
    "nera",
    "nere",
    "neri",
    "bianco",
    "bianca",
    "bianchi",
    "bianche",
    "rosso",
    "rossa",
    "rossi",
    "rosse",
    "blu",
    "azzurro",
    "azzurri",
    "azzurre",
    "verde",
    "verdi",
    "giallo",
    "gialla",
    "gialli",
    "gialle",
    "grigio",
    "grigia",
    "grigi",
    "grigie",
    "marrone",
    "marroni",
    "viola",
    "viola",
    "arancione",
    "arancioni",
  ];

  const lowerText = text.toLowerCase();
  return colors.filter((color) => {
    const regex = new RegExp(`\\b${color}\\b`, "i");
    return regex.test(lowerText);
  });
}

function extractMaterialRequests(text) {
  if (!text) return [];

  const materials = [
    "legno",
    "vetro",
    "metallo",
    "plastica",
    "acciaio",
    "ferro",
    "alluminio",
    "pelle",
    "tessuto",
    "stoffa",
    "marmo",
    "laminato",
    "melaminico",
  ];

  const lowerText = text.toLowerCase();
  return materials.filter((material) => {
    const regex = new RegExp(`\\b${material}\\b`, "i");
    return regex.test(lowerText);
  });
}

// Miglioramento della funzione getApproximateColorName per essere più accurata
function getApproximateColorName(hexColor) {
  // Evita errori con valori nulli
  if (!hexColor || hexColor.length < 7) return "neutro";

  // Converti hex in RGB
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);

  // Calcola la luminosità
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Algoritmo migliorato per il riconoscimento dei colori
  // Nero
  if (r < 30 && g < 30 && b < 30) return "nero";

  // Bianco
  if (r > 220 && g > 220 && b > 220) return "bianco";

  // Grigi
  if (Math.abs(r - g) < 20 && Math.abs(g - b) < 20 && Math.abs(r - b) < 20) {
    if (luminance < 0.25) return "grigio scuro";
    if (luminance < 0.6) return "grigio";
    return "grigio chiaro";
  }

  // Rossi
  if (r > 1.5 * g && r > 1.5 * b) {
    if (g > 125 && b < 100) return "arancione";
    if (luminance < 0.3) return "bordeaux";
    return "rosso";
  }

  // Verdi
  if (g > 1.4 * r && g > 1.4 * b) {
    if (r > 130) return "lime";
    if (luminance < 0.3) return "verde scuro";
    return "verde";
  }

  // Blu
  if (b > 1.4 * r && b > g) {
    if (g > 1.4 * r) return "ciano";
    if (luminance < 0.3) return "blu scuro";
    return "blu";
  }

  // Gialli
  if (r > 180 && g > 180 && b < 100) {
    if (r > 220 && g > 220) return "giallo";
    return "ocra";
  }

  // Marroni
  if (r > g && g > b && r > 60 && r < 200 && g < 150 && b < 100) {
    return "marrone";
  }

  // Rosa
  if (r > 180 && g < 150 && b > 150) {
    return "rosa";
  }

  // Viola
  if (r > 100 && b > 130 && b > g && r > g) {
    return "viola";
  }

  // Beige
  if (r > 190 && g > 170 && b > 130 && b < g) {
    return "beige";
  }

  return "neutro";
}

/**
 * Genera una spiegazione personalizzata per un prodotto consigliato
 */
export function generateProductReason(product, styleAnalysis, furnitureType) {
  const { roomStyle, complementaryPalette, suggestedMaterials } = styleAnalysis;

  // Controllo di compatibilità per colori, materiali e stile
  let colorMatch = false;
  let materialMatch = false;
  let styleMatch = false;

  if (product.color && complementaryPalette) {
    complementaryPalette.forEach((color) => {
      const colorName = getReadableColorName(color);
      if (product.color.toLowerCase().includes(colorName.toLowerCase())) {
        colorMatch = true;
      }
    });
  }

  if (product.material && suggestedMaterials) {
    suggestedMaterials.forEach((material) => {
      if (product.material.toLowerCase().includes(material.toLowerCase())) {
        materialMatch = true;
      }
    });
  }

  if (product.style && roomStyle) {
    if (product.style.toLowerCase().includes(roomStyle.toLowerCase())) {
      styleMatch = true;
    }
  }

  // Genera una motivazione personalizzata
  if (styleMatch && colorMatch && materialMatch) {
    return `Questo ${furnitureType} è perfetto per la tua stanza! Il colore ${product.color} si abbina perfettamente, il materiale in ${product.material} è ideale per lo stile ${roomStyle} e il design completa perfettamente il tuo arredamento.`;
  } else if (colorMatch && materialMatch) {
    return `Questo ${furnitureType} ha il colore ${product.color} che si abbina perfettamente alla tua stanza e il materiale in ${product.material} è consigliato per completare il tuo arredamento.`;
  } else if (styleMatch && colorMatch) {
    return `Il design di questo ${furnitureType} si integra perfettamente con lo stile ${roomStyle} della tua stanza e il colore ${product.color} si abbina splendidamente alla tua palette esistente.`;
  } else if (styleMatch && materialMatch) {
    return `Questo ${furnitureType} in ${product.material} è perfetto per lo stile ${roomStyle} della tua stanza e il suo design si integra armoniosamente con gli altri elementi.`;
  } else if (colorMatch) {
    return `Il colore ${product.color} di questo ${furnitureType} si abbina perfettamente alla palette della tua stanza creando un insieme armonioso.`;
  } else if (materialMatch) {
    return `Il materiale in ${product.material} di questo ${furnitureType} è ideale per completare l'arredamento della tua stanza nello stile ${roomStyle}.`;
  } else if (styleMatch) {
    return `Il design di questo ${furnitureType} è perfettamente in linea con lo stile ${roomStyle} della tua stanza per un risultato elegante e coerente.`;
  } else {
    return `Questo ${furnitureType} offre un buon equilibrio di stile e funzionalità e può integrarsi bene nel tuo ambiente attuale.`;
  }
}
