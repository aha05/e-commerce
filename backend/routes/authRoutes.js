// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const passport = require('passport');

router.post('/auth/login', authController.postLogin);
router.post('/auth/register', authController.postRegister);

router.get('/auth/session', authController.session);

router.post('/auth/logout', authController.logout);

router.get('/auth/google', passport.authenticate('google', { scope: ['profile'] }));
router.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), (req, res) => {
    res.redirect('/home');
});

module.exports = router;
