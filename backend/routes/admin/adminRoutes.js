// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const adminController = require('../../controllers/admin/adminController');
const isAuthorized = require("../../middleware/isAuthorized");


router.get('/dashboard', isAuthorized('admin'), adminController.dashboard);

// Manage Customers - list, view orders
router.get('/customers', isAuthorized('admin'), adminController.manageCustomer);

// Reports
router.get('/reports', isAuthorized('admin'), adminController.report);
router.get('/logs', isAuthorized('admin'), adminController.Log);
router.delete("/logs/delete-all", isAuthorized('admin'), adminController.deleteLog);

module.exports = router;