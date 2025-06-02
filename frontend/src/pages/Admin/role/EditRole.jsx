import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import toastr from "toastr";

const EditRole = () => {
    const { roleId } = useParams(); // Get role ID from URL params
    const navigate = useNavigate();

    const [roleName, setRoleName] = useState("");
    const [selectedPermissions, setSelectedPermissions] = useState([]);
    const [permissions, setPermissions] = useState([]);

    // Fetch role details and available permissions on component mount
    useEffect(() => {
        axios.get(`/api/admin/roles/update/${roleId}`)
            .then(res => {
                setRoleName(res.data.role.name);
                setSelectedPermissions(res.data.role.permissions.map(p => p._id));
            })
            .catch(() => toastr.error("Failed to load role data"));

        axios.get("/api/admin/permissions")
            .then(res => setPermissions(res.data.permissions))
            .catch(() => {
                if (error.response.status === 401) navigate('/unauthorized');
                toastr.error("Failed to load permissions")
            }
            );
    }, [roleId]);

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.put(`/api/admin/roles/update/${roleId}`, {
                name: roleName,
                permissionIds: selectedPermissions
            });
            toastr.success("Role updated successfully");
            navigate("/admin/roles");
        } catch (error) {
            if (error.response.status === 401) navigate('/unauthorized');
            toastr.error("Error updating role");
        }
    };

    return (
        <div className="container mt-5">
            <h1>Edit Role</h1>
            <form onSubmit={handleSubmit}>
                {/* Role Name */}
                <div className="form-group mb-3">
                    <label>Role Name</label>
                    <input
                        type="text"
                        className="form-control"
                        value={roleName}
                        onChange={(e) => setRoleName(e.target.value)}
                        required
                    />
                </div>

                {/* Permissions Selection */}
                <div className="form-group mb-3">
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

                <button type="submit" className="btn btn-success">Save Changes</button>
                <button type="button" className="btn btn-secondary ms-2" onClick={() => navigate("/admin/roles")}>Cancel</button>
            </form>
        </div>
    );
};

export default EditRole;
