import React, { useEffect, useState } from "react";
import axios from "axios";

const Wishlist = () => {
    const [wishlist, setWishlist] = useState([]);

    useEffect(() => {
        axios.get("/api/wishlist") // Adjust API endpoint as needed
            .then(response => setWishlist(response.data))
            .catch(error => console.error("Error fetching wishlist:", error));
    }, []);

    const addToCart = (productId) => {
        axios.post("/api/cart/add", { productId })
            .then(() => {
                alert("Added to cart");
            })
            .catch(error => console.error("Error adding to cart:", error));
    };

    const removeFromWishlist = (productId) => {
        axios.post("/api/wishlist/remove", { productId })
            .then(() => {
                setWishlist(wishlist.filter(item => item.productId._id !== productId));
            })
            .catch(error => console.error("Error removing from wishlist:", error));
    };

    return (
        <div className="container my-4">
            <h2>Your Wishlist</h2>
            {wishlist.length > 0 ? (
                <ul className="list-group">
                    {wishlist.map(item => (
                        <li key={item.productId._id} className="list-group-item d-flex justify-content-between align-items-center">
                            <div className="d-flex">
                                <div className="mx-3">
                                    <img src={`/img/${item.productId.image}`} alt={item.productId.name} style={{ height: "50px" }} />
                                </div>
                                <div>
                                    <h5>{item.productId.name}</h5>
                                    <p>${item.productId.price.toFixed(2)}</p>
                                </div>
                            </div>
                            <div>
                                <button onClick={() => addToCart(item.productId._id)} className="btn btn-sm btn-success">
                                    Add to Cart
                                </button>
                                <a className="btn btn-secondary mx-2" href={`/products/${item.productId._id}`}>
                                    View Details
                                </a>
                                <button onClick={() => removeFromWishlist(item.productId._id)} className="btn btn-sm btn-danger">
                                    Remove
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <p>Your wishlist is empty.</p>
            )}
        </div>
    );
};

export default Wishlist;
