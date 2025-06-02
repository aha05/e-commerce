const Product = require('../../models/Product');
const Category = require('../../models/Category');
const Logger = require("../../middleware/Logger");
const path = require("path");
const fs = require("fs");

exports.manageProduct = async (req, res) => {
    const products = await Product.find().populate('category');
    res.json({ products });
}

exports.addProduct = async (req, res) => {
    const categories = await Category.find();
    res.json({ categories });
}

exports.addProductPost = async (req, res) => {
    try {
        const filesMap = {};
        req.files.forEach((file) => {
            filesMap[file.fieldname] = file.filename;
        });

        // Main product image
        const imagePath = req.files ? `/uploads/${filesMap["image"]}` : null;

        const {
            name,
            description,
            categoryId,
            brand,
            price,
            stock,
            attributes,
            variants,
        } = req.body;

        // Handle attributes (assumed JSON stringified object: Map<string, [string]>)
        const Attributes = attributes ? (attributes.map(attribute => JSON.parse(attribute))) : {};
        const parsedAttributes = Attributes.reduce((acc, curr) => {
            if (curr.key) {
                acc[curr.key] = curr.values;
            }
            return acc;
        }, {});

        // Handle variants (assumed JSON stringified array of variant objects)
        const parsedVariants = variants ? (variants.map(variant => JSON.parse(variant))) : [];

        // Attach correct image path to each variant
        const updatedVariants = parsedVariants?.map((variant, index) => {
            const variantImageField = `variants[${index}][image]`;
            const attributes = variant.attributeValues || {};
            const price = variant.price || '';
            const stock = variant.stock || '';
            return {
                attributes,
                price,
                stock,
                image: `/uploads/${filesMap[variantImageField]}` || "",
            };
        });

        // Create the product
        const newProduct = new Product({
            name,
            description,
            category: categoryId,
            brand,
            price,
            stock,
            attributes: parsedAttributes,
            image: imagePath,
            variants: updatedVariants,
        });


        // await newProduct.save();

        res.status(201).json({ message: "Product added successfully", product: newProduct });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
};

exports.editProduct = async (req, res) => {
    const product = await Product.findOne({ _id: req.params.id }).populate('category');
    const categories = await Category.find();
    res.json({ product, categories });
}

exports.editProductPost = async (req, res) => {

    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        // Map uploaded files
        const filesMap = {};
        if (req.files) {
            req.files.forEach((file) => {
                filesMap[file.fieldname] = file.filename;
            });
        }

        // Parse request body
        const {
            name,
            description,
            categoryId,
            brand,
            price,
            stock,
            attributes,
            variants,

        } = req.body;


        // Validate required fields
        if (!name || !description || !categoryId || !brand || !price || !stock) {
            return res.status(400).json({ success: false, message: "All fields are required" });
        }

        // Parse and reformat attributes
        const parsedAttributes = JSON.parse(attributes)

        // Parse and attach images to variants
        const parsedVariants = variants
            ? variants.map((variant, index) => {
                const parsed = JSON.parse(variant);
                const variantImageField = `variants[${index}][image]`;
                return {
                    attributes: parsed.attributes || {},
                    price: parsed.price || '',
                    stock: parsed.stock || '',
                    image: filesMap[variantImageField] ? `/uploads/${filesMap[variantImageField]}` : parsed.image || ' ' // Use existing image if no new upload,
                };
            })
            : [];

        // Handle main product image
        let imagePath = product?.image;
        if (filesMap["image"]) {
            // Delete old image
            if (product?.image) {
                const oldImagePath = path.join(__dirname, "..", "public", product.image);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }
            imagePath = `/uploads/${filesMap["image"]}`;
        }


        // Update the product
        product.name = name;
        product.description = description;
        product.category = categoryId;
        product.brand = brand;
        product.price = price;
        product.stock = stock;
        product.attributes = parsedAttributes;
        product.image = imagePath;
        product.variants = parsedVariants;

        await product.save();
        await Logger(req.user.name, "Product updated", `Updated "<em>${product.name}</em>" from catalog.`, "Success");

        res.status(200).json({ success: true, message: "Product updated successfully", product });
    } catch (error) {
        console.error("Error updating product:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

exports.deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: "Product not found!" });
        }

        // Remove the associated image file
        if (product.image) {
            const imagePath = path.join(__dirname, "..", "public", product.image);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath); // Delete file
            }
        }

        await Product.findByIdAndDelete(req.params.id);

        res.status(200).json({ message: "Product deleted successfully!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.deleteSelectedProduct = async (req, res) => {
    try {
        const { productIds } = req.body;
        await Product.deleteMany({ _id: { $in: productIds } });
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting selected products:', error);
        res.json({ success: false, message: 'Error deleting selected products' });
    }
}