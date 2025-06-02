import { useState, useEffect } from "react";
import axios from "axios";
import toastr from "toastr";

const Roles = () => {
    const [roles, setRoles] = useState([]);
    const [permissions, setPermissions] = useState([]);
    const [roleName, setRoleName] = useState("");
    const [selectedPermissions, setSelectedPermissions] = useState([]);
    const [permissionName, setPermissionName] = useState("");
    const [description, setDescription] = useState("");

    // Fetch roles and permissions on component mount
    useEffect(() => {
        axios.get("/api/admin/roles")
            .then(res => setRoles(res.data.roles))
            .catch(() => {
                if (error.response.status === 401) navigate('/unauthorized');
                toastr.error("Failed to load roles")

            });

        axios.get("/api/admin/permissions")
            .then(res => setPermissions(res.data.permissions))
            .catch(() => {
                if (error.response.status === 401) navigate('/unauthorized');
                toastr.error("Failed to load permissions")
            });
    }, []);

    // Handle role submission
    const handleAddRole = async (e) => {
        e.preventDefault();
        try {
            await axios.post("/api/admin/roles/add", { name: roleName, permissionIds: selectedPermissions });
            toastr.success("Role added successfully");
            setRoleName("");
            setSelectedPermissions([]);
            fetchRoles(); // Refresh the role list
        } catch (error) {
            if (error.response.status === 401) navigate('/unauthorized');
            toastr.error("Error adding role");
        }
    };

    // Handle permission submission
    const handleAddPermission = async (e) => {
        e.preventDefault();
        try {
            await axios.post("/api/admin/permissions/add", { name: permissionName, description });
            toastr.success("Permission added successfully");
            setPermissionName("");
            setDescription("");
            fetchPermissions(); // Refresh the permissions list
        } catch (error) {
            if (error.response.status === 401) navigate('/unauthorized');
            toastr.error("Error adding permission");
        }
    };

    // Fetch roles again after adding a new one
    const fetchRoles = () => {
        axios.get("/api/admin/roles")
            .then(res => {
                setRoles(res.data.roles)
                console.log(res.data);
            })
            .catch(() => {
                if (error.response.status === 401) navigate('/unauthorized');
                toastr.error("Failed to reload roles")
            });
    };

    // Fetch permissions again after adding a new one
    const fetchPermissions = () => {
        axios.get("/api/admin/permissions")
            .then(res => {
                setPermissions(res.data.permissions)
                console.log(res.data);
            })
            .catch(() => {
                if (error.response.status === 401) navigate('/unauthorized');
                toastr.error("Failed to reload permissions")
            });
    };

    // Handle role deletion
    const handleDeleteRole = async (roleId) => {
        try {
            await axios.delete(`/api/admin/roles/delete/${roleId}`);
            toastr.success("Role deleted successfully");
            fetchRoles();
        } catch (error) {
            toastr.error("Error deleting role");
        }
    };

    return (
        <div className="container mt-5">
            <h1>Roles & Permissions Management</h1>

            {/* Add New Role Form */}
            <form onSubmit={handleAddRole} className="mb-4">
                <div className="form-group">
                    <label>Role Name</label>
                    <input
                        type="text"
                        className="form-control"
                        value={roleName}
                        onChange={(e) => setRoleName(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Select Permissions</label>
                    <select
                        className="form-select"
                        multiple
                        value={selectedPermissions}
                        onChange={(e) => setSelectedPermissions(Array.from(e.target.selectedOptions, option => option.value))}
                        required
                    >
                        {permissions.map(permission => (
                            <option key={permission._id} value={permission._id}>
                                {permission.name} - {permission.description}
                            </option>
                        ))}
                    </select>
                </div>
                <button type="submit" className="btn btn-primary">Add Role</button>
            </form>

            {/* Add New Permission Form */}
            <form onSubmit={handleAddPermission} className="mb-4">
                <div className="form-group">
                    <label>Permission Name</label>
                    <input
                        type="text"
                        className="form-control"
                        value={permissionName}
                        onChange={(e) => setPermissionName(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Description</label>
                    <input
                        type="text"
                        className="form-control"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </div>
                <button type="submit" className="btn btn-secondary">Add Permission</button>
            </form>

            {/* Existing Roles Table */}
            <h2>Existing Roles</h2>
            <table className="table table-striped">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Role Name</th>
                        <th>Permissions</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {roles.map((role, index) => (
                        <tr key={role._id}>
                            <td>{index + 1}</td>
                            <td>{role.name}</td>
                            <td>
                                {role.permissions.map(permission => (
                                    <span key={permission._id} className="badge bg-info me-1">
                                        {permission.name}
                                    </span>
                                ))}
                            </td>
                            <td>
                                <a href={`/admin/roles/update/${role._id}`} className="btn btn-primary btn-sm me-2">
                                    Edit
                                </a>
                                <button
                                    className="btn btn-danger btn-sm"
                                    onClick={() => handleDeleteRole(role._id)}
                                >
                                    Delete
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default Roles;
