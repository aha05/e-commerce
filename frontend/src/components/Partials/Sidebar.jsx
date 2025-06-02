import { useState } from "react";
import { Link } from "react-router-dom";
import '../../styles/sidebar.css';

const Sidebar = () => {
    const [isCollapsed, setIsCollapsed] = useState(false);

    const toggleSidebar = () => {
        setIsCollapsed(!isCollapsed);
    };

    return (
        <div className={`sidebar ${isCollapsed ? "collapsed" : ""}`} id="sidebar">
            <div className="sidebar-title">
                E<span>-Commerce</span>
            </div>
            <button className="toggle-btn" onClick={toggleSidebar}>
                <i className={`fas ${isCollapsed ? "fa-angle-right" : "fa-angle-left"}`} id="toggle-icon"></i>
            </button>
            <div className="nav flex-column mt-4">
                <Link to="/admin/dashboard" className="nav-link d-flex align-items-center">
                    <i className="fas fa-tachometer-alt me-2"></i> <span>Dashboard</span>
                </Link>
                <Link to="/admin/products" className="nav-link d-flex align-items-center">
                    <i className="fas fa-box me-2"></i> <span>Products</span>
                </Link>
                <Link to="/admin/orders" className="nav-link d-flex align-items-center">
                    <i className="fas fa-shopping-cart me-2"></i> <span>Orders</span>
                </Link>
                <Link to="/admin/customers" className="nav-link d-flex align-items-center">
                    <i className="fas fa-users me-2"></i> <span>Customers</span>
                </Link>
                <Link to="/admin/categories" className="nav-link d-flex align-items-center">
                    <i className="fas fa-tags me-2"></i> <span>Categories</span>
                </Link>
                <Link to="/admin/users" className="nav-link d-flex align-items-center">
                    <i className="fas fa-user me-2"></i> <span>User Management</span>
                </Link>
                <Link to="/admin/roles" className="nav-link d-flex align-items-center">
                    <i className="fas fa-user me-2"></i> <span>Roles & Permissions</span>
                </Link>
                <Link to="/admin/promotions" className="nav-link d-flex align-items-center">
                    <i className="fas fa-bullhorn me-2"></i> <span>Promotions</span>
                </Link>
                <Link to="/admin/reports" className="nav-link d-flex align-items-center">
                    <i className="fas fa-chart-line me-2"></i> <span>Reports</span>
                </Link>
                <Link to="/admin/logs" className="nav-link d-flex align-items-center">
                    <i className="fas fa-history me-2"></i> <span>User Activity Logs</span>
                </Link>
            </div>
        </div>
    );
};

export default Sidebar;
