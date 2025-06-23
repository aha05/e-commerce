import React, { useState, useEffect, useRef, useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { AuthContext, useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import ReviewModal from '../UI/ReviewModal';
import Notifications from '../../components/UI/Notifications';
import '../../styles/navbar.css';

const backendUrl = import.meta.env.VITE_BACKEND_URL;

function Navbar() {
    const { user } = useAuth();
    const { cart } = useCart();
    const { logout } = useContext(AuthContext);

    const [keyword, setKeyword] = useState('');
    const [results, setResults] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [highlightIndex, setHighlightIndex] = useState(-1);
    const [isNavCollapsed, setIsNavCollapsed] = useState(true);
    const [showUserDropdown, setShowUserDropdown] = useState(false);

    const searchRef = useRef(null);
    const location = useLocation();
    const navigate = useNavigate();

    const [pendingReview, setPendingReview] = useState(null);
    const [hasShownModal, setHasShownModal] = useState(false);

    useEffect(() => {
        if (!keyword.trim()) {
            setResults([]);
            setShowDropdown(false);
            return;
        }
        const timer = setTimeout(() => {
            axios.get(`/api/products/search/${keyword}`)
                .then(res => {
                    setResults(res.data);
                    setShowDropdown(true);
                    setHighlightIndex(-1);
                })
                .catch(err => console.error('Search error:', err));
        }, 300);
        return () => clearTimeout(timer);
    }, [keyword]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (searchRef.current && !searchRef.current.contains(e.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleKeyDown = (e) => {
        if (e.key === 'ArrowDown') {
            setHighlightIndex(prev => (prev + 1) % results.length);
        } else if (e.key === 'ArrowUp') {
            setHighlightIndex(prev => (prev - 1 + results.length) % results.length);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            const selected = highlightIndex >= 0 ? results[highlightIndex] : results.find(r => r.name.toLowerCase() === keyword.toLowerCase());
            if (selected) navigateToProduct(selected._id);
        } else if (e.key === 'Tab' && results.length > 0) {
            setKeyword(results[0].name);
            setShowDropdown(false);
            e.preventDefault();
        }
    };

    const navigateToProduct = (id) => {
        if (location.pathname === `/products/${id}`) {
            window.location.reload();
        } else {
            navigate(`/products/${id}`);
        }
        setShowDropdown(false);
    };

    const handleSelect = (product) => {
        setKeyword(product.name);
        navigateToProduct(product._id);
    };

    const handleLogout = () => logout();
    const cartCount = cart?.reduce?.((sum, item) => sum + item.quantity, 0) || cart?.items?.reduce?.((sum, item) => sum + item.quantity, 0) || 0;

    useEffect(() => {
        if (!user || hasShownModal) return;
        axios.get('/api/products/reviews/pending')
            .then(res => {
                const data = res.data?.[0];
                if (!data) return;

                const skipKey = `review_skip_${data.product._id}`;
                const lastSkip = localStorage.getItem(skipKey);
                const now = Date.now();

                if (lastSkip && now - parseInt(lastSkip, 10) < 5 * 60 * 1000) return;

                setTimeout(() => {
                    setPendingReview(data);
                    setHasShownModal(true);
                }, 5000);
            })
            .catch(err => console.error('Pending review fetch error:', err));
    }, [user, hasShownModal]);

    const handleReviewSubmit = ({ productId, rating, comment }) => {
        axios.post(`/api/products/reviews/${productId}`, { rating, comment })
            .then(() => {
                axios.patch('/api/orders/mark-reviewed', { productId });
                setPendingReview(null);
            })
            .catch(err => console.error('Review submit error:', err));
    };

    const handleModalClose = () => {
        if (pendingReview?.product?._id) {
            const skipKey = `review_skip_${pendingReview.product._id}`;
            localStorage.setItem(skipKey, Date.now().toString());
        }
        setPendingReview(null);
    };

    return (
        <>
            {pendingReview && <ReviewModal product={pendingReview.product} onClose={handleModalClose} onSubmit={handleReviewSubmit} />}

            <nav className="navbar navbar-expand-lg bg-white shadow-sm sticky-top">
                <div className="container">
                    <Link className="navbar-brand fw-bold" to="/">E-Shop</Link>
                    <button className="navbar-toggler" type="button" onClick={() => setIsNavCollapsed(!isNavCollapsed)}>
                        <span className="navbar-toggler-icon"></span>
                    </button>

                    <div className={`collapse navbar-collapse justify-content-between ${!isNavCollapsed ? 'show' : ''}`}>
                        <ul className="navbar-nav me-auto mb-2 mb-lg-0">
                            <li className="nav-item"><Link className="nav-link active" to="/">Home</Link></li>
                            <li className="nav-item"><a className="nav-link" href="#categories">Category</a></li>
                            <li className="nav-item"><a className="nav-link" href="#products">Shop</a></li>
                            <li className="nav-item"><Link className="nav-link" to="#">About</Link></li>
                        </ul>

                        <div ref={searchRef} className="position-relative w-25">
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Search products..."
                                value={keyword}
                                onChange={(e) => setKeyword(e.target.value)}
                                onFocus={() => results.length > 0 && setShowDropdown(true)}
                                onKeyDown={handleKeyDown}
                            />
                            {showDropdown && results.length > 0 && (
                                <ul className="dropdown-menu show w-100 bg-white border-top-0 left-0 shadow z-3" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                    {results.map((product, i) => (
                                        <li
                                            key={product._id}
                                            className={`dropdown-item ${i === highlightIndex ? 'bg-light fw-bold' : ''}`}
                                            onMouseEnter={() => setHighlightIndex(i)}
                                            onClick={() => handleSelect(product)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            {product.name}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        <div className="d-flex ms-3 align-items-center">
                            {user && <ul className="navbar-nav ms-auto me-2">
                                <Notifications />
                            </ul>}

                            <div className="dropdown" tabIndex={0}>
                                <button type="button" className="icon-btn btn p-0 border-0 bg-transparent" onClick={() => setShowUserDropdown(prev => !prev)}>
                                    {!user ? (
                                        <i className="fas fa-user"></i>
                                    ) : (
                                        <img src={`${backendUrl}${user.image}`} alt={user.name} width="30" height="30" className="rounded-circle fs-6" />
                                    )}
                                </button>
                                {showUserDropdown && (
                                    <ul className="dropdown-menu dropdown-menu-end show">
                                        {!user ? (
                                            <>
                                                <li><Link className="dropdown-item" to="/login">Login</Link></li>
                                                <li><Link className="dropdown-item" to="/signup">Signup</Link></li>
                                            </>
                                        ) : (
                                            <>
                                                <li><Link className="dropdown-item" to="/profile">Profile</Link></li>
                                                <li><hr className="dropdown-divider" /></li>
                                                <li><Link className="dropdown-item" to="#" onClick={handleLogout}>Logout</Link></li>
                                            </>
                                        )}
                                    </ul>
                                )}
                            </div>

                            <Link to="/cart" className="position-relative icon-btn">
                                <i className="fas fa-shopping-cart"></i>
                                {cartCount > 0 && (
                                    <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                                        {cartCount}
                                    </span>
                                )}
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>
        </>
    );
}

export default Navbar;
