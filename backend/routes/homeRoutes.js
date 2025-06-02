// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/isAuthenticated');

router.get('/home', isAuthenticated, (req, res) => {
    res.render('home');
});

module.exports = router;
