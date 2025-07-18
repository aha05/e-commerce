import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import toastr from "toastr";
const backendUrl = import.meta.env.VITE_BACKEND_URL;

const EditCategory = () => {
    const { categoryId } = useParams();
    const navigate = useNavigate();

    const [category, setCategory] = useState({
        name: "",
        description: "",
        image: "",
    });

    useEffect(() => {
        // Fetch category details
        axios.get(`/api/admin/categories/edit/${categoryId}`)
            .then((res) => {
                setCategory(res.data.category);
            })
            .catch((error) => {
                if (error.response.status === 401) navigate('/unauthorized');
                toastr.error("Error fetching category")
            });
    }, [categoryId]);

    const handleChange = (e) => {
        setCategory({ ...category, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        setCategory({ ...category, image: e.target.files[0] });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append("name", category.name);
        formData.append("description", category.description);
        if (category.image) {
            formData.append("image", category.image);
        }

        try {
            await axios.put(`/api/admin/categories/edit/${categoryId}`, formData);
            toastr.success("Category updated successfully");
            navigate("/admin/categories");
        } catch {
            toastr.error("Failed to update category");
        }
    };

    return (
        <div className="container my-4">
            <p className="fs-5 text-muted mb-4">
                Manage Categories &gt; <span>Edit Category</span>
            </p>

            <div style={{ padding: "0% 20%" }}>
                <div className="card-body">
                    <form onSubmit={handleSubmit} encType="multipart/form-data">
                        <div className="mb-3">
                            <label className="form-label text-muted">Category Name</label>
                            <input
                                type="text"
                                name="name"
                                className="form-control bg-light"
                                value={category.name}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="mb-3">
                            <label className="form-label text-light">Description</label>
                            <textarea
                                name="description"
                                className="form-control bg-light"
                                rows="3"
                                value={category.description}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <label className="form-label text-muted">Category Image</label>
                                <input
                                    type="file"
                                    className="form-control bg-light"
                                    name="image"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                />
                            </div>
                            {category.image && typeof category.image === "string" && (
                                <div className="col-md-6 mb-3">
                                    <label className="form-label">Current Image</label>
                                    <div>
                                        <img
                                            src={`${backendUrl}${category.image}`}
                                            alt={category.image}
                                            className="img-fluid h-100"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        <button type="submit" className="btn btn-primary">
                            <i className="fas fa-save"></i> Save Changes
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default EditCategory;
