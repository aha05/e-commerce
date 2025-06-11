import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import toastr from "toastr";

const OrderDetails = () => {
    const { orderId } = useParams();
    const [order, setOrder] = useState(null); // Initialize as null to prevent empty array state
    useEffect(() => {
        // Fetch order details
        axios.get(`/api/admin/orders/details/${orderId}`)
            .then((res) => {
                setOrder(res.data.order);
                console.log(res.data, "nothing");
            })
            .catch((err) => {
                if (error.response.status === 401) navigate('/unauthorized');
                toastr.error("Error fetching order details")
            });
    }, [orderId]);

    if (!order) {
        return <div className="container my-4">Loading...</div>;
    }

    return (
        <div className="container my-4">
            <p className="mb-4 fs-5">Order Details</p>

            {/* Order Summary */}
            <div className="row container gap-1">
                <div className="col card border-0 shadow-sm mb-4 me-2">
                    <div className="card-body">
                        <p className="fs-6 fw-bold text-muted" >Order Summary</p>
                        <p><span className="text-muted">Order ID:</span> <span>{order._id}</span></p>
                        <p><span className="text-muted">Order Date:</span> {new Date(order.createdAt).toLocaleDateString()}</p>
                        <p><span className="text-muted">Status:</span> <span className="badge bg-info text-dark">{order.status}</span></p>
                        <p><span className="text-muted">Total:</span> ${order.orderTotal && order.orderTotal.toFixed(2)}</p>
                    </div>
                </div>

                {/* Customer Details */}
                <div className="col card border-0 shadow-sm mb-4 ms-2">
                    <div>
                        <p className="fs-6 fw-bold text-muted">Customer Details</p>
                        <p><span className="text-muted">Name:</span> {order.userId ? order.userId.name : "Guest"}</p>
                        <p><span className="text-muted">Email:</span> {order.userId ? order.userId.email : "N/A"}</p>
                        <p><span className="text-muted">Shipping Address:</span></p>
                        <p>
                            {order.shippingAddress.fullName} <br />
                            {order.shippingAddress.address}, {order.shippingAddress.city} <br />
                            {order.shippingAddress.postalCode}, {order.shippingAddress.country}
                        </p>
                    </div>
                </div>
            </div>

            {/* Order Items */}
            <div className="card border-0 shadow-sm mb-4 me-4">
                <div className="card-body">
                    <p className="fs-6 fw-bold text-muted">Items in the Order</p>
                    <table className="table">
                        <thead>
                            <tr>
                                <th className="text-muted">Product</th>
                                <th className="text-muted">Price</th>
                                <th className="text-muted">Quantity</th>
                                <th className="text-muted">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            {order.items.map((item, index) => (
                                <tr key={index}>
                                    <td>{item.productId?.name || "N/A"}</td>
                                    <td>${item.productId?.price ? item.productId.price.toFixed(2) : "0.00"}</td>
                                    <td>{item.quantity}</td>
                                    <td>${item.productId?.price ? (item.productId.price * item.quantity).toFixed(2) : "0.00"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Back Button */}
            <div className="mt-4">
                <a href="/admin/orders" className="btn btn-light">Back to Orders</a>
            </div>
        </div>
    );
};

export default OrderDetails;
