const mongoose = require('mongoose');
const Product = require('./Product');

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


categorySchema.pre('findOneAndDelete', async function (next) {
    const product = await this.model.findOne(this.getFilter());
    await Product.deleteMany({ product: product._id });
    next();
});

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;
