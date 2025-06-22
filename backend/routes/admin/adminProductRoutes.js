
const express = require('express');
const router = express.Router();
const adminProductController = require('../../controllers/admin/adminProductController');
const upload = require("../../middleware/uploadMiddleware");
const excelUpload = require("../../middleware/excelUploadMiddleware");
const checkPermission = require("../../middleware/checkPermission");
const isAuthorized = require("../../middleware/isAuthorized");


// Manage Products - list, add, edit, delete
router.get('/products', isAuthorized('admin', 'manager', 'sales'), checkPermission('view_products'), adminProductController.manageProduct);

router.get('/products/add', isAuthorized('admin', 'manager', 'sales'), checkPermission('create_product'), adminProductController.addProduct);

router.post('/products/add', isAuthorized('admin', 'manager', 'sales'), checkPermission('create_product'), upload.any(), adminProductController.addProductPost);

router.post('/products/deleteSelected', isAuthorized('admin', 'manager', 'sales'), checkPermission('delete_selected_product'), adminProductController.deleteSelectedProduct);

router.get('/products/edit/:id', isAuthorized('admin', 'manager', 'sales'), checkPermission('edit_product'), adminProductController.editProduct);

router.put('/products/edit/:id', isAuthorized('admin', 'manager', 'sales'), checkPermission('edit_product'), upload.any(), adminProductController.editProductPost);

router.delete('/products/delete/:id', isAuthorized('admin', 'manager', 'sales'), checkPermission('delete_product'), adminProductController.deleteProduct);

router.get('/products/export/excel', isAuthorized('admin', 'manager', 'sales'), checkPermission('product_excel_export'), adminProductController.exportExcel);

router.post('/products/import/excel', isAuthorized('admin', 'manager', 'sales'), checkPermission('product_excel_import'), excelUpload.single('file'), adminProductController.importExcel);

router.get('/products/export/pdf', isAuthorized('admin', 'manager', 'sales'), checkPermission('product_pdf_export'), adminProductController.exportPDF);


module.exports = router;