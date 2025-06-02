function AdminFooter() {
    return (
        <footer className="bg-dark text-light py-4">
            <div className="container">
                <div className="row">
                    {/* Contacts  */}
                    <div className="col-md-4">
                        <h5>Contact Us</h5>
                        <ul className="list-unstyled">
                            <li><i className="fas fa-phone"></i> +1 234 567 890</li>
                            <li><i className="fas fa-envelope"></i> support@eshop.com</li>
                            <li>
                                <a href="#" className="text-light me-2"
                                ><i className="fab fa-facebook"></i></a>
                                <a href="#" className="text-light me-2"
                                ><i className="fab fa-twitter"></i></a>
                                <a href="#" className="text-light"><i className="fab fa-instagram"></i></a>
                            </li>
                        </ul>
                    </div>
                    {/* Quick Links  */}
                    <div className="col-md-4">
                        <h5>Quick Links</h5>
                        <ul className="list-unstyled">
                            <li><a href="#" className="footer-links">FAQs</a></li>
                            <li><a href="#" className="footer-links">Help & Support</a></li>
                            <li><a href="#" className="footer-links">About Us</a></li>
                        </ul>
                    </div>
                    {/* Newsletter  */}
                    <div className="col-md-4">
                        <h5>Newsletter</h5>
                        <p>Subscribe to receive updates, offers, and more!</p>
                        <form>
                            <div className="input-group">
                                <input
                                    type="email"
                                    className="form-control"
                                    placeholder="Enter your email"
                                />
                                <button className="btn btn-warning">Subscribe</button>
                            </div>
                        </form>
                    </div>
                </div>
                <div className="text-center mt-3">
                    <p>&copy; 2024 E-Shop. All Rights Reserved.</p>
                </div>
            </div>
        </footer>)
}

export default AdminFooter;