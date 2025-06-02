const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { isAuthenticated } = require("../middleware/isAuthenticated");


router.post('/settings/notifications/:id', isAuthenticated, settingsController.userNotification);
router.get('/settings/:id', isAuthenticated, settingsController.getSettings);
router.get('/settings/payment/:id', isAuthenticated, settingsController.getPayment);
router.post('/settings/payment/:id', isAuthenticated, settingsController.addPayment);
router.post('/settings/preferences/:id', isAuthenticated, settingsController.preference);
router.delete('/settings/payment/delete/:id/:index', isAuthenticated, settingsController.deletePayment);

router.get('/notifications', isAuthenticated, settingsController.getNotifications);
router.patch('/notifications/:id/read', isAuthenticated, settingsController.readNotifications);

module.exports = router; 