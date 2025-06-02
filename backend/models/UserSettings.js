const mongoose = require("mongoose");

const paymentMethodSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['credit_card', 'paypal', 'bank_transfer'],
        required: true,
    },
    details: {
        cardLast4: String,
        cardBrand:  String,
        paypalEmail: String,
        bankName: String,
        bankAccountLast4: String,
    },
    isDefault: {
        type: Boolean,
        default: false,
    },
}, { _id: false }); // Optional: _id false to avoid nested _id if embedded


const userSettingsSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true,
    },

    notifications: {
        promoEmail: { type: Boolean, default: true },
        smsAlerts: { type: Boolean, default: false },
        reviewReminders: { type: Boolean, default: true },
        types: {
            inApp: { type: Boolean, default: true },
            email: { type: Boolean, default: false }
        }
    },

    preferences: {
        language: { type: String, default: "en" },
        currency: { type: String, default: "USD" },
        theme: { type: String, default: "light" }, // e.g., light/dark mode
    },

    paymentMethods: [paymentMethodSchema], // Embedded list

    // other settings like marketing consents, privacy, etc.
}, {
    timestamps: true,
});

module.exports = mongoose.model("UserSettings", userSettingsSchema);
