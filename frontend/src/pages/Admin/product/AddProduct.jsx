import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toastr from "toastr";
import "toastr/build/toastr.min.css";

const AddProduct = () => {
    const navigate = useNavigate();

    const [product, setProduct] = useState({
        name: "",
        price: "",
        categoryId: "",
        image: null,
        stock: "",
        description: "",
        brand: "",
    });

    const [categories, setCategories] = useState([]);
    const [attributes, setAttributes] = useState([{ key: "", values: [""] }]);
    const [variants, setVariants] = useState([
        { attributes: {}, price: "", stock: "", image: null },
    ]);

    useEffect(() => {
        axios.get("/api/category")
            .then((res) => setCategories(res.data.categories || []))
            .catch((error) => toastr.error(error?.response?.data?.message));
    }, []);

    const handleChange = (e) => {
        const { name, value, type, files } = e.target;
        setProduct({
            ...product,
            [name]: type === "file" ? files[0] : value,
        });
    };

    const handleAttributeKeyChange = (index, value) => {
        const updated = [...attributes];
        updated[index].key = value;
        setAttributes(updated);
    };

    const handleAttributeValueChange = (attrIndex, valIndex, value) => {
        const updated = [...attributes];
        updated[attrIndex].values[valIndex] = value;
        setAttributes(updated);
    };

    const addAttribute = () => {
        setAttributes([...attributes, { key: "", values: [""] }]);
    };

    const addAttributeValue = (attrIndex) => {
        const updated = [...attributes];
        updated[attrIndex].values.push("");
        setAttributes(updated);
    };

    const removeAttributeValue = (attrIndex, valueIndex) => {
        const updated = [...attributes];
        updated[attrIndex].values.splice(valueIndex, 1);
        if (updated[attrIndex].values.length === 0) {
            updated[attrIndex].values.push("");
        }
        setAttributes(updated);
    };
    const removeAttribute = (index) => {
        const updated = [...attributes];
        updated.splice(index, 1);
        setAttributes(updated.length ? updated : [{ key: "", values: [""] }]);
    };


    const handleVariantChange = (index, field, value) => {
        const updated = [...variants];
        updated[index][field] = value;
        setVariants(updated);
    };

    const handleVariantAttributeChange = (index, key, value) => {
        const updated = [...variants];
        updated[index].attributeValues[key] = value;
        setVariants(updated);
    };

    const addVariant = () => {
        setVariants([
            ...variants,
            { attributeValues: {}, price: "", stock: "", image: null },
        ]);
    };

    const removeVariant = (index) => {
        const updated = [...variants];
        updated.splice(index, 1);
        setVariants(updated.length ? updated : [{ attributeValues: {}, price: "", stock: "", image: null }]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const formData = new FormData();
        for (const key in product) {
            if (key === "image" && product.image instanceof File) {
                formData.append("image", product.image);
            } else {
                formData.append(key, product[key]);
            }
        }

        attributes.forEach(attr => {
            if (attr.key && attr.values.length) {
                formData.append("attributes[]", JSON.stringify(attr));
            }
        });

        variants.forEach((variant, index) => {
            formData.append("variants[]", JSON.stringify({
                attributeValues: variant.attributeValues,
                price: variant.price,
                stock: variant.stock,
            }));
            if (variant.image instanceof File) {
                formData.append(`variants[${index}][image]`, variant.image);
            }
        });

        try {
            await axios.post("/api/admin/products/add", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            toastr.success("Product added successfully!");
            navigate("/admin/products");
        } catch (error) {
            toastr.error(error?.response?.data?.message);
        }
    };

    return (
        <div className="container my-4">
            <p className="fs-5 text-muted">Dashboard &gt; Manage Product &gt; <span>Add Product</span></p>

            <div className="card border-0">
                <div className="card-body">
                    <form onSubmit={handleSubmit} encType="multipart/form-data" className="text-muted">
                        {/* BASIC FIELDS */}
                        <div className="row mb-3">
                            <div className="col-md-4">
                                <label>Name</label>
                                <input type="text" className="form-control bg-light" name="name" value={product.name} onChange={handleChange} required />
                            </div>
                            <div className="col-md-4">
                                <label>Price</label>
                                <input type="number" className="form-control bg-light" name="price" value={product.price} onChange={handleChange} required />
                            </div>
                            <div className="col-md-4">
                                <label>Stock</label>
                                <input type="number" className="form-control bg-light" name="stock" value={product.stock} onChange={handleChange} required />
                            </div>
                        </div>

                        <div className="row mb-3">
                            <div className="col-md-6">
                                <label>Category</label>
                                <select name="categoryId" className="form-select bg-light" value={product.categoryId} onChange={handleChange} required>
                                    <option value="">Select</option>
                                    {categories.map(cat => (
                                        <option key={cat._id} value={cat._id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-md-6">
                                <label>Brand</label>
                                <input type="text" className="form-control bg-light" name="brand" value={product.brand} onChange={handleChange} />
                            </div>
                        </div>

                        <div className="mb-3">
                            <label>Main Image</label>
                            <input type="file" name="image" accept="image/*" className="form-control bg-light" onChange={handleChange} required />
                        </div>

                        <div className="mb-3">
                            <label>Description</label>
                            <textarea name="description" className="form-control bg-light" value={product.description} onChange={handleChange} required />
                        </div>

                        {/* ATTRIBUTE INPUTS */}
                        <div className="mb-3">
                            <label>Attributes</label>
                            {attributes.map((attr, i) => (
                                <div className="mb-2 row" key={i}>
                                    <div className="d-flex align-items-center mb-2 col-4">
                                        <input type="text" placeholder="Key" className="form-control mb-1 bg-light" value={attr.key} onChange={(e) => handleAttributeKeyChange(i, e.target.value)} />
                                    </div>
                                    {attr.values.map((val, j) => (
                                        <div key={j} className="d-flex align-items-center col-3 mb-1">
                                            <input key={j} type="text" className="form-control mb-1 bg-light" placeholder={`Value ${j + 1}`} value={val} onChange={(e) => handleAttributeValueChange(i, j, e.target.value)} />
                                            {j < attr.values.length - 1 && (
                                                <button type="button" className="btn btn-outline-danger btn-sm ms-2" onClick={() => removeAttributeValue(i, j)}><i className="fas fa-trash-alt"></i></button>
                                            )}
                                        </div>
                                    ))}
                                    <div className="d-flex col-3 gap-2 mb-2">
                                        <button type="button" className="btn btn-sm btn-secondary me-2" onClick={() => addAttributeValue(i)}><i className="fas fa-plus"></i></button>
                                        {i < attributes.length - 1 && (
                                            <button type="button" className="btn btn-sm btn-danger" onClick={() => removeAttribute(i)}><i className="fas fa-trash-alt"></i></button>
                                        )}
                                    </div>
                                </div>
                            ))}
                            <button type="button" className="btn btn-primary mt-2" onClick={addAttribute}>+ Add Attribute</button>
                        </div>

                        {/* VARIANT INPUTS */}
                        <div className="mb-3">
                            <label>Variants</label>
                            <p className="text-secondary">Please enter featured variant first <span className="text-danger">*</span></p>
                            {variants.map((variant, i) => (
                                <div key={i} className="border-0 shadow-sm rounded px-2 pb-2 mb-2">
                                    {attributes.map(attr => (
                                        <div key={attr.key} className="mb-2">
                                            <label>{attr.key}</label>
                                            <select className="form-select bg-light" onChange={(e) => handleVariantAttributeChange(i, attr.key, e.target.value)}>
                                                <option value="">Select {attr.key}</option>
                                                {attr.values.map(val => (
                                                    <option key={val} value={val}>{val}</option>
                                                ))}
                                            </select>
                                        </div>
                                    ))}
                                    <input type="number" className="form-control mb-1 bg-light" placeholder="Variant Price" value={variant.price} onChange={(e) => handleVariantChange(i, "price", e.target.value)} />
                                    <input type="number" className="form-control mb-1 bg-light" placeholder="Variant Stock" value={variant.stock} onChange={(e) => handleVariantChange(i, "stock", e.target.value)} />
                                    <input type="file" className="form-control mb-1 bg-light" accept="image/*" onChange={(e) => handleVariantChange(i, "image", e.target.files[0])} />

                                    {/* SHOW REMOVE BUTTON ONLY IF NOT THE LAST VARIANT */}
                                    {i < variants.length - 1 && (
                                        <button type="button" className="btn btn-sm btn-danger" onClick={() => removeVariant(i)}>
                                            Remove Variant
                                        </button>
                                    )}
                                </div>
                            ))}
                            <button type="button" className="btn btn-success mt-2" onClick={addVariant}>+ Add Variant</button>
                        </div>

                        <button type="submit" className="btn btn-primary">
                            <i className="fas fa-save"></i> Create Product
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AddProduct;
