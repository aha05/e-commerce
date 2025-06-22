import { useState, useEffect } from "react";
import axios from "axios";
import toastr from "toastr";
import { Modal, Button, Form, Row, Col } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { hasPermission } from '../../../utils/authUtils';
import { useAuth } from '../../../contexts/AuthContext';


const Roles = () => {
    const { user } = useAuth();
    const [roles, setRoles] = useState([]);
    const [permissions, setPermissions] = useState([]);
    const [roleName, setRoleName] = useState("");
    const [selectedPermissions, setSelectedPermissions] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editRoleId, setEditRoleId] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [expandedRows, setExpandedRows] = useState({});
    const navigate = useNavigate();

    useEffect(() => {
        fetchRoles();
        fetchPermissions();
    }, []);

    const fetchRoles = async () => {
        try {
            const res = await axios.get("/api/admin/roles");
            setRoles(res.data.roles);
        } catch (error) {
            toastr.error(error?.response?.data?.message || 'error');
        }
    };

    const fetchPermissions = async () => {
        try {
            const res = await axios.get("/api/admin/permissions");
            setPermissions(res.data.permissions);
        } catch (error) {
            toastr.error(error?.response?.data?.message || 'Error');
        }
    };

    const handleOpenModal = (role = null) => {
        if (role) {
            setIsEditing(true);
            setEditRoleId(role._id);
            setRoleName(role.name);
            setSelectedPermissions(role.permissions.map(p => p._id));
        } else {
            setIsEditing(false);
            setEditRoleId(null);
            setRoleName("");
            setSelectedPermissions([]);
        }
        setShowModal(true);
    };

    const handleSaveRole = async (e) => {
        e.preventDefault();
        try {
            if (isEditing) {
                await axios.put(`/api/admin/roles/update/${editRoleId}`, {
                    name: roleName,
                    permissionIds: selectedPermissions,
                });
                toastr.success("Role updated");
            } else {
                await axios.post("/api/admin/roles/add", {
                    name: roleName,
                    permissionIds: selectedPermissions,
                });
                toastr.success("Role created");
            }
            fetchRoles();
            setShowModal(false);
        } catch (error) {
            toastr.error(error?.response?.data?.message || 'Error');
        }
    };

    const handleDeleteRole = async (id) => {
        if (!window.confirm("Are you sure you want to delete this role?")) return;
        try {
            await axios.delete(`/api/admin/roles/delete/${id}`);
            toastr.success("Role deleted");
            fetchRoles();
        } catch (error) {
            toastr.error(error?.response?.data?.error || "Error");
        }
    };

    const toggleExpand = (id) => {
        setExpandedRows(prev => ({
            ...prev,
            [id]: !prev[id],
        }));
    };

    const filteredRoles = roles.filter(r =>
        r.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(filteredRoles.length / rowsPerPage);
    const paginatedRoles = filteredRoles.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage
    );

    return (
        <div className="container my-4">
            <h5 className="text-muted mb-3">Roles Management</h5>

            <div className="d-flex justify-content-between mb-3">
                <div className="d-flex gap-2">
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Search role..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1);
                        }}
                    />
                    <select
                        className="form-select"
                        value={rowsPerPage}
                        onChange={(e) => {
                            setRowsPerPage(Number(e.target.value));
                            setCurrentPage(1);
                        }}
                    >
                        {[5, 10, 20].map(size => (
                            <option key={size} value={size}>{size}</option>
                        ))}
                    </select>
                </div>
                {hasPermission(user, 'create_role') && (
                    <Button onClick={() => handleOpenModal()}>+ Add Role</Button>
                )}
            </div>

            <table className="table">
                <thead>
                    <tr>
                        <th>Role</th>
                        <th>Permissions</th>
                        {hasPermission(user, 'edit_role', 'delete_role') && (
                            <th>Actions</th>
                        )}
                    </tr>
                </thead>
                <tbody>
                    {paginatedRoles.map(role => {
                        const isExpanded = expandedRows[role._id];
                        const maxToShow = 5;
                        const showToggle = role.permissions.length > maxToShow;
                        const displayed = isExpanded
                            ? role.permissions
                            : role.permissions.slice(0, maxToShow);

                        return (
                            <tr key={role._id}>
                                <td>{role.name}</td>
                                <td>
                                    {displayed.map(p => (
                                        <span key={p._id} className="badge bg-info me-1 mb-1">
                                            {p.name}
                                        </span>
                                    ))}
                                    {showToggle && (
                                        <button
                                            className="btn btn-link btn-sm p-0 ms-1 text-decoration-none"
                                            onClick={() => toggleExpand(role._id)}
                                        >
                                            {isExpanded
                                                ? "Show Less"
                                                : `+${role.permissions.length - maxToShow} More`}
                                        </button>
                                    )}
                                </td>
                                {hasPermission(user, 'edit_role', 'delete_role') && (
                                    <td>
                                        {hasPermission(user, 'edit_role') && (
                                            <Button
                                                size="sm"
                                                variant="light"
                                                className="me-2 text-primary"
                                                onClick={() => handleOpenModal(role)}
                                            >
                                                <i className="fas fa-edit"></i>
                                            </Button>
                                        )}
                                        {hasPermission(user, 'delete_role') && (
                                            <Button
                                                size="sm"
                                                variant="light"
                                                className="text-danger"
                                                onClick={() => handleDeleteRole(role._id)}
                                            >
                                                <i className="fas fa-trash"></i>
                                            </Button>
                                        )}
                                    </td>
                                )}
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            <nav className="d-flex justify-content-center">
                <ul className="pagination">
                    <li className={`page-item ${currentPage === 1 && "disabled"}`}>
                        <button
                            className="page-link"
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        >
                            &laquo;
                        </button>
                    </li>
                    {Array.from({ length: totalPages }, (_, i) => (
                        <li
                            key={i}
                            className={`page-item ${currentPage === i + 1 && "active"}`}
                        >
                            <button className="page-link" onClick={() => setCurrentPage(i + 1)}>
                                {i + 1}
                            </button>
                        </li>
                    ))}
                    <li className={`page-item ${currentPage === totalPages && "disabled"}`}>
                        <button
                            className="page-link"
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        >
                            &raquo;
                        </button>
                    </li>
                </ul>
            </nav>

            {/* Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)} size="md">
                <Form onSubmit={handleSaveRole}>
                    <Modal.Header closeButton>
                        <Modal.Title>{isEditing ? "Edit Role" : "Add Role"}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form.Group className="mb-3">
                            <Form.Label>Role Name</Form.Label>
                            <Form.Control
                                type="text"
                                value={roleName}
                                onChange={(e) => setRoleName(e.target.value)}
                                required
                            />
                        </Form.Group>
                        <Form.Label>Permissions</Form.Label>
                        <div
                            style={{
                                maxHeight: "250px",
                                overflowY: "auto",
                                border: "1px solid #ddd",
                                padding: "10px",
                                borderRadius: "5px",
                                overflowX: 'hidden'
                            }}
                        >
                            <Row>
                                {permissions.map((perm, index) => (
                                    <Col key={perm._id} md={6}>
                                        <Form.Check
                                            type="checkbox"
                                            label={perm.name}
                                            value={perm._id}
                                            checked={selectedPermissions.includes(perm._id)}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setSelectedPermissions((prev) =>
                                                    e.target.checked
                                                        ? [...prev, value]
                                                        : prev.filter((id) => id !== value)
                                                );
                                            }}
                                        />
                                    </Col>
                                ))}
                            </Row>
                        </div>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowModal(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="primary">
                            {isEditing ? "Update" : "Create"}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </div>
    );
};

export default Roles;
