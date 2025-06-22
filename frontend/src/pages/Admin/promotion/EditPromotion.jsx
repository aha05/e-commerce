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
                toastr.error(error.response.data.message || 'Error');
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
        } catch (error) {
            toastr.error(error.response.data.message || 'Error');
        }
    };

    return (
        <div className="container my-4">

            <p className="fs-5 text-muted mb-3">Promotions &gt; Edit Promotion</p>

            <div className="card border-0">
                <div className="card-body">
                    <form onSubmit={handleSubmit} style={{ padding: "0% 5%" }}>
                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <label className="form-label text-muted">Promotion Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    className="form-control bg-light"
                                    value={promotion.name}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label className="form-label text-muted">Promotion Type</label>
                                <select
                                    name="type"
                                    className="form-select bg-light"
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
                                    <label className="form-label text-muted">Promo Code</label>
                                    <input
                                        type="text"
                                        name="code"
                                        className="form-control bg-light"
                                        value={promotion.code}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>
                        )}

                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <label className="form-label text-muted">Discount Percentage (%)</label>
                                <input
                                    type="number"
                                    name="discountPercentage"
                                    className="form-control bg-light"
                                    value={promotion.discountPercentage}
                                    onChange={handleChange}
                                    min="0"
                                    max="100"
                                    required
                                />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label className="form-label text-muted">Product</label>
                                <select
                                    name="productId"
                                    className="form-select bg-light"
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

                        <div className="row mb-2">
                            <div className="col-md-6 mb-3">
                                <label className="form-label text-muted">Start Date</label>
                                <input
                                    type="date"
                                    name="startDate"
                                    className="form-control bg-light"
                                    value={promotion.startDate}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label className="form-label text-muted">End Date</label>
                                <input
                                    type="date"
                                    name="endDate"
                                    className="form-control bg-light"
                                    value={promotion.endDate}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <button type="submit" className="btn btn-primary">
                            <i className="fas fa-save"></i> Update
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default EditPromotion;
