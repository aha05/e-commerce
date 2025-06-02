import React from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

const Unauthorized = () => {
    return (
        <div className="min-vh-100 d-flex justify-content-center align-items-center bg-gradient">
            <div className="text-center" style={{ maxWidth: '400px' }}>
                <h1 className="display-4  text-danger">401</h1>
                <h5 className="text-muted">Unauthorized!</h5>
            </div>
        </div>
    );
};

export default Unauthorized;

