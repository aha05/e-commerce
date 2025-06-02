import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toastr from "toastr";

const AddPromotion = () => {
    const [products, setProducts] = useState([]);
    const [formData, setFormData] = useState({
        name: "",
        type: "auto", // default type
        code: "",
        discountPercentage: "",
        startDate: "",
        endDate: "",
        productId: "",
    });

    const navigate = useNavigate();

    useEffect(() => {
        fetch("/api/admin/products")
            .then((res) => res.json())
            .then((data) => { setProducts(data.products) })
            .catch((error) => console.error("Error fetching products:", error));
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;

        // If type is changed to auto, clear code
        if (name === "type" && value === "auto") {
            setFormData({ ...formData, [name]: value, code: "" });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Only send code if type is not auto
        const submitData = { ...formData };
        if (formData.type === "auto") {
            delete submitData.code;
        }

        try {
            await axios.post("/api/admin/promotions/add", submitData);
            toastr.success("Promotion created successfully!");
            navigate("/admin/promotions");
        } catch (error) {
            if (error.response?.status === 401) navigate('/unauthorized');
            toastr.error("Failed to create promotion");
        }
    };

    return (
        <div className="container mt-4">
            <h1>Create Promotion</h1>
            <form onSubmit={handleSubmit}>
                <div className="mb-3">
                    <label className="form-label">Promotion Name</label>
                    <input
                        type="text"
                        className="form-control"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="mb-3">
                    <label className="form-label">Promotion Type</label>
                    <select
                        name="type"
                        className="form-select"
                        value={formData.type}
                        onChange={handleChange}
                        required
                    >
                        <option value="auto">Auto</option>
                        <option value="code">Code</option>
                        <option value="hybrid">Hybrid</option>
                    </select>
                </div>

                {formData.type !== "auto" && (
                    <div className="mb-3">
                        <label className="form-label">Promo Code</label>
                        <input
                            type="text"
                            className="form-control"
                            name="code"
                            value={formData.code}
                            onChange={handleChange}
                            required
                        />
                    </div>
                )}

                <div className="col-md-4 mb-3">
                    <label className="form-label">Product</label>
                    <select
                        name="productId"
                        className="form-select"
                        value={formData.productId}
                        onChange={handleChange}
                        required
                    >
                        <option value="">Select Product</option>
                        {products.map((product) => (
                            <option key={product._id} value={product._id}>
                                {product.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="mb-3">
                    <label className="form-label">Discount Percentage</label>
                    <input
                        type="number"
                        className="form-control"
                        name="discountPercentage"
                        value={formData.discountPercentage}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="mb-3">
                    <label className="form-label">Start Date</label>
                    <input
                        type="date"
                        className="form-control"
                        name="startDate"
                        value={formData.startDate}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="mb-3">
                    <label className="form-label">End Date</label>
                    <input
                        type="date"
                        className="form-control"
                        name="endDate"
                        value={formData.endDate}
                        onChange={handleChange}
                        required
                    />
                </div>

                <button type="submit" className="btn btn-primary">Create</button>
            </form>
        </div>
    );
};

export default AddPromotion;
