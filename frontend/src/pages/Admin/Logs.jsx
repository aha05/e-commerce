import { useState, useEffect } from "react";
import axios from "axios";
import toastr from "toastr";
import "toastr/build/toastr.min.css";
import { hasPermission } from '../../utils/authUtils';
import { useAuth } from '../../contexts/AuthContext';

const Logs = () => {
    const { user } = useAuth();
    const [logs, setLogs] = useState([]);
    const [filteredLogs, setFilteredLogs] = useState([]);

    const [search, setSearch] = useState("");
    const [adminFilter, setAdminFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10); // now stateful

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const res = await axios.get("/api/admin/logs");
                setLogs(res.data);
                setFilteredLogs(res.data);
            } catch (error) {
                console.error("Error fetching activity logs:", error);
                toastr.error("Failed to load logs");
            }
        };
        fetchLogs();
    }, []);

    useEffect(() => {
        filterLogs();
        setCurrentPage(1); // reset to first page when filter changes
    }, [search, adminFilter, statusFilter, logs]);

    const filterLogs = () => {
        let filtered = logs;

        if (search.trim()) {
            filtered = filtered.filter(log =>
                log.details.toLowerCase().includes(search.toLowerCase())
            );
        }

        if (adminFilter) {
            filtered = filtered.filter(log => log.admin === adminFilter);
        }

        if (statusFilter) {
            filtered = filtered.filter(log => log.status.toLowerCase() === statusFilter.toLowerCase());
        }

        setFilteredLogs(filtered);
    };

    const handleDeleteAll = async () => {
        if (!window.confirm("Are you sure you want to delete all logs?")) return;

        try {
            const response = await axios.delete('/api/admin/logs/delete-all');
            toastr.success(response.data.message);
            setLogs([]);
        } catch (error) {
            toastr.error("Error deleting logs");
        }
    };

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentLogs = filteredLogs.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);

    const admins = [...new Set(logs.map(log => log.admin))];

    return (
        <div className="container my-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="text-muted mb-0">User Activity Logs</h5>
                {hasPermission(user, 'create_promotion') && (
                    <button className="btn btn-sm btn-danger" onClick={handleDeleteAll}>
                        <i className="fas fa-trash me-1"></i> Clear All
                    </button>
                )}
            </div>

            {/* Filters */}
            <div className="row mb-3 gy-2">
                <div className="col-md-3">
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Search in details..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="col-md-3">
                    <select
                        className="form-select"
                        value={adminFilter}
                        onChange={(e) => setAdminFilter(e.target.value)}
                    >
                        <option value="">Filter by Admin</option>
                        {admins.map(admin => (
                            <option key={admin} value={admin}>{admin}</option>
                        ))}
                    </select>
                </div>
                <div className="col-md-3">
                    <select
                        className="form-select"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="">Filter by Status</option>
                        <option value="success">Success</option>
                        <option value="updated">Updated</option>
                        <option value="modified">Modified</option>
                        <option value="deleted">Deleted</option>
                    </select>
                </div>
                <div className="col-md-3">
                    <select
                        className="form-select"
                        value={itemsPerPage}
                        onChange={(e) => {
                            setItemsPerPage(Number(e.target.value));
                            setCurrentPage(1); // reset to page 1 on change
                        }}
                    >
                        <option value="5">5 rows per page</option>
                        <option value="10">10 rows per page</option>
                        <option value="25">25 rows per page</option>
                        <option value="50">50 rows per page</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="card border-0">
                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-5">
                        <thead>
                            <tr>
                                <th className="text-muted">Admin</th>
                                <th className="text-muted">Action</th>
                                <th className="text-muted">Details</th>
                                <th className="text-muted">Timestamp</th>
                                <th className="text-muted">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentLogs.length > 0 ? (
                                currentLogs.map((log, index) => (
                                    <tr key={index}>
                                        <td>{log.admin}</td>
                                        <td className="fw-semibold">{log.action}</td>
                                        <td dangerouslySetInnerHTML={{ __html: log.details }}></td>
                                        <td>{new Date(log.timestamp).toLocaleString()}</td>
                                        <td>
                                            <span className={`badge bg-${getBadgeClass(log.status)}`}>
                                                {log.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="text-center text-muted py-4">
                                        No logs found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="p-3 d-flex justify-content-center">
                        <nav>
                            <ul className="pagination mb-0">
                                <li className={`page-item ${currentPage === 1 && "disabled"}`}>
                                    <button className="page-link" onClick={() => setCurrentPage(prev => prev - 1)}>
                                        &lt;
                                    </button>
                                </li>
                                {[...Array(totalPages)].map((_, idx) => (
                                    <li
                                        key={idx}
                                        className={`page-item ${currentPage === idx + 1 ? "active" : ""}`}
                                    >
                                        <button className="page-link" onClick={() => setCurrentPage(idx + 1)}>
                                            {idx + 1}
                                        </button>
                                    </li>
                                ))}
                                <li className={`page-item ${currentPage === totalPages && "disabled"}`}>
                                    <button className="page-link" onClick={() => setCurrentPage(prev => prev + 1)}>
                                        &gt;
                                    </button>
                                </li>
                            </ul>
                        </nav>
                    </div>
                )}
            </div>
        </div>
    );
};

const getBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
        case "success": return "success";
        case "updated": return "primary";
        case "modified": return "warning text-dark";
        case "deleted": return "danger";
        default: return "secondary";
    }
};

export default Logs;
