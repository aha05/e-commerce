import React, { useState, useEffect } from "react";
import axios from "axios";
import Header from "../components/Partials/Header";
import Footer from "../components/Partials/Footer";
import OrderConfirmationModal from "../components/UI/OrderConfirmationModal";
import { useNavigate } from "react-router-dom";
import toastr from "toastr";

const Checkout = () => {
    const [cart, setCart] = useState([]);
    const [user, setUser] = useState({});
    const [order, setOrder] = useState(null);
    const [currency, setCurrency] = useState('USD');
    const [settings, setSettings] = useState({});
    const [showModal, setShowModal] = useState(false);
    const [code, setCode] = useState("");
    const [formData, setFormData] = useState({
        fullName: "",
        address: "",
        city: "",
        postalCode: "",
        country: "",
        paymentMethod: "",
    });

    const [paymentMethods, setPaymentMethods] = useState([]);
    const [showPaymentMethodModal, setPaymentMethodModal] = useState(false);
    const [type, setType] = useState("credit_card");
    const [isDefault, setIsDefault] = useState(true);
    const [details, setDetails] = useState({
        number: "",
        expiry: "",
        cvv: "",
        paypalEmail: "",
        bankName: "",
        bankAccount: ""
    });

    const navigate = useNavigate();

    useEffect(() => {
        const fetchCart = async () => {
            try {
                const response = await axios.get("/api/orders/checkout");
                setCart(response.data.cart);
                setUser(response?.data?.user);
            } catch (error) {
                console.error("Error fetching cart:", error);
            }
        };
        fetchCart();
    }, []);

    useEffect(() => {
        if (user && user.address) {
            setFormData(prev => ({
                ...prev,
                fullName: `${user.FirstName || ""} ${user.MiddleName || ""} ${user.LastName || ""}`.trim(),
                address: user.address.address || "",
                city: user.address.city || "",
                postalCode: user.address.postalCode || "",
                country: user.address.country || "",
            }));
        }
    }, [user]);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await axios.get(`/api/settings/${user._id}`);
                setSettings(res.data);
                setCurrency(res.data.preferences.currency);
            } catch (err) {
                console.error("Failed to load settings");
            }
        };

        const fetchPaymentMethods = async () => {
            try {
                const res = await axios.get(`/api/settings/payment/${user._id}`);
                setPaymentMethods(res.data || []);
            } catch (err) {
                console.error("Failed to load payment methods");
            }
        };

        if (user && user._id) {
            fetchSettings();
            fetchPaymentMethods();
        }
    }, [user]);

    useEffect(() => {
        if (paymentMethods.length > 0) {
            const defaultPM = paymentMethods.find(pm => pm.isDefault);
            if (defaultPM) {
                const label = defaultPM.type === "credit_card"
                    ? `Credit Card (****${defaultPM.details.cardLast4})`
                    : defaultPM.type === "paypal"
                        ? `PayPal (${defaultPM.details.paypalEmail})`
                        : `Bank Transfer (${defaultPM.details.bankName})`;

                setFormData(prev => ({ ...prev, paymentMethod: label }));
            }
        }
    }, [paymentMethods]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleAddPaymentMethod = async () => {
        let payload = {
            type,
            isDefault,
            details: {},
        };

        if (type === "credit_card") {
            payload.details.cardLast4 = details.number.slice(-4);
            payload.details.cardBrand = "Visa";
        } else if (type === "paypal") {
            payload.details.paypalEmail = details.paypalEmail;
        } else if (type === "bank_transfer") {
            payload.details.bankName = details.bankName;
            payload.details.bankAccountLast4 = details.bankAccount.slice(-4);
        }

        try {
            await axios.post(`/api/settings/payment/${user._id}`, payload);
            toastr.success("Payment method added");
            setPaymentMethodModal(false);
            setDetails({ number: "", expiry: "", cvv: "", paypalEmail: "", bankName: "", bankAccount: "" });
            setType("credit_card");
            window.location.reload();
        } catch (error) {
            toastr.warning(error.response?.data?.message);
        }
    };

    const handleDelete = async (index) => {
        try {
            await axios.delete(`/api/settings/payment/delete/${user._id}/${index}`);
            toastr.success("Payment method removed");
            window.location.reload();
        } catch (error) {
            toastr.error(error.response?.data?.message);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const orderData = {
            userId: user?._id || '',
            shippingAddress: formData,
            paymentMethod: formData.paymentMethod,
            code
        };

        if (!formData.paymentMethod) {
            setPaymentMethodModal(true);
            return;
        }

        try {
            const response = await fetch("/api/orders/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(orderData),
            });

            const result = await response.json();
            if (result.success) {
                const res = await axios.get(`/api/orders/order-confirmation?orderNumber=${result.orderNumber}`);
                setOrder(res.data.order);
                setShowModal(true);
            } else {
                alert("Please log in first.");
            }
        } catch (error) {
            console.error("Error submitting order:", error);
        }
    };

    return (
        <div>
            <Header />
            <OrderConfirmationModal show={showModal} onClose={() => setShowModal(false)} order={order} />
            <div className="container my-4">
                <p className="fs-5 fw-bold text-muted ms-5 ps-5">
                    <span>Checkout</span>
                </p>
                <form onSubmit={handleSubmit} className="card border-0 px-5 mx-5">
                    <p className="fs-6 fw-semibold text-muted">Shipping Information</p>
                    <div className="row">
                        {[
                            { label: "Full Name", name: "fullName", },
                            { label: "Address", name: "address", },
                            { label: "City", name: "city", },
                            { label: "Postal Code", name: "postalCode", },
                            { label: "Country", name: "country", },
                        ].map(({ label, name }) => (
                            <div className="mb-1 col-6" key={name}>
                                <label htmlFor={name} className="form-label text-muted">{label}</label>
                                <input
                                    type="text"
                                    name={name}
                                    id={name}
                                    className="form-control bg-light"
                                    required
                                    value={formData[name]}
                                    onChange={handleChange}
                                />
                            </div>
                        ))}
                    </div>
                    <div className="row">
                        <div className="col-md-6 mt-3">
                            <span className="fs-6 fw-semibold text-muted">Payment Options</span>
                            <div className="my-2">
                                <select
                                    name="paymentMethod"
                                    value={formData.paymentMethod}
                                    onChange={handleChange}
                                    className="form-select mb-3 bg-light"
                                >
                                    {paymentMethods.map((pm, index) => {
                                        const label =
                                            pm.type === "credit_card"
                                                ? `Credit Card (****${pm.details.cardLast4})`
                                                : pm.type === "paypal"
                                                    ? `PayPal (${pm.details.paypalEmail})`
                                                    : `Bank Transfer (${pm.details.bankName})`;
                                        return (
                                            <option key={index} value={label}>
                                                {label}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>
                        </div>
                        <div className="col-md-6 mt-3">
                            <span className="fs-6 fw-semibold text-muted">Code (Optional)</span>
                            <div className="my-2" >
                                <input
                                    type="text"
                                    name="code"
                                    id="code"
                                    className="form-control bg-light"
                                    placeholder="Enter Code"
                                    onChange={(e) => setCode(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                    <span className="fs-6 fw-semibold text-muted">Order Summary</span>
                    <ul className="list-group  mb-3 mt-2">
                        {cart.map((item) => (
                            <li key={item._id} className="list-group-item bg-light d-flex justify-content-between">
                                <span>{item.name} (Quantity: {item.quantity})</span>
                                <span>{(item.price * item.quantity).toFixed(2)}{item.currency}</span>
                            </li>
                        ))}
                        <li className="list-group-item bg-light d-flex justify-content-between">
                            <strong>Total</strong>
                            <strong>
                                {cart.reduce((total, item) => total + item.price * item.quantity, 0).toFixed(2)}{currency}
                            </strong>
                        </li>
                    </ul>
                    <button type="submit" className="btn btn-primary mb-5" style={{ width: "130px" }}>Place Order</button>
                </form>
            </div>
            {showPaymentMethodModal && (
                <div className="modal show d-block" style={{ background: "rgba(0,0,0,0.5)" }}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            {/* Existing Methods */}
                            <div className="modal-header">
                                <h5 className="modal-title">Payment Method</h5>
                                <button className="btn-close" onClick={() => setPaymentMethodModal(false)}></button>
                            </div>


                            <div className="modal-body">
                                <div className="mt-1">
                                    {paymentMethods.map((pm, idx) => (
                                        <div key={idx} className="border p-2 rounded mb-2 d-flex justify-content-between align-items-center">
                                            <div>
                                                <strong>{pm.type.replace("_", " ").toUpperCase()}</strong> —
                                                {pm.type === "credit_card" && ` Card ending in **** ${pm.details.cardLast4}`}
                                                {pm.type === "paypal" && ` ${pm.details.paypalEmail}`}
                                                {pm.type === "bank_transfer" && ` ${pm.details.bankName}, ****${pm.details.bankAccountLast4}`}
                                                {pm.isDefault && <span className="badge bg-primary ms-2">Default</span>}
                                            </div>
                                            <div>
                                                <button className="btn btn-sm btn-outline-danger me-1" onClick={() => handleDelete(idx)}>
                                                    <i className="fas fa-trash"></i>
                                                </button>
                                                {/* Edit logic can be added here */}
                                                {/* <button className="btn btn-sm btn-outline-secondary">
                                                                            <i className="fas fa-edit"></i>
                                                                        </button> */}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="card p-4">
                                    <h6>Add New Payment Method</h6>
                                    {/* Payment Method Type Selection */}
                                    <select
                                        className="form-select mb-3"
                                        value={type}
                                        onChange={(e) => setType(e.target.value)}
                                    >
                                        <option value="credit_card">Credit Card</option>
                                        <option value="paypal">PayPal</option>
                                        <option value="bank_transfer">Bank Transfer</option>
                                    </select>

                                    {/* Dynamic Fields */}
                                    {type === "credit_card" && (
                                        <>
                                            <input
                                                type="text"
                                                className="form-control mb-2"
                                                placeholder="Card Number"
                                                maxLength={16}
                                                value={details.number}
                                                onChange={(e) =>
                                                    setDetails({ ...details, number: e.target.value })
                                                }
                                            />
                                            <input
                                                type="text"
                                                className="form-control mb-2"
                                                placeholder="Expiry MM/YY"
                                                value={details.expiry}
                                                onChange={(e) =>
                                                    setDetails({ ...details, expiry: e.target.value })
                                                }
                                            />
                                            <input
                                                type="text"
                                                className="form-control mb-2"
                                                placeholder="CVV"
                                                maxLength={4}
                                                value={details.cvv}
                                                onChange={(e) =>
                                                    setDetails({ ...details, cvv: e.target.value })
                                                }
                                            />
                                        </>
                                    )}

                                    {type === "paypal" && (
                                        <input
                                            type="email"
                                            className="form-control mb-2"
                                            placeholder="PayPal Email"
                                            value={details.paypalEmail}
                                            onChange={(e) =>
                                                setDetails({ ...details, paypalEmail: e.target.value })
                                            }
                                        />
                                    )}

                                    {type === "bank_transfer" && (
                                        <>
                                            <input
                                                type="text"
                                                className="form-control mb-2"
                                                placeholder="Bank Name"
                                                value={details.bankName}
                                                onChange={(e) =>
                                                    setDetails({ ...details, bankName: e.target.value })
                                                }
                                            />
                                            <input
                                                type="text"
                                                className="form-control mb-2"
                                                placeholder="Bank Account Number"
                                                value={details.bankAccount}
                                                onChange={(e) =>
                                                    setDetails({ ...details, bankAccount: e.target.value })
                                                }
                                            />
                                        </>
                                    )}
                                    <div className="form-check mb-3">
                                        <input
                                            className="form-check-input"
                                            type="checkbox"
                                            checked={isDefault}
                                            onChange={(e) => setIsDefault(e.target.checked)}
                                            id="isDefaultCheckbox"
                                        />
                                        <label className="form-check-label" htmlFor="isDefaultCheckbox">
                                            Set as default payment method
                                        </label>
                                    </div>
                                    <div className="d-flex justify-content-end">
                                        <button className="btn btn-success" onClick={handleAddPaymentMethod} >
                                            <i className="fas fa-plus"></i> Add
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            <Footer />
        </div>
    );
};

export default Checkout;
