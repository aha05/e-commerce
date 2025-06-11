import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import '../../styles/sidebar.css';

const Sidebar = () => {
    const [isCollapsed, setIsCollapsed] = useState(false);

    const toggleSidebar = () => {
        setIsCollapsed(!isCollapsed);
    };

    return (
        <div className="sidebar shadow-sm" id="sidebar">
            <div className="sidebar-title">
                E<span>-Commerce</span>
            </div>
            <div className="nav flex-column mt-4">
                <NavLink to="/admin/dashboard" className="nav-link d-flex align-items-center " >
                    <i className="fas fa-tachometer-alt me-2 text-muted"></i><span>Dashboard</span>
                </NavLink>
                <NavLink to="/admin/products" className="nav-link d-flex align-items-center ">
                    <i className="fas fa-box me-2 text-muted"></i> <span>Products</span>
                </NavLink>
                <NavLink to="/admin/orders" className="nav-link d-flex align-items-center">
                    <i className="fas fa-shopping-cart me-2 text-muted"></i> <span>Orders</span>
                </NavLink>
                <NavLink to="/admin/customers" className="nav-link d-flex align-items-center ">
                    <i className="fas fa-users me-2 text-muted"></i> <span>Customers</span>
                </NavLink>
                <NavLink to="/admin/categories" className="nav-link d-flex align-items-center ">
                    <i className="fas fa-tags me-2 text-muted"></i> <span>Categories</span>
                </NavLink>
                <NavLink to="/admin/users" className="nav-link d-flex align-items-center ">
                    <i className="fas fa-user me-2 text-muted"></i> <span>User Management</span>
                </NavLink>
                <NavLink to="/admin/roles" className="nav-link d-flex align-items-center ">
                    <i className="fas fa-user me-2 text-muted"></i> <span>Roles & Permissions</span>
                </NavLink>
                <NavLink to="/admin/promotions" className="nav-link d-flex align-items-center">
                    <i className="fas fa-bullhorn me-2 text-muted"></i> <span>Promotions</span>
                </NavLink>
                <NavLink to="/admin/reports" className="nav-link d-flex align-items-center">
                    <i className="fas fa-chart-line me-2 text-muted"></i> <span>Reports</span>
                </NavLink>
                <NavLink to="/admin/logs" className="nav-link d-flex align-items-center">
                    <i className="fas fa-history me-2 text-muted"></i> <span>User Activity Logs</span>
                </NavLink>
            </div>
        </div>
    );
};

export default Sidebar;
