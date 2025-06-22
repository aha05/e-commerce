import { useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import '../../styles/sidebar.css';
import { hasPermission } from '../../utils/authUtils';
import { useAuth } from '../../contexts/AuthContext';

const Sidebar = () => {
    const { user } = useAuth();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isReportsOpen, setIsReportsOpen] = useState(false);
    const location = useLocation();

    // Check if any sub-route is active
    const isReportsSectionActive = location.pathname.startsWith('/admin/reports');

    // Show border on parent ONLY when a sub-item is active AND dropdown is closed
    const showParentBorder = isReportsSectionActive && !isReportsOpen;

    const toggleReportsDropdown = () => {
        setIsReportsOpen(!isReportsOpen);
    };

    const toggleSidebar = () => {
        setIsCollapsed(!isCollapsed);
    };

    return (
        <div className="sidebar shadow-sm" id="sidebar">
            <div className="sidebar-title">
                E<span>-Commerce</span>
            </div>
            <div className="nav flex-column mt-4">
                {hasPermission(user, 'view_dashboard') && (
                    <NavLink to="/admin/dashboard" className="nav-link d-flex align-items-center " >
                        <i className="fas fa-tachometer-alt me-2 text-muted"></i><span>Dashboard</span>
                    </NavLink>
                )}

                {hasPermission(user, 'view_products') && (
                    <NavLink to="/admin/products" className="nav-link d-flex align-items-center ">
                        <i className="fas fa-box me-2 text-muted"></i> <span>Products</span>
                    </NavLink>
                )}
                {hasPermission(user, 'manage_orders') && (
                    <NavLink to="/admin/orders" className="nav-link d-flex align-items-center">
                        <i className="fas fa-shopping-cart me-2 text-muted"></i> <span>Orders</span>
                    </NavLink>
                )}
                {hasPermission(user, 'view_customers') && (
                    <NavLink to="/admin/customers" className="nav-link d-flex align-items-center ">
                        <i className="fas fa-users me-2 text-muted"></i> <span>Customers</span>
                    </NavLink>
                )}
                {hasPermission(user, 'view_categories') && (
                    <NavLink to="/admin/categories" className="nav-link d-flex align-items-center ">
                        <i className="fas fa-tags me-2 text-muted"></i> <span>Categories</span>
                    </NavLink>
                )}
                {hasPermission(user, 'view_users') && (
                    <NavLink to="/admin/users" className="nav-link d-flex align-items-center ">
                        <i className="fas fa-user me-2 text-muted"></i> <span>User Management</span>
                    </NavLink>
                )}
                {hasPermission(user, 'view_roles') && (
                    <NavLink to="/admin/roles" className="nav-link d-flex align-items-center ">
                        <i className="fas fa-user me-2 text-muted"></i> <span>Roles & Permissions</span>
                    </NavLink>
                )}
                {hasPermission(user, 'view_promotion') && (
                    <NavLink to="/admin/promotions" className="nav-link d-flex align-items-center">
                        <i className="fas fa-bullhorn me-2 text-muted"></i> <span>Promotions</span>
                    </NavLink>
                )}
                {hasPermission(user, 'view_reports') && (
                    <div className="nav-item rounded">
                        <div
                            className={`nav-link d-flex align-items-center justify-content-between ${showParentBorder ? 'border-start border-dark border-4' : ''}`}
                            onClick={toggleReportsDropdown}
                            style={{ cursor: 'pointer', borderRadius: "0.20rem" }}
                        >
                            <div>
                                <i className="fas fa-chart-line me-2 text-muted"></i>
                                <span>Reports</span>
                            </div>
                            <i className={`fas fa-chevron-${isReportsOpen ? 'up' : 'down'}`} style={{ fontSize: "0.80rem" }}></i>
                        </div>

                        {/* Dropdown Items */}
                        {isReportsOpen && (
                            <div className="ms-4 mt-1">
                                <NavLink
                                    to="/admin/reports/sales"
                                    className={({ isActive }) =>
                                        `nav-link ${isActive ? 'border-start border-dark border-4' : ''}`
                                    }
                                    style={{ borderRadius: "0.20rem" }}
                                >
                                    Sales Report
                                </NavLink>
                                <NavLink
                                    to="/admin/reports/analytics"
                                    className={({ isActive }) =>
                                        `nav-link ${isActive ? 'border-start border-dark border-4' : ''}`
                                    }
                                    style={{ borderRadius: "0.20rem" }}
                                >
                                    Analytics
                                </NavLink>
                            </div>
                        )}
                    </div>
                )}
                {hasPermission(user, 'view_logs') && (
                    <NavLink to="/admin/logs" className="nav-link d-flex align-items-center">
                        <i className="fas fa-history me-2 text-muted"></i> <span>User Activity Logs</span>
                    </NavLink>
                )}
            </div>
        </div>
    );
};

export default Sidebar;
