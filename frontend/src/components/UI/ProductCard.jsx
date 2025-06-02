import React from 'react';
import 'font-awesome/css/font-awesome.min.css'; // Make sure this is loaded globally or here

const ProductCard = ({ product, backendUrl }) => {
    const fullStars = Math.floor(product.averageRating);
    const hasHalfStar = product.averageRating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
        <div className="col-md-3">
            <div className="card product-card border-0 bg-light">
                <div className='position-relative p-2' style={{ height: "17.3rem" }}>
                    <img
                        src={`${backendUrl}${product.image}`}
                        alt={product.image}
                        className="img-fluid h-100 p-3 rounded"
                    />
                    {product.discountPercentage > 0 &&
                        <span className="badge bg-danger position-absolute top-0 start-0 m-3 fs-1">
                            {product.discountPercentage}% OFF
                        </span>
                    }

                </div>
                <div className="card-body">
                    <h5 className="card-title">{product.name}</h5>
                    <div className="star-rating text-warning mb-2">
                        {[...Array(fullStars)].map((_, i) => (
                            <i key={`full-${i}`} style={{ fontSize: "0.8rem", letterSpacing: "2px" }} className="fas fa-star"></i>
                        ))}
                        {hasHalfStar && <i style={{ fontSize: "0.8rem", letterSpacing: "2px" }} className="fas fa-star-half-alt"></i>}
                        {[...Array(emptyStars)].map((_, i) => (
                            <i key={`empty-${i}`} style={{ fontSize: "0.8rem", letterSpacing: "2px" }} className="far fa-star"></i>
                        ))}
                        <span className="text-dark ms-1">({product.totalReviews} reviews)</span>
                    </div>
                    <p className="card-text">{product.description.slice(0, 40)}...</p>
                    <p className="text-danger fw-bold">{product.price}{product.currency}</p>
                    <a href={`/products/${product._id}`} className="btn btn-primary">View Product</a>
                </div>
            </div>
        </div>

    );
};

export default ProductCard;
