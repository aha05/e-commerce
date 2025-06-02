import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toastr from "toastr";

const ManageCategories = () => {
  const [categories, setCategories] = useState([]);
  const navigate = useNavigate();

  // Fetch categories from backend
  useEffect(() => {
    fetch("/api/admin/categories")
      .then((res) => res.json())
      .then((data) => {
        setCategories(data.categories)
      })
      .catch((error) => {
        if (error.response.status === 401) navigate('/unauthorized');
        console.error("Error fetching categories:", error)

      });
  }, []);

  // Handle delete category
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this category?")) return;
    fetch(`/api/admin/categories/delete/${id}`, { method: "DELETE" })
      .then((res) => res.json())
      .then(() => {
        setCategories(categories.filter((category) => category._id !== id))
        toastr.success("Category deleted successfully!");
      })
      .catch((error) => {
        if (error.response.status === 401) navigate('/unauthorized');
        toastr.error("Failed to delete category!", error)
      });
  };

  return (
    <div className="container mt-4">
      <h1 className="mb-3">Manage Categories</h1>

      <button className="btn btn-primary mb-3" onClick={() => navigate("/admin/categories/add")}>
        Add Category
      </button>

      <table className="table table-bordered table-striped">
        <thead className="thead-dark">
          <tr>
            <th>#</th>
            <th>Name</th>
            <th>Description</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {categories.length > 0 ? (
            categories.map((category, index) => (
              <tr key={category._id}>
                <td>{index + 1}</td>
                <td>{category.name}</td>
                <td>{category.description || "N/A"}</td>
                <td>
                  <Link
                    className="btn btn-sm btn-warning me-2"
                    to={`/admin/categories/edit/${category._id}`}
                    key={category._id}
                  >
                    Edit
                  </Link>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => handleDelete(category._id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4" className="text-center">
                No categories found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ManageCategories;
