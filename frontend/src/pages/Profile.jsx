import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Header from "../components/Partials/Header";
import Footer from "../components/Partials/Footer";
import 'font-awesome/css/font-awesome.min.css';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/bootstrap.css';
import countries from "i18n-iso-countries";
import enLocale from "i18n-iso-countries/langs/en.json";
import '../styles/phone-input-custom.css';
import Select from "react-select";
const backendUrl = import.meta.env.VITE_BACKEND_URL;
import axios from "axios";
import "../styles/profile.css"
import toastr from "toastr";
import OrderDetailModal from "../components/UI/OrderDetailModal";
import RefundModal from "../components/UI/RefundModal";
import { Card, Container, Row, Col, Button } from 'react-bootstrap';



const Profile = () => {
    const [user, setUser] = useState({});
    const [formData, setFormData] = useState({
        FirstName: "",
        MiddleName: "",
        LastName: "",
        username: "",
        email: "",
        phone: "",
        address: {
            country: "",
            city: "",
            postalCode: "",
            homeNumber: "",
            address: ""
        }
    });
    const [refunds, setRefunds] = useState([]);

    const [orders, setOrders] = useState([]);
    const [activeTab, setActiveTab] = useState("profile");
    const [cart, setCart] = useState([]);
    const [showOrderDetailModal, setShowOrderDetailModal] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [showPasswordChangeModal, setPasswordChangeModal] = useState(false);
    const [showDeleteModal, setDeleteModal] = useState(false);
    const [showNotificationModal, setNotificationModal] = useState(false);
    const [showPaymentMethodModal, setPaymentMethodModal] = useState(false);
    const [showLanguageAndCurrencyModal, setLanguageAndCurrencyModal] = useState(false);
    const [showRefundModal, setShowRefundModal] = useState(false);

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [errorMessage, setErrorMessage] = useState("");
    countries.registerLocale(enLocale); // Load English names
    const countryOptions = Object.entries(countries.getNames("en", { select: "official" })).map(
        ([code, name]) => ({
            value: name,
            label: name,
        })
    );

    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await axios.get("/api/profile");
                const cleanUser = JSON.parse(JSON.stringify(res.data.user));
                setUser(cleanUser);
                setFormData(cleanUser);
                setOrders(res.data.orders || []);
                setCart(res.data.cart || []);
            } catch (error) {
                console.error("Failed to load profile data", error);
            }
        };

        fetchData();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name.startsWith("address.")) {
            const key = name.split(".")[1];
            setFormData((prev) => ({
                ...prev,
                address: {
                    ...prev.address,
                    [key]: value,
                },
            }));
        } else {
            setFormData((prev) => ({
                ...prev,
                [name]: value,
            }));
        }
    };


    const handleSave = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/profile/edit/${user._id}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (res.ok) {
                setMessage("Profile updated successfully.");
                setUser(data.user || formData);
                setShowModal(false);
            } else {
                setMessage(data.message || "Something went wrong.");
            }
        } catch (err) {
            console.error(err);
            setMessage("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const openOrderDetails = async (order) => {
        if (order) {
            const res = await axios.get(`/api/orders/order-confirmation?orderNumber=${order.orderNumber}`);
            setSelectedOrder(res.data.order);
            setShowOrderDetailModal(true);
        } else {
            setSelectedOrder(order);
            setShowOrderDetailModal(true);
        }
    };

    const closeOrderModal = () => {
        setSelectedOrder(null);
    };


    const [passwords, setPasswords] = useState({
        current: "",
        new: "",
        confirm: "",
    });

    const [notificationPrefs, setNotificationPrefs] = useState({
        promoEmail: false,
        smsAlerts: false,
        reviewReminders: false,
    });

    const [paymentMethods, setPaymentMethods] = useState([]);
    const [settings, setSettings] = useState({});
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

    const [language, setLanguage] = useState("");
    const [currency, setCurrency] = useState("");

    const handleChangePassword = async () => {
        if (!passwords.current || !passwords.new || !passwords.confirm) {
            return setErrorMessage("All fields are required.");
        }
        if (passwords.new !== passwords.confirm) {
            return setErrorMessage("New password and confirmation do not match.");
        }
        if (passwords.new.length < 4) {
            return setErrorMessage("New password must be at least 6 characters.");
        }

        try {

            await axios.post(`/api/profile/changepassword/${user._id}`, {
                currentPassword: passwords.current,
                newPassword: passwords.new,
            });
            toastr.success("Password changed successfully");
            setPasswordChangeModal(false);
            setPasswords({
                current: "",
                new: "",
                confirm: "",
            });
            setErrorMessage("");

        } catch (error) {
            toastr.error(error.response?.data?.message || "Failed to change password");
            setErrorMessage(error.response?.data?.message || "Failed to change password");
        }
    };

    const handleDeleteAccount = async () => {
        try {
            await axios.delete(`/api/profile/delete/${user._id}`);
            setDeleteModal(false);
            navigate("/login");
        } catch (error) {
            toastr.error("Failed to delete account");
        }
    };

    const handleSaveNotifications = async () => {
        try {
            await axios.post(`/api/settings/notifications/${user._id}`, notificationPrefs);
            toastr.success("Preferences saved");
            setNotificationModal(false);
        } catch (err) {
            toastr.error("Failed to save preferences");
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

    const fetchSettings = async () => {
        try {
            const res = await axios.get(`/api/settings/${user._id}`);
            setSettings(res.data);
            if (res.data?.notifications) {
                const { types, ...prefs } = res.data.notifications;
                setNotificationPrefs(prefs);
            }
        } catch (err) {
            console.error("Failed to load settings");
        }
    };

    useEffect(() => {
        fetchPaymentMethods();
        fetchSettings();
    }, []);


    const handleAddPaymentMethod = async () => {
        let payload = {
            type,
            isDefault,
            details: {},
        };

        if (type === "credit_card") {
            payload.details.cardLast4 = details.number.slice(-4);
            payload.details.cardBrand = "Visa"; // Or detect dynamically
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
            setDetails({
                number: "",
                expiry: "",
                cvv: "",
                paypalEmail: "",
                bankName: "",
                bankAccount: ""
            });
            setType("credit_card");

        } catch (error) {
            toastr.warning(error.response?.data?.message);
        }
    };

    const handleDelete = async (index) => {
        try {
            await axios.delete(`/api/settings/payment/delete/${user._id}/${index}`);
            toastr.success("Payment method removed");
            fetchPaymentMethods();
        } catch (error) {
            toastr.error("Failed to remove payment method");
        }
    };

    const handleSaveLanguageCurrency = async () => {
        try {
            await axios.post(`/api/settings/preferences/${user._id}`, { language, currency });
            toastr.success("Preferences saved");
            setLanguageAndCurrencyModal(false);
        } catch (err) {
            toastr.error("Failed to save preferences");
        }
    }

    const handleProfileImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const formData = new FormData();
            formData.append("image", file);

            // Example: POST to upload endpoint
            axios.post(`/api/profile/upload-image/${user._id}`, formData)
                .then(res => {
                    toastr.success("Profile image updated");
                    // Refresh user data if needed
                })
                .catch(() => toastr.error("Upload failed"));
        }
    };

    const openRefundModal = (order) => {
        setSelectedOrder(order);
        setShowRefundModal(true);
    };

    return (
        <div>
            <Header cart={cart} />
            <Container className="container profile-container my-5 mx-5">
                <div className="justify-content-center" style={{ marginLeft: "150px", marginRight: "150px" }}>
                    <div className="d-flex align-items-center bg-light p-4 rounded shadow-sm mb-4">
                        <div className="position-relative d-inline-block me-4">
                            <img
                                src={`${backendUrl}${user?.image}`}
                                alt="Profile"
                                width="80"
                                height="80"
                                className="rounded-circle border"
                                style={{ objectFit: "cover" }}
                            />

                            {/* Upload Icon Overlay */}
                            <label
                                htmlFor="profileImageUpload"
                                className="position-absolute"
                                style={{
                                    top: "0px",
                                    right: "0px",
                                    cursor: "pointer",
                                    width: "30px",
                                    height: "30px",
                                    backgroundColor: "#e0f0ff",
                                    borderRadius: "50%",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    boxShadow: "0 0 4px rgba(0,0,0,0.1)",
                                }}
                            >
                                <i
                                    className="fas fa-cloud-upload-alt"
                                    style={{
                                        fontSize: "14px",
                                        color: "#007bff",
                                    }}
                                ></i>
                            </label>
                            <input
                                type="file"
                                id="profileImageUpload"
                                accept="image/*"
                                style={{ display: "none" }}
                                onChange={handleProfileImageChange}
                            />
                        </div>
                        <div>
                            <h5 className="mb-1 fw-bold">{user.name}</h5>
                            <p className="mb-1 text-muted">@{user.username}</p>
                            <small className="text-muted">Joined: {new Date(user.createdAt).toLocaleDateString()}</small>
                        </div>
                    </div>

                    {/* Profile Info */}
                    <Row className="my-5 align-items-start">
                        <Col md={3} className="fw-bold text-uppercase text-muted">
                            Personal information
                        </Col>
                        <Col md={9}>
                            <div className="d-flex justify-content-between align-items-start">
                                {/* Profile details */}
                                <div>
                                    <p><strong>Name:</strong> {user.name}</p>
                                    <p><strong>Username:</strong> {user.username}</p>
                                    <p><strong>Email:</strong> {user.email}</p>
                                    <p><strong>Phone:</strong> {user.phone}</p>
                                    <p><strong>Country:</strong> {user?.address?.country}</p>
                                    <p><strong>Address:</strong> {user?.address?.address}</p>
                                </div>

                                {/* Edit icon aligned to the top end */}
                                <i
                                    className="fas fa-edit text-primary ms-3"
                                    style={{ cursor: "pointer" }}
                                    onClick={() => setShowModal(true)}
                                ></i>
                            </div>
                        </Col>
                        {showModal && (
                            <div className="modal show fade d-block" style={{ background: "rgba(0,0,0,0.5)" }}>
                                <div className="modal-dialog modal-lg">
                                    <div className="modal-content">
                                        <div className="modal-header">
                                            <h5 className="modal-title">Edit Profile</h5>
                                            <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                                        </div>

                                        <div className="modal-body">
                                            {message && <div className="alert alert-info">{message}</div>}

                                            {/* Personal Info */}
                                            <div className="row">
                                                <div className="col-md-4 mb-3">
                                                    <input
                                                        type="text"
                                                        name="FirstName"
                                                        className="form-control"
                                                        placeholder="First Name"
                                                        value={formData.FirstName}
                                                        onChange={handleChange}
                                                    />
                                                </div>
                                                <div className="col-md-4 mb-3">
                                                    <input
                                                        type="text"
                                                        name="MiddleName"
                                                        className="form-control"
                                                        placeholder="Middle Name"
                                                        value={formData.MiddleName}
                                                        onChange={handleChange}
                                                    />
                                                </div>
                                                <div className="col-md-4 mb-3">
                                                    <input
                                                        type="text"
                                                        name="LastName"
                                                        className="form-control"
                                                        placeholder="Last Name"
                                                        value={formData.LastName}
                                                        onChange={handleChange}
                                                    />
                                                </div>
                                            </div>

                                            {/* Account Info */}
                                            <div className="row">
                                                <div className="col-md-6 mb-3">
                                                    <input
                                                        type="text"
                                                        name="username"
                                                        className="form-control"
                                                        placeholder="Username"
                                                        value={formData.username}
                                                        onChange={handleChange}
                                                    />
                                                </div>
                                                <div className="col-md-6 mb-3">
                                                    <input
                                                        type="email"
                                                        name="email"
                                                        className="form-control"
                                                        placeholder="Email"
                                                        value={formData.email}
                                                        onChange={handleChange}
                                                    />
                                                </div>
                                            </div>

                                            {/* Phone */}
                                            <div className="row">
                                                <div className="col-md-4 mb-3">
                                                    <PhoneInput
                                                        country={'et'}
                                                        value={formData.phone}
                                                        onChange={(value) =>
                                                            setFormData((prev) => ({
                                                                ...prev,
                                                                phone: value,
                                                            }))
                                                        }
                                                        inputClass="form-control py-2"
                                                        containerClass="w-100"
                                                        placeholder="Enter phone number"
                                                    />
                                                </div>

                                            </div>

                                            {/* Address Info */}
                                            <div className="row">
                                                <div className="col-md-4 mb-3">
                                                    <Select
                                                        options={countryOptions}
                                                        placeholder="Select Country"
                                                        value={countryOptions.find(opt => opt.value === formData.address?.country)}
                                                        onChange={(selected) =>
                                                            setFormData((prev) => ({
                                                                ...prev,
                                                                address: { ...prev.address, country: selected.value },
                                                            }))
                                                        }
                                                    />
                                                </div>
                                                <div className="col-md-4 mb-3">
                                                    <input
                                                        type="text"
                                                        name="address.city"
                                                        className="form-control"
                                                        placeholder="City"
                                                        value={formData.address?.city || ''}
                                                        onChange={handleChange}
                                                    />
                                                </div>
                                                <div className="col-md-4 mb-3">
                                                    <input
                                                        type="text"
                                                        name="address.address"
                                                        className="form-control"
                                                        placeholder="Full Address"
                                                        value={formData.address?.address || ''}
                                                        onChange={handleChange}
                                                    />
                                                </div>


                                                <div className="col-md-6 mb-3">
                                                    <input
                                                        type="text"
                                                        name="address.postalCode"
                                                        className="form-control"
                                                        placeholder="Postal Code"
                                                        value={formData.address?.postalCode || ''}
                                                        onChange={handleChange}
                                                    />
                                                </div>
                                                <div className="col-md-4 mb-3">
                                                    <input
                                                        type="text"
                                                        name="address.homeNumber"
                                                        className="form-control"
                                                        placeholder="Home Number (Optional)"
                                                        value={formData.address?.homeNumber || ''}
                                                        onChange={handleChange}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="modal-footer">
                                            <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                            <button type="button" className="btn btn-primary" onClick={handleSave} disabled={loading}>
                                                {loading ? 'Saving...' : 'Save Changes'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </Row>
                    <hr className='bg-light text-muted mb-3' style={{ marginLeft: "25%" }} />

                    {/* Order History */}
                    <Row className="mb-5">
                        <Col md={3} className="fw-bold text-uppercase text-muted">
                            Order History
                        </Col>
                        <Col md={9}>
                            <OrderDetailModal show={showOrderDetailModal} onClose={() => setShowOrderDetailModal(false)} selectedOrder={selectedOrder} />
                            <RefundModal order={selectedOrder} show={showRefundModal} onClose={() => setShowRefundModal(false)} />
                            <Row>
                                {orders.map((order) => (
                                    <Col key={order._id} md={6} className="mb-3">
                                        <Card className="shadow-sm border-0 h-100">
                                            <Card.Body className="d-flex flex-column justify-content-between h-100">
                                                <div className="mb-2">
                                                    <strong>{order.orderNumber}</strong> —{" "}
                                                    {parseFloat(order?.orderTotal || 0).toFixed(2)}
                                                    {order.currency} <br />
                                                    <small className="text-muted">
                                                        {new Date(order.createdAt).toLocaleDateString('en-US', {
                                                            month: 'short',
                                                            day: 'numeric',
                                                            year: 'numeric',
                                                        })}
                                                    </small>

                                                </div>

                                                <div className="d-flex justify-content-between align-items-center mt-auto">
                                                    <div className="d-flex gap-2">
                                                        <button
                                                            className="btn btn-outline-primary btn-sm"
                                                            onClick={() => openOrderDetails(order)}
                                                        >
                                                            View
                                                        </button>
                                                        <a
                                                            className="btn btn-link btn-sm text-muted text-decoration-none"
                                                            style={{ cursor: "pointer" }}
                                                            onClick={() => openRefundModal(order)}
                                                        >
                                                            Refund
                                                        </a>
                                                    </div>

                                                    <span
                                                        className={`badge rounded-pill ${order.status === "Delivered"
                                                            ? "bg-success"
                                                            : "bg-warning text-dark"
                                                            }`}
                                                    >
                                                        {order.status}
                                                    </span>
                                                </div>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                ))}
                            </Row>
                        </Col>
                    </Row>
                    <hr className='bg-light text-muted mb-3' style={{ marginLeft: "25%" }} />

                    {/* Settings */}
                    <Row>
                        <Col md={3} className="fw-bold text-uppercase text-muted">Settings</Col>
                        <Col md={9}>
                            <div className="d-flex justify-content-between py-2 border-bottom">
                                <span><i className="fas fa-lock me-2 text-primary"></i> Change Password</span>
                                <span style={{ cursor: 'pointer' }} onClick={() => setPasswordChangeModal(true)} className="pe-2">&gt;</span>
                            </div>
                            <div className="d-flex justify-content-between py-2 border-bottom">
                                <span><i className="fas fa-bell me-2 text-warning"></i> Notification Preferences</span>
                                <span style={{ cursor: 'pointer' }} onClick={() => setNotificationModal(true)} className="pe-2">&gt;</span>
                            </div>
                            <div className="d-flex justify-content-between py-2 border-bottom">
                                <span><i className="fas fa-credit-card me-2 text-success"></i> Payment Method</span>
                                <span style={{ cursor: 'pointer' }} onClick={() => setPaymentMethodModal(true)} className="pe-2">&gt;</span>
                            </div>
                            <div className="d-flex justify-content-between py-2 border-bottom">
                                <span><i className="fas fa-globe me-2 text-info"></i> Language & Currency</span>
                                <span style={{ cursor: 'pointer' }} onClick={() => setLanguageAndCurrencyModal(true)} className="pe-2">&gt;</span>
                            </div>
                            <div className="d-flex justify-content-between py-2">
                                <span className="text-danger"><i className="fas fa-trash me-2"></i> Delete Account</span>
                                <span style={{ cursor: 'pointer' }} onClick={() => setDeleteModal(true)} className="text-danger pe-2">&gt;</span>
                            </div>
                        </Col>
                        <>
                            {/* Change Password Modal */}
                            {showPasswordChangeModal && <div className="modal show d-block" style={{ background: "rgba(0,0,0,0.5)" }}>
                                <div className="modal-dialog">
                                    <div className="modal-content">
                                        <div className="modal-header">
                                            <h5 className="modal-title">Change Password</h5>
                                            <button className="btn-close" onClick={() => setPasswordChangeModal(false)}></button>
                                        </div>
                                        <div className="modal-body">
                                            {errorMessage && <div className="alert alert-danger">{errorMessage}</div>}
                                            <input type="password" className="form-control mb-3" placeholder="Current Password"
                                                value={passwords.current}
                                                onChange={(e) => setPasswords({ ...passwords, current: e.target.value })} />
                                            <input type="password" className="form-control mb-3" placeholder="New Password"
                                                value={passwords.new}
                                                onChange={(e) => setPasswords({ ...passwords, new: e.target.value })} />
                                            <input type="password" className="form-control" placeholder="Confirm Password"
                                                value={passwords.confirm}
                                                onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })} />
                                        </div>
                                        <div className="modal-footer">
                                            <button className="btn btn-secondary" onClick={() => setPasswordChangeModal(false)}>Cancel</button>
                                            <button className="btn btn-success" onClick={handleChangePassword}>Change</button>
                                        </div>
                                    </div>
                                </div>
                            </div>}

                            {/* Delete Account Modal */}
                            {showDeleteModal && <div className="modal show d-block" style={{ background: "rgba(0,0,0,0.5)" }}>
                                <div className="modal-dialog">
                                    <div className="modal-content">
                                        <div className="modal-header bg-danger text-white">
                                            <h5 className="modal-title">Confirm Delete Account</h5>
                                            <button className="btn-close" onClick={() => setDeleteModal(false)}></button>
                                        </div>
                                        <div className="modal-body">
                                            <p>Are you sure you want to delete your account? This action cannot be undone.</p>
                                        </div>
                                        <div className="modal-footer">
                                            <button className="btn btn-secondary" onClick={() => setDeleteModal(false)} >Cancel</button>
                                            <button className="btn btn-danger" onClick={handleDeleteAccount}>Delete</button>
                                        </div>
                                    </div>
                                </div>
                            </div>}

                            {/* Notification Preferences Modal */}
                            {showNotificationModal && <div className="modal show d-block" style={{ background: "rgba(0,0,0,0.5)" }}>
                                <div className="modal-dialog">
                                    <div className="modal-content">
                                        <div className="modal-header">
                                            <h5 className="modal-title">Notification Preferences</h5>
                                            <button className="btn-close" onClick={() => setNotificationModal(false)}></button>
                                        </div>
                                        <div className="modal-body">
                                            {["promoEmail", "smsAlerts", "reviewReminders"].map((key) => (
                                                <div className="form-check" key={key}>
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        id={key}
                                                        checked={!!notificationPrefs[key]}
                                                        onChange={(e) =>
                                                            setNotificationPrefs((prev) => ({
                                                                ...prev,
                                                                [key]: e.target.checked,
                                                            }))
                                                        }
                                                    />
                                                    <label className="form-check-label" htmlFor={key}>
                                                        {key === "promoEmail"
                                                            ? "Promotional Emails"
                                                            : key === "smsAlerts"
                                                                ? "SMS Alerts"
                                                                : "Review Reminders"}
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="modal-footer">
                                            <button className="btn btn-secondary" onClick={() => setNotificationModal(false)}>Cancel</button>
                                            <button className="btn btn-success" onClick={handleSaveNotifications}>Save</button>
                                        </div>
                                    </div>
                                </div>
                            </div>}

                            {/* Payment Modal */}
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
                                                        <button className="btn btn-success" onClick={handleAddPaymentMethod}>
                                                            <i className="fas fa-plus"></i> Add
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {/* Language and Currency Modal */}
                            {showLanguageAndCurrencyModal && <div className="modal show d-block" style={{ background: "rgba(0,0,0,0.5)" }}>
                                <div className="modal-dialog">
                                    <div className="modal-content">
                                        <div className="modal-header">
                                            <h5 className="modal-title">Language & Currency</h5>
                                            <button className="btn-close" onClick={() => setLanguageAndCurrencyModal(false)}></button>
                                        </div>
                                        <div className="modal-body">
                                            <select className="form-select mb-3" value={language || settings?.preferences?.language} onChange={(e) => setLanguage(e.target.value)}>
                                                <option>English</option>
                                                <option>Spanish</option>
                                            </select>
                                            <select className="form-select" value={currency || settings?.preferences?.currency} onChange={(e) => setCurrency(e.target.value)}>
                                                <option>USD</option>
                                                <option>EUR</option>
                                                <option>ETB</option>
                                            </select>
                                        </div>
                                        <div className="modal-footer">
                                            <button className="btn btn-secondary" onClick={() => setLanguageAndCurrencyModal(false)}>Cancel</button>
                                            <button className="btn btn-success" onClick={handleSaveLanguageCurrency}>Save</button>
                                        </div>
                                    </div>
                                </div>
                            </div>}
                        </>
                    </Row>

                </div>
            </Container>
            <Footer />
        </div>
    );
};

export default Profile;
