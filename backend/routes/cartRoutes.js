// routes/cartRoutes.js

const express = require('express');
const cartController = require('../controllers/cartController');
const setCurrency = require("../middleware/setCurrency");

const router = express.Router();

// GET cart details for logged-in user
router.get('/cart', setCurrency, cartController.getCart);

// Add product to cart
router.post('/cart/add', cartController.addToCart);

router.post('/cart/update', cartController.updateCart);

router.post('/cart/set', cartController.setCart);

// Remove item from cart
router.post('/cart/remove', cartController.removeCart);

module.exports = router;
