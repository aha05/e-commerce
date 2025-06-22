import React, { useContext, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from "react-router-dom";
import {
    Home, Product, ProductDetail, Cart, Checkout, Login, Signup, Profile, AdminProfile,
    Dashboard, ManageProducts, AddProduct, EditProduct,
    ManageOrders, OrderDetails,
    ManageCategories, AddCategory, EditCategory,
    UserManagement, AddUser, EditUser, SalesReport,
    Roles, Promotion, AddPromotion, EditPromotion,
    Report, Logs, Test, ManageCustomer, OrderDetail
} from "./pages";

import { AuthProvider, AuthContext } from "./contexts/AuthContext";
import { CartProvider } from "./contexts/CartContext";
import AdminHeader from "./components/Partials/AdminHeader";
import NotFound from "./NotFound"
import Unauthorized from "./Unauthorized"


const ProtectedRoute = ({ children }) => {
    const { user, loading } = useContext(AuthContext);

    if (loading) {
        return <div>Loading...</div>; // You can show a spinner here
    }

    return user ? children : <Navigate to="/login" />;
};

const Logout = () => {
    const { logout } = useContext(AuthContext);

    useEffect(() => {
        logout();
    }, [logout]);

    return <Navigate to="/login" />;
};

const AdminRoute = () => (
    <ProtectedRoute>
        <AdminHeader>
            <Outlet />
        </AdminHeader>
    </ProtectedRoute>
);

const AuthUserRoute = () => (
    <ProtectedRoute>
        <Outlet />
    </ProtectedRoute>
);

function App() {
    return (
        <AuthProvider>
            <Router>
                <CartProvider>
                    <Routes>
                        {/* Public Pages */}
                        <Route path="/" element={<Home />} />
                        <Route path="/cart" element={<Cart />} />
                        <Route path="/test" element={<Test />} />
                        <Route path="/products/:productId" element={<ProductDetail />} />
                        <Route path="/products/category/:categoryId" element={<Product />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/logout" element={<Logout />} />
                        <Route path="/signup" element={<Signup />} />
                        <Route path="/unauthorized" element={<Unauthorized />} />
                        <Route path="*" element={<NotFound />} />

                        {/* For Authorized User */}
                        <Route path="" element={<AuthUserRoute />}>
                            <Route path="/profile" element={<Profile />} />
                            <Route path="/orders/checkout" element={<Checkout />} />
                        </Route>

                        {/* Admin Panel */}
                        <Route path="/admin" element={<AdminRoute />}>
                            <Route path="dashboard" element={<Dashboard />} />

                            {/* Products */}
                            <Route path="products" element={<ManageProducts />} />
                            <Route path="products/add" element={<AddProduct />} />
                            <Route path="products/edit/:productId" element={<EditProduct />} />

                            {/* Orders */}
                            <Route path="orders" element={<ManageOrders />} />
                            <Route path="orders/details/:orderId" element={<OrderDetails />} />

                            {/* Categories */}
                            <Route path="categories" element={<ManageCategories />} />
                            <Route path="categories/add" element={<AddCategory />} />
                            <Route path="categories/edit/:categoryId" element={<EditCategory />} />

                            {/* Users */}
                            <Route path="users" element={<UserManagement />} />
                            <Route path="users/add" element={<AddUser />} />
                            <Route path="users/edit/:userId" element={<EditUser />} />

                            {/* Roles */}
                            <Route path="roles" element={<Roles />} />

                            {/* Customers */}
                            <Route path="customers" element={<ManageCustomer />} />

                            {/* Promotions */}
                            <Route path="promotions" element={<Promotion />} />
                            <Route path="promotions/add" element={<AddPromotion />} />
                            <Route path="promotions/update/:promotionId" element={<EditPromotion />} />

                            {/* Reports & Logs */}
                            <Route path="reports/sales" element={<SalesReport />} />
                            <Route path="reports/analytics" element={<Report />} />
                            <Route path="logs" element={<Logs />} />

                            <Route path="profile" element={<AdminProfile />} />
                        </Route>
                    </Routes>
                </CartProvider>
            </Router>
        </AuthProvider>
    );
}

export default App;
