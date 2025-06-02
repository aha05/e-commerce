// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const adminCategoryController = require('../../controllers/admin/adminCategoryController');
const upload = require("../../middleware/uploadMiddleware");
const isAuthorized = require("../../middleware/isAuthorized");

// Manage Categories - list, add, edit, delete
router.get('/categories', isAuthorized('admin'), adminCategoryController.manageCategory);

router.get('/categories/add', isAuthorized('admin'), adminCategoryController.addCategory);

router.post('/categories/add', isAuthorized('admin'), upload.single("image"), adminCategoryController.addCategoryPost);

router.get('/categories/edit/:id', isAuthorized('admin'), adminCategoryController.editCategory);

router.put('/categories/edit/:id', isAuthorized('admin'), upload.single("image"), adminCategoryController.editCategoryPost);

router.delete('/categories/delete/:id', isAuthorized('admin'), adminCategoryController.deleteCategory);


module.exports = router;