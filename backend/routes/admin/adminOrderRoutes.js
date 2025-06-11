// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const adminOrderController = require('../../controllers/admin/adminOrderController');
const isAuthorized = require("../../middleware/isAuthorized");

// Manage Orders - view and update
router.get('/orders', isAuthorized('admin'), adminOrderController.manageOrder);

router.get('/orders/details/:id', isAuthorized('admin'), adminOrderController.orderDetails);

router.post('/orders/:id/update', isAuthorized('admin'), adminOrderController.orderUpdate);

router.post('/orders/deleteSelected', isAuthorized('admin'), adminOrderController.deleteSelectedOrder);

module.exports = router;