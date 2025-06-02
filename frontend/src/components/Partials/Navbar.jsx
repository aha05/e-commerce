import { useState, useContext } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { AuthContext } from "../../contexts/AuthContext";
import Notifications from "../../components/UI/Notifications";
import '../../styles/navbar.css';
const backendUrl = import.meta.env.VITE_BACKEND_URL;

const Navbar = () => {
    const { user } = useAuth();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const { logout } = useContext(AuthContext);

    const handleLogout = () => {
        logout();
    };

    return (
        <nav className="navbar navbar-expand-lg navbar-light bg-light shadow-sm">
            <div className="container-fluid">
                <span className="navbar-brand">Dashboard</span>
                <ul className="navbar-nav ms-auto">
                    <Notifications />
                    <li className="nav-item dropdown">
                        <button
                            type="button"
                            className="nav-link border-0 bg-transparent"
                            onClick={() => setDropdownOpen(!dropdownOpen)}
                        >
                            <img
                                src={`${backendUrl}${user.image}`}
                                alt={user.name}
                                className="rounded-circle"
                                width="30"
                                height="30"
                            />
                        </button>
                        <ul
                            className={`dropdown-menu dropdown-menu-start ${dropdownOpen ? "show" : ""}`}
                        >
                            <li>
                                <Link className="dropdown-item" to="/admin/profile">
                                    Profile
                                </Link>
                            </li>
                            <li>
                                <Link className="dropdown-item" to="/settings">
                                    Settings
                                </Link>
                            </li>
                            <li>
                                <hr className="dropdown-divider" />
                            </li>
                            <li>
                                <Link onClick={handleLogout} className="dropdown-item" to="/logout">
                                    Logout
                                </Link>
                            </li>
                        </ul>
                    </li>

                </ul>
            </div>
        </nav>
    );
};

export default Navbar;
