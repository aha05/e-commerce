import React from "react";
import { useEffect, useState } from "react";
import axios from "axios";
import SelesChart from "./report/SelesChart";
import CustomerGrowthChart from "./report/CustomerGrowthChart";
import { useNavigate } from 'react-router-dom';


const Dashboard = () => {
    const [data, setData] = useState({ orders: 0, users: 0, revenue: 0 });
    const [orders, setOrders] = useState([]);
    const [customers, setCustomer] = useState([]);
    const [promotions, setPromotions] = useState([]);
    const [TopCustomers, setTopCustomers] = useState([]);
    const [TopSellingProducts, setTopSellingProducts] = useState([]);
    const [lowStockProducts, setLowStockProducts] = useState([]);

    const navigate = useNavigate();

    useEffect(() => {
        const fetchTopSellingProducts = async () => {
            try {
                const response = await axios.get("/api/admin/dashboard");
                setTopSellingProducts(response.data.TopSellingProducts);
            } catch (error) {
                if (error.response.status === 401) navigate('/unauthorized');
                console.error("Failed to fetch top-selling products:", error);

            }
        };

        const fetchLowStockProducts = async () => {
            try {
                const response = await axios.get("/api/admin/dashboard");
                setLowStockProducts(response.data.lowStockProducts);
            } catch (error) {
                
                console.error("Failed to fetch top-selling products:", error);
            }
        };

        fetchTopSellingProducts();
        fetchLowStockProducts();
    }, []);

    useEffect(() => {
        axios.get("/api/admin/dashboard").then((response) => {
            setData(response.data);
            setTopCustomers(response.data.TopCustomers)
        });

        axios.get("/api/admin/orders").then((response) => {
            setOrders(
                response.data.orders
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                    .slice(0, 4)

            )
        });

        axios.get("/api/admin/customers").then((response) => {
            setCustomer(
                response.data
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                    .slice(0, 4)
            )
        });

        axios.get("/api/admin/promotions").then((response) => {
            setPromotions(
                response.data.promotions
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                    .slice(0, 4)
            )
        });

    }, []);

    return (
        <div className="container mt-4">
            {/* Dashboard Cards */}
            <div className="row">
                {[
                    { title: "Total Products", value: data.totalProducts, bg: "bg-danger" },
                    { title: "Total Orders", value: data.totalOrders, bg: "bg-warning" },
                    { title: "Total Customers", value: data.totalCustomers, bg: "bg-primary" },
                    { title: "Revenue", value: `$${data.TotalRevenue}`, bg: "bg-success" },
                ].map((card, index) => (
                    <div className="col-md-3" key={index}>
                        <div className={`card ${card.bg} text-white`}>
                            <div className="card-body">
                                <h5 className="card-title">{card.title}</h5>
                                <p className="card-text display-6">{card.value}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Recent Orders */}
            <div className="card shadow-sm row my-4 mx-2">
                <div className="card-body col">
                    <h4>Recent Orders</h4>
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>Customer Name</th>
                                <th>Date</th>
                                <th>Status</th>
                                <th>Total</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map((order, index) => (
                                <tr key={index}>
                                    <td>{order.orderNumber}</td>
                                    <td>{order.userId.name}</td>
                                    <td>{new Date(order.createdAt).toDateString()}</td>
                                    <td>{order.status}</td>
                                    <td>${order.orderTotal.toFixed(2)}</td>
                                    <td><button className="btn btn-primary btn-sm">View</button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Top-Selling Products */}
            <div className="card shadow-sm row my-4 mx-2">
                <div className="card-body col">
                    <h4>Top-Selling Products</h4>
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Product Name</th>
                                <th>Category</th>
                                <th>Units Sold</th>
                                <th>Total Revenue</th>
                            </tr>
                        </thead>
                        <tbody>
                            {TopSellingProducts.map((product, index) => (
                                <tr key={index}>
                                    <td>{product.name}</td>
                                    <td>{product.category}</td>
                                    <td>{product.totalSold}</td>
                                    <td>{product.revenue}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Tasks & Reminders */}
            <div>
                <div className="row my-4 mx-2">
                    <div className="col card shadow-sm me-2">
                        <div className="card-body">
                            <h5 className="mb-0">Tasks & Reminders</h5>
                            <ul className="list-group list-group-flush">
                                <TaskItem text="Process pending orders" badgeClass="bg-warning text-dark" badgeText="Pending" />
                                <TaskItem text="Reorder low-stock items" badgeClass="bg-danger" badgeText="Urgent" />
                                <TaskItem text="Update promotional content" badgeClass="bg-info" badgeText="Upcoming" />
                                <TaskItem text="Review new customer sign-ups" badgeClass="bg-success" badgeText="Done" />
                            </ul>
                        </div>
                    </div>

                    {/* Inventory Alerts */}
                    <div className="col card shadow-sm ms-2">
                        <div className="card-body">
                            <h4>Inventory Alerts</h4>
                            <InventoryTable lowStockProducts={lowStockProducts} />
                        </div>
                    </div>
                </div>

                {/* Customers Section */}
                <div className="row mx-1">
                    <CustomerTable title="Recent Customers" customers={customers} />
                    <CustomerTable title="Top Customers" customers={TopCustomers} />
                </div>

                {/* Ongoing Promotions */}
                <div className="row my-4 mx-2">
                    <PromotionList promotions={promotions} />
                    <QuickActions />
                </div>

                {/* Sales Analytics & Customer Growth */}
                <div className="row my-4 mx-2">
                    <div className="col-md-6">
                        <SelesChart />
                    </div>
                    <div className="col-md-6">
                        <CustomerGrowthChart />
                    </div>
                </div>
            </div>
        </div>
    );
};

const TaskItem = ({ text, badgeClass, badgeText }) => (
    <li className="list-group-item d-flex justify-content-between align-items-center">
        {text}
        <span className={`badge ${badgeClass}`}>{badgeText}</span>
    </li>
);

const InventoryTable = ({ lowStockProducts }) => (
    <table className="table">
        <thead>
            <tr>
                <th>Product</th>
                <th>Stock Level</th>
                <th>Reorder Point</th>
            </tr>
        </thead>
        <tbody>
            {lowStockProducts.length === 0 ? (
                <tr>
                    <td colSpan="3">No low stock products</td>
                </tr>
            ) : (
                lowStockProducts.map((product, index) => (
                    <tr key={index}>
                        <td>{product.name}</td>
                        <td>{product.stock}</td>
                        <td>{product.reorderPoint}</td>
                    </tr>
                ))
            )}
        </tbody>
    </table>
);

const CustomerTable = ({ title, customers }) => (
    <div className="col card shadow-sm mx-2">
        <div className="card-body">
            <h5>{title}</h5>
            <table className="table table-hover">
                <thead>
                    <tr>
                        <th>Profile</th>
                        <th>Name</th>
                        <th>{title === "Top Customers" ? "Orders" : "Registration Date"}</th>
                        {title === "Top Customers" && <th>Spending</th>}
                    </tr>
                </thead>
                <tbody>
                    {customers.map((customer, index) => (
                        <tr key={index}>
                            <td>
                                <img src={customer.image} alt={customer.name || customer.userId.name} className="rounded-circle" width="30" height="30" />
                            </td>
                            <td>{customer.name || customer.userId.name}</td>
                            <td>{customer.orders || new Date(customer.createdAt).toDateString()}</td>
                            {customer.totalSpent && <td>${customer.totalSpent.toFixed(2)}</td>}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);

const PromotionList = ({ promotions }) => (
    <div className="col-7 card me-2">
        <div className="card-body">
            <h5 className="mb-0">Ongoing Promotions</h5>
            <ul className="list-group">
                {promotions.map((promotion, index) => (
                    <li key={index} className="list-group-item d-flex justify-content-between align-items-center">
                        <div>
                            <strong>{promotion.name}</strong>
                            <p className="mb-0 text-muted">Discount: {promotion.discountPercentage}% | Valid until: {new Date(promotion.endDate).toDateString()}</p>
                        </div>
                        <div>
                            <button className="btn btn-sm btn-warning me-2">Edit</button>
                            <button className="btn btn-sm btn-danger">Delete</button>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    </div>
);

const QuickActions = () => (
    <div className="col-4 card ms-2">
        <div className="card-body">
            <h5 className="mb-0">Quick Actions</h5>
            <form>
                <div className="mb-3">
                    <label className="form-label">Promotion Name</label>
                    <input type="text" className="form-control" placeholder="Enter promotion name" />
                </div>
                <div className="mb-3">
                    <label className="form-label">Discount (%)</label>
                    <input type="number" className="form-control" placeholder="e.g., 20" />
                </div>
                <div className="mb-3">
                    <label className="form-label">Valid Until</label>
                    <input type="date" className="form-control" />
                </div>
                <button type="submit" className="btn btn-primary w-100">Add Promotion</button>
            </form>
        </div>
    </div>
);



export default Dashboard;
