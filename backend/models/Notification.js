// models/Notification.js
const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // null = global
    type: { type: String, enum: ['promo', 'order', 'review', 'system', 'test'], required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    expiresAt: Date,
    meta: mongoose.Schema.Types.Mixed // for extra data like orderId, link, etc.
});

module.exports = mongoose.model('Notification', notificationSchema);
