const mongoose = require('mongoose');

// Review subdocument schema
const reviewSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
    },
    comment: String,
    createdAt: {
        type: Date,
        default: Date.now,
    }
}, { _id: false });

// Variant subdocument schema
const variantSchema = new mongoose.Schema({
    attributes: {
        type: Map,
        of: String, // e.g., { Color: 'Red', Size: 'Small' }
        required: true
    },
    image: {
        type: String,
        required: true
    },
    price: Number, // Optional override
    stock: Number  // Optional override
}, { _id: false });

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    brand: String,
    description: String,
    price: {
        type: Number,
        required: true,
    },
    image: String, // default/main image
    stock: {
        type: Number,
        required: true,
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
    },
    attributes: {
        type: Map,
        of: [String], // General attributes, e.g., { Color: ['Red', 'Blue'], Size: ['S', 'M'] }
        default: {},
    },
    variants: [variantSchema], // NEW: flexible combinations with images
    reviews: [reviewSchema],
    averageRating: {
        type: Number,
        default: 0,
    },
    totalReviews: {
        type: Number,
        default: 0,
    },
}, { timestamps: true });

// Pre-find hook to cast relatedId to ObjectId
productSchema.pre('find', function () {
    if (this.getQuery().relatedId && mongoose.Types.ObjectId.isValid(this.getQuery().relatedId)) {
        this.getQuery().relatedId = mongoose.Types.ObjectId(this.getQuery().relatedId);
    }
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
