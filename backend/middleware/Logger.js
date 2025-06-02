const Log = require("../models/Log");

const Logger = async (admin, action, details, status) => {
    try {
        await Log.create({ admin, action, details, status });
    } catch (error) {
        console.error("Error logging activity:", error);
    }
};

module.exports = Logger;
