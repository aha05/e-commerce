import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Notifications() {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showAll, setShowAll] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const res = await axios.get('/api/notifications');
            setNotifications(res.data);
            const unread = res.data.filter(n => !n.read).length;
            setUnreadCount(unread);
        } catch (err) {
            console.error('Failed to fetch notifications:', err);
        }
    };

    const handleMarkAsRead = async (id) => {
        try {
            await axios.patch(`/api/notifications/${id}/read`);
            setNotifications(prev =>
                prev.map(n => (n._id === id ? { ...n, read: true } : n))
            );
            setUnreadCount(prev => prev - 1);
        } catch (err) {
            console.error('Error marking notification as read:', err);
        }
    };

    const handleRedirect = (link, id) => {
        handleMarkAsRead(id);
        navigate(link);
    };

    const toggleShowAll = (e) => {
        e.preventDefault();
        e.stopPropagation(); // Prevent dropdown from closing
        setShowAll(prev => !prev);
    };

    return (
        <li className="nav-item dropdown">
            <span
                className="nav-link position-relative"
                role="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
            >
                <i className="fas fa-bell fs-5"></i>
                {unreadCount > 0 && (
                    <span
                        className="position-absolute top-25 start-25 translate-middle badge rounded-pill bg-danger"
                        style={{ transform: 'translate(-30%, -50%)' }}
                    >
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </span>

            <ul
                className="dropdown-menu dropdown-menu-end shadow p-2"
                style={{ width: '340px', maxHeight: '400px', overflowY: 'auto' }}
            >
                <li><h6 className="dropdown-header">Notifications</h6></li>
                <li><hr className="dropdown-divider" /></li>

                {notifications.length === 0 && (
                    <li className="px-3 py-2 text-muted">No notifications</li>
                )}

                {(showAll ? notifications : notifications.slice(0, 5)).map(n => (
                    <li
                        key={n._id}
                        className={`dropdown-item d-flex flex-column ${n.read ? '' : 'bg-light'} rounded mb-1`}
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleRedirect(n.meta?.link || '/', n._id)}
                    >
                        <div className="fw-bold">{n.title}</div>
                        <div className="small text-muted">{n.message}</div>
                        {!n.read && (
                            <button
                                className="btn btn-sm btn-link text-decoration-none p-0 mt-1 align-self-end"
                                onClick={(e) => {
                                    e.stopPropagation(); // Don't trigger parent click
                                    handleMarkAsRead(n._id);
                                }}
                            >
                                Mark as read
                            </button>
                        )}
                    </li>
                ))}

                {notifications.length > 5 && (
                    <>
                        <li><hr className="dropdown-divider" /></li>
                        <li className="text-center">
                            <button
                                className="dropdown-item text-primary"
                                onClick={toggleShowAll}
                            >
                                {showAll ? 'Show Less' : 'Show More'}
                            </button>
                        </li>
                    </>
                )}
            </ul>
        </li>
    );
}

export default Notifications;
