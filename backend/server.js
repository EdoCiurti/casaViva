require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

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

app.use("/api/products", productRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/wishlist", wishRoutes); // 🔥 Aggiungi il middleware per la wishlist

// Rotta di test
app.get("/", (req, res) => res.send("API funzionante"));

// Avvio server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server avviato su porta ${PORT}`));