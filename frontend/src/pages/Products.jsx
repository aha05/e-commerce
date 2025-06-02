import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from "react-router-dom";
import Header from "../components/Partials/Header";
import Footer from "../components/Partials/Footer";
import toastr from "toastr";
const backendUrl = import.meta.env.VITE_BACKEND_URL;

function Product() {
    const { categoryId } = useParams();
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [promotions, setPromotions] = useState([]);
    const [cart, setCart] = useState([]);
    const [priceRange, setPriceRange] = useState(150);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [selectedRating, setSelectedRating] = useState(null);
    const [inStockOnly, setInStockOnly] = useState(false);
    const [selectedDiscount, setSelectedDiscount] = useState(null);

    useEffect(() => {
        // Fetch data from backend
        axios.get(`/api/products/category/${categoryId}`)
            .then((response) => {
                setProducts(response.data.products);
                setCart(response.data.cart);
            })
            .catch((error) => console.error('Error fetching data:', error));

        axios.get('/api/category')
            .then((response) => {
                setCategories(response.data.categories);
            })
            .catch((error) => console.error('Error fetching data:', error));

        axios.get("/api/index/all-promotion")
            .then(res => setPromotions(res.data.promotions))
            .catch(() => toastr.error("Failed to load promotions"));

    }, [categoryId]);

    const handlePriceChange = (e) => {
        setPriceRange(e.target.value);
    };

    const applyFilters = async () => {
        try {
            const response = await axios.post('/api/products/filter', {
                categories: selectedCategories,
                price: priceRange,
                rating: selectedRating,
                inStock: inStockOnly,
                discount: selectedDiscount,
                categoryId
            });
            setProducts(response.data.products);
            toastr.success("Filters applied!");
        } catch (err) {
            console.error("Error applying filters", err);
            toastr.error("Failed to apply filters.");
        }
    };

    return (
        <div>
            <Header cart={cart} />
            <section id="#product" >
                <div className="row my-5">
                    {/* Product Grid  */}

                    <div className="col-lg-9  mb-0">
                        <div className="row g-4">
                            {products.map(product => (
                                <ProductCard key={product._id} product={product} backendUrl={backendUrl} />
                            ))}
                            {/* {products.map(product => (
                                // <div className="col-md-3" key={product._id}>
                                //     <div className="card product-card border-0 bg-light">
                                //         <div className="position-relative" style={{ height: "13rem" }}>
                                //             <img
                                //                 src={`${backendUrl}${product.image}`}
                                //                 alt={product.image}
                                //                 className="img-fluid h-100 w-100 rounded"
                                //             />
                                //             {product?.discountPercentage > 0 &&
                                //                 <span className="badge bg-danger position-absolute top-0 start-0 fs-1">
                                //                     {product.discountPercentage}% OFF
                                //                 </span>
                                //             }
                                //         </div>
                                //         <div className="card-body">
                                //             <h5 className="card-title">{product.name}</h5>
                                //             <div className="star-rating text-warning">★★★★☆</div>
                                //             <p className="card-text">{product.description.slice(0, 47)}...</p>
                                //             <p className="text-danger fw-bold">${product.price}</p>
                                //             <a href={`/products/${product._id}`} className="btn btn-primary">View Product</a>
                                //         </div>
                                //     </div>
                                // </div>
                            ))} */}
                        </div>
                    </div>

                    {/* Filter Sidebar */}
                    <div className="col-lg-3 filter-sidebar bg-light filter-section pt-2">
                        <h4>Filter By</h4>
                        <hr />
                        {/* Category Filter */}
                        <h6>Category</h6>
                        <ul className="list-unstyled">
                            {categories.map(category => (
                                <li key={category._id}>
                                    <input
                                        className="me-1"
                                        type="checkbox"
                                        id={`cat-${category._id}`}
                                        name="category"
                                        onChange={(e) => {
                                            setSelectedCategories(prev =>
                                                e.target.checked
                                                    ? [...prev, category._id]
                                                    : prev.filter(c => c !== category._id)
                                            );
                                        }} />
                                    <label htmlFor={`cat-${category._id}`}>{category.name}</label>
                                </li>
                            ))}
                        </ul>
                        <hr />
                        {/* Price Range Filter */}
                        <h6>Price Range</h6>
                        <input
                            type="range"
                            className="form-range"
                            min="0"
                            max="500"
                            step="10"
                            value={priceRange}
                            onChange={handlePriceChange}
                        />
                        <p>Max: <span id="price-range-value">${priceRange}</span></p>
                        <hr />
                        {/* Rating Filter */}
                        <h6>Rating</h6>
                        <ul className="list-unstyled">
                            <li>
                                <input
                                    className="me-1"
                                    type="radio"
                                    id="5stars"
                                    name="rating"
                                    onChange={() => setSelectedRating(5)}
                                />
                                <label htmlFor="5stars">&#9733;&#9733;&#9733;&#9733;&#9733;</label>
                            </li>
                            <li>
                                <input
                                    className="me-1"
                                    type="radio"
                                    id="4stars"
                                    name="rating"
                                    onChange={() => setSelectedRating(4)}
                                />
                                <label htmlFor="4stars">&#9733;&#9733;&#9733;&#9733; & up</label>
                            </li>
                            <li>
                                <input
                                    className="me-1"
                                    type="radio"
                                    id="3stars"
                                    name="rating"
                                    onChange={() => setSelectedRating(3)}
                                />
                                <label htmlFor="3stars">&#9733;&#9733;&#9733; & up</label>
                            </li>
                            <li>
                                <input
                                    className="me-1"
                                    type="radio"
                                    id="2stars"
                                    name="rating"
                                    onChange={() => setSelectedRating(2)}
                                />
                                <label htmlFor="2stars">&#9733;&#9733; & up</label>
                            </li>
                        </ul>
                        {/* Availability Filter */}
                        <hr />
                        <h6>Availability</h6>
                        <ul className="list-unstyled">
                            <li>
                                <input
                                    className="me-1"
                                    type="checkbox"
                                    id="in-stock"
                                    name="availability"
                                    onChange={(e) => setInStockOnly(e.target.checked)}
                                />
                                <label htmlFor="in-stock">In Stock</label>
                            </li>
                        </ul>
                        <hr />

                        {/* Discount Filter */}
                        <div className="list-unstyled mb-4">
                            <label className="form-label">Discount</label>
                            <select
                                className="form-select"
                                name="discount"
                                onChange={(e) => setSelectedDiscount(e.target.value)}
                            >
                                <option value="">
                                    -- Select Discount --                                </option>
                                {promotions.map(promotion => (
                                    <option key={promotion.id} value={promotion.discountPercentage}>
                                        {promotion.discountPercentage}% Off or more
                                    </option>
                                ))}
                            </select>
                        </div>
                        <hr />
                        <button className="btn btn-primary w-100" onClick={applyFilters}>Apply Filters</button>
                    </div>
                </div>
            </section>
            <Footer />
        </div>
    )
}

