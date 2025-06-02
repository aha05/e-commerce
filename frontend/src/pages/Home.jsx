import React, { useEffect, useState } from 'react';
import { Link } from "react-router-dom";
import axios from 'axios';
import Header from "../components/Partials/Header";
import Footer from "../components/Partials/Footer";
import "../styles/services.css"
import CustomerReviews from '../components/UI/CustomerReviews';
import PromoCards from '../components/UI/PromoCards';
import ProductCard from '../components/UI/ProductCard';
const backendUrl = import.meta.env.VITE_BACKEND_URL;


function Home() {
    const [products, setProducts] = useState([]);
    const [categories, setCategory] = useState([]);
    const [promotions, setPromotions] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            axios.get('/api/index')
                .then((response) => {
                    setReviews(response.data.reviews.slice(0, 4));
                })
                .catch((error) => console.error('Error fetching reviews:', error));
        };
        fetchData();
        const fetchPromotions = async () => {
            await axios.get("/api/index/all-promotion")
                .then(res => setPromotions(res.data.promotions.slice(0, 4)))
                .catch(() => toastr.error("Failed to load promotions"));
        }
        fetchPromotions();

        // Fetch data from backend
        axios.get('/api/index')
            .then((response) => {
                setProducts(response.data.products.slice(0, 8));
                setCategory(response.data.categories.slice(0, 4));
            })
            .catch((error) => console.error('Error fetching data:', error));
    }, []);

    return (
        <div>
            <Header />
            {/* Hero BannerDiscount Promotion Section */}
            <div className="hero-section">
                <div className="container">
                    <div className="row align-items-center">
                        {/* Left Column */}
                        <div className="col-lg-6 mb-4 mb-lg-0">
                            <h1 className="fw-bold">Welcome to Our Store</h1>
                            <p className="lead">
                                Get up to <strong>50% off</strong> on selected items. Explore the latest collections and hot deals today.
                            </p>
                            <a href="#shop" className="btn btn-primary me-2">Shop Now</a>
                            <a href="#category" className="btn btn-outline-secondary">Browse Categories</a>
                        </div>

                        {/* Right Carousel */}
                        <div className="col-lg-6">
                            <div id="heroCarousel" className="carousel slide" data-bs-ride="carousel">
                                <div className="carousel-inner">
                                    {categories.map((category, index) => (
                                        <div
                                            className={`carousel-item ${index === 0 ? "active" : ""}`}
                                            key={category._id || index}
                                        >
                                            <img
                                                src={`${backendUrl}${category.image}`}
                                                alt={category.name}
                                                className="d-block w-100"
                                                style={{ height: "400px", objectFit: "cover" }}
                                            />
                                        </div>
                                    ))}
                                </div>
                                <button
                                    className="carousel-control-prev"
                                    type="button"
                                    data-bs-target="#heroCarousel"
                                    data-bs-slide="prev"
                                >
                                    <span className="carousel-control-prev-icon" />
                                </button>
                                <button
                                    className="carousel-control-next"
                                    type="button"
                                    data-bs-target="#heroCarousel"
                                    data-bs-slide="next"
                                >
                                    <span className="carousel-control-next-icon" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>


            {/* Categories Section */}
            <section id="categories" className="py-5">
                <div className="container">
                    <h2 className="text-center mb-4">Shop by Categories</h2>
                    <div className="row g-4 text-center my-1">
                        {categories.map(category => (
                            <div className="col-md-3">
                                <Link to={`/products/category/${category._id}`} key={category._id} className="category-card">
                                    <img
                                        src={`${backendUrl}${category.image}`}
                                        alt={category.name}
                                        className="img-fluid h-100"
                                    />
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Featured Products */}
            <section id="products" className="py-5 bg-light">
                <div className="container">
                    <h2 className="text-center mb-4">Featured Products</h2>
                    <div className="row g-4">
                        {products.map(product => (
                            <ProductCard key={product._id} product={product} backendUrl={backendUrl} />
                        ))}
                    </div>
                </div>
            </section>

            {/* Discounts Section */}
            <PromoCards promotions={promotions} />

            <CustomerReviews />
            {/* Service Highlights */}
            <section class="py-5 bg-light">
                <div class="container">
                    <h2 class="mb-4 text-center">Our Services</h2>
                    <div class="row text-center">
                        <div class="col-md-3 mb-4">
                            <div class="service-box p-4 bg-white rounded shadow-sm h-100 text-center">
                                <i class="fas fa-truck service-icon mb-3 text-primary"></i>
                                <h5 class="mb-3">Free Shipping</h5>
                                <p>On orders over $50</p>
                            </div>
                        </div>
                        <div class="col-md-3 mb-4">
                            <div class="service-box p-4 bg-white rounded shadow-sm h-100 text-center">
                                <i class="fas fa-undo-alt service-icon mb-3 text-success"></i>
                                <h5 class="mb-3">Easy Returns</h5>
                                <p>30-day hassle-free returns</p>
                            </div>
                        </div>
                        <div class="col-md-3 mb-4">
                            <div class="service-box p-4 bg-white rounded shadow-sm h-100 text-center">
                                <i class="fas fa-lock service-icon mb-3 text-danger"></i>
                                <h5 class="mb-3">Secure Checkout</h5>
                                <p>Your information is safe with us</p>
                            </div>
                        </div>
                        <div class="col-md-3 mb-4">
                            <div class="service-box p-4 bg-white rounded shadow-sm h-100 text-center">
                                <i class="fas fa-clock service-icon mb-3 text-warning"></i>
                                <h5 class="mb-3">Fast Delivery</h5>
                                <p>Get it within 2-5 business days</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            <Footer />
        </div>
    );
}

export default Home;
