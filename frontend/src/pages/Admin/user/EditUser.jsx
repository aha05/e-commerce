import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import toastr from "toastr";

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
            .catch(() => {
                if (error.response.status === 401) navigate('/unauthorized');
                toastr.error("Failed to load user data")
            });

        // Fetch available roles
        axios.get(`/api/admin/users/edit/${userId}`)
            .then((res) => {
                setRoles(res.data.roles)
            })
            .catch(() => {
                if (error.response.status === 401) navigate('/unauthorized');
                toastr.error("Failed to load roles")

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
            if (error.response.status === 401) navigate('/unauthorized');
            toastr.error("Error updating user");
        }
    };

    return (
        <div className="container my-4">
            <h1>Edit User</h1>
            <form onSubmit={handleSubmit} encType="multipart/form-data">
                <div className="mb-3">
                    <label className="form-label">Name</label>
                    <input
                        type="text"
                        name="name"
                        className="form-control"
                        value={user.name}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="mb-3">
                    <label className="form-label">Username</label>
                    <input
                        type="text"
                        name="username"
                        className="form-control"
                        value={user.username}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="mb-3">
                    <label className="form-label">Email</label>
                    <input
                        type="email"
                        name="email"
                        className="form-control"
                        value={user.email}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="mb-3">
                    <label className="form-label">Role</label>
                    <select
                        name="roleId"
                        className="form-select"
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
                            <label className="form-label">Profile Image</label>
                            <div>
                                <img
                                    src={user.image}
                                    alt={user.image}
                                    className="img-fluid rounded"
                                    width="100"
                                    height="100"

                                />
                            </div>
                        </div>
                    )}
                </div>

                <button type="submit" className="btn btn-primary">Update User</button>
            </form>
        </div>
    );
};

export default EditUser;
