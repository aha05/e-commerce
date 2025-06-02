
const express = require('express');
const router = express.Router();
const adminProductController = require('../../controllers/admin/adminProductController');
const upload = require("../../middleware/uploadMiddleware");
const isAuthorized = require("../../middleware/isAuthorized");


// Manage Products - list, add, edit, delete
router.get('/products', isAuthorized('admin'), adminProductController.manageProduct);

router.get('/products/add', isAuthorized('admin'), adminProductController.addProduct);

router.post('/products/add', isAuthorized('admin'), upload.any(), adminProductController.addProductPost);

router.post('/products/deleteSelected', isAuthorized('admin'), adminProductController.deleteSelectedProduct);

router.get('/products/edit/:id', isAuthorized('admin'), adminProductController.editProduct);

router.put('/products/edit/:id', isAuthorized('admin'), upload.any(), adminProductController.editProductPost);

router.delete('/products/delete/:id', isAuthorized('admin'), adminProductController.deleteProduct);

module.exports = router;