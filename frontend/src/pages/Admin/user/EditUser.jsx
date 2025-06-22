import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import toastr from "toastr";
const backendUrl = import.meta.env.VITE_BACKEND_URL;

const EditUser = () => {
    const { userId } = useParams(); // Get user ID from URL
    const navigate = useNavigate();

    const [user, setUser] = useState({
        name: "",
        username: "",
        email: "",
        roles: [],
    });

    const [roles, setRoles] = useState([]); // Available roles
    const [selectedRoles, setSelectedRoles] = useState([]);


    useEffect(() => {
        // Fetch user data
        axios.get(`/api/admin/users/edit/${userId}`)
            .then((res) => {
                setUser(res.data.user);
                setSelectedRoles(res.data.user.roles.map(role => role._id));
            })
            .catch((error) => {
                toastr.error(error.response.data.message || 'Error');
            });

        // Fetch available roles
        axios.get(`/api/admin/users/edit/${userId}`)
            .then((res) => {
                setRoles(res.data.roles)
            })
            .catch((error) => {
                toastr.error(error.response.data.message || 'Error');
            });
    }, [userId]);

    const handleChange = (e) => {
        setUser({ ...user, [e.target.name]: e.target.value });
    };

    const handleRoleChange = (e) => {
        const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
        setSelectedRoles(selectedOptions);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append("name", user.name);
        formData.append("username", user.username);
        formData.append("email", user.email);
        selectedRoles.forEach(role => formData.append("roleId", role));

        try {
            await axios.put(`/api/admin/users/edit/${userId}`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            toastr.success("User updated successfully");
            navigate("/admin/users");
        } catch (error) {
            toastr.error(error.response.data.message || 'Error');
        }
    };

    return (
        <div className="container my-4">
            <p className="fs-5 text-muted mb-3">
                User Management &gt;  <span>Edit User</span>
            </p>
            <form onSubmit={handleSubmit} encType="multipart/form-data" style={{ padding: "0% 20%" }}>
                <div className="mb-3">
                    <label className="form-label text-muted">Name</label>
                    <input
                        type="text"
                        name="name"
                        className="form-control bg-light"
                        value={user.name}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="mb-3">
                    <label className="form-label text-muted">Username</label>
                    <input
                        type="text"
                        name="username"
                        className="form-control bg-light"
                        value={user.username}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="mb-3">
                    <label className="form-label text-muted">Email</label>
                    <input
                        type="email"
                        name="email"
                        className="form-control bg-light"
                        value={user.email}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="mb-3">
                    <label className="form-label text-muted">Role</label>
                    <select
                        name="roleId"
                        className="form-select bg-light"
                        multiple
                        value={selectedRoles}
                        onChange={handleRoleChange}
                        required
                    >
                        {roles.map(role => (
                            <option key={role._id} value={role._id}>
                                {role.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="row">
                    {user.image && typeof user.image === "string" && (
                        <div className="col-md-6 mb-3">
                            <label className="form-label text-muted" >Profile Image</label>
                            <div>
                                <img
                                    src={`${backendUrl}${user.image}`}
                                    alt={user.image}
                                    className="img-fluid rounded"
                                    width="100"
                                    height="100"

                                />
                            </div>
                        </div>
                    )}
                </div>

                <button type="submit" className="btn btn-primary"><i className="fas fa-save"></i> Update User</button>
            </form>
        </div>
    );
};

export default EditUser;
