const express = require('express');
const Product = require('../../models/Product');
const User = require('../../Models/User');
const Order = require('../../models/Order');
const Category = require('../../models/Category');
const Log = require("../../models/Log");



function getTopCustomers(orders, topN = 4) {
    const customerSpending = {};

    orders.forEach(order => {
        const userId = order.userId._id.toString();
        if (!customerSpending[userId]) {
            customerSpending[userId] = {
                name: order.userId.name,
                email: order.userId.email,
                totalSpent: 0,
                orders: 0
            };
        }
        customerSpending[userId].totalSpent += order.orderTotal;
        customerSpending[userId].orders += 1;
    });

    const sortedCustomers = Object.values(customerSpending)
        .sort((a, b) => b.totalSpent - a.totalSpent)
        .slice(0, topN);

    return sortedCustomers;
}


async function getTopSellingProducts(orders, topN = 5) {
    const productSales = {};
    const categoryPromises = [];


    // Collect product details
    orders.forEach(order => {
        order.items.forEach(item => {
            if (!item.productId) return; // Skip if productId is null
            const productId = item.productId._id.toString();

            if (!productSales[productId]) {
                productSales[productId] = {
                    name: item.productId.name,
                    categoryId: item.productId.category, // Store category ID temporarily
                    totalSold: 0,
                    revenue: 0

                };

            }
            productSales[productId].revenue += (item.quantity * (item.productId.price));
            productSales[productId].totalSold += item.quantity;

        });


    });

    // Fetch categories in batch
    const categoryIds = [...new Set(Object.values(productSales).map(p => p.categoryId))];
    const categories = await Category.find({ _id: { $in: categoryIds } });

    // Map category IDs to names
    const categoryMap = categories.reduce((acc, category) => {
        acc[category._id.toString()] = category.name;
        return acc;
    }, {});

    // Assign category names
    Object.values(productSales).forEach(product => {
        product.category = categoryMap[product.categoryId] || "Unknown";
        delete product.categoryId; // Remove temporary ID
    });

    // Sort and return top N products
    return Object.values(productSales)
        .sort((a, b) => b.totalSold - a.totalSold)
        .slice(0, topN);
}

function calculateTotalRevenue(orders) {
    let totalRevenue = 0;

    for (const order of orders) {
        for (const item of order.items) {
            totalRevenue += item.quantity * item?.productId?.price || 0;
        }
    }

    return totalRevenue;
}

async function getLowStockProducts(dailyUsage = 5, leadTime = 5) {
    const Products = await Product.find({ stock: { $lt: 5 } });

    // Compute reorder point and prepare response
    const alerts = Products.map(product => {
        const reorderPoint = dailyUsage * leadTime;

        return {
            name: product.name,
            stock: product.stock,
            reorderPoint,
        };
    });

    return alerts;
}


exports.dashboard = async (req, res) => {
    try {

        const orders = await Order.find()
            .populate('userId');

        const TopCustomers = getTopCustomers(orders);
        const orders1 = await Order.find().populate('items.productId');
        const TopSellingProducts = await getTopSellingProducts(orders1);
        const TotalRevenue = calculateTotalRevenue(orders1)
        const totalProducts = await Product.countDocuments();
        const totalOrders = await Order.countDocuments();
        const lowStockProducts = await getLowStockProducts()



        const users = await User.find().populate('roles');

        const customers = users.filter(user =>
            user.roles.some(role => role.name === 'customer')
        );

        totalCustomers = customers.length;

        res.json({
            totalProducts,
            totalOrders,
            totalCustomers,
            TopCustomers,
            TopSellingProducts,
            TotalRevenue,
            lowStockProducts
        });
    } catch (error) {
        console.error('Error loading admin dashboard:', error);
        res.status(500).send('Server Error');
    }
}

exports.manageCustomer = async (req, res) => {
    try {

        const users = await User.find().populate('roles');

        // Filter only users where at least one role is 'customer'
        const customers = users.filter(user =>
            user.roles.some(role => role.name === 'customer')
        );

        res.status(200).json(customers);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
}

exports.Log = async (req, res) => {
    try {
        const logs = await Log.find().sort({ timestamp: -1 });
        res.json(logs);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch logs" });
    }
}

exports.deleteLog = async (req, res) => {
    try {
        await Log.deleteMany({});
        res.status(200).json({ message: "All logs deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

const getMonthlySales = async () => {
    const monthlySales = await Order.aggregate([
        {
            $group: {
                _id: { $month: "$createdAt" },
                total: { $sum: "$orderTotal" }
            }
        },
        {
            $sort: { "_id": 1 }
        }
    ]);

    const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const sales = {
        labels: monthlySales.map(s => monthLabels[s._id - 1]),
        values: monthlySales.map(s => s.total)
    };

    return sales;
};

const getMonthlyCustomers = async () => {
    const monthlyCustomers = await User.aggregate([
        {
            $group: {
                _id: { $month: "$createdAt" },
                count: { $sum: 1 }
            }
        },
        { $sort: { "_id": 1 } }
    ]);

    const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const customers = {
        labels: monthlyCustomers.map(c => monthLabels[c._id - 1]),
        values: monthlyCustomers.map(c => c.count)
    };
    return customers;
};

const getOrderStatusData = async () => {
    const orderStatusData = await Order.aggregate([
        {
            $group: {
                _id: "$status", // e.g., "Pending", "Completed"
                count: { $sum: 1 }
            }
        },
        { $sort: { "_id": 1 } }
    ]);

    const orders = {
        labels: orderStatusData.map(o => o._id),
        values: orderStatusData.map(o => o.count)
    };

    return orders;
};

exports.report = async (req, res) => {
    // const hasRole = await User.hasRole(req.user._id, 'admin');
    // console.log(hasRole);

    try {

        const sales = await getMonthlySales();
        const customers = await getMonthlyCustomers();
        const orders = await getOrderStatusData();
        res.json({ sales, customers, orders });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch data" });
    }
}