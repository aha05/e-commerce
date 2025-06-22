import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toastr from "toastr";

const AddUser = () => {
    const [roles, setRoles] = useState([]);
    const navigate = useNavigate();

    const [user, setUser] = useState({
        name: "",
        username: "",
        email: "",
        password: "",
        roleId: "",
    });

    useEffect(() => {
        const fetchRoles = async () => {
            try {
                const response = await axios.get("/api/admin/users/add"); // Adjust this to match your backend route
                setRoles(response.data);
            } catch (error) {
                toastr.error(error.response.data.message || 'Error');
            }
        };
        fetchRoles();
    }, []);


    const handleChange = (e) => {
        setUser({ ...user, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append("name", user.name);
        formData.append("username", user.username);
        formData.append("email", user.email);
        formData.append("password", user.password);
        formData.append("roleId", user.roleId);

        try {
            await axios.post("/api/admin/users/add", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            toastr.success("User added successfully");
            navigate("/admin/users");
        } catch (error) {
            toastr.error(error.response.data.message || 'Error');
        }
    };

    return (
        <div className="container my-4">
            <p className="fs-5 text-muted mb-3">
                User Management &gt;  <span>Add New User</span>
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
                    <label className="form-label text-muted">Password</label>
                    <input
                        type="password"
                        name="password"
                        className="form-control bg-light"
                        value={user.password}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="mb-3">
                    <label className="form-label text-muted">Role</label>
                    <select name="roleId" className="form-select bg-light" value={user.roleId} onChange={handleChange}>
                        <option value="">Select Role</option>
                        {roles.map((role) => (
                            <option key={role._id} value={role._id}>{role.name}</option>
                        ))}
                    </select>
                </div>
                <button type="submit" className="btn btn-primary"><i className="fas fa-save"></i> Add User</button>
            </form>
        </div>
    );
};

export default AddUser;
