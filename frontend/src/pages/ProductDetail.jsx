import React, { useEffect, useState } from 'react';
import { useParams } from "react-router-dom";
import { Link } from "react-router-dom";
import axios from 'axios';
import Header from "../components/Partials/Header";
import Footer from "../components/Partials/Footer";
const backendUrl = import.meta.env.VITE_BACKEND_URL;

function ProductDetail() {
    const { productId } = useParams();
    const [product, setProduct] = useState(null);
    const [categories, setCategory] = useState([]);
    const [promotion, setPromotion] = useState(null);
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [selectedAttributes, setSelectedAttributes] = useState({});
    const [selectedVariant, setSelectedVariant] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            await axios.get(`/api/products/${productId}`)
                .then((response) => {
                    const data = response.data.product;
                    setProduct(data);
                    setCategory(response.data.categories);
                    setPromotion(response.data.promotions);
                    setRelatedProducts(response.data.relatedProducts);

                    // Initialize attribute selection (first option)
                    const defaultAttrs = {};
                    Object.keys(data.attributes || {}).forEach(key => {
                        defaultAttrs[key] = data.attributes[key][0];
                    });
                    setSelectedAttributes(defaultAttrs);
                })
                .catch((error) => console.error('Error fetching data:', error));

            await axios.get('/api/index/promotions')
                .then((response) => {
                    setPromotion(response.data.promotion);
                })
        }
        fetchData();
    }, [productId]);

    useEffect(() => {
        if (product && product.variants) {
            const match = product.variants.find(variant =>
                Object.entries(variant.attributes).every(
                    ([key, value]) => selectedAttributes[key] === value
                )
            );
            setSelectedVariant(match || null);
        }
    }, [selectedAttributes, product]);

    const handleAttributeChange = (name, value) => {
        setSelectedAttributes(prev => ({ ...prev, [name]: value }));
    };

    if (!product) return <div>Loading...</div>;

    const fullStars = Math.floor(product.averageRating || 0);
    const hasHalfStar = product.averageRating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
        <div>
            <Header />
            <div className="container my-5">
                <div className="row">
                    {/* Left side - Product Image */}
                    <div className="col-md-4">
                        <img
                            src={`${backendUrl}${selectedVariant?.image || product.image}`}
                            alt={product.name}
                            className="img-fluid product-image"
                        />
                    </div>

                    {/* Middle section - Product Details  */}
                    <div className="col-md-5">
                        <h2 className="mt-4">{product.name}</h2>
                        <p><strong>Brand:</strong> {product.brand}</p>
                        <div className="star-rating text-warning mb-2">
                            {[...Array(fullStars)].map((_, i) => <i key={`full-${i}`} className="fas fa-star"></i>)}
                            {hasHalfStar && <i className="fas fa-star-half-alt"></i>}
                            {[...Array(emptyStars)].map((_, i) => <i key={`empty-${i}`} className="far fa-star"></i>)}
                            <span className="text-dark ms-2">({product.totalReviews || 0} reviews)</span>
                        </div>

                        {/* Dynamic Attribute Selectors */}
                        {Object.entries(product.attributes || {}).map(([attrName, options]) => (
                            <div className="mt-3" key={attrName}>
                                <p><strong>{attrName}:</strong></p>
                                {options.map((option) => (
                                    <label className="form-check-label me-3" key={option}>
                                        <input
                                            type="radio"
                                            name={attrName}
                                            className="form-check-input"
                                            value={option}
                                            checked={selectedAttributes[attrName] === option}
                                            onChange={() => handleAttributeChange(attrName, option)}
                                        />
                                        {option}
                                    </label>
                                ))}
                            </div>
                        ))}

                        <div className="product-detail mt-4">
                            <h5><strong>About this Item:</strong></h5>
                            <p className="text-muted">{product.description}</p>
                        </div>
                    </div>

                    {/* Right side - Price, Add to Cart, and Promotions  */}
                    <div className="col-md-3">
                        <div className="card p-4">
                            <h4 className="font-weight-bold">
                                {selectedVariant?.price || product.price}{product.currency}
                            </h4>

                            <form action="/api/cart/add" method="POST">
                                <input type="hidden" name="productId" value={product._id} />
                                <input
                                    className="form-control w-25"
                                    type="hidden"
                                    name="quantity"
                                    value="1"
                                    min="1"
                                    max={selectedVariant?.stock || product.stock}
                                />
                                <button
                                    className="btn btn-primary w-100 mb-3"
                                    disabled={(selectedVariant?.stock || product.stock) <= 0}
                                >
                                    Add to Cart
                                </button>
                            </form>

                            <hr />
                            <p className="mt-3"><strong>Shipping:</strong></p>
                            {["Standard", "Express", "Free"].map((method, idx) => (
                                <label key={idx} className="form-check-label d-block">
                                    <input
                                        type="radio"
                                        name="shipping"
                                        className="form-check-input"
                                        defaultChecked={method === "Free"}
                                    />
                                    {method} Shipping
                                </label>
                            ))}
                        </div>

                        {promotion && (
                            <div className="promo-card mt-3">
                                <h5>Special Offer: {promotion.discountPercentage}% Off Your First Order</h5>
                                <div className="d-flex">
                                    <img
                                        src={`${backendUrl}${promotion.product?.image}`}
                                        alt="Product Image"
                                        style={{ height: '100px', objectFit: 'cover' }}
                                        className="img-fluid me-3"
                                    />
                                    <div>
                                        <p><strong>{promotion.name}</strong></p>
                                        <p className="text-muted">
                                            Use code <strong>{promotion.code}</strong> at checkout.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Similar Products Section  */}
                <div className="similar-products mt-5">
                    <h3>Similar Products</h3>
                    <div className="row g-4">
                        {relatedProducts.map(relatedProduct => (
                            <div className="col-md-3" key={relatedProduct._id}>
                                <div className="card product-card position-relative border-0">
                                    <div className="position-relative" style={{ height: "17.3rem" }}>
                                        <img
                                            src={`${backendUrl}${relatedProduct.image}`}
                                            alt={product.image}
                                            className="img-fluid h-100 p-3 rounded"
                                        />
                                        {relatedProduct?.discountPercentage > 0 &&
                                            <span className="badge bg-danger position-absolute top-0 start-0 m-2 fs-1">
                                                {relatedProduct.discountPercentage}% OFF
                                            </span>
                                        }
                                    </div>
                                    <div className="card-body">
                                        <h5 className="card-title">{relatedProduct.name}</h5>
                                        <div className="star-rating">
                                            ★★★★☆ <small className="text-dark">(200 reviews)</small>
                                        </div>
                                        <p className="card-text">{relatedProduct.description.slice(0, 40)}...</p>
                                        <p className="fw-bold">{relatedProduct.price}{relatedProduct.currency}</p>
                                        <form action="/api/cart/add" method="POST">
                                            <input type="hidden" name="productId" value={relatedProduct._id} />
                                            <button className="btn btn-primary w-100">Add to Cart</button>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
}

export default ProductDetail;
