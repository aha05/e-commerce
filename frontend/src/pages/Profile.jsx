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


    return (
        <div>
            <Header cart={cart} />
            <div className="container profile-container my-5">
                <div className="row">
                    {/* Sidebar */}
                    <div className="col-md-3">
                        <div className="card p-3">
                            <div className="text-center position-relative d-inline-block">
                                {user.image ? (
                                    <>
                                        <img
                                            src={`${backendUrl}${user.image}`}
                                            width="100"
                                            height="100"
                                            alt="Profile"
                                            className="rounded-circle border"
                                            style={{ objectFit: "cover" }}
                                        />
                                        <label
                                            htmlFor="profileImageUpload"
                                            className="position-absolute top-0 end-0 bg-light border rounded-circle p-1"
                                            style={{ cursor: "pointer" }}
                                        >
                                            <i className="fas fa-edit text-primary"></i>
                                        </label>
                                    </>
                                ) : (
                                    <>
                                        <div
                                            className="rounded-circle bg-light border d-flex align-items-center justify-content-center"
                                            style={{ width: "100px", height: "100px", cursor: "pointer", marginLeft: "30%" }}
                                        >
                                            <label
                                                htmlFor="profileImageUpload"
                                                className="text-muted m-0"
                                                style={{ cursor: "pointer" }}
                                            >
                                                Add Image
                                            </label>
                                        </div>
                                    </>
                                )}

                                <input
                                    type="file"
                                    id="profileImageUpload"
                                    accept="image/*"
                                    style={{ display: "none" }}
                                    onChange={handleProfileImageChange}
                                />
                                <h4 className="mt-3">{user.name}</h4>
                            </div>
                            <ul className="nav nav-pills flex-column mt-4">
                                <li className="nav-item">
                                    <button className={`nav-link ${activeTab === "profile" ? "active" : ""}`} onClick={() => setActiveTab("profile")}>
                                        Profile
                                    </button>
                                </li>
                                <li className="nav-item">
                                    <button className={`nav-link ${activeTab === "orders" ? "active" : ""}`} onClick={() => setActiveTab("orders")}>
                                        Order History
                                    </button>
                                </li>
                                <li className="nav-item">
                                    <button className={`nav-link ${activeTab === "settings" ? "active" : ""}`} onClick={() => setActiveTab("settings")}>
                                        Settings
                                    </button>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="col-md-9">
                        {activeTab === "profile" && (
                            <>
                                <div className="card p-4 position-relative">
                                    <h3>Profile Details</h3>
                                    <i
                                        className="fas fa-edit position-absolute top-0 end-0 m-3 text-primary"
                                        style={{ cursor: "pointer" }}
                                        onClick={() => setShowModal(true)}
                                    ></i>
                                    <p><strong>Name:</strong> {user.name}</p>
                                    <p><strong>Username:</strong> {user.username}</p>
                                    <p><strong>Email:</strong> {user.email}</p>
                                    <p><strong>Phone:</strong> {user.phone}</p>
                                    <p><strong>Country:</strong> {user.address?.country}</p>
                                    <p><strong>Address:</strong> {user.address?.address}</p>
                                </div>

                                {/* Edit Modal */}
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
                            </>
                        )}

                        {activeTab === "orders" && (
                            <div>
                                <h3 className="text-center mb-4">Order History</h3>
                                <OrderDetailModal show={showOrderDetailModal} onClose={() => setShowOrderDetailModal(false)} selectedOrder={selectedOrder} />
                                <div className="row">
                                    {orders.map((order) => (
                                        <div className="col-md-6" key={order._id}>
                                            <div className="card p-3 mb-4 shadow-sm">
                                                <h5>Order #{order.orderNumber}</h5>
                                                <p><strong>Date:</strong> {new Date(order.createdAt).toLocaleDateString()}</p>
                                                <p><strong>Status:</strong> {order.status}</p>
                                                <p><strong>Total:</strong> {parseFloat(order?.orderTotal || 0).toFixed(2)}{order.currency}</p>
                                                <button
                                                    className="btn btn-outline-primary btn-sm"
                                                    onClick={() => openOrderDetails(order)}
                                                >
                                                    View Details
                                                </button>

                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}


                        {activeTab === "settings" && (
                            <>
                                <div className="card p-4">
                                    <h3 className="mb-4">Settings</h3>

                                    {/* Change Password */}
                                    <div
                                        className="setting-item"
                                        onClick={() => setPasswordChangeModal(true)}
                                    >
                                        <i className="fas fa-lock me-2 text-primary"></i>
                                        <strong>Change Password</strong>
                                    </div>

                                    {/* Notification Preferences */}
                                    <div
                                        className="setting-item"
                                        onClick={() => setNotificationModal(true)}
                                    >
                                        <i className="fas fa-bell me-2 text-warning"></i>
                                        <strong>Notification Preferences</strong>
                                    </div>

                                    {/* Payment Method */}
                                    <div
                                        className="setting-item"
                                        onClick={() => setPaymentMethodModal(true)}
                                    >
                                        <i className="fas fa-credit-card me-2 text-success"></i>
                                        <strong>Payment Method</strong>
                                    </div>

                                    {/* Language & Currency */}
                                    <div
                                        className="setting-item"
                                        onClick={() => setLanguageAndCurrencyModal(true)}
                                    >
                                        <i className="fas fa-globe me-2 text-info"></i>
                                        <strong>Language & Currency</strong>
                                    </div>

                                    {/* Delete Account */}
                                    <div
                                        className="setting-item text-danger"
                                        onClick={() => setDeleteModal(true)}
                                    >
                                        <i className="fas fa-trash me-2"></i>
                                        <strong>Delete Account</strong>
                                    </div>
                                </div>

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
                            </>

                        )}

                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default Profile;
