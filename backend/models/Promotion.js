const mongoose = require('mongoose');

const promotionSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },

    code: {
        type: String,
        required: function () {
            return this.type === 'code'; // Required only for code-based promos
        },
        unique: true,
        sparse: true, // allows multiple nulls
    },

    type: {
        type: String,
        enum: ['auto', 'code', 'hybrid'], // hybrid = both methods
        default: 'auto',
    },

    discountPercentage: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
    },

    startDate: {
        type: Date,
        required: true,
    },

    endDate: {
        type: Date,
        required: true,
    },

    isActive: {
        type: Boolean,
        default: true,
    },

    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
    },
}, { timestamps: true });

module.exports = mongoose.model('Promotion', promotionSchema);
