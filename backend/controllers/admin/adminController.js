const express = require('express');
const Product = require('../../models/Product');
const User = require('../../Models/User');
const Order = require('../../models/Order');
const Category = require('../../models/Category');
const Log = require("../../models/Log");
const { exportToCSV, exportToExcel, exportToPDF } = require('../../utils/exportUtils');
const logger = require('../../utils/logger.js');


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
            .populate({
                path: 'items.productId',
                populate: {
                    path: 'category', // Assuming Product model has a field like: category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' }
                    select: 'name'
                }
            })
            .populate('userId');;

        const TopCustomers = getTopCustomers(orders);
        const orders1 = await Order.find().populate('items.productId');
        const TopSellingProducts = await getTopSellingProducts(orders1);
        let TotalRevenue = calculateTotalRevenue(orders1)
        const totalRefunds = orders.reduce((acc, o) => acc + (o.refund?.refundedAmount || 0), 0);
        TotalRevenue -= totalRefunds;
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
        setImmediate(async () => {
            try {
                logger.info(`📢 All logs cleared by ${req.user.username}`);
            } catch (error) {
                logger.error("❌ Failed to log:", error);
            }
        });
    } catch (error) {
        logger.error("❌ Error clearing logs:", error);
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
    try {

        const sales = await getMonthlySales();
        const customers = await getMonthlyCustomers();
        const orders = await getOrderStatusData();
        res.json({ sales, customers, orders });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch data" });
    }
}

exports.salesReport = async (req, res) => {
    try {
        const orders = await Order.find({})
            .populate({
                path: 'items.productId',
                populate: {
                    path: 'category', // Assuming Product model has a field like: category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' }
                    select: 'name'
                }
            })
            .populate('userId');
        // Filters (if needed later): status, date, etc.

        const totalSales = orders.reduce((acc, o) => acc + o.orderTotal, 0);
        const totalOrders = orders.length;
        const avgOrderValue = totalOrders ? totalSales / totalOrders : 0;
        const totalRefunds = orders.reduce((acc, o) => acc + (o.refund?.refundedAmount || 0), 0);
        const netSales = totalSales - totalRefunds;

        // Top-selling products
        const productSalesMap = {};
        orders.forEach(order => {
            order.items.forEach(item => {
                const id = item.productId?._id?.toString();
                if (!id) return;

                if (!productSalesMap[id]) {
                    productSalesMap[id] = {
                        name: item.productId.name,
                        units: 0,
                        revenue: 0,
                        returns: 0,
                    };
                }

                productSalesMap[id].units += item.quantity;
                productSalesMap[id].revenue += (item.discountPrice || 0) * item.quantity;
            });

            if (order.refund?.refundedItems) {
                order.refund.refundedItems.forEach(refItem => {
                    const id = refItem.productId.toString();
                    if (productSalesMap[id]) {
                        productSalesMap[id].returns += refItem.quantity;
                    }
                });
            }
        });

        const topProducts = Object.values(productSalesMap)
            .sort((a, b) => b.units - a.units)
            .slice(0, 5);


        // Sales by category (assuming product.category exists)
        const categoryMap = {};
        orders.forEach(order => {
            order.items.forEach(item => {
                const category = item.productId?.category.name || 'Uncategorized';

                if (!categoryMap[category]) {
                    categoryMap[category] = { units: 0, revenue: 0 };
                }
                categoryMap[category].units += item.quantity;
                categoryMap[category].revenue += (item.discountPrice || 0) * item.quantity;
            });
        });


        const salesByCategory = Object.entries(categoryMap).map(([category, data]) => ({
            category,
            units: data.units,
            revenue: data.revenue,
        })).sort((a, b) => b.units - a.units);

        // Sales by country (assuming user has country or address)
        const countryMap = {};
        orders.forEach(order => {
            const country = order.userId?.address.country || 'Unknown';

            if (!countryMap[country]) {
                countryMap[country] = { orders: 0, revenue: 0 };
            }
            countryMap[country].orders += 1;
            countryMap[country].revenue += order.orderTotal;
        });

        const salesByCountry = Object.entries(countryMap).map(([country, data]) => ({
            country,
            orders: data.orders,
            revenue: data.revenue,
        }));

        // Payment methods
        const paymentMap = {};
        orders.forEach(order => {
            const method = order.paymentMethod || 'Unknown';
            if (!paymentMap[method]) {
                paymentMap[method] = { orders: 0, revenue: 0 };
            }
            paymentMap[method].orders += 1;
            paymentMap[method].revenue += order.orderTotal;
        });

        const salesByPayment = Object.entries(paymentMap).map(([method, data]) => ({
            method,
            orders: data.orders,
            revenue: data.revenue,
        }));

        // Customer segment (basic: new vs returning)
        const customerOrders = {};
        orders.forEach(order => {
            const userId = order.userId?._id?.toString();
            if (!userId) return;

            if (!customerOrders[userId]) {
                customerOrders[userId] = [];
            }
            customerOrders[userId].push(order);
        });

        const salesBySegment = [
            {
                segment: "Returning Customers",
                orders: Object.values(customerOrders).filter(arr => arr.length > 1).flat().length,
                revenue: Object.values(customerOrders).filter(arr => arr.length > 1).flat().reduce((acc, o) => acc + o.orderTotal, 0),
                aov: 0,
            },
            {
                segment: "New Customers",
                orders: Object.values(customerOrders).filter(arr => arr.length === 1).flat().length,
                revenue: Object.values(customerOrders).filter(arr => arr.length === 1).flat().reduce((acc, o) => acc + o.orderTotal, 0),
                aov: 0,
            }
        ];
        salesBySegment.forEach(seg => {
            seg.aov = seg.orders ? seg.revenue / seg.orders : 0;
        });

        // Transactions table
        const transactions = orders.map(o => ({
            id: o.orderNumber || o._id,
            date: o.createdAt.toISOString().split('T')[0],
            customer: o.userId?.username || 'Guest',
            total: o.orderTotal,
            status: o.status,
            payment: o.paymentMethod || 'N/A'
        }));


        const now = new Date();
        const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

        // Get orders from both months
        const ordersLastMonth = await Order.find({
            createdAt: { $gte: startOfLastMonth, $lt: startOfThisMonth }
        });

        const ordersThisMonth = await Order.find({
            createdAt: { $gte: startOfThisMonth }
        });

        const salesLastMonth = ordersLastMonth.reduce((acc, o) => acc + o.orderTotal, 0);
        const salesThisMonth = ordersThisMonth.reduce((acc, o) => acc + o.orderTotal, 0);

        const salesGrowth = salesLastMonth === 0
            ? 100
            : ((salesThisMonth - salesLastMonth) / salesLastMonth * 100).toFixed(2);

        // Final response
        res.json({
            totalSales,
            totalOrders,
            avgOrderValue,
            salesGrowth: parseFloat(salesGrowth), // (you can calculate this later)
            totalRefunds,
            netSales,
            topProducts,
            salesByCategory,
            salesByCountry,
            salesByPayment,
            salesBySegment,
            transactions
        });

    } catch (error) {
        console.error("Error generating sales report:", error);
        res.status(500).json({ message: "Server error generating sales report" });
    }
};

