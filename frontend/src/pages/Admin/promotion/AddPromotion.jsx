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
            toastr.error(error.response.data.message || 'Error');
        }
    };

    return (
        <div className="container mt-4">
            <p className="fs-5 text-muted mb-4">Promotions &gt; Create Promotion</p>
            <form onSubmit={handleSubmit} style={{ padding: "0% 5%" }}>
                <div className="row">
                    <div className="col-md-6 mb-3">
                        <label className="form-label text-muted">Promotion Name</label>
                        <input
                            type="text"
                            className="form-control bg-light"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="col-md-6 mb-3">
                        <label className="form-label text-muted">Promotion Type</label>
                        <select
                            name="type"
                            className="form-select bg-light"
                            value={formData.type}
                            onChange={handleChange}
                            required
                        >
                            <option value="auto">Auto</option>
                            <option value="code">Code</option>
                            <option value="hybrid">Hybrid</option>
                        </select>
                    </div>
                </div>

                {formData.type !== "auto" && (
                    <div className="col-md-6 mb-3">
                        <label className="form-label text-muted">Promo Code</label>
                        <input
                            type="text"
                            className="form-control bg-light"
                            name="code"
                            value={formData.code}
                            onChange={handleChange}
                            required
                        />
                    </div>
                )}

                <div className="row">
                    <div className="col-md-6 mb-3">
                        <label className="form-label text-muted">Product</label>
                        <select
                            name="productId"
                            className="form-select bg-light"
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


                    <div className="col-md-6 mb-3">
                        <label className="form-label text-muted">Discount Percentage</label>
                        <input
                            type="number"
                            className="form-control bg-light"
                            name="discountPercentage"
                            value={formData.discountPercentage}
                            onChange={handleChange}
                            required
                        />
                    </div>
                </div>

                <div className="row">
                    <div className="col-md-6 mb-3">
                        <label className="form-label text-muted">Start Date</label>
                        <input
                            type="date"
                            className="form-control bg-light"
                            name="startDate"
                            value={formData.startDate}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="col-md-6 mb-3">
                        <label className="form-label text-muted">End Date</label>
                        <input
                            type="date"
                            className="form-control bg-light"
                            name="endDate"
                            value={formData.endDate}
                            onChange={handleChange}
                            required
                        />
                    </div>
                </div>
                <button type="submit" className="btn btn-primary">Create</button>
            </form>
        </div>
    );
};

export default AddPromotion;
