const mongoose = require("mongoose");
const Product = require("./models/Product");

// Connessione al database
mongoose.connect("mongodb://localhost:27017/casaviva", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Esempi di prodotti con modelli 3D
const products3D = [
  {
    name: "Divano Moderno 3D",
    description: "Elegante divano moderno con visualizzazione 3D in realtà aumentata. Perfetto per soggiorno contemporaneo.",
    price: 1299,
    category: "divani-letto",
    images: [
      "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500&h=400&fit=crop",
      "https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=500&h=400&fit=crop"
    ],
    stock: 5,
    dimensioni: "220x90x85 cm",
    color: "Grigio",
    link3Dios: "https://go.echo3d.co/example-ios-ar-model",
    link3Dandroid: "https://go.echo3d.co/example-android-ar-model"
  },
  {
    name: "Tavolo da Pranzo AR",
    description: "Tavolo da pranzo in legno massello con tecnologia AR per visualizzazione realistica.",
    price: 899,
    category: "tavoli-allungabili",
    images: [
      "https://images.unsplash.com/photo-1549497538-303791108f95?w=500&h=400&fit=crop",
      "https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=500&h=400&fit=crop"
    ],
    stock: 3,
    dimensioni: "180x90x75 cm",
    color: "Noce",
    link3Dios: "https://go.echo3d.co/table-ios-ar",
    link3Dandroid: "https://go.echo3d.co/table-android-ar"
  },
  {
    name: "Libreria Modulare 3D",
    description: "Libreria modulare personalizzabile con anteprima 3D per pianificare la disposizione.",
    price: 699,
    category: "librerie",
    images: [
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&h=400&fit=crop",
      "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=500&h=400&fit=crop"
    ],
    stock: 7,
    dimensioni: "200x180x35 cm",
    color: "Bianco",
    link3Dios: "https://go.echo3d.co/bookshelf-ios",
    link3Dandroid: "https://go.echo3d.co/bookshelf-android"
  },
  {
    name: "Letto Matrimoniale Smart",
    description: "Letto matrimoniale con testiera imbottita e visualizzazione AR per il posizionamento perfetto.",
    price: 1599,
    category: "letti-matrimoniali",
    images: [
      "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=500&h=400&fit=crop",
      "https://images.unsplash.com/photo-1540932181975-9dcb3c1c1c27?w=500&h=400&fit=crop"
    ],
    stock: 4,
    dimensioni: "160x200x110 cm",
    color: "Grigio antracite",
    link3Dios: "https://go.echo3d.co/bed-ios-ar",
    link3Dandroid: "https://go.echo3d.co/bed-android-ar"
  },
  {
    name: "Mobile TV Sospeso AR",
    description: "Mobile TV sospeso moderno con tecnologia AR per visualizzare il posizionamento ideale.",
    price: 459,
    category: "mobili-tv-moderni",
    images: [
      "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500&h=400&fit=crop",
      "https://images.unsplash.com/photo-1493663284031-b7e3aaa4b7bb?w=500&h=400&fit=crop"
    ],
    stock: 8,
    dimensioni: "150x35x25 cm",
    color: "Nero opaco",
    link3Dios: "https://go.echo3d.co/tv-unit-ios",
    link3Dandroid: "https://go.echo3d.co/tv-unit-android"
  }
];

async function addProducts() {
  try {
    console.log("🚀 Avvio inserimento prodotti con modelli 3D...");
    
    for (const productData of products3D) {
      // Controlla se il prodotto esiste già
      const existingProduct = await Product.findOne({ name: productData.name });
      
      if (existingProduct) {
        console.log(`⚠️ Prodotto "${productData.name}" già esistente, aggiorno i link 3D...`);
        existingProduct.link3Dios = productData.link3Dios;
        existingProduct.link3Dandroid = productData.link3Dandroid;
        existingProduct.dimensioni = productData.dimensioni;
        existingProduct.color = productData.color;
        await existingProduct.save();
        console.log(`✅ Aggiornato: ${productData.name}`);
      } else {
        const newProduct = new Product(productData);
        await newProduct.save();
        console.log(`✅ Aggiunto: ${productData.name}`);
      }
    }
    
    console.log("\n🎉 Tutti i prodotti 3D sono stati aggiunti/aggiornati con successo!");
    console.log(`📊 Totale prodotti processati: ${products3D.length}`);
    
    // Mostra statistiche
    const totalProducts = await Product.countDocuments();
    const products3DCount = await Product.countDocuments({
      $or: [
        { link3Dios: { $exists: true, $ne: null } },
        { link3Dandroid: { $exists: true, $ne: null } }
      ]
    });
    
    console.log(`📈 Prodotti totali nel database: ${totalProducts}`);
    console.log(`🔮 Prodotti con modelli 3D: ${products3DCount}`);
    
  } catch (error) {
    console.error("❌ Errore durante l'inserimento:", error);
  } finally {
    mongoose.connection.close();
    console.log("🔐 Connessione database chiusa.");
  }
}

// Esegui lo script
addProducts();
