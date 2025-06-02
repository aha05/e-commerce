import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'font-awesome/css/font-awesome.min.css';
import '../../styles/slider-cards.css';
const backendUrl = import.meta.env.VITE_BACKEND_URL;

const CustomerReviews = () => {
    const [reviews, setReviews] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const reviewContainerRef = useRef(null);

    const slideReviews = () => {
        if (reviewContainerRef.current) {
            const reviewContainer = reviewContainerRef.current;
            const cards = Array.from(reviewContainer.children);

            // Remove previous classes
            cards.forEach(card => card.classList.remove("center-card", "blurred", "slide-out"));

            // Move the first card to the back
            if (cards.length > 0) {
                reviewContainer.appendChild(cards[0]);
            }

            // Set new classes for the current center card and other cards
            cards.forEach((card, index) => {
                if (index === 2) {
                    card.classList.add("center-card");
                } else {
                    card.classList.add("blurred");
                }
            });
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get('/api/index');
                setReviews(response.data.reviews.slice(0, 3));
            } catch (error) {
                console.error('Error fetching reviews:', error);
            }
        };

        fetchData();
    }, []);

    useEffect(() => {
        if (reviews.length > 0) {
            slideReviews();
            const interval = setInterval(() => {
                setCurrentIndex((prevIndex) => (prevIndex + 1) % reviews.length);
                slideReviews();
            }, 5000);
            return () => clearInterval(interval);
        }
    }, [reviews]);

    return (
        <section className="py-5 bg-light">
            <div className="container">
                <h2 className="mb-4 text-center">Customer Reviews</h2>
                <div className="row justify-content-center mb-4" ref={reviewContainerRef}>
                    {reviews.map((review, index) => (
                        <div key={index} className={`col-md-4 review-card ${index === 1 ? "center-card" : ""}`}>
                            <div className="testimonial-box p-4 bg-white rounded shadow-sm text-center">
                                <div className="d-flex justify-content-center mb-3">
                                    <div className="star-rating">
                                        {[...Array(review.rating)].map((_, i) => (
                                            <i key={i} className="fas fa-star text-warning"></i>
                                        ))}
                                        {[...Array(5 - review.rating)].map((_, i) => (
                                            <i key={i} className="far fa-star text-warning"></i>
                                        ))}
                                    </div>
                                </div>
                                <p>"{review.text}"</p>
                                <div className="d-flex justify-content-center mb-3">
                                    <img src={`${backendUrl}${review.image}`} className="rounded-circle me-3" alt="Customer" />
                                    <div>
                                        <h5 className="mb-0">{review.name}</h5>
                                        <p className="mb-0">Verified Buyer</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default CustomerReviews;
