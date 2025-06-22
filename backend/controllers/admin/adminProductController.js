const Product = require('../../models/Product');
const Promotion = require('../../models/Promotion');
const Category = require('../../models/Category');
const Logger = require("../../middleware/Logger");
const User = require('../../Models/User');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const moment = require('moment');
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
        const Attributes = attributes ? (attributes.map(attribute => JSON.parse(attribute))) : [];
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


        await newProduct.save();

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
                    image: filesMap[variantImageField] ? `/uploads/${filesMap[variantImageField]}` : parsed.image || ''
                };
            })
                .filter(v =>
                    Object.keys(v.attributes).length > 0 ||
                    v.price !== '' ||
                    v.stock !== '' ||
                    v.image !== ''
                )
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
        await Promotion.deleteMany({ product: { $in: productIds } });

        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting selected products:', error);
        res.json({ success: false, message: 'Error deleting selected products' });
    }
}

exports.exportExcel = async (req, res) => {
    try {
        const products = await Product.find().populate('category').populate('reviews.user');


        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Products');

        // Define columns
        sheet.columns = [
            { header: 'Name', key: 'name', width: 20 },
            { header: 'Brand', key: 'brand', width: 20 },
            { header: 'Description', key: 'description', width: 40 },
            { header: 'Price', key: 'price', width: 10 },
            { header: 'Stock', key: 'stock', width: 10 },
            { header: 'Category', key: 'category', width: 20 },
            { header: 'Attributes', key: 'attributes', width: 30 },
            { header: 'Variants', key: 'variants', width: 40 },
            { header: 'Reviews', key: 'reviews', width: 60 },
            { header: 'Average Rating', key: 'averageRating', width: 15 },
            { header: 'Total Reviews', key: 'totalReviews', width: 15 },
            { header: 'Created Date', key: 'createdAt', width: 20 },
            { header: 'Updated Date', key: 'updatedAt', width: 20 },
        ];

        // Add rows
        products.forEach(product => {
            // Format attributes
            const attributesStr = Array.from(product.attributes.entries())
                .map(([key, values]) => `${key}: ${values.join(', ')}`)
                .join('; ');

            // Format variants
            const variantsStr = product.variants.map(v => {
                const attrStr = Array.from(v.attributes.entries())
                    .map(([k, val]) => `${k}: ${val}`).join(', ');
                return `${attrStr}, Price: ${v.price || '-'}, Stock: ${v.stock || '-'}`;
            }).join('; \n');

            const reviewsStr = (product.reviews || []).map(r => {
                const email = r.user?.email || 'N/A';
                return `${email}, ${r.rating}, ${r.comment}`;
            }).join('; \n');


            sheet.addRow({
                name: product.name,
                brand: product.brand,
                description: product.description,
                price: product.price,
                stock: product.stock,
                category: product.category?.name || '',
                attributes: attributesStr,
                variants: variantsStr,
                reviews: reviewsStr,
                averageRating: product.averageRating,
                totalReviews: product.totalReviews,
                createdAt: product?.createdAt?.toLocaleString(),
                updatedAt: product?.updatedAt?.toLocaleString()
            });
        });

        // Format header
        sheet.getRow(1).eachCell(cell => {
            cell.font = { bold: true };
        });

        // Send file
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=products.xlsx');
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('Failed to export Excel:', error);
        res.status(500).json({ message: 'Failed to export Excel' });
    }
};

exports.exportPDF = async (req, res) => {
    try {
        const products = await Product.find().populate('category');

        // Initialize PDF document
        const doc = new PDFDocument({ margin: 30, size: 'A4' });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=products.pdf');

        doc.pipe(res);

        doc.fontSize(18).text('Product Report', { align: 'center' });
        doc.moveDown(1.5);

        products.forEach((product, index) => {
            const attributesStr = Array.from(product.attributes.entries())
                .map(([key, values]) => `${key}: [${values.join(', ')}]`).join('; ');

            const variantsStr = product.variants.map(v => {
                const attrStr = Array.from(v.attributes.entries())
                    .map(([k, val]) => `${k}: ${val}`).join(', ');
                return `{ ${attrStr} | Price: ${v.price || '-'}, Stock: ${v.stock || '-'} }`;
            }).join('\n');

            doc
                .fontSize(12)
                .text(`Name: ${product.name}`)
                .text(`Brand: ${product.brand || '-'}`)
                .text(`Description: ${product.description || '-'}`)
                .text(`Price: $${product.price}`)
                .text(`Stock: ${product.stock}`)
                .text(`Category: ${product.category?.name || '-'}`)
                .text(`Attributes: ${attributesStr}`)
                .text(`Variants: ${variantsStr}`)
                .text(`Average Rating: ${product.averageRating}`)
                .text(`Total Reviews: ${product.totalReviews}`)
                .text(`Created: ${moment(product.createdAt).format('YYYY-MM-DD HH:mm')}`)
                .text(`Updated: ${moment(product.updatedAt).format('YYYY-MM-DD HH:mm')}`)
                .moveDown(1);

            // Add a line between products
            if (index !== products.length - 1) {
                doc.moveTo(30, doc.y).lineTo(570, doc.y).stroke();
                doc.moveDown(1);
            }

            // Check for pagination
            if (doc.y > 700) {
                doc.addPage();
            }
        });

        doc.end();
    } catch (err) {
        console.error('Failed to export PDF:', err);
        res.status(500).json({ message: 'Failed to export PDF' });
    }
};

