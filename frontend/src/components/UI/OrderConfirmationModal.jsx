import React from "react";
import { Modal, Button } from "react-bootstrap";
import QRCode from "react-qr-code";
import "bootstrap/dist/css/bootstrap.min.css";
import { CheckCircleFill } from "react-bootstrap-icons";

const OrderConfirmationModal = ({ show, onClose, order }) => {
    if (!order) return null;

    const estimatedDeliveryDate = new Date(Date.now() + 7 * 86400000).toLocaleDateString();

    return (
        <div className="text-center">
            <Modal
                show={show}
                onHide={onClose}
                centered
                contentClassName="custom-modal-width"
                dialogClassName="modal-dialog-centered"
            >
                <Modal.Header className="bg-success text-white py-2">
                    <Modal.Title style={{ fontSize: "1rem" }}>Order Confirmation</Modal.Title>
                </Modal.Header>

                <Modal.Body className="py-3 px-4">
                    <div className="text-center mb-3">
                        <CheckCircleFill size={40} className="text-success mb-2" />
                        <h6 className="fw-bold mb-1" style={{ fontSize: "0.95rem" }}>Thank you!</h6>
                        <p className="text-muted mb-2" style={{ fontSize: "0.8rem" }}>
                            Your order has been placed successfully.
                        </p>
                    </div>

                    <div className="w-100 d-flex bg-light p-2 rounded mb-3 w-100 toe">
                        <small className="text-secondary me-2">Order Number: </small>
                        <div className="fw-bold" style={{ fontSize: "0.9rem" }}>
                            {order.orderNumber ?? "N/A"}
                        </div>
                    </div>

                    <div className="row">
                        <div className="col-7 pe-1">
                            <ul className="list-group mb-2 shadow-sm">
                                {order.items?.map((item, idx) => (
                                    <li
                                        key={item.productId?._id || idx}
                                        className="list-group-item py-1 px-2 d-flex justify-content-between align-items-center"
                                    >
                                        <small>{item.productId?.name} (x{item.quantity})</small>
                                        <small>{((item?.discountPrice || item?.productId?.price || 0) * (item?.quantity || 1)).toFixed(2)}{item.productId?.currency}</small>
                                    </li>
                                ))}
                                <li
                                    key="total"
                                    className="list-group-item bg-light d-flex justify-content-between py-1 px-2"
                                >
                                    <strong>Total</strong>
                                    <strong>{parseFloat(order?.orderTotal || 0).toFixed(2)}{order.currency}</strong>
                                </li>
                            </ul>

                            <p className="mb-1" style={{ fontSize: "0.75rem" }}>
                                <strong>{order.shippingAddress?.fullName}</strong><br />
                                {order.shippingAddress?.address}, {order.shippingAddress?.city}<br />
                                {order.shippingAddress?.postalCode}, {order.shippingAddress?.country}
                            </p>
                            <p className="text-muted" style={{ fontSize: "0.7rem" }}>
                                <strong>Delivery:</strong> {estimatedDeliveryDate}
                            </p>
                        </div>

                        <div className="col-5 text-center d-flex flex-column align-items-center justify-content-center border-start">
                            <small className="fw-bold mb-1" style={{ fontSize: "0.75rem" }}>Track</small>
                            <QRCode
                                value={`https://yourstore.com/track/${order.orderNumber}`}
                                size={80}
                                level="H"
                            />
                            <small className="text-muted mt-1" style={{ fontSize: "0.65rem" }}>Scan to track</small>
                        </div>
                    </div>
                </Modal.Body>

                <Modal.Footer className="py-2">
                    <Button size="sm" variant="secondary" onClick={onClose}>
                        Close
                    </Button>
                    <Button
                        size="sm"
                        variant="success"
                        onClick={() => window.open(`https://yourstore.com/track/${order.orderNumber}`, "_blank")}
                    >
                        Track Order
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Custom modal width styling */}
            <style>
                {`
                    .custom-modal-width {
                        max-width: 570px;
                        margin: auto;
                    }
                `}
            </style>
        </div>
    );
};

export default OrderConfirmationModal;
