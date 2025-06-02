import { useContext, useState } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import toastr from "toastr";
import "../styles/login.css"

const Login = () => {
    const { login } = useContext(AuthContext);
    const [credentials, setCredentials] = useState({ email: "", password: "" });
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setCredentials({ ...credentials, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const user = await login(credentials);
            if (user.roles.includes("admin")) {
                navigate("/admin/dashboard"); // Redirect admin to Dashboard
            } else {
                navigate("/"); // Redirect regular user to Home
            }
        } catch (error) {
            console.log("Invalid credentials");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="form-signin card">
            <form onSubmit={handleSubmit} className="p-4">
                <h1 className="h3 mb-3 fw-normal text-center">Login</h1>

                <div className="form-floating mb-4">
                    <input name="email" type="email" className="form-control" id="floatingInput" placeholder="name@example.com"
                        value={credentials.email} onChange={handleChange} required />
                    <label htmlFor="floatingInput">Email address</label>
                </div>
                <div className="form-floating mb-4">
                    <input name="password" type="password" className="form-control" id="floatingPassword" placeholder="Password"
                        value={credentials.password} onChange={handleChange} required />
                    <label htmlFor="floatingPassword">Password</label>
                </div>

                <button className="w-100 btn btn-lg btn-primary" type="submit" disabled={loading}>
                    {loading ? "Logging in..." : "Login"}
                </button>
            </form>
        </main>
    );
};

export default Login;
