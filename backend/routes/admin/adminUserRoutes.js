const express = require('express');
const router = express.Router();
const adminUserController = require('../../controllers/admin/adminUserController');
const upload = require("../../middleware/uploadMiddleware");
const isAuthorized = require("../../middleware/isAuthorized");

// Manage User
router.get('/users', isAuthorized('admin'), adminUserController.allUsers);

router.get('/users/add', isAuthorized('admin'), adminUserController.createUser);

router.post('/users/add', isAuthorized('admin'), upload.single("image"), adminUserController.createUserPost);

router.get('/users/edit/:id', isAuthorized('admin'), adminUserController.getEditUser);

router.put('/users/edit/:id', isAuthorized('admin'), upload.single("image"), adminUserController.editUserPost);

router.put('/users/:id/status', isAuthorized('admin'), adminUserController.userUpdate);

router.delete('/users/delete/:id', isAuthorized('admin'), adminUserController.deleteUser);



// Manage User Roles and Permissions
router.get('/roles', isAuthorized('admin'), adminUserController.manageRole);

router.get('/permissions', isAuthorized('admin'), adminUserController.manageRole);

router.post('/roles/add', isAuthorized('admin'), adminUserController.addRole);

router.post('/permissions/add', isAuthorized('admin'), adminUserController.addPermission);

router.get('/roles/update/:id', adminUserController.updateRole);

router.put('/roles/update/:id', isAuthorized('admin'), adminUserController.updateRolePost);

router.delete('/roles/delete/:id', isAuthorized('admin'), adminUserController.deleteRole);

router.post('/users/assign-role', isAuthorized('admin'), adminUserController.assignRole);

module.exports = router;