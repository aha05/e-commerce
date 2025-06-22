// app.js
const path = require('path');
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const passport = require('passport');
const connectDB = require('./config/db');
const flash = require('connect-flash');
require('dotenv').config();
require('./config/passport'); // Passport configuration
const cors = require("cors");
const cookieParser = require("cookie-parser");
const authenticateUser = require("./middleware/authenticateUser");
const MongoDBStore = require('connect-mongodb-session')(session);

const app = express();

// Connect to MongoDB
connectDB();


// Middleware
app.use(express.static('public'));
app.use("/uploads", express.static("public/uploads"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json()); // to handle JSON payloads
app.use(cors());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(authenticateUser);

app.use(
    cors({
        origin: "http://localhost:3000", // Replace with your frontend URL
        credentials: true, // Allow cookies to be sent with requests
    })
);
app.use(session({
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true if using HTTPS
}));

// Routes
app.use('/api', require('./routes/indexRoutes'));
app.use('/api', require('./routes/authRoutes'));
app.use('/api', require('./routes/homeRoutes'));
app.use('/api', require('./routes/productRoutes'));
app.use('/api', require('./routes/cartRoutes'));
app.use('/api', require('./routes/categoryRoutes'));
app.use('/api', require('./routes/userRoutes'));
app.use('/api', require('./routes/settingsRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/admin', require('./routes/admin/adminRoutes'));
app.use('/api/admin', require('./routes/admin/adminProductRoutes'));
app.use('/api/admin', require('./routes/admin/adminCategoryRoutes'));
app.use('/api/admin', require('./routes/admin/adminPromotionRoutes'));
app.use('/api/admin', require('./routes/admin/adminUserRoutes'));
app.use('/api/admin', require('./routes/admin/adminOrderRoutes'));




// Start the server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}/ `);
});
