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
            <h1 className="mb-4">Order Details</h1>

            {/* Order Summary */}
            <div className="card mb-4">
                <div className="card-header">Order Summary</div>
                <div className="card-body">
                    <p><strong>Order ID:</strong> {order._id}</p>
                    <p><strong>Order Date:</strong> {new Date(order.createdAt).toLocaleDateString()}</p>
                    <p><strong>Status:</strong> <span className="badge bg-info text-dark">{order.status}</span></p>
                    <p><strong>Total:</strong> ${order.orderTotal && order.orderTotal.toFixed(2)}</p>
                </div>
            </div>

            {/* Customer Details */}
            <div className="card mb-4">
                <div className="card-header">Customer Details</div>
                <div className="card-body">
                    <p><strong>Name:</strong> {order.userId ? order.userId.name : "Guest"}</p>
                    <p><strong>Email:</strong> {order.userId ? order.userId.email : "N/A"}</p>
                    <p><strong>Shipping Address:</strong></p>
                    <p>
                        {order.shippingAddress.fullName} <br />
                        {order.shippingAddress.address}, {order.shippingAddress.city} <br />
                        {order.shippingAddress.postalCode}, {order.shippingAddress.country}
                    </p>
                </div>
            </div>

            {/* Order Items */}
            <div className="card mb-4">
                <div className="card-header">Items in the Order</div>
                <div className="card-body">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>Price</th>
                                <th>Quantity</th>
                                <th>Subtotal</th>
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
                <a href="/admin/orders" className="btn btn-secondary">Back to Orders</a>
            </div>
        </div>
    );
};

export default OrderDetails;
