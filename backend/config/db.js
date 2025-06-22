// Load environment variables from .env file
require('dotenv').config();
const mongoose = require('mongoose');


// Database connection function
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: MongoDB ${error.message}`);
        process.exit(1); // Exit process with failure
    }
};

module.exports = connectDB;
