const express = require("express");
const router = express.Router();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

router.post("/create-checkout-session", async (req, res) => {
    try {
        const { cartItems } = req.body;

        if (!cartItems || cartItems.length === 0) {
            return res.status(400).json({ error: "Il carrello è vuoto" });
        }
        console.log("Chiave segreta Stripe:", process.env.STRIPE_SECRET_KEY);

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            mode: "payment",
            line_items: cartItems.map(item => ({
                price_data: {
                    currency: "eur",
                    product_data: {
                        name: item.name,
                        images: [item.image],
                    },
                    unit_amount: Math.round(item.price * 100),
                },
                quantity: item.quantity,
            })),
            success_url: `${process.env.CLIENT_URL}/success`,
            cancel_url: `${process.env.CLIENT_URL}/cancel`,
        });
        console.log("Sessione Stripe creata:", session);

        res.json({ url: session.url });

    } catch (error) {
        console.error("Errore nella creazione della sessione di pagamento:", error);
        res.status(500).json({ error: "Errore durante la creazione della sessione di pagamento" });
    }
});

module.exports = router;
