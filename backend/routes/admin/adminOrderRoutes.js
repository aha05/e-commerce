// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const adminOrderController = require('../../controllers/admin/adminOrderController');
const checkPermission = require("../../middleware/checkPermission");
const isAuthorized = require("../../middleware/isAuthorized");

// Manage Orders - view and update
router.get('/orders', isAuthorized('admin', 'manager', 'sales'), checkPermission('manage_orders'), adminOrderController.manageOrder);

router.get('/orders/details/:id', isAuthorized('admin', 'manager', 'sales'), checkPermission('view_order_details'), adminOrderController.orderDetails);

router.get('/orders/export/excel', isAuthorized('admin', 'manager', 'sales'), checkPermission('order_excel_export'), adminOrderController.exportExcel);

router.get('/orders/export/pdf', isAuthorized('admin', 'manager', 'sales'), checkPermission('order_pdf_export'), adminOrderController.exportPDF);

router.post('/orders/:id/update', isAuthorized('admin', 'manager', 'sales'), checkPermission('update_order_status'), adminOrderController.orderUpdate);

router.post('/orders/:id/refund', isAuthorized('admin', 'manager', 'sales'), checkPermission('update_order_status'), adminOrderController.updateRefund);

router.post('/orders/deleteSelected', isAuthorized('admin', 'manager', 'sales'), checkPermission('delete_selected_order'), adminOrderController.deleteSelectedOrder);



module.exports = router;