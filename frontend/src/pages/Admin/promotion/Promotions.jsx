import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import toastr from "toastr";

const Promotions = () => {
    const [promotions, setPromotions] = useState([]);

    // Fetch promotions on component mount
    useEffect(() => {
        axios.get("/api/admin/promotions")
            .then(res => setPromotions(res.data.promotions))
            .catch(() => {
                if (error.response.status === 401) navigate('/unauthorized');
                toastr.error("Failed to load promotions")
            });
    }, []);

    // Handle delete promotion
    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this promotion?")) return;

        try {
            await axios.delete(`/api/admin/promotions/delete/${id}`);
            setPromotions(promotions.filter(promo => promo._id !== id));
            toastr.success("Promotion deleted successfully");
        } catch (error) {
            toastr.error("Error deleting promotion");
        }
    };

    return (
        <div className="container mt-4">
            <h1>Promotions</h1>
            <Link to="/admin/promotions/add" className="btn btn-primary mb-3">
                <i className="fas fa-plus"></i> Create Promotion
            </Link>

            <table className="table table-bordered">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Code</th>
                        <th>Product</th>
                        <th>Discount</th>
                        <th>Start Date</th>
                        <th>End Date</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {promotions.map((promotion) => (
                        <tr key={promotion._id}>
                            <td>{promotion.name}</td>
                            <td>{promotion.code || "auto"}</td>
                            <td>{promotion.product?.name}</td>
                            <td>{promotion.discountPercentage}%</td>
                            <td>{new Date(promotion.startDate).toDateString()}</td>
                            <td>{new Date(promotion.endDate).toDateString()}</td>
                            <td>{promotion.isActive ? "Active" : "Inactive"}</td>
                            <td>
                                <Link to={`/admin/promotions/update/${promotion._id}`} className="btn btn-sm btn-warning">
                                    <i className="fas fa-edit"></i> Edit
                                </Link>
                                <button className="btn btn-sm btn-danger ms-2" onClick={() => handleDelete(promotion._id)}>
                                    <i className="fas fa-trash-alt"></i> Delete
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default Promotions;
