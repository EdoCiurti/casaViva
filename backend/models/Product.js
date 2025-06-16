const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    category: { type: String, required: true },
    images: { type: [String], required: true },
    stock: { type: Number, default: 1 },
    dimensioni: { type: String, required: false },
    color: { type: String, required: false },
    link3Dios: { type: String, required: false },
    link3Dandroid: { type: String, required: false },
}, { timestamps: true });

module.exports = mongoose.model("Product", ProductSchema);
