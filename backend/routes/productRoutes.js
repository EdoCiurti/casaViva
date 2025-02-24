const express = require("express");
const Product = require("../models/Product");

const router = express.Router();

// Ottenere tutti i prodotti
router.get("/", async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Ottenere un prodotto per ID
router.get("/:id", async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: "Prodotto non trovato" });
        res.json(product);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Creare un nuovo prodotto
router.post("/", async (req, res) => {
    try {
        const { name, description, price, category, images, stock } = req.body;
        const newProduct = new Product({ name, description, price, category, images, stock });
        await newProduct.save();
        res.status(201).json(newProduct);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// 🔥 Aggiornare un prodotto
router.put("/:id", async (req, res) => {
    try {
        console.log("🔹 Ricevuta richiesta PUT per ID:", req.params.id);
        console.log("🔹 Dati ricevuti:", req.body);

        // Controlliamo se il prodotto esiste
        const product = await Product.findById(req.params.id);
        if (!product) {
            console.log("❌ Prodotto non trovato");
            return res.status(404).json({ error: "Prodotto non trovato" });
        }

        // Aggiornamento prodotto
        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        console.log("✅ Prodotto aggiornato:", updatedProduct);
        res.json(updatedProduct);
    } catch (err) {
        console.error("❌ Errore nell'aggiornamento prodotto:", err.message);
        res.status(500).json({ error: "Errore nell'aggiornamento prodotto" });
    }
});


// 🔥 Eliminare un prodotto
router.delete("/:id", async (req, res) => {
    try {
        const deletedProduct = await Product.findByIdAndDelete(req.params.id);
        if (!deletedProduct) return res.status(404).json({ error: "Prodotto non trovato" });
        res.json({ message: "Prodotto eliminato" });
    } catch (err) {
        res.status(500).json({ error: "Errore nell'eliminazione prodotto" });
    }
});

module.exports = router;


