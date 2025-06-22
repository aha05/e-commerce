import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import toastr from "toastr";
import "toastr/build/toastr.min.css";
import { hasPermission } from '../../../utils/authUtils';
import { useAuth } from '../../../contexts/AuthContext';


const UserManagement = () => {
    const { user } = useAuth();
    const [users, setUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");
    const [sortField, setSortField] = useState("");
    const [sortDirection, setSortDirection] = useState("asc");
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const navigate = useNavigate();

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await axios.get("/api/admin/users");
            setUsers(res.data.users);
        } catch (error) {
            toastr.error(error.response.data.message || 'Error');
        }
    };

    const handleSearch = (e) => {
        setSearchTerm(e.target.value.toLowerCase());
        setCurrentPage(1);
    };

    const handleRoleFilter = (e) => {
        setRoleFilter(e.target.value);
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

    const handleDelete = async (userId) => {
        try {
            await axios.delete(`/api/admin/users/delete/${userId}`);
            toastr.success("User deleted successfully!");
            fetchUsers();
        } catch (error) {
            toastr.error(error.response.data.message || 'Error');
        }
    };

    const handleToggleStatus = async (id, currentStatus) => {
        try {
            await axios.put(`/api/admin/users/${id}/status`, {
                status: currentStatus === "active" ? "blocked" : "active"
            });
            toastr.success("User status updated!");
            fetchUsers();
        } catch (error) {
            toastr.error(error.response.data.message || 'Error');
        }
    };

    const handleSelectAll = (e) => {
        setSelectedUsers(e.target.checked ? users.map(u => u._id) : []);
    };

    const handleSelectUser = (userId) => {
        setSelectedUsers(prev =>
            prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
        );
    };

    const handleDeleteSelected = async () => {
        if (selectedUsers.length === 0) return toastr.warning("Select at least one user.");
        if (!window.confirm("Are you sure you want to delete selected users?")) return;

        try {
            await axios.post("/api/admin/users/deleteSelected", { userIds: selectedUsers });
            toastr.success("Selected users deleted!");
            fetchUsers();
            setSelectedUsers([]);
        } catch (error) {
            toastr.error(error.response.data.message || 'Error');
        }
    };

    const handleRowsPerPageChange = (e) => {
        setRowsPerPage(parseInt(e.target.value));
        setCurrentPage(1);
    };

    // Filter + Sort
    let filteredUsers = users.filter(user =>
        user.username.toLowerCase().includes(searchTerm) ||
        user.email.toLowerCase().includes(searchTerm)
    );

    if (roleFilter !== "all") {
        filteredUsers = filteredUsers.filter(user =>
            user.roles.some(role => role.name === roleFilter)
        );
    }

    if (sortField) {
        filteredUsers.sort((a, b) => {
            const aValue = a[sortField]?.toLowerCase?.() || a[sortField];
            const bValue = b[sortField]?.toLowerCase?.() || b[sortField];
            if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
            if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
            return 0;
        });
    }

    // Pagination
    const totalPages = Math.ceil(filteredUsers.length / rowsPerPage);
    const displayedUsers = filteredUsers.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage
    );

    const renderSortArrow = (field) => {
        if (sortField !== field) return "↕";
        return sortDirection === "asc" ? "↑" : "↓";
    };

    // Unique roles for filter
    const allRoles = Array.from(new Set(users.flatMap(user => user.roles.map(r => r.name))));

    return (
        <div className="container my-4">
            <p className="fs-5 text-muted mb-3">
                <span>User Management</span>
            </p>

            {/* Controls */}
            {/* Controls */}
            <div className="row align-items-end mb-4 gy-3">
                {/* Search Input */}
                <div className="col-12 col-md-4 col-lg-3">
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={handleSearch}
                    />
                </div>

                {/* Role Filter */}
                <div className="col-12 col-md-4 col-lg-3">
                    <select className="form-select" value={roleFilter} onChange={handleRoleFilter}>
                        <option value="all">All Roles</option>
                        {allRoles.map(role => (
                            <option key={role} value={role}>{role}</option>
                        ))}
                    </select>
                </div>

                {/* Rows Per Page */}
                <div className="col-12 col-md-4 col-lg-2">
                    <select className="form-select w-50" value={rowsPerPage} onChange={handleRowsPerPageChange}>
                        {[10, 15, 20, 25, 50].map(n => (
                            <option key={n} value={n}>{n}</option>
                        ))}
                    </select>
                </div>

                {/* Action Buttons */}
                <div className="col-12 col-lg-4">
                    <div className="d-flex flex-column flex-sm-row justify-content-lg-end gap-2">
                        {hasPermission(user, 'delete_user') && (
                            <button className="btn btn-danger" onClick={handleDeleteSelected}>
                                <i className="fas fa-trash me-1"></i> Delete Selected
                            </button>
                        )}
                        {hasPermission(user, 'create_user') && (
                            <Link to="/admin/users/add" className="btn btn-primary">
                                <i className="fas fa-plus me-1"></i> Add User
                            </Link>
                        )}
                    </div>
                </div>
            </div>



            {/* Table */}
            <table className="table p-0">
                <thead>
                    <tr>
                        {hasPermission(user, 'delete_user') && (
                            <th><input type="checkbox" onChange={handleSelectAll} checked={selectedUsers.length === users.length && users.length > 0} /></th>
                        )}
                        <th className="text-muted" onClick={() => toggleSort("username")} style={{ cursor: "pointer" }}>
                            Username {renderSortArrow("username")}
                        </th>
                        <th className="text-muted" onClick={() => toggleSort("email")} style={{ cursor: "pointer" }}>
                            Email {renderSortArrow("email")}
                        </th>
                        <th className="text-muted" onClick={() => toggleSort("role")} style={{ cursor: "pointer" }}>
                            Role {renderSortArrow("role")}
                        </th>
                        <th className="text-muted" onClick={() => toggleSort("status")} style={{ cursor: "pointer" }}>
                            Status {renderSortArrow("status")}
                        </th>
                        {hasPermission(user, 'delete_user', 'edit_user', 'block_user') && (
                            <th className="text-muted">Actions</th>
                        )}
                    </tr>
                </thead>
                <tbody>
                    {displayedUsers.map(usr => (
                        <tr key={usr._id}>
                            {hasPermission(user, 'delete_user') && (
                                <td>
                                    <input
                                        type="checkbox"
                                        checked={selectedUsers.includes(usr._id)}
                                        onChange={() => handleSelectUser(usr._id)}
                                    />
                                </td>
                            )}
                            <td>{usr.username}</td>
                            <td>{usr.email}</td>
                            <td>
                                {usr.roles.map((role, i) => (
                                    <span key={i} className="badge bg-info me-1">{role.name}</span>
                                ))}
                            </td>
                            <td>
                                <span className={`badge ${usr.status === 'active' ? 'bg-success' : 'bg-danger'}`}>
                                    {usr.status}
                                </span>
                            </td>
                            {hasPermission(user, 'delete_user', 'edit_user', 'block_user') && (
                                <td>
                                    {hasPermission(user, 'block_user') && (
                                        <button
                                            className={`btn btn-sm  fw-bold ${usr.status === "active" ? "btn-light" : "btn-light"} me-2`}
                                            onClick={() => handleToggleStatus(usr._id, usr.status)}
                                        >
                                            {usr.status === "active" ? (
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
                                    {hasPermission(user, 'edit_user') && (
                                        <Link to={`/admin/users/edit/${usr._id}`} className="btn btn-light text-primary btn-sm me-2">
                                            <i className="fas fa-edit"></i>
                                        </Link>
                                    )}
                                    {hasPermission(user, 'delete_user') && (
                                        <button
                                            className="btn btn-light text-danger btn-sm ms-2"
                                            onClick={() => handleDelete(usr._id)}
                                        >
                                            <i className="fas fa-trash"></i>
                                        </button>
                                    )}
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
        </div>
    );
};

export default UserManagement;
