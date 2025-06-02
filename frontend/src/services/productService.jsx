import axios from "axios";

const fetchProductsByCategory = async (categoryId) => {
    try {
        const response = await axios.get(`/products/category/${categoryId}`);
        console.log(response.data);
        return response.data; // Products data
    } catch (error) {
        console.error("Error fetching products:", error);
        throw error;
    }
};

export default fetchProductsByCategory;
