require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path"); // Aggiungi questa importazione all'inizio

const app = express();

// Configurazione CORS
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://casaviva-2.onrender.com',
    process.env.CLIENT_URL
  ].filter(Boolean), // Rimuove valori null/undefined
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// Middleware
app.use(cors(corsOptions));
app.use(bodyParser.json());

// Aggiungi questa configurazione dopo gli altri middleware
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connessione a MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log("MongoDB connesso"))
  .catch(err => console.error("Errore connessione DB:", err));

// Importa le rotte
const productRoutes = require("./routes/productRoutes");
const authRoutes = require("./routes/authRoutes");
const orderRoutes = require("./routes/orderRoutes");
const cartRoutes = require("./routes/cartRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const wishRoutes = require("./routes/wishRoutes"); // 🔥 Importa le rotte della wishlist
const virtualRoomRoutes = require("./routes/virtualRoomRoutes");

app.use("/api/products", productRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/wishlist", wishRoutes); // 🔥 Aggiungi il middleware per la wishlist
app.use("/api/virtual-room", virtualRoomRoutes); // Aggiungi questa riga

// Rotta di test
app.get("/", (req, res) => res.send("API funzionante"));

// Avvio server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server avviato su porta ${PORT}`));