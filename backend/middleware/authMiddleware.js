const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
    const authHeader = req.headers.authorization;
    console.log("Intestazione di autorizzazione ricevuta:", authHeader);
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Accesso negato, token mancante" });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log("Token decodificato con successo:", decoded);
        req.user = decoded; // Memorizza l'utente decodificato nella richiesta
        next();
    } catch (err) {
        console.error("Errore durante la verifica del token:", err);
        res.status(401).json({ error: "Token non valido" });
    }
};
