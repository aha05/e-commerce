const mongoose = require("mongoose");

const LogSchema = new mongoose.Schema({
    admin: { type: String, required: true }, // Admin's name or ID
    action: { type: String, required: true }, // Action performed
    details: { type: String, required: true }, // Description of the action
    timestamp: { type: Date, default: Date.now }, // Date and time of action
    status: { type: String, enum: ["Success", "Updated", "Modified", "Deleted"], required: true }
}, { timestamps: true });

module.exports = mongoose.model("Log", LogSchema);
