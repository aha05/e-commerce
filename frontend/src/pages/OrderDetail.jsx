import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import Header from "../components/Partials/Header";
import Footer from "../components/Partials/Footer";

const OrderDetail = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const response = await axios.get(`/api/orders/order/${orderId}`);
        setOrder(response.data.order);
        setCart(response.data.cart);
      } catch (err) {
        setError("Failed to load order details");
      } finally {
        setLoading(false);
      }
    };
    fetchOrderDetails();
  }, [orderId]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;
  if (!order) return <p>Order not found</p>;

  return (
    <div>
      <Header cart={cart} />

      <div className="container mb-5 mt-3">
        <h2>Order Details</h2>
        <div className="card mb-4">
          <div className="card-body">
            <p><strong>Order Number:</strong> {order.orderNumber}</p>
            <p><strong>Status:</strong> {order.status}</p>
            <p><strong>Placed On:</strong> {new Date(order.createdAt).toLocaleDateString()}</p>
            <p><strong>Total:</strong> ${order.orderTotal.toFixed(2)}</p>
          </div>
        </div>

        <h4>Shipping Information</h4>
        <p><strong>Address:</strong> {order.shippingAddress.address}</p>
        <p><strong>City:</strong> {order.shippingAddress.city}, {order.shippingAddress.country}</p>

        <h4>Payment Method</h4>
        <p>{order.paymentMethod}</p>

        <h4>Order Items</h4>
        <ul className="list-group">
          {order.items.map((item) => (
            <li key={item._id} className="list-group-item d-flex justify-content-between align-items-center">
              <div>
                <p>{item.productId.name}</p>
                <small>Quantity: {item.quantity}</small>
              </div>
              <span>${(item.productId.price * item.quantity).toFixed(2)}</span>
            </li>
          ))}
        </ul>
      </div>
      <Footer />
    </div>
  );
};

export default OrderDetail;
