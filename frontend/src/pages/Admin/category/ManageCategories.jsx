import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toastr from "toastr";
import "toastr/build/toastr.min.css";
import axios from "axios";
import { hasPermission } from '../../../utils/authUtils';
import { useAuth } from '../../../contexts/AuthContext';

const ManageCategories = () => {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("");
  const [sortDirection, setSortDirection] = useState("asc");
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get("/api/admin/categories");
      setCategories(response.data.categories);
    } catch (error) {
      toastr.error(error?.response?.data?.message || 'Error');
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
    setSelectedCategories(e.target.checked ? categories.map(c => c._id) : []);
  };

  const handleSelectCategory = (id) => {
    setSelectedCategories(prev =>
      prev.includes(id) ? prev.filter(cid => cid !== id) : [...prev, id]
    );
  };

  const handleDeleteSelected = async () => {
    if (selectedCategories.length === 0) return toastr.warning("Please select at least one category to delete.");
    if (!window.confirm("Are you sure you want to delete selected categories?")) return;

    try {
      await axios.post("/api/admin/categories/deleteSelected",
        { categoryIds: selectedCategories },
        { headers: { "Content-Type": "application/json" } }
      );

      toastr.success("Selected categories deleted successfully!");
      fetchCategories();
      setSelectedCategories([]);
    } catch (error) {
      toastr.error(error?.response?.data?.message || 'Error');
    }
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this category?");
    if (!confirmDelete) return;

    try {
      await axios.delete(`/api/admin/categories/delete/${id}`);
      setCategories(prev => prev.filter(cat => cat._id !== id));
      toastr.success("Category deleted successfully!");
    } catch (error) {
      toastr.error(error?.response?.data?.message || 'Error');
    }
  };

  const handleRowsPerPageChange = (e) => {
    setRowsPerPage(parseInt(e.target.value));
    setCurrentPage(1);
  };

  let filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(searchTerm) ||
    (cat.description?.toLowerCase() || "").includes(searchTerm)
  );

  if (sortField) {
    filteredCategories.sort((a, b) => {
      const aValue = a[sortField]?.toLowerCase?.() || "";
      const bValue = b[sortField]?.toLowerCase?.() || "";
      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }

  const totalPages = Math.ceil(filteredCategories.length / rowsPerPage);
  const displayedCategories = filteredCategories.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const renderSortArrow = (field) => {
    if (sortField !== field) return "↕";
    return sortDirection === "asc" ? "↑" : "↓";
  };

  return (
    <div className="container my-4">
      <p className="fs-5 text-muted mb-3">
        <span>Manage Categories</span>
      </p>

      {/* Controls */}
      <div className="row align-items-center mb-4">
        <div className="col-md-3 mb-2 mb-md-0">
          <input
            type="text"
            className="form-control"
            placeholder="Search categories..."
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>

        <div className="col-md-2 mb-2 mb-md-0">
          <select
            className="form-select w-50"
            onChange={handleRowsPerPageChange}
            value={rowsPerPage}
          >
            {[10, 15, 20, 25, 50].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>

        <div className="col-md-7 text-md-end d-flex flex-wrap justify-content-md-end gap-2">
          {hasPermission(user, 'delete_category') && (
            <button
              className="btn btn-danger"
              onClick={handleDeleteSelected}
            >
              <i className="fas fa-trash me-1"></i> Delete Selected
            </button>
          )}
          {hasPermission(user, 'create_category') && (
            <button
              className="btn btn-primary"
              onClick={() => navigate("/admin/categories/add")}
            >
              <i className="fas fa-plus me-1"></i> Add Category
            </button>
          )}
        </div>


      </div>


      {/* Categories Table */}
      <table className="table p-0">
        <thead>
          <tr>
            {hasPermission(user, 'delete_category') && (
              <th className="text-muted">
                <input
                  type="checkbox"
                  onChange={handleSelectAll}
                  checked={selectedCategories.length === categories.length && categories.length > 0}
                />
              </th>
            )}
            <th className="text-muted" onClick={() => toggleSort("name")} style={{ cursor: "pointer" }}>
              Name {renderSortArrow("name")}
            </th>
            <th className="text-muted" onClick={() => toggleSort("description")} style={{ cursor: "pointer" }}>
              Description {renderSortArrow("description")}
            </th>
            {hasPermission(user, 'edit_category', 'delete_category') && (
              <th className="text-muted">Actions</th>
            )}
          </tr>
        </thead>
        <tbody>
          {displayedCategories.map(cat => (
            <tr key={cat._id}>
              {hasPermission(user, 'delete_category') && (
                <td>
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(cat._id)}
                    onChange={() => handleSelectCategory(cat._id)}
                  />
                </td>
              )}
              <td>{cat.name}</td>
              <td>{cat.description?.length > 50 ? cat.description.slice(0, 50) + "..." : cat.description}</td>
              <td>
                {hasPermission(user, 'edit_category') && (
                  <Link to={`/admin/categories/edit/${cat._id}`} className="btn btn-sm btn-light text-primary me-2">
                    <i className="fas fa-edit"></i>
                  </Link>
                )}
                {hasPermission(user, 'delete_category') && (
                  <button onClick={() => handleDelete(cat._id)} className="btn btn-sm btn-light text-danger">
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
  );
};

export default ManageCategories;
