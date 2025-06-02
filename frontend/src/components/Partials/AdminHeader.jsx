import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import toastr from "toastr";
import "../../styles/toastr.css";
import '../../styles/styles.css';


const AdminHeader = ({ children }) => {

    toastr.options = {
        closeButton: true,
        debug: false,
        newestOnTop: true,
        progressBar: true,
        positionClass: "toast-top-right",
        preventDuplicates: false,
        showDuration: "300",
        hideDuration: "1000",
        timeOut: "5000",
        extendedTimeOut: "1000",
        showEasing: "swing",
        hideEasing: "linear",
        showMethod: "fadeIn",
        hideMethod: "fadeOut",
    };

    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <div>
            {/* Sidebar */}
            <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

            {/* Main Content */}
            <div className={`content ${isCollapsed ? "collapsed" : ""}`} id="content">
                {/* Navbar */}
                <Navbar />

                {/* Main Page Content */}
                <div>{children}</div>
            </div>
        </div>
    );
};

export default AdminHeader;
