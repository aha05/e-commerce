import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import toastr from "toastr";
import "toastr/build/toastr.min.css";
import { hasPermission } from '../../../utils/authUtils';
import { useAuth } from '../../../contexts/AuthContext';

const ManageCustomer = () => {
    const { user } = useAuth();
    const [customers, setCustomers] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortField, setSortField] = useState("");
    const [sortDirection, setSortDirection] = useState("asc");
    const [statusFilter, setStatusFilter] = useState("all");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const navigate = useNavigate();

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        try {
            const response = await axios.get("/api/admin/customers");
            setCustomers(response.data);
        } catch (error) {
            toastr.error(error.response.data.message || 'Error');
        }
    };

    const handleDelete = async (customerId) => {
        if (!window.confirm("Are you sure you want to delete this customer?")) return;
        try {
            await axios.post(`/api/admin/users/delete/${customerId}`);
            setCustomers(customers.filter(c => c._id !== customerId));
            toastr.success("Customer deleted successfully");
        } catch (error) {
            toastr.error(error.response.data.message || 'Error');
        }
    };

    const handleBlock = async (id, status) => {
        try {
            await axios.put(`/api/admin/users/${id}/status`, {
                status: status === "active" ? "blocked" : "active",
            });
            setCustomers(customers.map(c =>
                c._id === id ? { ...c, status: status === "active" ? "blocked" : "active" } : c
            ));
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
            setSortDirection(prev => (prev === "asc" ? "desc" : "asc"));
        } else {
            setSortField(field);
            setSortDirection("asc");
        }
    };

    const renderSortArrow = (field) => {
        if (sortField !== field) return "↕";
        return sortDirection === "asc" ? "↑" : "↓";
    };

    const handleRowsPerPageChange = (e) => {
        setRowsPerPage(parseInt(e.target.value));
        setCurrentPage(1);
    };

    const handleStatusFilterChange = (e) => {
        setStatusFilter(e.target.value);
        setCurrentPage(1);
    };

    const handleDateRangeChange = (type, value) => {
        if (type === "start") setStartDate(value);
        else setEndDate(value);
        setCurrentPage(1);
    };

    // Apply Filters: search + status + date range
    let filtered = customers.filter(c => {
        const matchesSearch =
            c.username?.toLowerCase().includes(searchTerm) ||
            c.email?.toLowerCase().includes(searchTerm);

        const matchesStatus =
            statusFilter === "all" || c.status === statusFilter;

        const createdAt = new Date(c.createdAt);
        const from = startDate ? new Date(startDate) : null;
        const to = endDate ? new Date(endDate) : null;

        const matchesDate =
            (!from || createdAt >= from) && (!to || createdAt <= to);

        return matchesSearch && matchesStatus && matchesDate;
    });

    // Sorting
    if (sortField) {
        filtered.sort((a, b) => {
            const aVal = (a[sortField] || "").toString().toLowerCase();
            const bVal = (b[sortField] || "").toString().toLowerCase();
            if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
            if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
            return 0;
        });
    }

    // Pagination
    const totalPages = Math.ceil(filtered.length / rowsPerPage);
    const displayed = filtered.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

    return (
        <div className="container my-4">
            <p className="fs-5 text-muted mb-3">
                <span>Manage Customers</span>
            </p>

            <div className="row">
                {/* Controls */}

                <div className="row mb-2 col-10">
                    <div className="col-md-3 mb-2" style={{ width: "35%" }}>
                        <br />
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Search by name or email..."
                            value={searchTerm}
                            onChange={handleSearch}
                        />
                    </div>
                    <div className="col-md-2 mb-2">
                        <br />
                        <select className="form-select" value={statusFilter} onChange={handleStatusFilterChange}>
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="blocked">Blocked</option>
                        </select>
                    </div>
                    <div className="col-md-2 mb-2">
                        <br />
                        <select className="form-select w-50 p-2 pb-1" onChange={handleRowsPerPageChange} value={rowsPerPage}>
                            {[10, 15, 20, 25, 50].map(n => (
                                <option key={n} value={n}>{n}</option>
                            ))}
                        </select>
                    </div>

                </div>

                {/* Date Range Filter - Right Aligned */}
                <div className="d-flex justify-content-end mb-2 col-2">
                    <div>
                        <label className="form-label text-muted d-block text-start">Date Range</label>
                        <div className="d-flex mb-2 gap-2">
                            <input
                                type="date"
                                className="form-control"
                                value={startDate}
                                onChange={(e) => handleDateRangeChange("start", e.target.value)}
                            />
                            <input
                                type="date"
                                className="form-control"
                                value={endDate}
                                onChange={(e) => handleDateRangeChange("end", e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Table */}
            <table className="table p-0">
                <thead>
                    <tr>
                        <th className="text-muted" onClick={() => toggleSort("username")} style={{ cursor: "pointer" }}>
                            Username {renderSortArrow("username")}
                        </th>
                        <th className="text-muted" onClick={() => toggleSort("email")} style={{ cursor: "pointer" }}>
                            Email {renderSortArrow("email")}
                        </th>
                        <th className="text-muted" onClick={() => toggleSort("status")} style={{ cursor: "pointer" }}>
                            Status {renderSortArrow("status")}
                        </th>
                        <th className="text-muted" onClick={() => toggleSort("createdAt")} style={{ cursor: "pointer" }}>
                            Joined {renderSortArrow("createdAt")}
                        </th>
                        {hasPermission(user, 'block_user', 'delete_user') && (
                            <th className="text-muted">Actions</th>
                        )}
                    </tr>
                </thead>
                <tbody>
                    {displayed.map((customer) => (
                        <tr key={customer._id}>
                            <td>{customer.username}</td>
                            <td>{customer.email}</td>
                            <td>
                                <span className={`badge ${customer.status === "active" ? "bg-success" : "bg-danger"}`}>
                                    {customer.status}
                                </span>
                            </td>
                            <td>{new Date(customer.createdAt).toLocaleDateString()}</td>
                            <td>
                                {hasPermission(user, 'block_user') && (
                                    <button
                                        className={`btn btn-sm  fw-bold ${customer.status === "active" ? "btn-light" : "btn-light"} me-2`}
                                        onClick={() => handleBlock(customer._id, customer.status)}
                                    >
                                        {customer.status === "active" ? (
                                            <>
                                                <i className="bi bi-person-dash me-1 text-danger"></i>
                                            </>
                                        ) : (
                                            <>
                                                <i className="bi bi-person-check me-1 text-success"></i>
                                            </>
                                        )}
                                    </button>
                                )}
                                {hasPermission(user, 'delete_user') && (
                                    <button className="btn btn-light btn-sm text-danger" onClick={() => handleDelete(customer._id)}>
                                        <i className="fas fa-trash"></i>
                                    </button>
                                )}
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

export default ManageCustomer;
