const express = require("express");
const { register, login } = require("../controllers/authController");
const User = require("../models/User");  // Importa il modello utente
const authMiddleware = require("../middleware/authMiddleware"); // Middleware per JWT
const router = express.Router();

router.post("/register", register);
router.post("/login", login);

// Rotta protetta per ottenere il profilo utente
router.get("/profile", authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select("-password");
        if (!user) return res.status(404).json({ error: "Utente non trovato" });
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: "Errore del server" });
    }
});

module.exports = router;
