const express = require('express');
const router = express.Router();
const adminPromotionController = require('../../controllers/admin/adminPromotionController');
const checkPermission = require("../../middleware/checkPermission");
const isAuthorized = require("../../middleware/isAuthorized");

// Manage Promotions and Discounts
router.get('/promotions', isAuthorized('admin', 'manager', 'sales'), checkPermission('view_promotion'), adminPromotionController.managePromotion);

router.get('/promotions/add', isAuthorized('admin', 'manager', 'sales'), checkPermission('create_promotion'), adminPromotionController.addPromotion);

router.post('/promotions/add', isAuthorized('admin', 'manager', 'sales'), checkPermission('create_promotion'), adminPromotionController.addPromotionPost);

router.get('/promotions/update/:id', isAuthorized('admin', 'manager', 'sales'), checkPermission('edit_promotion'), adminPromotionController.updatePromotion);

router.put('/promotions/update/:id', isAuthorized('admin', 'manager', 'sales'), checkPermission('edit_promotion'), adminPromotionController.updatePromotionPost);

router.delete('/promotions/delete/:id', isAuthorized('admin', 'manager', 'sales'), checkPermission('delete_promotion'), adminPromotionController.deletePromotion);

module.exports = router;