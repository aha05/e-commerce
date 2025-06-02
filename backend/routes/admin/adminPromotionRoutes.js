const express = require('express');
const router = express.Router();
const adminPromotionController = require('../../controllers/admin/adminPromotionController');
const isAuthorized = require("../../middleware/isAuthorized");


// Manage Promotions and Discounts
router.get('/promotions', isAuthorized('admin'), adminPromotionController.managePromotion);

router.get('/promotions/add', isAuthorized('admin'), adminPromotionController.addPromotion);

router.post('/promotions/add', isAuthorized('admin'), adminPromotionController.addPromotionPost);

router.get('/promotions/update/:id', isAuthorized('admin'), adminPromotionController.updatePromotion);

router.put('/promotions/update/:id', isAuthorized('admin'), adminPromotionController.updatePromotionPost);

router.delete('/promotions/delete/:id', isAuthorized('admin'), adminPromotionController.deletePromotion);

module.exports = router;