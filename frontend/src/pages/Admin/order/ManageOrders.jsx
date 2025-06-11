import { useState, useEffect } from "react";
import axios from "axios";
import toastr from "toastr";
import "toastr/build/toastr.min.css";
import { Link, useNavigate } from "react-router-dom";

const ManageOrders = () => {
    const [orders, setOrders] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortField, setSortField] = useState("");
    const [sortDirection, setSortDirection] = useState("asc");
    const [selectedOrders, setSelectedOrders] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const navigate = useNavigate();

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

    const toggleSort = (field) => {
        if (field === sortField) {
            setSortDirection(prev => prev === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortDirection("asc");
        }
    };

    const handleStatusChange = async (orderId, newStatus) => {
        try {
            await axios.post(`/api/admin/orders/${orderId}/update`, { status: newStatus });
            toastr.success("Order status updated!");
            fetchOrders();
        } catch (error) {
            if (error.response.status === 401) navigate('/unauthorized');
            toastr.error("Error updating order status.");
        }
    };

    const handleSelectAll = (e) => {
        setSelectedOrders(e.target.checked ? orders.map(o => o._id) : []);
    };

    const handleSelectOrder = (orderId) => {
        setSelectedOrders(prev =>
            prev.includes(orderId) ? prev.filter(id => id !== orderId) : [...prev, orderId]
        );
    };

    const handleDeleteSelected = async () => {
        if (selectedOrders.length === 0) return toastr.warning("Please select at least one order to delete.");
        if (!window.confirm("Are you sure you want to delete selected orders?")) return;

        try {
            await axios.post("/api/admin/orders/deleteSelected", { orderIds: selectedOrders });
            toastr.success("Selected orders deleted successfully!");
            fetchOrders();
            setSelectedOrders([]);
        } catch {
            toastr.error("Error deleting orders.");
        }
    };

    const handleRowsPerPageChange = (e) => {
        setRowsPerPage(parseInt(e.target.value));
        setCurrentPage(1);
    };

    // Filter and sort logic
    let filteredOrders = orders.filter(order =>
        order.userId.username.toLowerCase().includes(searchTerm) ||
        order.orderNumber.toLowerCase().includes(searchTerm)
    );

    if (sortField) {
        filteredOrders.sort((a, b) => {
            const aValue = sortField === "date" ? new Date(a.createdAt) :
                sortField === "total" ? a.orderTotal :
                    sortField === "customerName" ? a.userId.username.toLowerCase() :
                        a[sortField]?.toLowerCase();

            const bValue = sortField === "date" ? new Date(b.createdAt) :
                sortField === "total" ? b.orderTotal :
                    sortField === "customerName" ? b.userId.username.toLowerCase() :
                        b[sortField]?.toLowerCase();

            if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
            if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
            return 0;
        });
    }

    // Pagination
    const totalPages = Math.ceil(filteredOrders.length / rowsPerPage);
    const displayedOrders = filteredOrders.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

    const renderSortArrow = (field) => {
        if (sortField !== field) return "↕";
        return sortDirection === "asc" ? "↑" : "↓";
    };

    return (
        <div className="container my-4">
            <p className="fs-5 text-muted mb-3">
                Dashboard &gt; <span>Manage Orders</span>
            </p>

            {/* Controls */}
            <div className="row mb-3">
                <div className="col-md-3">
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Search orders..."
                        value={searchTerm}
                        onChange={handleSearch}
                    />
                </div>
                <div className="col-md-4 row">
                    <select className="form-select w-25" onChange={handleRowsPerPageChange} value={rowsPerPage}>
                        {[10, 15, 20, 25, 50].map(n => (
                            <option key={n} value={n}>{n}</option>
                        ))}
                    </select>
                </div>
                <div className="col-md-5 text-end">
                    <button className="btn btn-danger" onClick={handleDeleteSelected}>
                        Delete Selected
                    </button>
                </div>
            </div>

            {/* Orders Table */}
            <table className="table table-borderless table-striped">
                <thead>
                    <tr>
                        <th>
                            <input
                                type="checkbox"
                                onChange={handleSelectAll}
                                checked={selectedOrders.length === orders.length && orders.length > 0}
                            />
                        </th>
                        <th onClick={() => toggleSort("orderNumber")} style={{ cursor: "pointer" }}>
                            Order ID {renderSortArrow("orderNumber")}
                        </th>
                        <th onClick={() => toggleSort("customerName")} style={{ cursor: "pointer" }}>
                            Customer Name {renderSortArrow("customerName")}
                        </th>
                        <th onClick={() => toggleSort("date")} style={{ cursor: "pointer" }}>
                            Date {renderSortArrow("date")}
                        </th>
                        <th onClick={() => toggleSort("status")} style={{ cursor: "pointer" }}>
                            Status {renderSortArrow("status")}
                        </th>
                        <th onClick={() => toggleSort("total")} style={{ cursor: "pointer" }}>
                            Total {renderSortArrow("total")}
                        </th>
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
                                <Link to={`/admin/orders/details/${order._id}`} className="btn btn-light text-primary btn-sm">
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
                    <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                        <button className="page-link" onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}>
                            &lt;
                        </button>
                    </li>
                    {Array.from({ length: totalPages }, (_, i) => (
                        <li key={i + 1} className={`page-item ${i + 1 === currentPage ? "active" : ""}`}>
                            <button className="page-link" onClick={() => setCurrentPage(i + 1)}>
                                {i + 1}
                            </button>
                        </li>
                    ))}
                    <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                        <button className="page-link" onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}>
                            &gt;
                        </button>
                    </li>
                </ul>
            </nav>
        </div>
    );
};

export default ManageOrders;
