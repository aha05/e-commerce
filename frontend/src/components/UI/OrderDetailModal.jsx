import React, { useState } from "react";
import { Modal, Button } from "react-bootstrap";
const backendUrl = import.meta.env.VITE_BACKEND_URL;

const OrderDetailModal = ({ selectedOrder, show, onClose }) => {
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [showModal, setShowModal] = useState(false);

    if (!show || !selectedOrder) return null;

    const items = selectedOrder.items || [];
    const currentItem = items[activeImageIndex] || {};


    const handleNext = () => {
        setActiveImageIndex((prev) => (prev + 1) % items.length);
    };

    const handlePrev = () => {
        setActiveImageIndex((prev) => (prev - 1 + items.length) % items.length);
    };

    const handleImageClick = () => {
        setShowModal(true);
    };

    const handleClose = () => {
        setShowModal(false);
    };

    return (
        <div className="text-center">
            <div className="modal show fade d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}>
                <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: "570px", margin: "auto" }}>
                    <div className="modal-content">
                        <div className="modal-header py-2">
                            <h5 className="modal-title" style={{ fontSize: "1rem" }}>Order Details</h5>
                            <button type="button" className="btn-close" onClick={onClose}></button>
                        </div>

                        <div className="modal-body py-3 px-4">
                            <div className="bg-light p-3 rounded mb-3">
                                <div className="row align-items-start">
                                    {/* Product Image Carousel */}
                                    <div className="col-md-4 d-flex flex-column align-items-center position-relative">
                                        <h6 className="text-secondary mb-3">Product</h6>
                                        <div className="position-relative d-inline-block">
                                            <img
                                                src={`${backendUrl}${currentItem?.productId?.image || "/placeholder.jpg"}`}
                                                alt={currentItem?.productId?.name || "Unnamed Product"}
                                                onClick={handleImageClick}
                                                style={{
                                                    width: "60px",
                                                    height: "60px",
                                                    objectFit: "cover",
                                                    borderRadius: "6px",
                                                    marginBottom: "10px"
                                                }}
                                            />

                                            {/* Left Arrow */}
                                            <button
                                                onClick={handlePrev}
                                                className="position-absolute top-50 start-0 translate-middle-y border-0 rounded-circle badge fw-bold"
                                                style={{ fontSize: "0.9rem", color: "#000", marginLeft: "-15px", padding: "0.2rem" }}
                                            >
                                                &lt;
                                            </button>

                                            {/* Right Arrow */}
                                            <button
                                                onClick={handleNext}
                                                className="position-absolute top-50 end-0 translate-middle-y border-0 rounded-circle badge fw-bold"
                                                style={{ fontSize: "0.9rem", color: "#000", marginRight: "-15px", padding: "0.2rem" }}
                                            >
                                                &gt;
                                            </button>
                                        </div>

                                        <small className="fw-bold d-block text-center mt-1">
                                            {currentItem?.productId?.name || "Unnamed Product"}
                                        </small>
                                        <small style={{ fontSize: "0.75rem" }}>
                                            {currentItem.attributes ? Object.entries(currentItem.attributes).map(([key, value]) => (
                                                <span key={key}><span className="text-muted"> {key}:</span> <span> {value}</span><span className="text-muted"> |</span></span>
                                            )) : "No attributes"}
                                        </small>
                                        <small>{currentItem?.productId?.price} {currentItem?.productId?.currency}</small>
                                        <small className="text-muted">
                                            {[...Array(5)].map((_, i) => {
                                                const rating = currentItem?.productId?.averageRating || 0;

                                                return (
                                                    <i
                                                        key={i}
                                                        className={
                                                            rating >= i + 1
                                                                ? "fas fa-star text-warning me-1"           // full star
                                                                : rating >= i + 0.5
                                                                    ? "fas fa-star-half-alt text-warning me-1"  // half star
                                                                    : "far fa-star text-warning me-1"           // empty star
                                                        }
                                                        style={{ fontSize: "12px" }}
                                                    ></i>
                                                );
                                            })}
                                            <br />
                                            <span style={{ fontSize: "10px" }} className="text-dark">
                                                ({currentItem?.productId?.totalReviews || 0} reviews)
                                            </span>
                                        </small>
                                    </div>

                                    {/* Order Info */}
                                    <div className="col-md-8 text-start">
                                        <h6 className="text-secondary mb-3">Order Details</h6>
                                        <small className="text-secondary d-block mb-2"><strong>Order Number:</strong> {selectedOrder.orderNumber || "N/A"}</small>
                                        <small className="text-secondary d-block mb-2"><strong>Status:</strong> {selectedOrder.status || "Pending"}</small>
                                        <small className="text-secondary d-block mb-2"><strong>Payment Method:</strong> {selectedOrder.paymentMethod || "N/A"}</small>
                                        <small className="text-secondary d-block mb-2"><strong>Placed On:</strong> {new Date(selectedOrder.createdAt || "").toLocaleString()}</small>
                                    </div>
                                </div>
                            </div>

                            {/* Items List */}
                            <div className="row">
                                <div className="col-7 pe-1">
                                    <ul className="list-group mb-2 shadow-sm">
                                        {items?.map((item, idx) => (
                                            <li
                                                key={idx}
                                                className="list-group-item py-1 px-2 d-flex justify-content-between align-items-center"
                                            >
                                                <small>{item.productId?.name} (x{item.quantity})</small> <br />

                                                <small>{((item?.discountPrice || item?.productId?.price || 0) * (item?.quantity || 1)).toFixed(2)}{item.productId?.currency}</small>
                                            </li>
                                        ))}
                                        <li className="list-group-item bg-light d-flex justify-content-between py-1 px-2">
                                            <strong>Total</strong>
                                            <strong>{parseFloat(selectedOrder?.orderTotal || 0).toFixed(2)}{selectedOrder.currency}</strong>
                                        </li>
                                    </ul>
                                    {/* Address */}
                                    <p className="mb-1" style={{ fontSize: "0.75rem" }}>
                                        <strong>{selectedOrder.shippingAddress?.fullName || "N/A"}</strong><br />
                                        {selectedOrder.shippingAddress?.address || ""}, {selectedOrder.shippingAddress?.city || ""}<br />
                                        {selectedOrder.shippingAddress?.postalCode || ""}, {selectedOrder.shippingAddress?.country || ""}
                                    </p>
                                    <p className="text-muted" style={{ fontSize: "0.7rem" }}>
                                        <strong>Delivery:</strong>{" "}
                                        {new Date(new Date(selectedOrder.createdAt || "").getTime() + 5 * 86400000).toLocaleDateString()}
                                    </p>
                                </div>

                                {/* QR Code */}
                                <div className="col-5 text-center d-flex flex-column align-items-center justify-content-center border-start">
                                    <small className="fw-bold mb-1" style={{ fontSize: "0.75rem" }}>Track</small>
                                    <img
                                        src={`https://api.qrserver.com/v1/create-qr-code/?data=https://yourstore.com/track/${selectedOrder.orderNumber}&size=80x80`}
                                        alt="QR Code"
                                    />
                                    <small className="text-muted mt-1" style={{ fontSize: "0.65rem" }}>Scan to track</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Zoom Modal */}
            <Modal show={showModal} onHide={handleClose} centered size="lg" contentClassName="bg-dark text-white">
                <Modal.Body className="text-center position-relative">
                    <Button
                        variant="light"
                        onClick={() => {
                            handlePrev();

                        }}
                        className="position-absolute top-50 start-0 translate-middle-y"
                    >
                        &lt;
                    </Button>

                    <img
                        src={`${backendUrl}${currentItem?.productId?.image || "/placeholder.jpg"}`}
                        alt="Zoom View"
                        className="img-fluid rounded"
                        style={{ maxHeight: "70vh", objectFit: "contain" }}
                    />

                    <Button
                        variant="light"
                        onClick={() => {
                            handleNext();

                        }}
                        className="position-absolute top-50 end-0 translate-middle-y"
                    >
                        &gt;
                    </Button>
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default OrderDetailModal;
