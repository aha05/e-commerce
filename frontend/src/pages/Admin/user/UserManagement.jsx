import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import toastr from "toastr";

const UserManagement = () => {
    const [users, setUsers] = useState([]);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await axios.get("/api/admin/users"); // Adjust this to match your backend route
                setUsers(response.data.users);
            } catch (error) {
                if (error.response.status === 401) navigate('/unauthorized');
                toastr.error("Error fetching users");
            }
        };
        fetchUsers();
    }, []);

    const handleDelete = async (userId) => {
        try {
            const response = await axios.delete(`/api/admin/users/delete/${userId}`);
            setUsers(users.filter(user => user._id !== userId));
            toastr.success(response.data.message);

        } catch (error) {
            if (error.response.status === 401) navigate('/unauthorized');
            toastr.error('Error deleting user', error);
        }

    };

    const handleBlock = async (id, status) => {
        try {
            await axios.put(`/api/admin/users/${id}/status`,
                { status: status === "active" ? "blocked" : "active" },
                { headers: { Authorization: localStorage.getItem("token") } }
            );
            setUsers(users.map(user =>
                user._id === id ? { ...user, status: status === "active" ? "blocked" : "active" } : user
            ));
        } catch (error) {
            if (error.response.status === 401) navigate('/unauthorized');
            toastr.error("Error updating user status!");
        }
    };

    return (
        <div className="container my-4">
            <h1>User Management</h1>
            <Link to="/admin/users/add" className="btn btn-success mb-3">Add New User</Link>

            <table className="table table-bordered">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map((user, index) => (
                        <tr key={user._id}>
                            <td>{index + 1}</td>
                            <td>{user.name}</td>
                            <td>{user.email}</td>
                            <td>
                                {user.roles.map((role, i) => (
                                    <span key={i} className="badge bg-info me-1">{role.name}</span>
                                ))}
                            </td>
                            <td>
                                <button
                                    onClick={() => handleBlock(user._id, user.status)}
                                    className={`btn btn-sm ${user.status === "active" ? "btn-danger" : "btn-success"} me-2`}
                                >
                                    {user.status === "active" ? "Block" : "Unblock"}
                                </button>
                            </td>
                            <td>
                                <Link to={`/admin/users/edit/${user._id}`} className="btn btn-primary btn-sm me-2">
                                    Edit
                                </Link>
                                <button onClick={() => handleDelete(user._id)} className="btn btn-danger btn-sm">
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

export default UserManagement;
