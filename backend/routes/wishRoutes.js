const express = require("express");
const Wish = require("../models/Wish");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// 🔥 Ottenere la wishlist dell'utente
router.get("/", authMiddleware, async (req, res) => {
    try {
        const wish = await Wish.findOne({ user: req.user.userId }).populate("products.product");
        if (!wish) return res.json({ products: [] });
        res.json(wish);
    } catch (err) {
        res.status(500).json({ error: "Errore nel recupero della wishlist" });
    }
});

// 🔥 Aggiungere un prodotto alla wishlist
router.post("/", authMiddleware, async (req, res) => {
    try {
        const { productId } = req.body;

        let wish = await Wish.findOne({ user: req.user.userId });

        if (!wish) {
            wish = new Wish({ user: req.user.userId, products: [] });
        }

        const productExists = wish.products.some(p => p.product.toString() === productId);

        if (!productExists) {
            wish.products.push({ product: productId });
        }

        await wish.save();
        res.json(wish);
    } catch (err) {
        res.status(500).json({ error: "Errore nell'aggiunta alla wishlist" });
    }
});

// 🔥 Rimuovere un prodotto dalla wishlist
router.delete("/:productId", authMiddleware, async (req, res) => {
    try {
        let wish = await Wish.findOne({ user: req.user.userId });

        if (!wish) return res.status(404).json({ error: "Wishlist non trovata" });

        wish.products = wish.products.filter(p => p.product.toString() !== req.params.productId);
        await wish.save();
        res.json(wish);
    } catch (err) {
        res.status(500).json({ error: "Errore nella rimozione del prodotto" });
    }
});

// 🔥 Svuotare la wishlist
router.delete("/", authMiddleware, async (req, res) => {
    try {
        const result = await Wish.findOneAndDelete({ user: req.user.userId });

        if (!result) return res.status(404).json({ error: "Wishlist non trovata" });

        res.json({ message: "Wishlist eliminata con successo" });
    } catch (err) {
        res.status(500).json({ error: "Errore nello svuotamento della wishlist" });
    }
});

module.exports = router;