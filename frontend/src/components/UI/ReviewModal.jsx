// ReviewModal.js
import React, { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { FaStar } from 'react-icons/fa';

export default function ReviewModal({ product, onClose, onSubmit }) {
    const [rating, setRating] = useState(0);
    const [hover, setHover] = useState(0);
    const [comment, setComment] = useState('');

    const handleSubmit = () => {
        if (rating > 0) {
            onSubmit({ productId: product._id, rating, comment });
        }
        onClose();
    };

    const handleSkip = () => {
        const key = `review_skip_${product._id}`;
        localStorage.setItem(key, Date.now());
        onClose();
    };

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, []);

    return (
        <div
            className="modal fade show d-block"
            tabIndex="-1"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
            <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '500px' }}>
                <div className="modal-content p-4 rounded-4 shadow-sm m-5">
                    <div className="text-center">
                        <h5 className="mb-3 fw-bold">Rate Your Product</h5>
                        <p className="text-muted mb-3">
                            How was your experience with <strong>{product.name}</strong>?
                        </p>
                        <div className="mb-3">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    className="btn p-0 border-0 bg-transparent"
                                    onClick={() => setRating(star)}
                                    onMouseEnter={() => setHover(star)}
                                    onMouseLeave={() => setHover(0)}
                                >
                                    <FaStar
                                        size={30}
                                        color={(hover || rating) >= star ? '#ffc107' : '#e4e5e9'}
                                        style={{ cursor: 'pointer' }}
                                    />
                                </button>
                            ))}
                        </div>
                        <textarea
                            className="form-control mb-4"
                            rows={3}
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Write your feedback..."
                        />
                        <div className="d-flex justify-content-between">
                            <button className="btn btn-outline-secondary px-4 w-50 me-2" onClick={handleSkip}>
                                Later
                            </button>
                            <button
                                className="btn btn-primary px-4 w-50 ms-2"
                                onClick={handleSubmit}
                                disabled={rating === 0}
                            >
                                Submit
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
