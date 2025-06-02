const { notifyUser } = require('../utils/notifyUser');
const User = require('../Models/User');
const UserSettings = require('../models/UserSettings');
const Notification = require('../models/Notification');


exports.userNotification = async (req, res) => {
    try {

        let notifications = req.body;

        if (notifications.promoEmail) {
            notifications = {
                promoEmail: notifications.promoEmail,
                smsAlerts: notifications.smsAlerts,
                reviewReminders: notifications.reviewReminders,
                types: {
                    email: true
                }
            }
        }

        const settings = await UserSettings.findOneAndUpdate(
            { userId: req.user._id },
            { $set: { notifications } },
            { new: true, upsert: true }
        );

        res.json(settings.notifications);
    } catch (error) {
        console.error('Error updating notification settings:', error);
        res.status(500).json({ message: 'Server error' });
    }
}

exports.preference = async (req, res) => {
    try {

        const preferences = req.body;

        const settings = await UserSettings.findOneAndUpdate(
            { userId: req.user._id },
            { $set: { preferences, userId: req.user._id } }, // ensure userId is set on upsert
            { new: true, upsert: true } // upsert: true → creates a new document if no match is found. new: true → returns the updated (or newly created) document.
        );

        res.json(settings);
    } catch (error) {
        console.error('Error updating preference settings:', error);
        res.status(500).json({ message: 'Server error' });
    }
}

exports.getSettings = async (req, res) => {
    try {
        if (!req.user) return res.status(401).json({ error: "invalid user!" });

        const settings = await UserSettings.findOne({ userId: req.user._id });
        if (!settings) return res.status(404).json({ error: "Settings not found" });
        res.json(settings);
    } catch (error) {
        console.error('Error updating payment method:', error);
        res.status(500).json({ message: 'Server error' });
    }
}

exports.getPayment = async (req, res) => {
    try {
        if (!req.user) return res.status(401).json({ error: "invalid user!" });

        const settings = await UserSettings.findOne({ userId: req.user._id });
        if (!settings) return res.status(404).json({ error: "Settings not found" });
        res.json(settings.paymentMethods);
    } catch (error) {
        console.error('Error updating payment method:', error);
        res.status(500).json({ message: 'Server error' });
    }
}

exports.addPayment = async (req, res) => {
    try {
        if (!req.user) return res.status(401).json({ error: "invalid user!" });

        const { type, details, isDefault } = req.body;

        let settings = await UserSettings.findOne({ userId: req.user._id });

        if (!settings) {
            const newSettings = new UserSettings({
                userId: req.user._id,
                paymentMethods: [{ type, details, isDefault }],
            });
            await newSettings.save();
            return res.status(201).json(newSettings.paymentMethods);
        };

        if (type === "credit_card") {
            const existingCard = settings.paymentMethods.find(
                (pm) => pm.details.cardBrand === details.cardBrand
            );
            if (existingCard) {
                return res.status(400).json({ error: "Card brand already exists." });
            }
        }

        if (type === "paypal") {
            const addExistingPaypal = settings.paymentMethods.find(
                (pm) => pm.details.paypalEmail === details.paypalEmail
            );
            if (addExistingPaypal) {
                return res.status(400).json({ message: "PayPal email already exists." });
            }

            const existingPaypal = settings.paymentMethods.find(pm => pm.type === "paypal");

            if (existingPaypal) {
                if (existingPaypal.details.paypalEmail !== details.paypalEmail) {
                    return res.status(400).json({
                        message: "Only one PayPal account is allowed. Please remove the existing one first."
                    });
                } else {
                    return res.status(200).json(settings.paymentMethods);
                }
            }
        }

        if (isDefault) {
            settings.paymentMethods.forEach(pm => pm.isDefault = false);
        }

        settings.paymentMethods.push({ type, details, isDefault });
        await settings.save();

        res.status(201).json(settings.paymentMethods);
    } catch (error) {
        console.error('Error updating payment method:', error);
        res.status(500).json({ message: 'Server error' });
    }
}

exports.deletePayment = async (req, res) => {
    const { id, index } = req.params;

    try {
        const settings = await UserSettings.findOne({ userId: req.user._id });

        if (!settings) return res.status(404).json({ message: "No Data Found!" });

        const methodIndex = parseInt(index);
        if (isNaN(methodIndex) || methodIndex < 0 || methodIndex >= settings.paymentMethods.length) {
            return res.status(400).json({ message: "Invalid index" });
        }

        settings.paymentMethods.splice(methodIndex, 1);

        await settings.save();
        res.json({ message: "Payment method removed successfully" });
    } catch (err) {
        console.error("Delete payment method error:", err);
        res.status(500).json({ message: "Server error" });
    }
}

exports.getNotifications = async (req, res) => {
    const notifications = await Notification.find({ userId: req.user._id }).sort({ createdAt: -1 });

    res.json(notifications);
}

exports.readNotifications = async (req, res) => {
    await Notification.findByIdAndUpdate(req.params.id, { read: true });
    res.json({ success: true });
}

