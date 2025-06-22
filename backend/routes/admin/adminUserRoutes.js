const express = require('express');
const router = express.Router();
const adminUserController = require('../../controllers/admin/adminUserController');
const upload = require("../../middleware/uploadMiddleware");
const isAuthorized = require("../../middleware/isAuthorized");
const checkPermission = require("../../middleware/checkPermission");


// Manage User
router.get('/users', isAuthorized('admin', 'manager', 'sales'), checkPermission('view_users'), adminUserController.allUsers);

router.get('/users/add', isAuthorized('admin', 'manager', 'sales'), checkPermission('create_user'), adminUserController.createUser);

router.post('/users/add', isAuthorized('admin', 'manager', 'sales'), checkPermission('create_user'), upload.single("image"), adminUserController.createUserPost);

router.get('/users/edit/:id', isAuthorized('admin', 'manager', 'sales'), checkPermission('edit_user'), adminUserController.getEditUser);

router.put('/users/edit/:id', isAuthorized('admin', 'manager', 'sales'), checkPermission('edit_user'), upload.single("image"), adminUserController.editUserPost);

router.put('/users/:id/status', isAuthorized('admin', 'manager', 'sales'), checkPermission('block_user'), adminUserController.userUpdate);

router.delete('/users/delete/:id', isAuthorized('admin', 'manager', 'sales'), checkPermission('delete_user'), adminUserController.deleteUser);



// Manage User Roles and Permissions
router.get('/roles', isAuthorized('admin'), checkPermission('view_roles'), adminUserController.manageRole);

router.get('/permissions', isAuthorized('admin'), checkPermission('view_permissions'), adminUserController.manageRole);

router.post('/roles/add', isAuthorized('admin'), checkPermission('create_role', 'assign_permissions'), adminUserController.addRole);

router.get('/roles/update/:id', isAuthorized('admin'), checkPermission('edit_role'), adminUserController.updateRole);

router.put('/roles/update/:id', isAuthorized('admin'), checkPermission('edit_role'), adminUserController.updateRolePost);

router.delete('/roles/delete/:id', isAuthorized('admin'), checkPermission('delete_role'), adminUserController.deleteRole);

router.post('/users/assign-role', isAuthorized('admin'), checkPermission('assign_roles'), adminUserController.assignRole);

module.exports = router;