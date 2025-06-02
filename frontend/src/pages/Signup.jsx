import { useContext, useState } from "react";
import { useNavigate, } from 'react-router-dom';
import { AuthContext } from "../contexts/AuthContext";

const Signup = () => {
    const { register } = useContext(AuthContext);
    const [userData, setUserData] = useState({ name: "", username: "", email: "", password: "" });
    const [loading, setLoading] = useState(false); // Loading state
    const navigate = useNavigate();

    const handleChange = (e) => {
        setUserData({ ...userData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await register(userData);
            navigate("/");
        } catch (error) {
            alert("Registration failed.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="form-signin card">
            <form onSubmit={handleSubmit} className="p-4">
                <h1 className="h3 mb-3 fw-normal text-center">Sign Up</h1>

                <div className="form-floating  mb-4">
                    <input name="name" type="text" className="form-control" id="floatingName" placeholder="Name" value={userData.name}
                        onChange={handleChange}
                        required />
                    <label htmlFor="floatingName">Name</label>
                </div>

                <div className="form-floating  mb-4">
                    <input name="username" type="text" className="form-control" id="floatingUsername" placeholder="Username" value={userData.username}
                        onChange={handleChange}
                        required />
                    <label htmlFor="floatingUsername">Username</label>
                </div>

                <div className="form-floating  mb-4">
                    <input name="email" type="email" className="form-control" id="floatingEmail" placeholder="name@example.com" value={userData.email}
                        onChange={handleChange}
                        required />
                    <label htmlFor="floatingEmail">Email address</label>
                </div>

                <div className="form-floating  mb-4">
                    <input name="password" type="password" className="form-control" id="floatingPassword" placeholder="name@example.com" value={userData.password}
                        onChange={handleChange}
                        required />
                    <label htmlFor="floatingPassword">Password address</label>
                </div>
                <button
                    className="w-100 btn btn-lg btn-primary" type="submit" disabled={loading}
                >
                    {loading ? "Registering..." : "Sign Up"}
                </button>
            </form>
        </main>
    );
};

export default Signup;
