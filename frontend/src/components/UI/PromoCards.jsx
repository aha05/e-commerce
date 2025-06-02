import React from "react";
import '../../styles/promocards.css'
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
const backendUrl = import.meta.env.VITE_BACKEND_URL;
import axios from "axios";

const PromoCards = ({ promotions }) => {
    const navigate = useNavigate();
    const handleBuyNow = async (productId, quantity = 1, discountPrice = 0) => {

        try {
            const res = await axios.post("/api/cart/add", {
                productId, quantity, discountPrice




            });
            if (res) {
                navigate("/orders/checkout");
            }
        } catch (error) {

            if (error.response.status === 401) {
                toast.warning("Please log in to continue");
                navigate("/login?redirect=/orders/checkout");

            } else {
                toast.error("Something went wrong");
            }
        }
    };

    return (
        <div id="discounts" className="container my-5">
            <h2 className="text-center mb-5">Special Discounts</h2>
            <div className="row mb-4">
                {promotions.map(promotion => (
                    <div className="col-md-3 mb-4 px-4">
                        <div className="card h-100 shadow-lg border-0 rounded-4 overflow-hidden">
                            <div className="position-relative">
                                <img
                                    src={`${backendUrl}${promotion.product?.image}`}
                                    className="card-img-top"
                                    alt={promotion.product?.name}
                                />
                                <span className="badge bg-danger position-absolute top-0 start-0 m-2 fs-6">
                                    {promotion.discountPercentage}% OFF
                                </span>
                            </div>
                            <div className="card-body px-4">
                                <h5 className="card-title text-dark fw-bold mb-2">
                                    {promotion.product?.name}
                                </h5>
                                <p className="text-muted mb-1">
                                    <strong>Promotion:</strong> {promotion.name}
                                </p>
                                <p className="text-muted mb-2">
                                    <i className="fas fa-calendar-alt me-1"></i>{" "}
                                    <strong>Valid:</strong> {format(new Date(promotion.startDate), 'MMM dd')}  – {format(new Date(promotion.endDate), 'MMM dd')}
                                </p>
                                <div className="d-grid">
                                    <button
                                        className="btn btn-primary rounded-pill fw-semibold buy-btn"
                                        onClick={() => handleBuyNow(promotion.product?._id, 1, promotion.product?.discountPrice)}
                                    >
                                        <i className="fas fa-shopping-cart me-2"></i> Buy Now
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PromoCards;