exports.salesFilter = async (req, res) => {
    try {
        const { startDate, endDate, status } = req.query;
        const filter = {};

        if (startDate && endDate) {
            filter.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        } else if (startDate) {
            filter.createdAt = { $gte: new Date(startDate) };
        } else if (endDate) {
            filter.createdAt = { $lte: new Date(endDate) };
        }

        if (status && status !== 'All Status') {
            filter.status = status;
        }

        const orders = await Order.find(filter)
            .populate({
                path: 'items.productId',
                populate: {
                    path: 'category',
                    select: 'name'
                }
            })
            .populate('userId');

        const totalSales = orders.reduce((acc, o) => acc + o.orderTotal, 0);
        const totalOrders = orders.length;
        const avgOrderValue = totalOrders ? totalSales / totalOrders : 0;
        const totalRefunds = orders.reduce((acc, o) => acc + (o.refund?.refundedAmount || 0), 0);
        const netSales = totalSales - totalRefunds;

        const productSalesMap = {};
        orders.forEach(order => {
            order.items.forEach(item => {
                const id = item.productId?._id?.toString();
                if (!id) return;

                if (!productSalesMap[id]) {
                    productSalesMap[id] = {
                        name: item.productId.name,
                        units: 0,
                        revenue: 0,
                        returns: 0,
                    };
                }

                productSalesMap[id].units += item.quantity;
                productSalesMap[id].revenue += (item.discountPrice || 0) * item.quantity;
            });

            if (order.refund?.refundedItems) {
                order.refund.refundedItems.forEach(refItem => {
                    const id = refItem.productId.toString();
                    if (productSalesMap[id]) {
                        productSalesMap[id].returns += refItem.quantity;
                    }
                });
            }
        });

        const topProducts = Object.values(productSalesMap)
            .sort((a, b) => b.units - a.units)
            .slice(0, 5);

        const categoryMap = {};
        orders.forEach(order => {
            order.items.forEach(item => {
                const category = item.productId?.category.name || 'Uncategorized';

                if (!categoryMap[category]) {
                    categoryMap[category] = { units: 0, revenue: 0 };
                }
                categoryMap[category].units += item.quantity;
                categoryMap[category].revenue += (item.discountPrice || 0) * item.quantity;
            });
        });

        const salesByCategory = Object.entries(categoryMap).map(([category, data]) => ({
            category,
            units: data.units,
            revenue: data.revenue,
        })).sort((a, b) => b.units - a.units);

        const countryMap = {};
        orders.forEach(order => {
            const country = order.userId?.address.country || 'Unknown';

            if (!countryMap[country]) {
                countryMap[country] = { orders: 0, revenue: 0 };
            }
            countryMap[country].orders += 1;
            countryMap[country].revenue += order.orderTotal;
        });

        const salesByCountry = Object.entries(countryMap).map(([country, data]) => ({
            country,
            orders: data.orders,
            revenue: data.revenue,
        }));

        const paymentMap = {};
        orders.forEach(order => {
            const method = order.paymentMethod || 'Unknown';
            if (!paymentMap[method]) {
                paymentMap[method] = { orders: 0, revenue: 0 };
            }
            paymentMap[method].orders += 1;
            paymentMap[method].revenue += order.orderTotal;
        });

        const salesByPayment = Object.entries(paymentMap).map(([method, data]) => ({
            method,
            orders: data.orders,
            revenue: data.revenue,
        }));

        const customerOrders = {};
        orders.forEach(order => {
            const userId = order.userId?._id?.toString();
            if (!userId) return;

            if (!customerOrders[userId]) {
                customerOrders[userId] = [];
            }
            customerOrders[userId].push(order);
        });

        const salesBySegment = [
            {
                segment: "Returning Customers",
                orders: Object.values(customerOrders).filter(arr => arr.length > 1).flat().length,
                revenue: Object.values(customerOrders).filter(arr => arr.length > 1).flat().reduce((acc, o) => acc + o.orderTotal, 0),
                aov: 0,
            },
            {
                segment: "New Customers",
                orders: Object.values(customerOrders).filter(arr => arr.length === 1).flat().length,
                revenue: Object.values(customerOrders).filter(arr => arr.length === 1).flat().reduce((acc, o) => acc + o.orderTotal, 0),
                aov: 0,
            }
        ];
        salesBySegment.forEach(seg => {
            seg.aov = seg.orders ? seg.revenue / seg.orders : 0;
        });

        const transactions = orders.map(o => ({
            id: o.orderNumber || o._id,
            date: o.createdAt.toISOString().split('T')[0],
            customer: o.userId?.username || 'Guest',
            total: o.orderTotal,
            status: o.status,
            payment: o.paymentMethod || 'N/A'
        }));

        const now = new Date();
        const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

        const ordersLastMonth = await Order.find({
            createdAt: { $gte: startOfLastMonth, $lt: startOfThisMonth }
        });

        const ordersThisMonth = await Order.find({
            createdAt: { $gte: startOfThisMonth }
        });

        const salesLastMonth = ordersLastMonth.reduce((acc, o) => acc + o.orderTotal, 0);
        const salesThisMonth = ordersThisMonth.reduce((acc, o) => acc + o.orderTotal, 0);

        const salesGrowth = salesLastMonth === 0
            ? 100
            : ((salesThisMonth - salesLastMonth) / salesLastMonth * 100).toFixed(2);

        res.json({
            totalSales,
            totalOrders,
            avgOrderValue,
            salesGrowth: parseFloat(salesGrowth),
            totalRefunds,
            netSales,
            topProducts,
            salesByCategory,
            salesByCountry,
            salesByPayment,
            salesBySegment,
            transactions
        });
    } catch (error) {
        console.error("Error generating sales report:", error);
        res.status(500).json({ message: "Server error generating sales report" });
    }
};

