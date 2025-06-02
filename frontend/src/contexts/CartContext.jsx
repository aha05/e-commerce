import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

// Create Cart Context
const CartContext = createContext();

// Custom hook to use the Cart Context
export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children, user }) => {
    const [cart, setCart] = useState([]);

    // Load cart from API if user is logged in and is a customer
    useEffect(() => {
        fetchCart();
    }, []);

    // Fetch cart from backend
    const fetchCart = async () => {
        try {
            const response = await axios.get("/api/cart");
            setCart(response.data.cart);
        } catch (error) {
            console.error("Error fetching cart:", error);
        }
    };

    // Add item to cart
    const addToCart = async (productId, quantity = 1) => {
        try {
            const response = await axios.post("/cart/add", { productId, quantity });
            setCart(response.data);
        } catch (error) {
            console.error("Error adding to cart:", error);
        }
    };

    // Remove item from cart
    const removeFromCart = async (productId) => {
        try {
            const response = await axios.delete(`/cart/remove/${productId}`);
            setCart(response.data);
        } catch (error) {
            console.error("Error removing from cart:", error);
        }
    };

    return (
        <CartContext.Provider value={{ cart, addToCart, removeFromCart }}>
            {children}
        </CartContext.Provider>
    );
};
