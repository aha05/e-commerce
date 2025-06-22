// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const adminController = require('../../controllers/admin/adminController');
const isAuthorized = require("../../middleware/isAuthorized");
const checkPermission = require("../../middleware/checkPermission");


router.get('/dashboard', isAuthorized('admin', 'manager', 'sales'), checkPermission('view_dashboard'), adminController.dashboard);

// Manage Customers - list, view orders
router.get('/customers', isAuthorized('admin', 'manager', 'sales'), checkPermission('view_customers'), adminController.manageCustomer);

// Reports
router.get('/reports', isAuthorized('admin', 'manager', 'sales'), checkPermission('view_reports'), adminController.report);

router.get('/reports/sales', isAuthorized('admin', 'manager', 'sales'), checkPermission('view_reports'), adminController.salesReport);

router.get('/reports/sales/filter', isAuthorized('admin', 'manager', 'sales'), checkPermission('view_reports'), adminController.salesFilter);

router.post('/reports/:type/export/:format', isAuthorized('admin', 'manager', 'sales'), checkPermission('product_excel_export'), adminController.export);

router.get('/logs', isAuthorized('admin', 'manager', 'sales'), checkPermission('view_logs'), adminController.Log);

router.delete("/logs/delete-all", isAuthorized('admin'), adminController.deleteLog);

module.exports = router;