const Order = require('../../models/Order');


exports.manageOrder = async (req, res) => {
    const orders = await Order.find().populate('userId');
    res.json({ orders });
}

exports.orderUpdate = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
        const order = await Order.findByIdAndUpdate(id, { status });
        res.json({ order }); // Redirect back to orders page
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).send('Internal Server Error');
    }
}

exports.orderDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const order = await Order.findById(id)
            .populate('userId')
            .populate({
                path: 'items.productId',
                model: 'Product' // Ensure the reference is correct
            })
            .lean();
        res.json({ order });
    } catch (error) {
        console.error('Error loading order details:', error);
        res.status(500).send('Error loading order details');
    }
}

exports.updateOrder = (req, res) => {
    // Logic for updating an order
}

exports.deleteSelectedOrder = async (req, res) => {
    try {
        const { orderIds } = req.body;
        await Order.deleteMany({ _id: { $in: orderIds } });
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting selected Orders:', error);
        res.json({ success: false, message: 'Error deleting selected Orders' });
    }
}
