const User = require('../Models/User');
const UserSettings = require('../models/UserSettings');


async function setCurrency(req, res, next) {
    if (req.user) {
        const settings = await UserSettings.findOne({ userId: req.user._id });
        req.currency = settings?.preferences?.currency || 'USD';
    } else {
        req.currency = 'USD';
    }
    next(); // continue to controller
}

module.exports = setCurrency;
