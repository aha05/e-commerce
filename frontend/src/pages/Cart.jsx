import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Header from "../components/Partials/Header";
import Footer from "../components/Partials/Footer";
const backendUrl = import.meta.env.VITE_BACKEND_URL;
import toastr from "toastr";

const CartPage = () => {
    const [cart, setCart] = useState([]);
    const [totalPrice, setTotalPrice] = useState(0);
    const [currency, setCurrency] = useState('USD')
    const [quantities, setQuantities] = useState({});


    const getItemKey = (productId, attributes = {}) => {
        const sortedAttrs = Object.entries(attributes).sort();
        return `${productId}-${sortedAttrs.map(([k, v]) => `${k}:${v}`).join('|')}`;
    };

    useEffect(() => {
        fetchCart();
    }, []);

    const fetchCart = async () => {
        try {
            const response = await axios.get("/api/cart"); // Fetch cart data from backend
            setCart(response.data.cart);
            setQuantities(
                Object.fromEntries(
                    response.data.cart.map(item => [
                        getItemKey(item.productId, item.attributes),
                        item.quantity
                    ])
                )
            );

            calculateTotal(response.data.cart);
            setCurrency(response?.data?.currency);
        } catch (error) {
            console.error("Error fetching cart:", error);
        }
    };

    const calculateTotal = (cartItems) => {
        const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
        setTotalPrice(total.toFixed(2));
    };

    const updateCart = async (productId, action, attribute = {}) => {
        try {
            const response = await axios.post("/api/cart/update", { productId, action, attribute });
            if (response.data.success) {
                fetchCart(); // Refresh cart data
            }
        } catch (error) {
            toastr.warning(error.response?.data?.message || "Failed to update cart!");
        }
    };

    const handleQuantityChange = async (productId, newQuantity, attribute = {}) => {
        if (!newQuantity || newQuantity < 1) return; // Avoid zero or negative

        try {
            const response = await axios.post("/api/cart/set", {
                productId,
                quantity: newQuantity,
                attribute,
            });

            if (response.data.success) {
                fetchCart(); // Refresh updated cart
            }
        } catch (error) {
            toastr.warning(error.response?.data?.message || "Failed to update cart!");
            fetchCart();

        }
    };


    const removeItem = async (productId, attribute = {}) => {
        try {
            await axios.post("/api/cart/remove", { productId, attribute });
            fetchCart();
        } catch (error) {
            toastr.warning(error.response?.data?.message || "Failed to delete cart!");
        }
    };

    return (
        <div>
            <Header cart={cart} />
            <div className="container my-5">
                <h2 className="mb-4">Shopping Cart</h2>
                {cart.length > 0 ? (
                    <div className="row">
                        {/* Cart Items Section */}
                        <div className="col-lg-8">
                            {cart.map((item) => {
                                const itemKey = getItemKey(item.productId, item.attributes);

                                return (
                                    <div className="cart-item-card" key={itemKey}>
                                        <img src={`${backendUrl}${item.image}`} alt={item.name} />

                                        <div className="flex-grow-1">
                                            <h5>{item.name}</h5>
                                            <p>{item.category.name}</p>
                                            <p>
                                                {item?.attributes &&
                                                    Object.entries(item.attributes).map(([key, value]) => (
                                                        <span key={key}>
                                                            <span className="text-secondary visually-hidden">
                                                                {key.charAt(0).toLowerCase() + key.slice(1)}
                                                            </span>
                                                            <span className="fw-bold text-dark"> {value.trim()}</span>{" "}
                                                        </span>
                                                    ))}
                                            </p>

                                            <p className="text-success">
                                                <strong>{item.stock}</strong>
                                                <span className="text-secondary"> left in stock</span>
                                            </p>

                                            <p>{item.price}{item.currency}</p>
                                        </div>

                                        <div className="quantity-buttons">
                                            <button
                                                className="btn btn-secondary btn-sm"
                                                onClick={() => updateCart(item._id, 'subtract', item.attributes)}
                                            >
                                                -
                                            </button>

                                            <input
                                                type="text"
                                                className="form-control"
                                                value={quantities[itemKey] || ''}
                                                onChange={(e) => {
                                                    const newQty = parseInt(e.target.value) || '';
                                                    setQuantities(prev => ({ ...prev, [itemKey]: newQty }));
                                                    handleQuantityChange(item._id, newQty, item.attributes);
                                                }}
                                            />

                                            <button
                                                className="btn btn-secondary btn-sm"
                                                onClick={() => updateCart(item._id, 'add', item.attributes)}
                                            >
                                                +
                                            </button>
                                        </div>

                                        <div>
                                            <p>
                                                <strong>Subtotal:</strong>{" "}
                                                {(item.price * item.quantity).toFixed(2)}{item.currency}
                                            </p>
                                        </div>

                                        <button
                                            className="btn btn-sm btn-outline-danger ms-2"
                                            onClick={() => removeItem(item._id, item.attributes)}
                                        >
                                            Remove
                                        </button>
                                    </div>
                                );
                            })}

                        </div>
                        {/* Cart Summary Section */}
                        <div className="col-lg-4">
                            <div className="cart-summary">
                                <h4>Cart Summary</h4>
                                <p><strong>Total Items:</strong> {cart.length}</p>
                                <p><strong>Total Price:</strong> {totalPrice}{currency || "USD"}</p>
                                <Link to="/" className="btn btn-primary mb-2">Continue Shopping</Link>
                                <Link to="/orders/checkout" className="btn btn-success">Proceed to Checkout</Link>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="empty-cart-container">
                        <h2>Your Cart is Empty</h2>
                        <p>Looks like you haven’t added anything to your cart yet.</p>
                        <Link to="/" className="btn btn-primary mt-3">Start Shopping</Link>
                    </div>
                )}
            </div>
            <Footer />
        </div>

    );
};

export default CartPage;
