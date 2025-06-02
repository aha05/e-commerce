const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [
        {
            productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
            quantity: { type: Number, required: true },
        },
    ],
    shippingAddress: {
        fullName: { type: String, required: true },
        address: { type: String, required: true },
        city: { type: String, required: true },
        postalCode: { type: String, required: true },
        country: { type: String, required: true },
    },
    paymentMethod: { type: String, required: true }, // e.g., "Credit Card", "PayPal"
    orderTotal: { type: Number, required: true },
    orderNumber: { type: String, required: true },
    status: { type: String, default: "Pending" },
}, { timestamps: true });

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;