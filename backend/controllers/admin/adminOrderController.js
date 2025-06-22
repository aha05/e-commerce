const Order = require('../../models/Order');
const User = require('../../Models/User');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const moment = require('moment');
const path = require("path");
const fs = require("fs");


exports.manageOrder = async (req, res) => {
    const orders = await Order.find().populate('userId').populate('refund.refundedItems.productId');
    res.json({ orders });
}

exports.orderUpdate = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    try {
        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found.' });
        }

        // 🛑 Block status change if already Refunded
        if (order.status === "Refunded") {
            return res.status(400).json({ message: 'Cannot update status of a Refunded order.' });
        }

        order.status = status;
        await order.save();

        res.json({ message: 'Order status updated successfully.', order });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).send('Internal Server Error');
    }
};


exports.updateRefund = async (req, res) => {
    const orderId = req.params.id;
    const { status } = req.body;

    if (!orderId) return res.status(400).json({ message: 'Order ID is required' });

    try {
        const order = await Order.findById(orderId);
        if (!order) return res.status(404).json({ message: 'Order not found' });

        if (!order.refund || order.refund.isRefunded) {
            return res.status(400).json({ message: 'No pending refund to approve' });
        }

        // Update refund status
        if (status === 'Approved') {
            order.status = 'Refunded';
            order.refund.isRefunded = true;
            order.refund.approved = true;
            order.refund.refundDate = new Date();
            order.refund.refundedBy = req.user._id; // Assuming admin is authenticated
        } else {
            order.refund.isRefunded = false;
            order.refund.approved = false;
            order.refund.refundDate = new Date();
            order.refund.refundedBy = req.user._id;
        }

        await order.save();

        res.json({ message: 'Refund approved and marked as refunded.' });
    } catch (err) {
        console.error('Refund approval error:', err);
        res.status(500).json({ message: 'Server error during refund approval' });
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

exports.exportExcel = async (req, res) => {
    try {
        const orders = await Order.find()
            .populate('userId', 'email')
            .populate('items.productId', 'name price');

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Orders');

        // Define headers and column widths
        worksheet.columns = [
            { header: 'Order Number', key: 'orderNumber', width: 20 },
            { header: 'Product Name', key: 'productName', width: 30 },
            { header: 'Price', key: 'price', width: 12 },
            { header: 'Quantity', key: 'quantity', width: 10 },
            { header: 'Discount', key: 'discount', width: 12 },
            { header: 'Total Amount', key: 'totalAmount', width: 15 },
            { header: 'Customer Full Name', key: 'customerName', width: 20 },
            { header: 'Customer Email', key: 'customerEmail', width: 25 },
            { header: 'Shipping Address', key: 'shippingAddress', width: 40 },
            { header: 'Payment Method', key: 'paymentMethod', width: 20 },
            { header: 'Status', key: 'status', width: 15 },
            { header: 'Placed On', key: 'placedOn', width: 20 },
        ];

        // Bold the header row
        worksheet.getRow(1).font = { bold: true };

        // Add data rows
        orders.forEach(order => {
            const shipping = order.shippingAddress;
            const fullAddress = `${shipping.fullName}, ${shipping.address}, ${shipping.city}, ${shipping.postalCode}, ${shipping.country}`;
            const placedOn = order.createdAt.toLocaleString();

            order.items.forEach(item => {
                const product = item.productId;
                const price = item.discountPrice ?? product?.price ?? 0;

                worksheet.addRow({
                    orderNumber: order.orderNumber,
                    productName: product?.name || 'N/A',
                    price,
                    quantity: item.quantity,
                    discount: item.discountAmount ?? 0,
                    totalAmount: order.orderTotal,
                    customerName: shipping.fullName,
                    customerEmail: order.userId?.email || 'N/A',
                    shippingAddress: fullAddress,
                    paymentMethod: order.paymentMethod,
                    status: order.status,
                    placedOn
                });
            });
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=orders.xlsx');

        await workbook.xlsx.write(res);
        res.end();
    } catch (err) {
        console.error('Excel export error:', err);
        res.status(500).json({ error: 'Failed to export orders to Excel' });
    }
};

exports.exportPDF = async (req, res) => {
    try {
        const orders = await Order.find()
            .populate('userId', 'email')
            .populate('items.productId', 'name price');

        const doc = new PDFDocument({ margin: 30, size: 'A4' });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=orders.pdf');

        doc.pipe(res);

        doc.fontSize(12).text('Order Report', { align: 'center', underline: true });
        doc.moveDown(1);

        orders.forEach(order => {
            const shipping = order.shippingAddress;
            const fullAddress = `${shipping.fullName}, ${shipping.address}, ${shipping.city}, ${shipping.postalCode}, ${shipping.country}`;
            const placedOn = order.createdAt.toLocaleString();

            order.items.forEach(item => {
                const product = item.productId;
                const price = item.discountPrice ?? product?.price ?? 0;

                doc.font('Helvetica-Bold').text('Order Number: ', { continued: true }).font('Helvetica').text(order.orderNumber);
                doc.font('Helvetica-Bold').text('Product Name: ', { continued: true }).font('Helvetica').text(product?.name || 'N/A');
                doc.font('Helvetica-Bold').text('Price: ', { continued: true }).font('Helvetica').text(`$${price}`);
                doc.font('Helvetica-Bold').text('Quantity: ', { continued: true }).font('Helvetica').text(item.quantity);
                doc.font('Helvetica-Bold').text('Discount: ', { continued: true }).font('Helvetica').text(item.discountAmount ?? 0);
                doc.font('Helvetica-Bold').text('Total Amount: ', { continued: true }).font('Helvetica').text(`$${order.orderTotal}`);
                doc.font('Helvetica-Bold').text('Customer Name: ', { continued: true }).font('Helvetica').text(shipping.fullName);
                doc.font('Helvetica-Bold').text('Customer Email: ', { continued: true }).font('Helvetica').text(order.userId?.email || 'N/A');
                doc.font('Helvetica-Bold').text('Shipping Address: ', { continued: true }).font('Helvetica').text(fullAddress);
                doc.font('Helvetica-Bold').text('Payment Method: ', { continued: true }).font('Helvetica').text(order.paymentMethod);
                doc.font('Helvetica-Bold').text('Status: ', { continued: true }).font('Helvetica').text(order.status);
                doc.font('Helvetica-Bold').text('Placed On: ', { continued: true }).font('Helvetica').text(placedOn);

                doc.moveDown(1);
            });
        });

        doc.end();
    } catch (err) {
        console.error('PDF export error:', err);
        res.status(500).json({ error: 'Failed to export orders to PDF' });
    }
};

