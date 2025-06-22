import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toastr from "toastr";

const AddCategory = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        image: null
    });

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        if (type === "file") {
            setFormData({ ...formData, image: e.target.files[0] });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const formDataToSend = new FormData();
        Object.entries(formData).forEach(([key, value]) => {
            formDataToSend.append(key, value);
        });

        try {
            const response = await fetch("/api/admin/categories/add", {
                method: "POST",
                body: formDataToSend,
            });
            console.log(formDataToSend, "hello");
            const result = await response.json();
            if (response.ok) {
                toastr.success("Category added successfully!");
                navigate("/admin/categories");
            } else {
                toastr.error(result.message || "Failed to add category");
            }
        } catch (error) {
            if (error.response.status === 401) navigate('/unauthorized');
            toastr.error("An error occurred while adding the category");
        }
    };

    return (
        <div className="container my-4">
            <p className="fs-5 text-muted mb-4">
                Manage Categories &gt; <span>Add New Category</span>
            </p>
            <div style={{ padding: "0% 20%" }}>
                <div className="card-body">
                    <form onSubmit={handleSubmit}>
                        <div className="mb-3">
                            <label className="form-label text-muted">Category Name</label>
                            <input
                                type="text"
                                name="name"
                                className="form-control bg-light"
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="mb-3">
                            <label className="form-label text-muted">Description</label>
                            <textarea
                                name="description"
                                className="form-control bg-light"
                                rows="3"
                                value={formData.description}
                                onChange={handleChange}
                            ></textarea>
                        </div>

                        <div className="mb-3">
                            <label className="form-label text-muted">Category Image</label>
                            <input
                                type="file"
                                name="image"
                                className="form-control bg-light"
                                accept="image/*"
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <button type="submit" className="btn btn-primary">
                            <i className="fas fa-save"></i> Add Category
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AddCategory;
