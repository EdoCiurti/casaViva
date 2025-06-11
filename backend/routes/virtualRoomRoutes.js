const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Product = require("../models/Product");
const router = express.Router();

// Configura multer per l'upload delle immagini
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../uploads");
    // Crea la directory se non esiste
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, `room_${Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limite di 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error("Solo file immagine sono supportati (JPEG, JPG, PNG)"));
    }
  },
});

// Endpoint per generare raccomandazioni basate sulla stanza caricata
router.post("/recommend", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Nessuna immagine caricata" });
    }

    const furnitureType = req.body.furnitureType;
    const requirements = req.body.requirements;
    const detectedColors = req.body.detectedColors ? JSON.parse(req.body.detectedColors) : [];

    if (!furnitureType || !requirements) {
      return res.status(400).json({ error: "Parametri mancanti" });
    }

    console.log("Colori rilevati ricevuti:", detectedColors);

    // Percorso dell'immagine caricata
    const imagePath = req.file.path;
    const imageUrl = `http://localhost:5000/uploads/${path.basename(
      imagePath
    )}`;

    // Mappa il tipo di arredamento alla categoria nel database
    let categoryQuery = mapFurnitureTypeToCategory(furnitureType);

    // Recupera i prodotti dalla categoria richiesta
    const allProducts = await Product.find({
      category: { $regex: categoryQuery, $options: "i" },
    }).limit(20); // Aumentato il limite per avere più opzioni

    if (allProducts.length === 0) {
      return res
        .status(404)
        .json({ error: "Nessun prodotto trovato per questa categoria" });
    }    // Importa il servizio di raccomandazione
    const { findMatchingProducts, generateProductReason } = require("../services/furnitureRecommendationService");// Filtra e ordina i prodotti basandosi sui colori rilevati
    const matchingProducts = findMatchingProducts(
      allProducts,
      detectedColors,
      furnitureType,
      requirements
    );

    console.log(`Dopo il filtro colori: ${matchingProducts.length} prodotti compatibili`);

    // Se non ci sono prodotti che corrispondono ai colori della palette
    if (matchingProducts.length === 0) {
      return res.json({
        imageUrl,
        products: [],
        message: "Nessun prodotto disponibile che corrisponde ai colori rilevati nella tua stanza."
      });
    }

    // Invia al client l'URL dell'immagine e i prodotti filtrati e ordinati
    res.json({
      imageUrl,      products: matchingProducts.map((product) => ({
        productId: product._id,
        productName: product.name,
        productImage: product.images[0],
        price: product.price,
        description: product.description || "",
        compatibilityScore: product.compatibilityScore || 0,
        reason: generateProductReason(product, detectedColors, furnitureType)
      })),
    });
  } catch (error) {
    console.error("Errore durante l'elaborazione dell'immagine:", error);
    res
      .status(500)
      .json({ error: "Errore durante l'elaborazione dell'immagine" });
  }
});

// Nella route per l'analisi dell'immagine
router.post("/analyze", upload.single("image"), async (req, res) => {
  try {
    const imageFile = req.file;
    const { furnitureType, requirements } = req.body;

    console.log(
      `Richiesta analisi: tipo=${furnitureType}, requisiti=${requirements}`
    );

    if (!imageFile) {
      return res.status(400).json({ error: "Nessuna immagine caricata" });
    }

    // Analisi dell'immagine e genera suggerimenti
    const imageAnalysis = await analyzeImage(imageFile.path);

    // Trova prodotti corrispondenti considerando sia i colori della stanza che i requisiti utente
    const categoryQuery = mapFurnitureTypeToCategory(furnitureType);

    // Trova tutti i prodotti nella categoria
    const products = await Product.find({
      category: { $regex: categoryQuery, $options: "i" },
    }).limit(20);

    // Ordina i prodotti in base alla corrispondenza con l'analisi e i requisiti utente
    const matchedProducts = findMatchingProducts(
      products,
      imageAnalysis,
      furnitureType,
      requirements
    );

    // Prendi i primi 4 prodotti più rilevanti
    const topRecommendations = matchedProducts.slice(0, 4).map((product) => {
      return {
        productId: product._id,
        productName: product.name,
        productImage: product.images[0],
        price: product.price,
        reason: generateProductReason(product, imageAnalysis, furnitureType),
      };
    });

    // Aggiungi questi log nel backend per verificare l'analisi
    console.log(
      "Colori rilevati nella stanza:",
      imageAnalysis.colorPalette.map(getApproximateColorName)
    );
    console.log("Requisiti utente:", requirements);
    console.log(
      "Top prodotti trovati:",
      topRecommendations.map(
        (p) => `${p.productName} (score: ${p.compatibilityScore})`
      )
    );

    res.json({
      recommendations: topRecommendations,
      roomAnalysis: imageAnalysis,
    });
  } catch (error) {
    console.error("Errore nell'analisi dell'immagine:", error);
    res.status(500).json({ error: "Errore durante l'analisi" });
  }
});

// Aggiungi una rotta per servire le immagini caricate
router.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Funzione helper per mappare tipi di arredo a categorie
function mapFurnitureTypeToCategory(furnitureType) {
  const mapping = {
    divano: "divani-letto",
    tavolo: "tavoli-allungabili",
    sedia: "sedie",
    letto: "letti-matrimoniali",
    armadio: "guardaroba",
    libreria: "librerie",
    "mobile-tv": "mobili-tv-moderni",
    // Altri mapping qui...
  };

  return mapping[furnitureType] || furnitureType;
}

// Importa la funzione findMatchingProducts
const {
  findMatchingProducts,
  generateProductReason,
} = require("../services/furnitureRecommendationService");

module.exports = router;

// Nel componente VirtualRoomCreator

// Con questo
//const interpretation = generateAIRecommendations(imageAnalysis, furnitureType, requirements);
