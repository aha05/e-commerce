import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import toastr from "toastr";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true); // For loading state

    useEffect(() => {
        axios
            .get("/api/auth/session", { withCredentials: true })
            .then((res) => setUser(res.data.user))
            .catch(() => setUser(null))
            .finally(() => setLoading(false));
    }, []);

    const login = async (credentials) => {
        try {
            const res = await axios.post("/api/auth/login", credentials, { withCredentials: true });
            if (res.data.user) {
                setUser(res.data.user);
                return res.data.user; // Return user data for role checking
            }
        } catch (error) {
            toastr.error(error.response?.data?.message);
            throw error;
        }
    };

    const register = async (userData) => {
        try {
            const res = await axios.post("/api/auth/register", userData, { withCredentials: true });
            if (res.data.user) {
                setUser(res.data.user);
                return res.data.user; // Return user data for role checking
            }
        } catch (error) {
            toastr.error(error.response?.data?.message);
        }
    };

    const logout = async () => {
        try {
            await axios.post("/api/auth/logout", {}, { withCredentials: true });
            setUser(null);
        } catch (error) {
            toastr.error(error.response?.data?.message);
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
