const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const upload = require("../middleware/uploadMiddleware");
const { isAuthenticated } = require("../middleware/isAuthenticated");
const setCurrency = require("../middleware/setCurrency");

// Wishlist
router.get('/wishlist', isAuthenticated, userController.getWishlist);
router.post('/wishlist/add', isAuthenticated, userController.addWishlist);
router.post('/wishlist/remove', isAuthenticated, userController.deleteWishlist);
router.get('/profile', setCurrency, isAuthenticated, userController.getProfile);
router.post('/profile/upload-image/:id', isAuthenticated, upload.single("image"), userController.updateImage);
router.post('/profile/edit/:id', isAuthenticated, userController.editProfile);
router.post('/profile/changepassword/:id', isAuthenticated, userController.changePassword);
router.delete('/profile/delete/:id', isAuthenticated, userController.deleteUser);

module.exports = router; 