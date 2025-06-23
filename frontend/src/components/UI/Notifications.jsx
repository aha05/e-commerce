import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactDOM from 'react-dom';
import axios from 'axios';

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const bellRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
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

  const handleClickOutside = (event) => {
    const dropdown = document.getElementById('notification-dropdown');
    if (dropdown && !dropdown.contains(event.target) && !bellRef.current.contains(event.target)) {
      setIsDropdownOpen(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await axios.patch(`/api/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => (n._id === id ? { ...n, read: true } : n)));
      setUnreadCount(prev => prev - 1);
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const handleRedirect = (link, id) => {
    handleMarkAsRead(id);
    setIsDropdownOpen(false);
    navigate(link);
  };

  const toggleDropdown = () => {
    if (!isDropdownOpen && bellRef.current) {
      const rect = bellRef.current.getBoundingClientRect();
      setPosition({ top: rect.bottom + window.scrollY, left: rect.right - 340 });
    }
    setIsDropdownOpen(prev => !prev);
  };

  const dropdownContent = (
    <ul
      id="notification-dropdown"
      className="dropdown-menu shadow p-2 show"
      style={{
        position: 'absolute',
        top: `${position.top}px`,
        left: `${position.left}px`,
        width: '340px',
        maxHeight: '400px',
        overflowY: 'auto',
        zIndex: 2000,
        backgroundColor: '#fff',
        display: isDropdownOpen ? 'block' : 'none',
        borderRadius: '0.5rem'
      }}
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
          <div className="small text-muted text-wrap">{n.message}</div>
          {!n.read && (
            <button
              className="btn btn-sm btn-link text-decoration-none p-0 mt-1 align-self-end"
              onClick={(e) => {
                e.stopPropagation();
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
            <button className="dropdown-item text-primary" onClick={() => setShowAll(prev => !prev)}>
              {showAll ? 'Show Less' : 'Show More'}
            </button>
          </li>
        </>
      )}
    </ul>
  );

  return (
    <>
      <li className="nav-item" ref={bellRef}>
        <span className="nav-link position-relative" role="button" onClick={toggleDropdown}>
          <i className="fas fa-bell fs-5"></i>
          {unreadCount > 0 && (
            <span className="position-absolute top-25 start-25 translate-middle badge rounded-pill bg-danger" style={{ transform: 'translate(-30%, -50%)' }}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </span>
      </li>
      {ReactDOM.createPortal(dropdownContent, document.getElementById('notification-portal'))}
    </>
  );
}

export default Notifications;
