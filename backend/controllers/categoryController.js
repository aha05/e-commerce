const Category = require('../models/Category')

exports.getCategory = async (req, res) => {
    const categories = await Category.find();
    res.json({ categories });
};


