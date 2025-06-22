import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import toastr from "toastr";
import "toastr/build/toastr.min.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import * as bootstrap from "bootstrap";
import '../../../styles/tooltip.css'
import axios from "axios";
import { hasPermission } from '../../../utils/authUtils';
import { useAuth } from '../../../contexts/AuthContext';


const ManageProducts = () => {
    const { user } = useAuth();
    const [products, setProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortField, setSortField] = useState("");
    const [sortDirection, setSortDirection] = useState("asc");
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    useEffect(() => {
        fetchProducts();
    }, []);

    useEffect(() => {
        const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
        tooltipTriggerList.forEach((tooltipTriggerEl) => {
            new bootstrap.Tooltip(tooltipTriggerEl);
        });
    }, []);

    const fetchProducts = async () => {
        try {
            const response = await axios.get("/api/admin/products");
            setProducts(response.data.products);
        } catch (error) {
            console.error(error?.response?.data?.message);
        }
    };

    const handleSearch = (e) => {
        setSearchTerm(e.target.value.toLowerCase());
        setCurrentPage(1);
    };

    const toggleSort = (field) => {
        if (field === sortField) {
            setSortDirection(prev => prev === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortDirection("asc");
        }
    };

    const handleSelectAll = (e) => {
        setSelectedProducts(e.target.checked ? products.map(p => p._id) : []);
    };

    const handleSelectProduct = (productId) => {
        setSelectedProducts(prev =>
            prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
        );
    };

    const handleDeleteSelected = async () => {
        if (selectedProducts.length === 0) return toastr.warning("Please select at least one product to delete.");
        if (!window.confirm("Are you sure you want to delete selected products?")) return;

        try {
            await axios.post("/api/admin/products/deleteSelected",
                { productIds: selectedProducts },
                { headers: { "Content-Type": "application/json" } }
            );
            toastr.success("Selected products deleted successfully!");
            fetchProducts();
            setSelectedProducts([]);
        } catch (error) {
            toastr.error(error?.response?.data?.message || 'Error!');
        }
    };

    const handleRowsPerPageChange = (e) => {
        setRowsPerPage(parseInt(e.target.value));
        setCurrentPage(1);
    };

    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm)
    );

    if (sortField) {
        filteredProducts.sort((a, b) => {
            const aValue = typeof a[sortField] === "string" ? a[sortField].toLowerCase() : a[sortField];
            const bValue = typeof b[sortField] === "string" ? b[sortField].toLowerCase() : b[sortField];

            if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
            if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
            return 0;
        });
    }

    const totalPages = Math.ceil(filteredProducts.length / rowsPerPage);
    const displayedProducts = filteredProducts.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

    const renderSortArrow = (field) => {
        if (sortField !== field) return "↕";
        return sortDirection === "asc" ? "↑" : "↓";
    };

    const handleDelete = async (id) => {
        try {
            await axios.delete(`/api/admin/products/delete/${id}`)
            setProducts(products.filter((p) => p._id !== id))
            toastr.success("Product deleted successfully!");
        } catch (error) {
            toastr.error(error?.response?.data?.message)
        }
    };


    const [loadingExcelExport, setLoadingExcelExport] = useState(false);
    const [loadingPDFExport, setLoadingPDFExport] = useState(false);
    const [loadingExcelImport, setLoadingExcelImport] = useState(false);
    const [loadingExcelDownload, setLoadingExcelDownload] = useState(false);
    const fileInputRef = useRef();

    const exportFile = async (type, format) => {
        if (format === "pdf") {
            setLoadingPDFExport(true);
        } else {
            setLoadingExcelExport(true);
        }

        try {
            const url = `/api/admin/${type}/export/${format}`;
            const response = await fetch(url);

            if (!response.ok) throw new Error(response.statusText);

            const blob = await response.blob();
            const fileExtension = format === "excel" ? "xlsx" : "pdf";
            const fileName = `${type}.${fileExtension}`;

            const link = document.createElement("a");
            link.href = window.URL.createObjectURL(blob);
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(link.href);

            toastr.success(`Exported ${fileName} successfully`);
        } catch (error) {
            toastr.error(error);
        } finally {
            setLoadingPDFExport(false);
            setLoadingExcelExport(false);
        }
    };

    const handleFileSelectAndImport = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setLoadingExcelImport(true);
        try {
            const formData = new FormData();
            formData.append("file", file);

            const response = await fetch("/api/admin/products/import/excel", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) throw new Error(response.statusText);

            const result = await response.json();
            toastr.success(result.message || "Products imported successfully");
        } catch (error) {
            toastr.error(error || "Import failed");
        } finally {
            setLoadingExcelImport(false);
            event.target.value = null; // reset input so re-selecting the same file works
        }
    };

    const downloadTemplate = () => {
        setLoadingExcelDownload(true);
        try {
            const templateUrl = "/templates/product-import-template.xlsx";
            const link = document.createElement("a");
            link.href = templateUrl;
            link.download = "product-import-template.xlsx";
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error("Export failed:", error);
            toastr.error("Export failed. Please try again.");
        } finally {
            setLoadingExcelDownload(false);
        }
    };

    return (
        <>
            <div className="container my-4">
                <p className="fs-5 text-muted mb-3">
                    <span>Manage Products</span>
                </p>

                {/* Controls */}
                <div className="row mb-3">
                    <div className="col-md-3">
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Search products..."
                            value={searchTerm}
                            onChange={handleSearch}
                        />
                    </div>
                    <div className="col-md-2">
                        <select className="form-select w-50" onChange={handleRowsPerPageChange} value={rowsPerPage}>
                            {[10, 15, 20, 25, 50].map(n => (
                                <option key={n} value={n}>{n}</option>
                            ))}
                        </select>
                    </div>
                    <div className="d-flex justify-content-end col">
                        <div className="row g-2 me-2">
                            <div className="col-auto">
                                {hasPermission(user, 'product_excel_export') && (
                                    <button
                                        className="btn btn-success d-flex align-items-center gap-2"
                                        onClick={() => exportFile("products", "excel")}
                                        disabled={loadingExcelExport}
                                        data-bs-toggle="tooltip"
                                        data-bs-placement="top"
                                        data-bs-html="true"
                                        title="<strong>Export to Excel</strong><br/>Includes all product data"
                                        data-bs-custom-class="custom-tooltip"
                                    >
                                        <span><i className="fas fa-file-excel"></i></span>
                                        {loadingExcelExport && (
                                            <span className="spinner-border spinner-border-sm text-light" role="status" />
                                        )}
                                    </button>
                                )}
                            </div>
                            {hasPermission(user, 'product_pdf_export') && (
                                <div className="col-auto">
                                    <button
                                        className="btn btn-danger d-flex align-items-center gap-2"
                                        onClick={() => exportFile("products", "pdf")}
                                        disabled={loadingPDFExport}
                                        data-bs-toggle="tooltip"
                                        data-bs-placement="top"
                                        title="Export PDF File"
                                        data-bs-custom-class="custom-tooltip"
                                    >
                                        <span><i className="fas fa-file-pdf"></i></span>
                                        {loadingPDFExport && (
                                            <span className="spinner-border spinner-border-sm text-light" role="status" />
                                        )}
                                    </button>
                                </div>
                            )}
                            {hasPermission(user, 'product_excel_import') && (
                                <div className="col-auto">
                                    <input
                                        type="file"
                                        accept=".xlsx"
                                        ref={fileInputRef}
                                        onChange={handleFileSelectAndImport}
                                        style={{ display: "none" }}
                                        disabled={loadingExcelImport}
                                    />
                                    <button
                                        className="btn btn-primary d-flex align-items-center gap-2"
                                        onClick={() => !loadingExcelImport && fileInputRef.current.click()}
                                        disabled={loadingExcelImport}
                                        data-bs-toggle="tooltip"
                                        data-bs-placement="top"
                                        title="Import Excel File"
                                        data-bs-custom-class="custom-tooltip"
                                    >
                                        <span><i className="fas fa-upload"></i></span>
                                        {loadingExcelImport && (
                                            <span className="spinner-border spinner-border-sm text-light" role="status" />
                                        )}
                                    </button>
                                </div>
                            )}
                            {hasPermission(user, 'product_excel_import') && (
                                <div className="col-auto">
                                    <button
                                        className="btn btn-secondary d-flex align-items-center gap-2"
                                        onClick={downloadTemplate}
                                        disabled={loadingExcelDownload}
                                        data-bs-toggle="tooltip"
                                        data-bs-placement="top"
                                        title="Download Excel Template"
                                        data-bs-custom-class="custom-tooltip"
                                    >
                                        <span><i className="fas fa-download"></i></span>
                                        {loadingExcelDownload && (
                                            <span className="spinner-border spinner-border-sm text-light" role="status" />
                                        )}
                                    </button>
                                </div>
                            )}
                            {hasPermission(user, 'delete_selected_product') && (
                                <div className="col-auto">
                                    <button className="btn btn-danger d-flex align-items-center"
                                        onClick={handleDeleteSelected}
                                        data-bs-toggle="tooltip"
                                        data-bs-placement="top"
                                        title="Delete Selected Items"
                                        data-bs-custom-class="custom-tooltip" >

                                        <span><i className="fas fa-trash"></i></span>
                                    </button>
                                </div>
                            )}
                        </div>
                        {hasPermission(user, 'create_product') && (
                            <Link to="/admin/products/add" className="btn btn-primary ms-2">
                                <i className="fas fa-plus"></i> Add Product
                            </Link>
                        )}
                    </div>
                </div>

                {/* Products Table */}
                <table className="table p-0">
                    <thead>
                        <tr>
                            {hasPermission(user, 'delete_selected_product') && (
                                <th className="text-muted">
                                    <input
                                        type="checkbox"
                                        onChange={handleSelectAll}
                                        checked={selectedProducts.length === products.length && products.length > 0}
                                    />
                                </th>
                            )}
                            <th className="text-muted" onClick={() => toggleSort("name")} style={{ cursor: "pointer" }}>
                                Name {renderSortArrow("name")}
                            </th>
                            <th className="text-muted" onClick={() => toggleSort("category")} style={{ cursor: "pointer" }}>
                                Category {renderSortArrow("category")}
                            </th>
                            <th className="text-muted" onClick={() => toggleSort("price")} style={{ cursor: "pointer" }}>
                                Price {renderSortArrow("price")}
                            </th>
                            <th className="text-muted" onClick={() => toggleSort("stock")} style={{ cursor: "pointer" }}>
                                Stock {renderSortArrow("stock")}
                            </th>
                            {hasPermission(user, 'edit_product', 'delete_product') && (
                                <th className="text-muted">Actions</th>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {displayedProducts.map(product => (
                            <tr key={product._id}>
                                {hasPermission(user, 'delete_selected_product') && (
                                    <td>
                                        <input
                                            type="checkbox"
                                            checked={selectedProducts.includes(product._id)}
                                            onChange={() => handleSelectProduct(product._id)}
                                        />
                                    </td>
                                )}
                                <td>{product.name}</td>
                                <td>{product.category?.name}</td>
                                <td>${product.price.toFixed(2)}</td>
                                <td>{product.stock}</td>
                                <td>
                                    {hasPermission(user, 'edit_product') && (
                                        <Link to={`/admin/products/edit/${product._id}`} className="btn btn-light text-primary btn-sm">
                                            <i className="fas fa-edit"></i>
                                        </Link>
                                    )}
                                    {hasPermission(user, 'delete_product') && (
                                        <button
                                            className="btn btn-light text-danger btn-sm ms-2"
                                            onClick={() => handleDelete(product._id)}
                                        >
                                            <i className="fas fa-trash"></i>
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Pagination */}
                <nav>
                    <ul className="pagination justify-content-center">
                        <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                            <button className="page-link" onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}>
                                &lt;
                            </button>
                        </li>
                        {Array.from({ length: totalPages }, (_, i) => (
                            <li key={i + 1} className={`page-item ${i + 1 === currentPage ? "active" : ""}`}>
                                <button className="page-link" onClick={() => setCurrentPage(i + 1)}>
                                    {i + 1}
                                </button>
                            </li>
                        ))}
                        <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                            <button className="page-link" onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}>
                                &gt;
                            </button>
                        </li>
                    </ul>
                </nav>
            </div>
        </>
    );
};

export default ManageProducts;