exports.importExcel = async (req, res) => {
    try {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(req.file.path);

        const sheet = workbook.getWorksheet(1);
        const rows = sheet.getSheetValues().slice(2); // skip header row

        for (let row of rows) {
            if (!row) continue;

            const [
                , // Index 0 is unused
                name,
                brand,
                description,
                price,
                stock,
                imagePathOrUrl,
                categoryName,
                attributesRaw,
                variantsRaw,
                reviewsRaw,
                averageRating,
                totalReviews,
                createdAt,
                updatedAt
            ] = row;


            // -- Required: name, brand, description, price, stock, category
            if (!name || !price || !stock || !categoryName) continue;

            // 1. Category
            let category = await Category.findOne({ name: categoryName });
            if (!category) {
                category = await new Category({ name: categoryName }).save();
            }

            // 2. Attributes (optional)
            const attributes = new Map();
            if (attributesRaw && typeof attributesRaw === 'string') {
                attributesRaw.split(';').forEach(pair => {
                    const [key, values] = pair.split(':');
                    if (key && values) {
                        attributes.set(key.trim(), values.split(',').map(v => v.trim()));
                    }
                });
            }

            // 3. Variants (optional)
            const variants = [];

            if (variantsRaw && typeof variantsRaw === 'string') {
                const variantStrings = variantsRaw.split(';'); // Each variant separated by ;

                for (let str of variantStrings) {
                    const parts = str.trim().split(',');
                    const variant = {
                        attributes: new Map(),
                        price: null,
                        stock: null,
                        image: ''
                    };

                    let rawImagePath = '';

                    parts.forEach(part => {
                        const [k, v] = part.split('=').map(s => s.trim()); // Use '=' instead of ':'
                        if (!k || v === undefined) return;

                        const keyLower = k.toLowerCase();

                        if (keyLower === 'price') {
                            variant.price = parseFloat(v);
                        } else if (keyLower === 'stock') {
                            variant.stock = parseInt(v);
                        } else if (keyLower === 'image') {
                            rawImagePath = v;
                        } else {
                            variant.attributes.set(k, v);
                        }
                    });

                    // Handle image file
                    if (rawImagePath) {
                        if (rawImagePath.startsWith('http')) {
                            variant.image = rawImagePath;
                        } else {
                            const publicDir = path.join(process.cwd(), 'public');
                            const destDir = path.join(publicDir, 'uploads');
                            if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

                            const ext = path.extname(rawImagePath);
                            const uniqueName = `${Date.now()}-${Math.floor(Math.random() * 10000)}${ext}`;
                            const destPath = path.join(destDir, uniqueName);

                            if (fs.existsSync(rawImagePath)) {
                                fs.copyFileSync(rawImagePath, destPath);
                                variant.image = `/uploads/${uniqueName}`;
                            } else {
                                variant.image = rawImagePath;
                            }
                        }
                    }

                    variants.push(variant);
                }
            }

            // 4. Reviews (optional)
            const reviews = [];

            if (reviewsRaw) {
                // If cell is hyperlink object, extract .text
                let rawString;
                if (typeof reviewsRaw === 'object' && reviewsRaw.text) {
                    rawString = reviewsRaw.text;
                } else if (typeof reviewsRaw === 'string') {
                    rawString = reviewsRaw;
                }

                if (rawString) {
                    const reviewItems = rawString.split(';').filter(Boolean);

                    for (let item of reviewItems) {
                        // Each item is: email,rating,comment
                        const [rawEmail, rating, comment] = item.split(',').map(s => s.trim());

                        const email = rawEmail.replace(/^mailto:/i, '');

                        const user = await User.findOne({ email });

                        if (user && rating) {
                            reviews.push({
                                user: user._id,
                                rating: parseInt(rating),
                                comment: comment || '',
                                createdAt: new Date()
                            });
                        }
                    }
                }
            }


            // 5. Image (optional)

            let image = '';
            if (imagePathOrUrl && typeof imagePathOrUrl === 'string') {
                if (!imagePathOrUrl.startsWith('http')) {
                    const publicDir = path.join(process.cwd(), 'public');
                    const destDir = path.join(publicDir, 'uploads');
                    if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

                    const ext = path.extname(imagePathOrUrl);
                    const uniqueName = `${Date.now()}${ext}`;
                    const destPath = path.join(destDir, uniqueName);

                    if (fs.existsSync(imagePathOrUrl)) {
                        fs.copyFileSync(imagePathOrUrl, destPath);
                        image = `/uploads/${uniqueName}`;
                    }
                } else {
                    image = imagePathOrUrl;
                }
            }


            // 6. Save product
            const product = new Product({
                name,
                brand,
                description,
                price,
                stock,
                category: category._id,
                attributes,
                variants,
                reviews,
                image,
                averageRating: parseFloat(averageRating) || 0,
                totalReviews: parseInt(totalReviews) || 0,
                createdAt: createdAt ? new Date(createdAt) : undefined,
                updatedAt: updatedAt ? new Date(updatedAt) : undefined
            });

            await product.save();
        }

        res.status(200).json({ message: 'Products imported successfully' });
    } catch (err) {
        console.error('Excel import failed:', err);
        res.status(500).json({ message: 'Excel import failed' });
    }
};
