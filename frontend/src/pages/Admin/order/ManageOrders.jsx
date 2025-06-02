import { useState, useEffect } from "react";
import axios from "axios";
import toastr from "toastr";
import "toastr/build/toastr.min.css";
import { Link } from "react-router-dom";

const ManageOrders = () => {
    const [orders, setOrders] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortOrder, setSortOrder] = useState("");
    const [selectedOrders, setSelectedOrders] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 3;

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const response = await axios.get("/api/admin/orders");
            setOrders(response.data.orders);
        } catch (error) {
            console.error("Error fetching orders:", error);
        }
    };

    const handleSearch = (e) => {
        setSearchTerm(e.target.value.toLowerCase());
        setCurrentPage(1);
    };

    const handleSort = (field) => {
        setSortOrder(field);
    };

    const handleStatusChange = async (orderId, newStatus) => {
        try {
            await axios.post(`/api/admin/orders/${orderId}/update`, { status: newStatus });
            toastr.success("Order status updated!");
            fetchOrders(); // Refresh orders
        } catch (error) {
            if (error.response.status === 401) navigate('/unauthorized');
            toastr.error("Error updating order status.");
        }
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedOrders(orders.map(order => order._id));
        } else {
            setSelectedOrders([]);
        }
    };

    const handleSelectOrder = (orderId) => {
        setSelectedOrders((prev) =>
            prev.includes(orderId) ? prev.filter(id => id !== orderId) : [...prev, orderId]
        );
    };

    const handleDeleteSelected = async () => {
        if (selectedOrders.length === 0) {
            toastr.warning("Please select at least one order to delete.");
            return;
        }
        if (!window.confirm("Are you sure you want to delete selected orders?")) return;

        try {
            await axios.post("/api/admin/orders/deleteSelected", { orderIds: selectedOrders });
            toastr.success("Selected orders deleted successfully!");
            fetchOrders();
            setSelectedOrders([]);
        } catch (error) {
            toastr.error("Error deleting orders.");
        }
    };

    // Filter and sort orders
    let filteredOrders = orders.filter(order =>
        order.userId.username.toLowerCase().includes(searchTerm) ||
        order.orderNumber.toLowerCase().includes(searchTerm)
    );

    if (sortOrder) {
        filteredOrders.sort((a, b) => {
            if (sortOrder === "orderId") return a.orderNumber.localeCompare(b.orderNumber);
            if (sortOrder === "customerName") return a.userId.username.localeCompare(b.userId.username);
            if (sortOrder === "date") return new Date(a.createdAt) - new Date(b.createdAt);
            if (sortOrder === "status") return a.status.localeCompare(b.status);
            if (sortOrder === "total") return a.orderTotal - b.orderTotal;
            return 0;
        });
    }

    // Pagination logic
    const totalPages = Math.ceil(filteredOrders.length / rowsPerPage);
    const displayedOrders = filteredOrders.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

    return (
        <div className="container my-4">
            <h3 className="p-2 pb-0 mb-4">
                Dashboard &gt; <span className="text-primary">Manage Orders</span>
            </h3>

            {/* Search and Sort */}
            <div className="row mb-3">
                <div className="col-md-4">
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Search orders..."
                        value={searchTerm}
                        onChange={handleSearch}
                    />
                </div>
                <div className="col-md-4">
                    <select className="form-select" value={sortOrder} onChange={(e) => handleSort(e.target.value)}>
                        <option value="">Sort by</option>
                        <option value="orderId">Order ID</option>
                        <option value="customerName">Customer Name</option>
                        <option value="date">Date</option>
                        <option value="status">Status</option>
                        <option value="total">Total</option>
                    </select>
                </div>
            </div>

            {/* Orders Table */}
            <table className="table table-bordered table-striped">
                <thead>
                    <tr>
                        <th>
                            <input type="checkbox" onChange={handleSelectAll} checked={selectedOrders.length === orders.length} />
                        </th>
                        <th onClick={() => handleSort("orderId")}>Order ID</th>
                        <th onClick={() => handleSort("customerName")}>Customer Name</th>
                        <th onClick={() => handleSort("date")}>Date</th>
                        <th onClick={() => handleSort("status")}>Status</th>
                        <th onClick={() => handleSort("total")}>Total</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {displayedOrders.map(order => (
                        <tr key={order._id}>
                            <td>
                                <input
                                    type="checkbox"
                                    checked={selectedOrders.includes(order._id)}
                                    onChange={() => handleSelectOrder(order._id)}
                                />
                            </td>
                            <td>{order.orderNumber}</td>
                            <td>{order.userId.username}</td>
                            <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                            <td>
                                <select
                                    value={order.status}
                                    onChange={(e) => handleStatusChange(order._id, e.target.value)}
                                    className="form-select form-select-sm"
                                >
                                    <option value="Pending">Pending</option>
                                    <option value="Shipped">Shipped</option>
                                    <option value="Delivered">Delivered</option>
                                    <option value="Cancelled">Cancelled</option>
                                </select>
                            </td>
                            <td>${order.orderTotal.toFixed(2)}</td>
                            <td>
                                <Link to={`/admin/orders/details/${order._id}`} key={order._id} className="btn btn-primary btn-sm">
                                    <i className="fas fa-eye"></i> View
                                </Link>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Pagination */}
            <nav>
                <ul className="pagination justify-content-center">
                    {[...Array(totalPages)].map((_, i) => (
                        <li key={i} className={`page-item ${i + 1 === currentPage ? "active" : ""}`}>
                            <button className="page-link" onClick={() => setCurrentPage(i + 1)}>{i + 1}</button>
                        </li>
                    ))}
                </ul>
            </nav>

            {/* Delete Selected Button */}
            <button className="btn btn-danger mt-3" onClick={handleDeleteSelected}>
                Delete Selected
            </button>
        </div>
    );
};

export default ManageOrders;
