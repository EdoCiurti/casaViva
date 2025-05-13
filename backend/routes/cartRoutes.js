const express = require("express");
const Cart = require("../models/Cart");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// 🔥 Ottenere il carrello dell'utente
router.get("/", authMiddleware, async (req, res) => {
    try {
        console.log("Richiesta per ottenere il carrello dell'utente:", req.user);
        const cart = await Cart.findOne({ user: req.user.userId }).populate("products.product");
        if (!cart) {
            console.warn("Carrello non trovato per l'utente:", req.user.userId);
            return res.json({ products: [] });
        }
        res.json(cart);
    } catch (err) {
        console.error("Errore durante il recupero del carrello:", err);
        res.status(500).json({ error: "Errore nel recupero del carrello" });
    }
});

// 🔥 Aggiungere un prodotto al carrello
router.post("/", authMiddleware, async (req, res) => {
    try {
        const { productId, quantity } = req.body;
        console.log("ProductId:", productId, "Quantity:", quantity, "UserId:", req.user.userId);

        let cart = await Cart.findOne({ user: req.user.userId });

        if (!cart) {
            console.log("Nessun carrello trovato, lo creiamo...");
            cart = new Cart({ user: req.user.userId, products: [] });
        }

        const productIndex = cart.products.findIndex(p => p.product.toString() === productId);
        console.log("Indice prodotto nel carrello:", productIndex);

        if (productIndex > -1) {
            cart.products[productIndex].quantity += quantity;
        } else {
            cart.products.push({ product: productId, quantity });
        }

        await cart.save();
        console.log("Carrello aggiornato:", cart);
        res.json(cart);
    } catch (err) {
        console.error("Errore:", err);
        res.status(500).json({ error: "Errore nell'aggiunta al carrello" });
    }
});

// 🔥 Aggiornare la quantità di un prodotto nel carrello
router.put("/", authMiddleware, async (req, res) => {
    try {
        const { productId, quantity } = req.body;
        const cart = await Cart.findOne({ user: req.user.userId });

        if (!cart) return res.status(404).json({ error: "Carrello non trovato" });

        const productIndex = cart.products.findIndex(p => p.product.toString() === productId);
        if (productIndex === -1) return res.status(404).json({ error: "Prodotto non trovato nel carrello" });

        cart.products[productIndex].quantity = quantity;
        await cart.save();
        res.json(cart);
    } catch (err) {
        res.status(500).json({ error: "Errore nell'aggiornamento del carrello" });
    }
});

// 🔥 Rimuovere un prodotto dal carrello

router.delete("/:productId", authMiddleware, async (req, res) => {
    try {
        let cart = await Cart.findOne({ user: req.user.userId });

        if (!cart) return res.status(404).json({ error: "Carrello non trovato" });

        cart.products = cart.products.filter(p => p.product.toString() !== req.params.productId);
        await cart.save();
        res.json(cart);
    } catch (err) {
        res.status(500).json({ error: "Errore nella rimozione del prodotto" });
    }
});


// 🔥 Svuotare il carrello
router.delete("/", authMiddleware, async (req, res) => {
    try {
        const result = await Cart.findOneAndDelete({ user: req.user.userId });

        if (!result) return res.status(404).json({ error: "Carrello non trovato" });

        res.json({ message: "Carrello eliminato con successo" });
    } catch (err) {
        res.status(500).json({ error: "Errore nello svuotamento del carrello" });
    }
});


module.exports = router;