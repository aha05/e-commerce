import React from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

const NotFound = () => {
    const navigate = useNavigate();

    const handleGoBack = () => {
        navigate(-1); // Go back to the previous page
    };

    return (
        <div className="min-vh-100 d-flex justify-content-center align-items-center bg-gradient">
            <div className="text-center" style={{ maxWidth: '400px' }}>
                <h1 className="display-4 text-danger">404</h1>
                <p className="text-muted">Oops! The page you're looking for doesn't exist.</p>
                <button onClick={handleGoBack} className="btn btn-light mt-3">
                    Go Back
                </button>
            </div>
        </div>
    );
};

export default NotFound;
