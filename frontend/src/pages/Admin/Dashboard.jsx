import React from "react";
import { useEffect, useState } from "react";
import axios from "axios";
import SelesChart from "./report/SelesChart";
import CustomerGrowthChart from "./report/CustomerGrowthChart";
import 'bootstrap-icons/font/bootstrap-icons.css';
import { Link, useNavigate } from 'react-router-dom';


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
            <div className="row g-4">
                {[
                    {
                        title: "Total Products",
                        value: data.totalProducts,
                        icon: "bi-box-seam",
                        bg: "bg-light shadow"
                    },
                    {
                        title: "Total Orders",
                        value: data.totalOrders,
                        icon: "bi-cart-check",
                        bg: "bg-light shadow"
                    },
                    {
                        title: "Total Customers",
                        value: data.totalCustomers,
                        icon: "bi-people",
                        bg: "bg-light shadow"
                    },
                    {
                        title: "Revenue",
                        value: `$${data.TotalRevenue}`,
                        icon: "bi-currency-exchange",
                        bg: "bg-light shadow"
                    },
                ].map((card, index) => (
                    <div className="col-md-3" key={index}>
                        <div className={`card ${card.bg} text-dark border-0`}>
                            <div className="card-body d-flex row">
                                <div className="mb-1 col-2">
                                    <i className={`bi ${card.icon} fs-2 fw-bold text-muted`}></i>
                                </div>
                                <div className="col-8 ms-auto text-end">
                                    <span className="display-6 fw-semibold text-end me-2">{card.value}</span>
                                    <h6 className="fs-6 fw-light text-muted" style={{ color: '#bbb' }}>{card.title}</h6>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>


            {/* Recent Orders */}
            <div className="card border-0 shadow-sm row my-4 mx-2">
                <div className="card-body col">
                    <p className="fs-5">Recent Orders</p>
                    <table className="table">
                        <thead>
                            <tr>
                                <th className="text-muted">Order ID</th>
                                <th className="text-muted">Customer Name</th>
                                <th className="text-muted">Date</th>
                                <th className="text-muted">Status</th>
                                <th className="text-muted">Total</th>
                                <th className="text-muted">Actions</th>
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
                                    <td><Link to={`/admin/orders/details/${order._id}`} key={order._id} className="btn btn-primary btn-sm">View</Link></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Top-Selling Products */}
            <div className="card border-0 shadow-sm row my-4 mx-2">
                <div className="card-body col">
                    <p className="fs-5">Top-Selling Products</p>
                    <table className="table">
                        <thead>
                            <tr>
                                <th className="text-muted">Product Name</th>
                                <th className="text-muted">Category</th>
                                <th className="text-muted">Units Sold</th>
                                <th className="text-muted">Total Revenue</th>
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
                    <div className="col card border-0 shadow-sm me-2">
                        <div className="card-body">
                            <p className="fs-5">Tasks & Reminders</p>
                            <ul className="list-group list-group-flush">
                                <TaskItem text="Process pending orders" badgeClass="bg-warning text-dark" badgeText="Pending" />
                                <TaskItem text="Reorder low-stock items" badgeClass="bg-danger" badgeText="Urgent" />
                                <TaskItem text="Update promotional content" badgeClass="bg-info" badgeText="Upcoming" />
                                <TaskItem text="Review new customer sign-ups" badgeClass="bg-success" badgeText="Done" />
                            </ul>
                        </div>
                    </div>

                    {/* Inventory Alerts */}
                    <div className="col card border-0 shadow-sm ms-2">
                        <div className="card-body">
                            <p className="fs-5">Inventory Alerts</p>
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
                <th className="text-muted">Product</th>
                <th className="text-muted">Stock Level</th>
                <th className="text-muted">Reorder Point</th>
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
    <div className="col card border-0 shadow-sm mx-2">
        <div className="card-body">
            <p className="fs-5">{title}</p>
            <table className="table table-hover">
                <thead>
                    <tr>
                        <th className="text-muted">Profile</th>
                        <th className="text-muted">Name</th>
                        <th className="text-muted">{title === "Top Customers" ? "Orders" : "Registration Date"}</th>
                        {title === "Top Customers" && <th className="text-muted">Spending</th>}
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
    <div className="col-7 card border-0 shadow-sm me-2">
        <div className="card-body">
            <p className="fs-5 mb-2">Ongoing Promotions</p>
            <ul className="list-group border-0">
                {promotions.map((promotion, index) => (
                    <li key={index} className="list-group-item border-0 d-flex justify-content-between align-items-center">
                        <div>
                            <strong className="text-muted">{promotion.name}</strong>
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
    <div className="col-4 card border-0 ms-2">
        <div className="card-body">
            <p className="fs-5">Quick Actions</p>
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
