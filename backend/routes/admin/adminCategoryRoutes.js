// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const adminCategoryController = require('../../controllers/admin/adminCategoryController');
const upload = require("../../middleware/uploadMiddleware");
const isAuthorized = require("../../middleware/isAuthorized");
const checkPermission = require("../../middleware/checkPermission");


// Manage Categories - list, add, edit, delete
router.get('/categories', isAuthorized('admin', 'manager', 'sales'), checkPermission('view_categories'), adminCategoryController.manageCategory);

router.get('/categories/add', isAuthorized('admin', 'manager', 'sales'), checkPermission('create_category'), adminCategoryController.addCategory);

router.post('/categories/add', isAuthorized('admin', 'manager', 'sales'), checkPermission('create_category'), upload.single("image"), adminCategoryController.addCategoryPost);

router.get('/categories/edit/:id', isAuthorized('admin', 'manager', 'sales'), checkPermission('edit_category'), adminCategoryController.editCategory);

router.put('/categories/edit/:id', isAuthorized('admin', 'manager', 'sales'), checkPermission('edit_category'), upload.single("image"), adminCategoryController.editCategoryPost);

router.delete('/categories/delete/:id', isAuthorized('admin', 'manager', 'sales'), checkPermission('delete_category'), adminCategoryController.deleteCategory);

router.post('/categories/deleteSelected', isAuthorized('admin', 'manager', 'sales'), checkPermission('delete_selected_product'), adminCategoryController.deleteSelectedCategories);


module.exports = router;