const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true, // Ensure each category name is unique
    },
    description: String,
    image: String, // Could be a URL
    createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;
