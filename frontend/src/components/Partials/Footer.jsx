import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

const Footer = () => {
    return (
        <footer className="bg-dark text-white py-3 pt-5">
            <div className="container">
                <div className="row">
                    {/* Footer Column 1: Company Info */}
                    <div className="col-md-3">
                        <h5>About Us</h5>
                        <ul className="list-unstyled footer-links">
                            <li><a href="#" className="text-white text-decoration-none">About Us</a></li>
                            <li><a href="#" className="text-white text-decoration-none">FAQ</a></li>
                            <li><a href="#" className="text-white text-decoration-none">Terms</a></li>
                            <li><a href="#" className="text-white text-decoration-none">Privacy</a></li>
                            <li><a href="#" className="text-white text-decoration-none">Shipping/Returns</a></li>
                            <li><a href="#" className="text-white text-decoration-none">Blog</a></li>
                        </ul>
                    </div>

                    {/* Footer Column 2: Contact Info */}
                    <div className="col-md-3">
                        <h5>Contact Info</h5>
                        <ul className="list-unstyled">
                            <li><p>Email: support@example.com</p></li>
                            <li><p>Phone: +1 234 567 890</p></li>
                            <li><p>Address: 123 Main St, City, Country</p></li>
                        </ul>
                    </div>

                    {/* Footer Column 3: Social Media */}
                    <div className="col-md-3">
                        <h5>Follow Us</h5>
                        <ul className="list-unstyled d-flex">
                            <li><a href="#" className="text-white mx-2"><i className="fab fa-facebook-f"></i></a></li>
                            <li><a href="#" className="text-white mx-2"><i className="fab fa-instagram"></i></a></li>
                            <li><a href="#" className="text-white mx-2"><i className="fab fa-twitter"></i></a></li>
                            <li><a href="#" className="text-white mx-2"><i className="fab fa-linkedin-in"></i></a></li>
                        </ul>
                    </div>

                    {/* Footer Column 4: Newsletter & Payment Methods */}
                    <div className="col-md-3">
                        <h5>Newsletter</h5>
                        <form action="#" method="post" className="mb-4">
                            <input type="email" className="form-control mb-2" placeholder="Enter your email" />
                            <button type="submit" className="btn btn-primary w-100">Subscribe</button>
                        </form>

                        <h5>Payment Methods</h5>
                        <ul className="list-unstyled d-flex">
                            <li><a href="#" className="text-white mx-2"><i className="fab fa-cc-visa" style={{ fontSize: '30px' }}></i></a></li>
                            <li><a href="#" className="text-white mx-2"><i className="fab fa-cc-paypal" style={{ fontSize: '30px' }}></i></a></li>
                            <li><a href="#" className="text-white mx-2"><i className="fab fa-cc-mastercard" style={{ fontSize: '30px' }}></i></a></li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Copyright */}
            <div className="text-center">
                <p>&copy; 2025 E-Shop. All Rights Reserved.</p>
            </div>
        </footer>
    );
};

export default Footer;
