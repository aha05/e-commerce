import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import toastr from "toastr";

const ManageProducts = () => {
    const [products, setProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortOrder, setSortOrder] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 3;

    useEffect(() => {

        const response = fetch("/api/admin/products")
            .then((res) => res.json())
            .then((data) => { setProducts(data.products) })
            .catch((error) => console.error("Error fetching products:", error));

    }, []);

    const handleSearch = (e) => {
        setSearchTerm(e.target.value.toLowerCase());
    };

    const handleSort = (order) => {
        setSortOrder(order);
    };
    console.log(products)
    const filteredProducts = products
        .filter((product) =>
            product.name.toLowerCase().includes(searchTerm)
        )
        .sort((a, b) => {
            if (!sortOrder) return 0;
            if (sortOrder === "price" || sortOrder === "stock") {
                return a[sortOrder] - b[sortOrder];
            }
            return a[sortOrder].localeCompare(b[sortOrder]);
        });

    const totalPages = Math.ceil(filteredProducts.length / rowsPerPage);
    const paginatedProducts = filteredProducts.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage
    );

    const handleDelete = (id) => {
        fetch(`/api/admin/products/delete/${id}`, { method: "DELETE" })
            .then((res) => res.json())
            .then(() => {
                setProducts(products.filter((p) => p._id !== id))
                toastr.success("Product deleted successfully!");
            })
            .catch((error) => {
                if (error.response.status === 401) navigate('/unauthorized');
                toastr.error("Failed to delete product!", error)
            });
    };

    return (
        <div className="container my-4">
            <p className="fs-5 text-muted">
                Dashboard &gt; <span>Manage Product</span>
            </p>

            <div className="row mb-3">
                <div className="col-md-4">
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Search products..."
                        onChange={handleSearch}
                    />
                </div>
                <div className="col-md-4">
                    <select
                        className="form-select"
                        onChange={(e) => handleSort(e.target.value)}
                    >
                        <option value="">Sort by</option>
                        <option value="name">Name</option>
                        <option value="price">Price</option>
                        <option value="stock">Stock</option>
                    </select>
                </div>
                <div className="col-md-4 text-end">
                    <Link to="/admin/products/add" className="btn btn-primary">
                        <i className="fas fa-plus"></i> Add Product
                    </Link>
                </div>
            </div>

            <table className="table table-borderless table-striped">
                <thead>
                    <tr>
                        <th className="text-muted">Name</th>
                        <th className="text-muted">Category</th>
                        <th className="text-muted">Price</th>
                        <th className="text-muted">Stock</th>
                        <th className="text-muted">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {paginatedProducts.map((product) => (
                        <tr key={product._id}>
                            <td>{product.name}</td>
                            <td>{product.category.name}</td>
                            <td>${product.price}</td>
                            <td>{product.stock}</td>
                            <td>
                                <Link
                                    to={`/admin/products/edit/${product._id}`} key={product._id}
                                    className="btn btn-warning btn-sm"
                                >
                                    <i className="fas fa-edit"></i> Edit
                                </Link>
                                <button
                                    className="btn btn-danger btn-sm ms-2"
                                    onClick={() => handleDelete(product._id)}
                                >
                                    <i className="fas fa-trash"></i> Delete
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <nav>
                <ul className="pagination justify-content-center">
                    {[...Array(totalPages)].map((_, i) => (
                        <li key={i} className={`page-item ${i + 1 === currentPage ? "active" : ""}`}>
                            <button className="page-link" onClick={() => setCurrentPage(i + 1)}>
                                {i + 1}
                            </button>
                        </li>
                    ))}
                </ul>
            </nav>
        </div>
    );
};

export default ManageProducts;
