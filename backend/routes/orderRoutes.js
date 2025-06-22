const express = require('express');
const orderController = require('../controllers/orderController');
const router = express.Router();
const { isAuthenticated } = require("../middleware/isAuthenticated");
const setCurrency = require("../middleware/setCurrency");

router.get('/checkout', isAuthenticated, setCurrency, orderController.getCheckoutPage);
router.post('/checkout', isAuthenticated, setCurrency, orderController.postOrder);
router.get('/order-confirmation', isAuthenticated, setCurrency, orderController.getOrderConfirmation);
router.get('/order/:id', isAuthenticated, setCurrency, orderController.getOrderDetails);
router.post('/order/refund',  orderController.refund);



module.exports = router;