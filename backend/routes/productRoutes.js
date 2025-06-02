// routes/productRoutes.js

const express = require('express');
const productController = require('../controllers/productController')
const setCurrency = require("../middleware/setCurrency");
const { isAuthenticated } = require("../middleware/isAuthenticated");
const router = express.Router();

// GET all products
router.post('/products/filter', setCurrency, productController.filter);
router.get('/products/search/:keyword', setCurrency, productController.searchResult);
router.get('/products/:productId', setCurrency, productController.getProductById);
router.post('/products/reviews/:productId', setCurrency, isAuthenticated, productController.review);
router.get('/products/reviews/pending', setCurrency, isAuthenticated, productController.pendingReview);
router.get('/products/category/:categoryId', setCurrency, productController.getProductByCategory);


module.exports = router;
