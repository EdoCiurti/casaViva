const express = require("express");
const Order = require("../models/Order");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Ottenere tutti gli ordini
router.get("/", authMiddleware, async (req, res) => {
    try {
      const orders = await Order.find().populate("user").populate("products.product");
      res.json(orders);
    } catch (err) {
      res.status(500).json({ error: "Errore nel recupero degli ordini" });
    }
  });
  
// 🛒 Creare un nuovo ordine
router.post("/", authMiddleware, async (req, res) => {
    try {
        const { products } = req.body;
        if (!products || products.length === 0) {
            return res.status(400).json({ error: "Nessun prodotto nell'ordine" });
        }

        let total = 0;
        products.forEach(p => {
            total += p.price * p.quantity;
        });

        const newOrder = new Order({
            user: req.user.userId,
            products,
            total
        });

        await newOrder.save();
        res.status(201).json(newOrder);
    } catch (err) {
        res.status(500).json({ error: "Errore nella creazione dell'ordine" });
    }
});

// 📦 Ottenere tutti gli ordini dell'utente
router.get("/", authMiddleware, async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user.userId }).populate("products.product");
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: "Errore nel recupero degli ordini" });
    }
});

// 📌 Ottenere un ordine specifico
router.get("/:id", authMiddleware, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id).populate("products.product");
        if (!order) return res.status(404).json({ error: "Ordine non trovato" });

        res.json(order);
    } catch (err) {
        res.status(500).json({ error: "Errore nel recupero dell'ordine" });
    }
});

// 🚀 Aggiornare lo stato dell'ordine (solo admin)
router.put("/:id/status", authMiddleware, async (req, res) => {
    try {
        const { status } = req.body;
        if (!["In elaborazione", "Spedito", "Consegnato"].includes(status)) {
            return res.status(400).json({ error: "Stato non valido" });
        }

        const updatedOrder = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });

        if (!updatedOrder) return res.status(404).json({ error: "Ordine non trovato" });

        res.json(updatedOrder);
    } catch (err) {
        res.status(500).json({ error: "Errore nell'aggiornamento dell'ordine" });
    }
});

// ❌ Eliminare un ordine (opzionale)
router.delete("/:id", authMiddleware, async (req, res) => {
    try {
        const deletedOrder = await Order.findByIdAndDelete(req.params.id);
        if (!deletedOrder) return res.status(404).json({ error: "Ordine non trovato" });

        res.json({ message: "Ordine eliminato" });
    } catch (err) {
        res.status(500).json({ error: "Errore nell'eliminazione dell'ordine" });
    }
});

module.exports = router;
