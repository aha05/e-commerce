// routes/userRoutes.js
const express = require('express');
const indexController = require('../controllers/indexController');
const setCurrency = require("../middleware/setCurrency");
const router = express.Router();


router.get('/', indexController.getIndex);
router.get('/index', setCurrency, indexController.getIndex);
router.get('/index/promotions', indexController.getPromotion);
router.get('/index/all-promotion', indexController.getAllPromotions);
router.get('/test', setCurrency, indexController.getTest);



module.exports = router;
