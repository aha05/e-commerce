import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import toastr from "toastr";

const ManageCustomer = () => {
    const [customers, setCustomer] = useState([]);

    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                const response = await axios.get("/api/admin/customers"); // Adjust this to match your backend route
                setCustomer(response.data);
            } catch (error) {
                if (error.response.status === 401) navigate('/unauthorized');
                toastr.error("Error fetching customers");
            }
        };
        fetchCustomers();
    }, []);

    const handleDelete = async (customerId) => {
        try {
            const response = await axios.post(`/api/admin/users/delete/${customerId}`);
            setCustomer(customers.filter(customer => customer._id !== customerId));
            toastr.success(response.data.message);

        } catch (error) {
            if (error.response.status === 401) navigate('/unauthorized');
            toastr.error('Error deleting customer', error);
        }

    };

    const handleBlock = async (id, status) => {
        try {
            await axios.put(`/api/admin/users/${id}/status`,
                { status: status === "active" ? "blocked" : "active" },
                { headers: { Authorization: localStorage.getItem("token") } }
            );
            setCustomer(customers.map(customer =>
                customer._id === id ? { ...customer, status: status === "active" ? "blocked" : "active" } : customer
            ));
        } catch (error) {
            if (error.response.status === 401) navigate('/unauthorized');
            console.error("Error updating user status:", error);
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
                    {customers.map((customer, index) => (
                        <tr key={customer._id}>
                            <td>{index + 1}</td>
                            <td>{customer.name}</td>
                            <td>{customer.email}</td>
                            <td>
                                {customer.roles.map((role, i) => (
                                    <span key={i} className="badge bg-info me-1">{role.name}</span>
                                ))}
                            </td>
                            <td>
                                <button
                                    onClick={() => handleBlock(customer._id, customer.status)}
                                    className={`btn btn-sm ${customer.status === "active" ? "btn-danger" : "btn-success"} me-2`}
                                >
                                    {customer.status === "active" ? "Block" : "Unblock"}
                                </button>
                            </td>
                            <td>
                                <Link to={`/admin/users/edit/${customer._id}`} className="btn btn-primary btn-sm me-2">
                                    Edit
                                </Link>
                                <button onClick={() => handleDelete(customer._id)} className="btn btn-danger btn-sm">
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

export default ManageCustomer;
