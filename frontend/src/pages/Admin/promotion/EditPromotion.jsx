import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import toastr from "toastr";

const EditPromotion = () => {
    const { promotionId } = useParams();
    const navigate = useNavigate();

    const [products, setProducts] = useState([]);
    const [promotion, setPromotion] = useState({
        name: "",
        type: "", // default to 'auto'
        code: "",
        discountPercentage: "",
        startDate: "",
        endDate: "",
        productId: "",
    });

    // Fetch products and promotion data
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [productRes, promotionRes] = await Promise.all([
                    axios.get("/api/admin/products"),
                    axios.get(`/api/admin/promotions/update/${promotionId}`)
                ]);

                const promo = promotionRes.data.promotion;
                const productList = productRes.data.products;

                const sortedProducts = productList.sort((a, b) =>
                    a._id === promo.product ? -1 : b._id === promo.product ? 1 : 0
                );

                setPromotion({
                    name: promo.name,
                    type: promo.type || "auto",
                    code: promo.code || "",
                    discountPercentage: promo.discountPercentage,
                    startDate: promo.startDate.split("T")[0],
                    endDate: promo.endDate.split("T")[0],
                    productId: promo.product || "",
                });

                setProducts(sortedProducts);
            } catch (error) {
                if (error.response?.status === 401) navigate('/unauthorized');
                toastr.error("Error fetching promotion or product list.");
            }
        };

        fetchData();
    }, [promotionId]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setPromotion(prev => ({
            ...prev,
            [name]: value,
            ...(name === "type" && value === "auto" ? { code: "" } : {}) // Clear code if switched to auto
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            await axios.put(`/api/admin/promotions/update/${promotionId}`, promotion);
            toastr.success("Promotion updated successfully!");
            navigate("/admin/promotions");
        } catch (err) {
            toastr.error("Failed to update promotion.");
        }
    };

    return (
        <div className="container my-4">
            <h3 className="mb-2">
                Dashboard &gt; Manage Promotion &gt;
                <span className="text-primary"> Edit Promotion</span>
            </h3>

            <div className="card">
                <div className="card-header">
                    <h4 className="mb-0">Update Promotion Details</h4>
                </div>
                <div className="card-body">
                    <form onSubmit={handleSubmit}>
                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <label className="form-label">Promotion Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    className="form-control"
                                    value={promotion.name}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label className="form-label">Promotion Type</label>
                                <select
                                    name="type"
                                    className="form-select"
                                    value={promotion.type}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="auto">Automatic</option>
                                    <option value="code">Code Based</option>
                                    <option value="hybrid">Hybrid</option>
                                </select>
                            </div>
                        </div>

                        {(promotion.type === "code" || promotion.type === "hybrid") && (
                            <div className="row">
                                <div className="col-md-6 mb-3">
                                    <label className="form-label">Promo Code</label>
                                    <input
                                        type="text"
                                        name="code"
                                        className="form-control"
                                        value={promotion.code}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>
                        )}

                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <label className="form-label">Discount Percentage (%)</label>
                                <input
                                    type="number"
                                    name="discountPercentage"
                                    className="form-control"
                                    value={promotion.discountPercentage}
                                    onChange={handleChange}
                                    min="0"
                                    max="100"
                                    required
                                />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label className="form-label">Product</label>
                                <select
                                    name="productId"
                                    className="form-select"
                                    value={promotion.productId || ""}
                                    onChange={handleChange}
                                    required
                                >
                                    {products.map((product) => (
                                        <option key={product._id} value={product._id}>
                                            {product.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <label className="form-label">Start Date</label>
                                <input
                                    type="date"
                                    name="startDate"
                                    className="form-control"
                                    value={promotion.startDate}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label className="form-label">End Date</label>
                                <input
                                    type="date"
                                    name="endDate"
                                    className="form-control"
                                    value={promotion.endDate}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <button type="submit" className="btn btn-primary">
                            <i className="fas fa-save"></i> Save Changes
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default EditPromotion;