const ProductCard = ({ product, backendUrl }) => {
    const fullStars = Math.floor(product.averageRating);
    const hasHalfStar = product.averageRating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
        <div className="col-md-3" key={product._id}>
            <div className="card product-card border-0 bg-light">
                <div className="position-relative" style={{ height: "13rem" }}>
                    <img
                        src={`${backendUrl}${product.image}`}
                        alt={product.image}
                        className="img-fluid h-100 w-100 rounded"
                    />
                    {product?.discountPercentage > 0 &&
                        <span className="badge bg-danger position-absolute top-0 start-0 fs-1">
                            {product.discountPercentage}% OFF
                        </span>
                    }
                </div>
                <div className="card-body">
                    <h5 className="card-title">{product.name}</h5>
                    <div className="star-rating text-warning mb-2">
                        {[...Array(fullStars)].map((_, i) => (
                            <i key={`full-${i}`} style={{ fontSize: "0.7rem", letterSpacing: "2px" }} className="fas fa-star"></i>
                        ))}
                        {hasHalfStar && <i style={{ fontSize: "0.7rem", letterSpacing: "2px" }} className="fas fa-star-half-alt"></i>}
                        {[...Array(emptyStars)].map((_, i) => (
                            <i key={`empty-${i}`} style={{ fontSize: "0.7rem", letterSpacing: "2px" }} className="far fa-star"></i>
                        ))}
                        <span className="text-dark ms-1" style={{ fontSize: "0.8rem" }}>({product.totalReviews} reviews)</span>
                    </div>
                    <p className="card-text">{product.description.slice(0, 47)}...</p>
                    <p className="text-danger fw-bold">{product.price}{product.currency}</p>
                    <a href={`/products/${product._id}`} className="btn btn-primary">View Product</a>
                </div>
            </div>
        </div>)
};

export default Product;
