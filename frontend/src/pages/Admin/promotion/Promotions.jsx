import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import toastr from "toastr";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "toastr/build/toastr.min.css";
import { hasPermission } from '../../../utils/authUtils';
import { useAuth } from '../../../contexts/AuthContext';

const Promotions = () => {
    const { user } = useAuth();
    const [promotions, setPromotions] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
    const [productFilter, setProductFilter] = useState("");
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const navigate = useNavigate();

    useEffect(() => {
        axios.get("/api/admin/promotions")
            .then(res => {
                setPromotions(res.data.promotions);
                setFiltered(res.data.promotions);
            })
            .catch(error => {
                toastr.error(error.response.data.message || 'Error');
            });
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this promotion?")) return;
        try {
            await axios.delete(`/api/admin/promotions/delete/${id}`);
            const updated = promotions.filter(p => p._id !== id);
            setPromotions(updated);
            applyFilters(updated);
            toastr.success("Promotion deleted successfully");
        } catch {
            toastr.error(error.response.data.message || 'Error');
        }
    };

    const applyFilters = (data = promotions) => {
        let results = [...data];

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            results = results.filter(p =>
                p.name.toLowerCase().includes(term) ||
                (p.code || "auto").toLowerCase().includes(term)
            );
        }

        if (productFilter) {
            results = results.filter(p => p.product?.name === productFilter);
        }

        if (startDate && endDate) {
            results = results.filter(p => {
                const date = new Date(p.startDate);
                return date >= startDate && date <= endDate;
            });
        }

        if (sortConfig.key) {
            results.sort((a, b) => {
                let aVal = a[sortConfig.key];
                let bVal = b[sortConfig.key];

                if (sortConfig.key === "product") {
                    aVal = a.product?.name || "";
                    bVal = b.product?.name || "";
                }

                if (typeof aVal === "string") {
                    aVal = aVal.toLowerCase();
                    bVal = bVal.toLowerCase();
                }

                if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
                return 0;
            });
        }

        setFiltered(results);
        setCurrentPage(1);
    };

    useEffect(() => {
        applyFilters();
    }, [searchTerm, productFilter, startDate, endDate, sortConfig]);

    const toggleSort = (key) => {
        let direction = "asc";
        if (sortConfig.key === key && sortConfig.direction === "asc") {
            direction = "desc";
        }
        setSortConfig({ key, direction });
    };

    const getSortIcon = (key) => {
        if (sortConfig.key !== key) return "⇅";
        return sortConfig.direction === "asc" ? "↑" : "↓";
    };

    const uniqueProducts = [...new Set(promotions.map(p => p.product?.name).filter(Boolean))];

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filtered.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filtered.length / itemsPerPage);

    return (
        <div className="container my-4">
            <p className="fs-5 text-muted mb-3">Promotions</p>

            {/* Controls */}
            <div className="row gy-2 mb-4 align-items-end">
                <div className="col-md-3">
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Search by name or code"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="col-md-2">
                    <select className="form-select" value={productFilter} onChange={(e) => setProductFilter(e.target.value)}>
                        <option value="">All Products</option>
                        {uniqueProducts.map(p => (
                            <option key={p} value={p}>{p}</option>
                        ))}
                    </select>
                </div>
                <div className="col-md-2">
                    <DatePicker
                        selected={startDate}
                        onChange={setStartDate}
                        placeholderText="Start Date"
                        className="form-control"
                    />
                </div>
                <div className="col-md-2">
                    <DatePicker
                        selected={endDate}
                        onChange={setEndDate}
                        placeholderText="End Date"
                        className="form-control"
                    />
                </div>
                <div className="col-md-1">
                    <select
                        className="form-select pe-2"
                        value={itemsPerPage}
                        onChange={(e) => setItemsPerPage(Number(e.target.value))}
                    >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={15}>15</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                    </select>
                </div>
                {hasPermission(user, 'create_promotion') && (
                    <div className="col-md-2 text-end">
                        <Link to="/admin/promotions/add" className="btn btn-primary w-100">
                            <i className="fas fa-plus me-1"></i> Create
                        </Link>
                    </div>
                )}

            </div>

            {/* Table */}
            <table className="table table-hover">
                <thead>
                    <tr>
                        <th onClick={() => toggleSort("name")} className="text-muted">Name {getSortIcon("name")}</th>
                        <th onClick={() => toggleSort("code")} className="text-muted">Code {getSortIcon("code")}</th>
                        <th onClick={() => toggleSort("product")} className="text-muted">Product {getSortIcon("product")}</th>
                        <th onClick={() => toggleSort("discountPercentage")} className="text-muted">Discount {getSortIcon("discountPercentage")}</th>
                        <th className="text-muted">Start Date</th>
                        <th className="text-muted">End Date</th>
                        <th className="text-muted">Status</th>
                        <th className="text-muted">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {currentItems.length > 0 ? currentItems.map(promotion => (
                        <tr key={promotion._id}>
                            <td>{promotion.name}</td>
                            <td>{promotion.code || "auto"}</td>
                            <td>{promotion.product?.name}</td>
                            <td>{promotion.discountPercentage}%</td>
                            <td>{new Date(promotion.startDate).toDateString()}</td>
                            <td>{new Date(promotion.endDate).toDateString()}</td>
                            <td>
                                <span className={`badge ${promotion.isActive ? "bg-success" : "bg-secondary"}`}>
                                    {promotion.isActive ? "Active" : "Inactive"}
                                </span>
                            </td>
                            {hasPermission(user, 'edit_promotion', 'delete_promotion') && (
                                <td>
                                    {hasPermission(user, 'edit_promotion') && (
                                        <Link to={`/admin/promotions/update/${promotion._id}`} className="btn btn-sm btn-light text-primary me-2">
                                            <i className="fas fa-edit"></i>
                                        </Link>
                                    )}
                                    {hasPermission(user, 'delete_promotion') && (
                                        <button className="btn btn-sm btn-light text-danger" onClick={() => handleDelete(promotion._id)}>
                                            <i className="fas fa-trash"></i>
                                        </button>
                                    )}
                                </td>
                            )}
                        </tr>
                    )) : (
                        <tr>
                            <td colSpan="8" className="text-center text-muted">No promotions found.</td>
                        </tr>
                    )}
                </tbody>
            </table>

            {/* Pagination */}
            <div className="d-flex justify-content-center mt-3">
                <nav>
                    <ul className="pagination">
                        <li className={`page-item ${currentPage === 1 && "disabled"}`}>
                            <button className="page-link" onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}>
                                &lt;
                            </button>
                        </li>
                        {[...Array(totalPages)].map((_, i) => (
                            <li key={i} className={`page-item ${currentPage === i + 1 && "active"}`}>
                                <button className="page-link" onClick={() => setCurrentPage(i + 1)}>
                                    {i + 1}
                                </button>
                            </li>
                        ))}
                        <li className={`page-item ${currentPage === totalPages && "disabled"}`}>
                            <button className="page-link" onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}>
                                &gt;
                            </button>
                        </li>
                    </ul>
                </nav>
            </div>
        </div>
    );
};

export default Promotions;
