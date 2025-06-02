import { useState, useEffect } from "react";
import axios from "axios";
import toastr from "toastr";

const Logs = () => {
    const [logs, setLogs] = useState([]);

    const handleDeleteAll = async () => {
        try {
            const response = await axios.delete('/api/admin/logs/delete-all');
            toastr.success(response.data.message);
            setLogs([]);
        } catch (error) {
            toastr.error('Error deleting logs:', error);
        }
    };

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const res = await axios.get("/api/admin/logs");
                setLogs(res.data); // Assuming API returns an array of logs
            } catch (error) {
                console.error("Error fetching activity logs:", error);
            }
        };

        fetchLogs();
    }, []);

    return (
        <div className="card shadow-sm">
            <button className="btn btn-danger col-2 m-2" onClick={handleDeleteAll}>DELETE ALL</button>
            <div className="card-header bg-secondary text-white">
                <h5 className="mb-0">User Activity Log</h5>
            </div>
            <div className="card-body p-0">
                <table className="table table-striped table-hover mb-0">
                    <thead className="table-dark">
                        <tr>
                            <th scope="col">Admin</th>
                            <th scope="col">Action</th>
                            <th scope="col">Details</th>
                            <th scope="col">Timestamp</th>
                            <th scope="col">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.length > 0 ? (
                            logs.map((log, index) => (
                                <tr key={index}>
                                    <td>{log.admin}</td>
                                    <td>{log.action}</td>
                                    <td dangerouslySetInnerHTML={{ __html: log.details }}></td>
                                    <td>{new Date(log.timestamp).toLocaleString()}</td>
                                    <td>
                                        <span className={`badge bg-${getBadgeClass(log.status)}`}>
                                            {log.status}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" className="text-center p-3">
                                    No activity logs found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// Helper function to get badge class based on status
const getBadgeClass = (status) => {
    switch (status.toLowerCase()) {
        case "success":
            return "success";
        case "updated":
            return "primary";
        case "modified":
            return "warning text-dark";
        case "deleted":
            return "danger";
        default:
            return "secondary";
    }
};

export default Logs;
