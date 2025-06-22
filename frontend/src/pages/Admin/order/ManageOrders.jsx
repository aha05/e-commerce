import { useState, useEffect, useRef } from "react";
import axios from "axios";
import toastr from "toastr";
import "toastr/build/toastr.min.css";
import { Link, useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import * as bootstrap from "bootstrap";
import '../../../styles/tooltip.css'
import { hasPermission } from '../../../utils/authUtils';
import { useAuth } from '../../../contexts/AuthContext';

const ManageOrders = () => {
    const { user } = useAuth();
    const [orders, setOrders] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortField, setSortField] = useState("");
    const [sortDirection, setSortDirection] = useState("asc");
    const [selectedOrders, setSelectedOrders] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [selectedRefundOrder, setSelectedRefundOrder] = useState(null);
    const [showRefundModal, setShowRefundModal] = useState(false);

    const openRefundModal = (order) => {
        setSelectedRefundOrder(order);
        setShowRefundModal(true);
    };

    const closeRefundModal = () => {
        setSelectedRefundOrder(null);
        setShowRefundModal(false);
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const response = await axios.get("/api/admin/orders");
            setOrders(response.data.orders);
        } catch (error) {
            toastr.error(error.response.data.message || 'Error');
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
            toastr.error(error.response.data.message || 'Error');
        }
    };

    const handleRefundStatusChange = async (orderId, status) => {
        try {
            await axios.post(`/api/admin/orders/${orderId}/refund`, { status: status });
            toastr.success("Order status updated!");
            fetchOrders();
        } catch (error) {
            toastr.error(error.response.data.message || 'Error');
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
        } catch (error) {
            toastr.error(error?.response?.data?.message || 'Error');
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

    useEffect(() => {
        const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
        tooltipTriggerList.forEach((tooltipTriggerEl) => {
            new bootstrap.Tooltip(tooltipTriggerEl);
        });
    }, []);

    const [loadingExcelExport, setLoadingExcelExport] = useState(false);
    const [loadingPDFExport, setLoadingPDFExport] = useState(false);


    const exportFile = async (type, format) => {
        if (format === "pdf") {
            setLoadingPDFExport(true);
        } else {
            setLoadingExcelExport(true);
        }

        try {
            const url = `/api/admin/${type}/export/${format}`;
            const response = await fetch(url);

            if (!response.ok) throw new Error(response.statusText);

            const blob = await response.blob();
            const fileExtension = format === "excel" ? "xlsx" : "pdf";
            const fileName = `${type}.${fileExtension}`;

            const link = document.createElement("a");
            link.href = window.URL.createObjectURL(blob);
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(link.href);

            toastr.success(`Exported ${fileName} successfully`);
        } catch (error) {
            toastr.error(error);
        } finally {
            setLoadingPDFExport(false);
            setLoadingExcelExport(false);
        }
    };


    return (
        <div className="container my-4" style={{ height: '100% !important' }}>
            <p className="fs-5 text-muted mb-3">
                <span>Manage Orders</span>
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
                <div className="d-flex justify-content-end col">
                    <div className="row g-2 me-2">
                        {hasPermission(user, 'order_excel_export') && (
                            <div className="col-auto">
                                <button
                                    className="btn btn-success d-flex align-items-center gap-2"
                                    onClick={() => exportFile("orders", "excel")}
                                    disabled={loadingExcelExport}
                                    data-bs-toggle="tooltip"
                                    data-bs-placement="top"
                                    data-bs-html="true"
                                    title="<strong>Export to Excel</strong><br/>Includes all order data"
                                    data-bs-custom-class="custom-tooltip"
                                >
                                    <span><i className="fas fa-file-excel"></i></span>
                                    {loadingExcelExport && (
                                        <span className="spinner-border spinner-border-sm text-light" role="status" />
                                    )}
                                </button>
                            </div>
                        )}
                        {hasPermission(user, 'order_pdf_export') && (
                            <div className="col-auto">
                                <button
                                    className="btn btn-danger d-flex align-items-center gap-2"
                                    onClick={() => exportFile("orders", "pdf")}
                                    disabled={loadingPDFExport}
                                    data-bs-toggle="tooltip"
                                    data-bs-placement="top"
                                    title="Export PDF File"
                                    data-bs-custom-class="custom-tooltip"
                                >
                                    <span><i className="fas fa-file-pdf"></i></span>
                                    {loadingPDFExport && (
                                        <span className="spinner-border spinner-border-sm text-light" role="status" />
                                    )}
                                </button>
                            </div>
                        )}
                        {hasPermission(user, 'delete_selected_order') && (
                            <div className="col-auto">
                                <button className="btn btn-danger d-flex align-items-center"
                                    onClick={handleDeleteSelected}
                                    data-bs-toggle="tooltip"
                                    data-bs-placement="top"
                                    title="Delete Selected Items"
                                    data-bs-custom-class="custom-tooltip" >

                                    <span><i className="fas fa-trash"></i></span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Orders Table */}
            <table className="table p-0">
                <thead>
                    <tr>
                        {hasPermission(user, 'delete_selected_order') && (
                            <th className="text-muted">
                                <input
                                    type="checkbox"
                                    onChange={handleSelectAll}
                                    checked={selectedOrders.length === orders.length && orders.length > 0}
                                />
                            </th>
                        )}
                        <th className="text-muted" onClick={() => toggleSort("orderNumber")} style={{ cursor: "pointer" }}>
                            Order ID {renderSortArrow("orderNumber")}
                        </th>
                        <th className="text-muted" onClick={() => toggleSort("customerName")} style={{ cursor: "pointer" }}>
                            Customer Name {renderSortArrow("customerName")}
                        </th>
                        <th className="text-muted" onClick={() => toggleSort("date")} style={{ cursor: "pointer" }}>
                            Date {renderSortArrow("date")}
                        </th>
                        {hasPermission(user, 'update_order_status') && (
                            <th className="text-muted" onClick={() => toggleSort("status")} style={{ cursor: "pointer" }}>
                                Refund Status {renderSortArrow("status")}
                            </th>
                        )}
                        {hasPermission(user, 'update_order_status') && (
                            <th className="text-muted" onClick={() => toggleSort("refund_status")} style={{ cursor: "pointer" }}>
                                Status {renderSortArrow("refund_status")}
                            </th>
                        )}
                        <th className="text-muted" onClick={() => toggleSort("total")} style={{ cursor: "pointer" }}>
                            Total {renderSortArrow("total")}
                        </th>
                        {hasPermission(user, 'view_order_details') && (
                            <th className="text-muted">Actions</th>
                        )}
                    </tr>
                </thead>
                <tbody>
                    {displayedOrders.map(order => (
                        <tr key={order._id}>
                            {hasPermission(user, 'delete_selected_order') && (
                                <td>
                                    <input
                                        type="checkbox"
                                        checked={selectedOrders.includes(order._id)}
                                        onChange={() => handleSelectOrder(order._id)}
                                    />
                                </td>
                            )}
                            <td>{order.orderNumber}</td>
                            <td>{order.userId.username}</td>
                            <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                            {hasPermission(user, 'update_order_status') && (
                                <td>
                                    {order.refund?.isRefunded ? (
                                        <span className="badge bg-success">
                                            Refunded ${order.refund.refundedAmount?.toFixed(2) || 0}
                                        </span>
                                    ) : order.refund?.refundedItems?.length > 0 ? (
                                        <span
                                            className="text-primary"
                                            style={{ cursor: 'pointer' }}
                                            onClick={() => openRefundModal(order)}
                                        >
                                            Pending
                                        </span>
                                    ) : (
                                        <span className="text-muted">No Request</span>
                                    )}
                                </td>
                            )}
                            {hasPermission(user, 'update_order_status') && (
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
                                        <option value="Refunded">Refunded</option>
                                    </select>
                                </td>
                            )}
                            <td>${order.orderTotal.toFixed(2)}</td>
                            {hasPermission(user, 'view_order_details') && (
                                <td>
                                    <Link to={`/admin/orders/details/${order._id}`} className="btn btn-light text-primary btn-sm">
                                        <i className="fas fa-eye"></i> View
                                    </Link>
                                </td>
                            )}
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

            {showRefundModal && selectedRefundOrder && (
                <div className="modal d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">🧾 Review Refund Request</h5>
                                <button type="button" className="btn-close" onClick={closeRefundModal}></button>
                            </div>
                            <div className="modal-body">
                                <table className="table table-bordered">
                                    <thead>
                                        <tr>
                                            <th>Product</th>
                                            <th>Qty</th>
                                            <th>Reason</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedRefundOrder.refund?.refundedItems.map(item => (
                                            <tr key={item.productId}>
                                                <td>{item?.productId?.name}</td>
                                                <td>{item.quantity}</td>
                                                <td>{item.reason}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <p className="mt-3">
                                    <strong>Total Requested Refund:</strong> ${selectedRefundOrder.refund?.refundedAmount?.toFixed(2)}
                                </p>
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-success" onClick={() => handleRefundStatusChange(selectedRefundOrder._id, 'Approved')}>
                                    Approve
                                </button>
                                <button className="btn btn-danger" onClick={() => handleRefundStatusChange(selectedRefundOrder._id, 'Rejected')}>
                                    Reject
                                </button>
                                <button className="btn btn-secondary" onClick={closeRefundModal}>Close</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default ManageOrders;
