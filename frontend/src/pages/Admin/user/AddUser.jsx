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
        roleId: "customer",
    });

    useEffect(() => {
        const fetchRoles = async () => {
            try {
                const response = await axios.get("/api/admin/users/add"); // Adjust this to match your backend route
                setRoles(response.data);
            } catch (error) {
                if (error.response.status === 401) navigate('/unauthorized');
                toastr.error("Error fetching roles");
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
            if (error.response.status === 401) navigate('/unauthorized');
            toastr.error("Error adding user");
        }
    };

    return (
        <div className="container my-4">
            <h1>Add New User</h1>
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
                    <label className="form-label">Password</label>
                    <input
                        type="password"
                        name="password"
                        className="form-control"
                        value={user.password}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="mb-3">
                    <label className="form-label">Role</label>
                    <select name="roleId" className="form-select" value={user.roleId} onChange={handleChange}>
                        <option value="">Select Role</option>
                        {roles.map((role) => (
                            <option key={role._id} value={role._id}>{role.name}</option>
                        ))}
                    </select>
                </div>
                <button type="submit" className="btn btn-primary">Add User</button>
            </form>
        </div>
    );
};

export default AddUser;
