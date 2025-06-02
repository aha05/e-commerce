const Product = require('../models/Product');
const Promotion = require('../models/Promotion');
const Category = require('../models/Category')
const Order = require('../models/Order');
const { convertPrice } = require('../utils/currencyConverter');


async function applyDiscount(products) {

    const now = new Date();
    const autoPromotions = await Promotion.find({
        type: 'auto',
        isActive: true,
        startDate: { $lte: now },
        endDate: { $gte: now },
    });

    // handle both single and multiple products
    const isSinge = !Array.isArray(products);
    products = !Array.isArray(products) ? [products] : products;

    // Apply matching promotion to each product
    const productsWithDiscount = products.map(product => {
        const promo = autoPromotions.find(p => p.product.toString() === product._id.toString());

        const discountAmount = promo
            ? (product.price * promo.discountPercentage) / 100
            : 0;

        const discount = promo ? product.price - discountAmount : product.price;

        const discountPercentage = promo ? promo.discountPercentage : 0;

        return {
            ...product,
            price: discount,
            discountPercentage
        };
    });

    return isSinge ? productsWithDiscount[0] : productsWithDiscount;
}

exports.getProductById = async (req, res) => {

    const product = await Product.findById(req.params.productId).populate('category');
    if (!product) {
        return res.status(404).json({ message: "Product not found" });
    }

    const products = await Product.find({
        category: product.category._id,
        _id: { $ne: product._id } // Exclude the original product from the list
    }).populate('category');

    const formattedProducts = products.map(p => ({
        ...p.toObject(),
        price: convertPrice(p.price, req.currency),
        currency: req.currency
    }));

    const formattedProduct = {
        ...product.toObject(), // convert mongoose doc to plain object
        price: convertPrice(product.price, req.currency),
        currency: req.currency,
    };

    const productsWithDiscount = await applyDiscount(formattedProduct);
    const productsWithDiscounts = await applyDiscount(formattedProducts);

    res.json({ product: productsWithDiscount, relatedProducts: productsWithDiscounts });
};

exports.getProductByCategory = async (req, res) => {
    try {
        const categoryId = req.params.categoryId;

        // Find products in the given category
        const products = await Product.find({ category: categoryId }).populate('category');

        if (!products) {
            return res.status(404).send('No products found for this category');
        }

        const cart = req.session.cart;

        // set currency
        const formattedProducts = products.map(p => ({
            ...p.toObject(),
            price: convertPrice(p.price, req.currency),
            currency: req.currency
        }));

        const productsWithDiscount = await applyDiscount(formattedProducts);

        res.json({ products: productsWithDiscount, cart });

    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching products');
    }
};

exports.pendingReview = async (req, res) => {

    const orders = await Order.find({
        userId: req.user._id,
        status: 'Delivered',
    }).populate('items.productId');

    const pendingProducts = [];

    for (const order of orders) {
        for (const item of order.items) {
            const product = item.productId;
            if (!product) continue;

            // Check if the user already reviewed this product
            const alreadyReviewed = product.reviews.some(r => r.user.toString() === req.user._id.toString());

            if (!alreadyReviewed) {
                pendingProducts.push({
                    orderId: order._id,
                    product,
                    productId: product._id
                });
            }
        }
    }

    res.json(pendingProducts);
}

exports.review = async (req, res) => {

    const { rating, comment } = req.body;

    try {
        const product = await Product.findById(req.params.productId);

        if (!product) return res.status(404).json({ message: 'Product not found' });

        // Check if the user already reviewed
        const alreadyReviewed = product.reviews.find(r => r.user.toString() === req.user._id.toString());
        if (alreadyReviewed) {
            return res.status(400).json({ message: 'You already reviewed this product' });
        }

        const review = {
            user: req.user._id,
            rating: Number(rating),
            comment,
        };

        product.reviews.push(review);

        // Update totalReviews
        product.totalReviews = product.reviews.length;

        // Calculate new average rating
        const totalRating = product.reviews.reduce((acc, r) => acc + r.rating, 0);
        product.averageRating = totalRating / product.reviews.length;

        await product.save();

        res.status(201).json({ message: 'Review added successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.filter = async (req, res) => {
    const { categories, price, rating, inStock, discount, categoryId } = req.body;

    const query = {
        price: { $lte: Number(price) }
    };

    // Category filter
    if (categories && categories.length > 0) {
        query.category = { $in: categories };
    }

    // Rating filter
    if (rating) {
        query.averageRating = { $gte: Number(rating) };
    }

    // In stock filter
    if (inStock) {
        query.stock = { $gt: 0 }; // assuming quantity > 0 means in stock
    }



    try {
        let products = await Product.find(query);
        // Discount filter

        const formattedProducts = products.map(p => ({
            ...p.toObject(),
            price: convertPrice(p.price, req.currency),
            currency: req.currency
        }));


        products = await applyDiscount(formattedProducts);

        if (discount) {
            products = products.filter(p => p.discountPercentage >= discount);
        }

        res.json({ products });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to filter products' });
    }

}
// not used
exports.searchResult = async (req, res) => {

    const keyword = req.params.keyword;

    try {
        const products = await Product.find({
            name: { $regex: keyword, $options: 'i' }
        }).limit(10); // Limit results

        res.json(products);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
}