exports.export = async (req, res) => {
    try {
        const { type, format } = req.params;
        const { startDate, endDate, status } = req.body;

        const filter = {};
        if (startDate && endDate) {
            filter.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        } else if (startDate) {
            filter.createdAt = { $gte: new Date(startDate) };
        } else if (endDate) {
            filter.createdAt = { $lte: new Date(endDate) };
        }
        if (status && status !== 'All Status') filter.status = status;

        const orders = await Order.find(filter)
            .populate({
                path: 'items.productId',
                populate: { path: 'category', select: 'name' }
            })
            .populate('userId');

        let exportData = [];
        if (type === 'transactions') {
            exportData = orders.map(o => ({
                ID: o.orderNumber || o._id,
                Date: o.createdAt.toISOString().split('T')[0],
                Customer: o.userId?.username || 'Guest',
                Total: o.orderTotal,
                Status: o.status,
                Payment: o.paymentMethod || 'N/A'
            }));
        } else if (type === 'products') {
            const productSales = {};
            orders.forEach(order => {
                order.items.forEach(item => {
                    const id = item.productId?._id?.toString();
                    if (!id) return;

                    if (!productSales[id]) {
                        productSales[id] = {
                            Product: item.productId.name,
                            UnitsSold: 0,
                            Revenue: 0,
                            Returns: 0,
                        };
                    }
                    productSales[id].UnitsSold += item.quantity;
                    productSales[id].Revenue += (item.discountPrice || 0) * item.quantity;
                });

                if (order.refund?.refundedItems) {
                    order.refund.refundedItems.forEach(refItem => {
                        const id = refItem.productId.toString();
                        if (productSales[id]) {
                            productSales[id].Returns += refItem.quantity;
                        }
                    });
                }
            });
            exportData = Object.values(productSales);
        } else if (type === 'category') {
            const categoryMap = {};
            orders.forEach(order => {
                order.items.forEach(item => {
                    const category = item.productId?.category?.name || 'Uncategorized';
                    if (!categoryMap[category]) categoryMap[category] = { Units: 0, Revenue: 0 };
                    categoryMap[category].Units += item.quantity;
                    categoryMap[category].Revenue += (item.discountPrice || 0) * item.quantity;
                });
            });
            exportData = Object.entries(categoryMap).map(([category, data]) => ({
                Category: category,
                Units: data.Units,
                Revenue: data.Revenue
            }));
        } else if (type === 'country') {
            const countryMap = {};
            orders.forEach(order => {
                const country = order.userId?.address?.country || 'Unknown';
                if (!countryMap[country]) countryMap[country] = { Orders: 0, Revenue: 0 };
                countryMap[country].Orders += 1;
                countryMap[country].Revenue += order.orderTotal;
            });
            exportData = Object.entries(countryMap).map(([country, data]) => ({
                Country: country,
                Orders: data.Orders,
                Revenue: data.Revenue
            }));
        } else if (type === 'payment') {
            const paymentMap = {};
            orders.forEach(order => {
                const method = order.paymentMethod || 'Unknown';
                if (!paymentMap[method]) paymentMap[method] = { Orders: 0, Revenue: 0 };
                paymentMap[method].Orders += 1;
                paymentMap[method].Revenue += order.orderTotal;
            });
            exportData = Object.entries(paymentMap).map(([method, data]) => ({
                Method: method,
                Orders: data.Orders,
                Revenue: data.Revenue
            }));
        } else if (type === 'segment') {
            const customerOrders = {};
            orders.forEach(order => {
                const userId = order.userId?._id?.toString();
                if (!userId) return;
                if (!customerOrders[userId]) customerOrders[userId] = [];
                customerOrders[userId].push(order);
            });

            const newOrders = Object.values(customerOrders).filter(arr => arr.length === 1).flat();
            const returningOrders = Object.values(customerOrders).filter(arr => arr.length > 1).flat();

            exportData = [
                {
                    Segment: 'New Customers',
                    Orders: newOrders.length,
                    Revenue: newOrders.reduce((acc, o) => acc + o.orderTotal, 0),
                },
                {
                    Segment: 'Returning Customers',
                    Orders: returningOrders.length,
                    Revenue: returningOrders.reduce((acc, o) => acc + o.orderTotal, 0),
                }
            ];
        } else {
            return res.status(400).send('Invalid report type');
        }

        // Export based on format
        if (format === 'csv') return exportToCSV(res, exportData, type);
        if (format === 'excel') return await exportToExcel(res, exportData, type);
        if (format === 'pdf') return exportToPDF(res, exportData, type);

        res.status(400).send('Invalid export format');

        setImmediate(async () => {
            try {
                logger.info(`📢 ${type}.${format} reports has been exported by ${req.user.username}`);
            } catch (error) {
                logger.error("❌ Failed to log:", error);
            }
        });

    } catch (error) {
        logger.error("❌ Export Error:", error);
        res.status(500).send('Failed to export report');
    }
};

