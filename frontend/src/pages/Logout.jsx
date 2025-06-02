import { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";

const Logout = () => {
    const { logout } = useContext(AuthContext);

    return <button onClick={logout}>Logout</button>;
};

export default Logout;