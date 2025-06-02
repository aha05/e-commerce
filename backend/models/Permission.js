const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true }, // e.g., "VIEW_USER"
    description: { type: String }, // Optional: to explain what the permission does
}, { timestamps: true });

module.exports = mongoose.model('Permission', permissionSchema);
