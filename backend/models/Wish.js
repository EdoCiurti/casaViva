const mongoose = require("mongoose");

const WishSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    products: [
        {
            product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
            addedAt: { type: Date, default: Date.now } // Data in cui il prodotto è stato aggiunto
        }
    ],
}, { timestamps: true });

module.exports = mongoose.model("Wish", WishSchema);