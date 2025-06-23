const Category = require('../../models/Category');
const Product = require('../../models/Product');
const Logger = require("../../middleware/Logger");
const path = require("path");
const fs = require("fs");
const logger = require('../../utils/logger.js');

exports.manageCategory = async (req, res) => {
    try {
        const categories = await Category.find();
        res.json({ categories });

    } catch (error) {
        res.status(500).send('Error retrieving categories: ' + error.message);
    }
}

exports.addCategory = async (req, res) => {
    const categories = await Category.find();
    res.json({ categories });
}

exports.addCategoryPost = async (req, res) => {
    const { name, description, image } = req.body;
    try {
        const imagePath = req.file ? `/uploads/${req.file.filename}` : null;
        const category = new Category({ name, description, image: imagePath });
        await category.save();
        await Logger(req.user.name, "Category Added", `Added "<em>${name}</em>" to catalog`, "Success");
        res.status(201).json({ message: "Category created successfully!", category });

        setImmediate(async () => {
            try {
                logger.info(`📢 New category "${category.name}" added by ${req.user.username}`);
            } catch (error) {
                logger.error("❌ Failed to log:", error);
            }
        });
    } catch (error) {
        logger.error("❌ Error adding category:", error);
        res.status(500).send('Error adding category: ' + error.message);
    }
}

exports.editCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        res.json({ category });
    } catch (error) {
        res.status(500).send('Error retrieving category: ' + error.message);
    }
}

exports.editCategoryPost = async (req, res) => {
    const { name, description, image } = req.body;
    try {
        const category = await Category.findOne({ _id: req.params.id });

        if (category.image && category.image !== image) {
            const oldImagePath = path.join(__dirname, "..", "public", category.image);
            if (fs.existsSync(oldImagePath)) {
                fs.unlinkSync(oldImagePath); // Delete old file
            }
        }

        // Assign new image path (if a new image is uploaded)
        const imagePath = req.file ? `/uploads/${req.file.filename}` : category.image;
        await Category.findByIdAndUpdate(req.params.id, { name, description, image: imagePath });
        await Logger(req.user.name, "Category Updated", `Updated "<em>${name}</em>" from catalog`, "Success");
        res.json({ category });

        setImmediate(async () => {
            try {
                logger.info(`📢 Category "${category.name}" updated by ${req.user.username}`);
            } catch (error) {
                logger.error("❌ Failed to log", error);
            }
        });
    } catch (error) {
        logger.error("❌ Error updating category:", error);
        res.status(500).send('Error updating category: ' + error.message);
    }
}

exports.deleteCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);

        if (category.image) {
            const imagePath = path.join(__dirname, "..", "public", category.image);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath); // Delete file
            }
        }

        await Category.findByIdAndDelete(req.params.id);
        await Logger(req.user.name, "Category deleted", `delete "<em>${category.name}</em>" from catalog`, "Success");
        res.json({ category });

        setImmediate(async () => {
            try {
                logger.info(`📢 Category "${category.name}" deleted by ${req.user.username}`);
            } catch (error) {
                logger.error("❌ Failed to log:", error);
            }
        });
    } catch (error) {
        logger.error("❌ Error deleting category:", error);
        res.status(500).send('Error deleting category:' + error.message);
    }
}

exports.deleteSelectedCategories = async (req, res) => {
    try {
        const { categoryIds } = req.body;
        const categoriesToDelete = await Category.find({ _id: { $in: categoryIds } });
        await Category.deleteMany({ _id: { $in: categoryIds } });
        await Product.deleteMany({ category: { $in: categoryIds } });

        res.json({ success: true });
        setImmediate(async () => {
            try {
                const names = categoriesToDelete.map(category => category.name).join(', ');
                logger.info(`📢 Selected Categories "${names}" have been removed by ${req.user.username}`);
            } catch (error) {
                logger.error("❌ Failed to log:", error);
            }
        });
    } catch (error) {
        logger.error('❌ Error deleting selected Category:', error);
        res.json({ success: false, message: 'Error deleting selected Category' });
    }
}
