import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import toastr from "toastr";
import "toastr/build/toastr.min.css";

const EditProduct = () => {

    const { productId } = useParams();
    const navigate = useNavigate();

    const [product, setProduct] = useState({
        name: "",
        price: "",
        categoryId: "",
        image: "",
        stock: "",
        description: "",
        brand: "",
    });

    const [categories, setCategories] = useState([]);
    const [attributes, setAttributes] = useState([{ key: "", values: [""] }]);
    const [variants, setVariants] = useState([{ price: "", stock: "", image: null }]);

    useEffect(() => {
        axios.get(`/api/admin/products/edit/${productId}`)
            .then((res) => {
                const { product, categories } = res.data;

                setProduct({
                    name: product.name,
                    price: product.price,
                    categoryId: product.category?._id || product.categoryId || "",
                    image: "",
                    stock: product.stock,
                    description: product.description,
                    brand: product.brand || "",
                });

                const attrs = [];
                if (product.attributes && typeof product.attributes === "object") {
                    for (const [key, values] of Object.entries(product.attributes)) {
                        attrs.push({ key, values });
                    }
                }
                attrs.push({ key: "", values: [""] }); // for adding new attributes
                setAttributes(attrs);

                if (product.variants && product.variants.length > 0) {
                    setVariants(product.variants);
                }

                const sortedCategories = [
                    ...categories.filter(c => c._id === product.categoryId),
                    ...categories.filter(c => c._id !== product.categoryId),
                ];
                setCategories(sortedCategories);
            })
            .catch(() => toastr.error("Error loading product"));
    }, [productId]);

    const handleChange = (e) => {
        const { name, value, type, files } = e.target;
        if (type === "file") {
            setProduct({ ...product, image: files[0] });
        } else {
            setProduct({ ...product, [name]: value });
        }
    };

    const handleAttributeKeyChange = (index, key) => {
        const updated = [...attributes];
        updated[index].key = key;
        setAttributes(updated);
    };

    const handleAttributeValueChange = (index, valueIndex, value) => {
        const updated = [...attributes];
        updated[index].values[valueIndex] = value;
        setAttributes(updated);
    };

    const addAttribute = () => {
        const last = attributes[attributes.length - 1];
        if (!last.key || !last.values[0]) {
            toastr.warning("Fill out the current attribute before adding a new one");
            return;
        }
        setAttributes([...attributes, { key: "", values: [""] }]);
    };

    const addAttributeValue = (index) => {
        const updated = [...attributes];
        updated[index].values.push("");
        setAttributes(updated);
    };

    const removeAttribute = (index) => {
        const updated = [...attributes];
        updated.splice(index, 1);
        setAttributes(updated.length ? updated : [{ key: "", values: [""] }]);
    };

    const removeAttributeValue = (attrIndex, valueIndex) => {
        const updated = [...attributes];
        updated[attrIndex].values.splice(valueIndex, 1);
        if (!updated[attrIndex].values.length) updated[attrIndex].values.push("");
        setAttributes(updated);
    };

    const handleVariantChange = (index, field, value) => {
        const updated = [...variants];
        updated[index][field] = value;
        setVariants(updated);
    };

    const handleVariantAttributeChange = (index, key, value) => {
        const updated = [...variants];
        const currentVariant = updated[index];

        // Merge existing attributes from 'variant.attributes' and 'variant.attributeValues'
        const base = {
            ...(currentVariant.attributes || {}),
            ...(currentVariant.attributeValues || {})
        };

        // Apply the new change
        base[key] = value;

        // Update
        updated[index].attributeValues = base;
        setVariants(updated);
    };

    const addVariant = () => {
        setVariants([...variants, { price: "", stock: "", image: null }]);
    };

    const removeVariant = (index) => {
        const updated = [...variants];
        updated.splice(index, 1);
        setVariants(updated);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append("name", product.name);
        formData.append("price", product.price);
        formData.append("categoryId", product.categoryId);
        formData.append("stock", product.stock);
        formData.append("description", product.description);
        formData.append("brand", product.brand);

        if (product.image instanceof File) {
            formData.append("image", product.image);
        }

        const formattedAttributes = {};
        attributes.forEach(attr => {
            if (attr.key && attr.values.filter(v => v).length > 0) {
                formattedAttributes[attr.key] = attr.values.filter(v => v);
            }
        });
        formData.append("attributes", JSON.stringify(formattedAttributes));

        variants.forEach((variant, index) => {
            formData.append("variants[]", JSON.stringify({
                attributes: variant.attributeValues || variant.attributes,
                price: variant.price,
                stock: variant.stock,
                image: variant.image

            }));
            if (variant.image instanceof File) {
                formData.append(`variants[${index}][image]`, variant.image);
            }
        });

        // formData.append("variants", JSON.stringify(variants));

        try {
            await axios.put(`/api/admin/products/edit/${productId}`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            toastr.success("Product updated");
            navigate("/admin/products");
        } catch {
            if (error.response.status === 401) navigate('/unauthorized');
            toastr.error("Update failed");
        }
    };

    return (
        <div className="container my-4">
            <p className="fs-5 text-muted">Dashboard &gt; Manage Product &gt; <span>Edit Product</span></p>
            <div className="card border-0">
                <div className="card-body">
                    <form onSubmit={handleSubmit} encType="multipart/form-data">
                        <div className="row">
                            <div className="col-md-4 mb-3">
                                <label className="form-label">Name</label>
                                <input type="text" className="form-control" name="name" value={product.name} onChange={handleChange} required />
                            </div>
                            <div className="col-md-4 mb-3">
                                <label className="form-label">Price ($)</label>
                                <input type="number" className="form-control" name="price" value={product.price} onChange={handleChange} required />
                            </div>

                            <div className="col-md-4 mb-3">
                                <label className="form-label">Category</label>
                                <select name="categoryId" className="form-select" value={product.categoryId} onChange={handleChange} required>
                                    <option value="">Select category</option>
                                    {categories.map((cat) => (
                                        <option key={cat._id} value={cat._id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <label className="form-label">Brand</label>
                                <input type="text" className="form-control" name="brand" value={product.brand} onChange={handleChange} />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label className="form-label">Stock</label>
                                <input type="number" className="form-control" name="stock" value={product.stock} onChange={handleChange} required />
                            </div>
                        </div>

                        <div className="mb-3">
                            <label className="form-label">Image</label>
                            <input type="file" className="form-control" name="image" accept="image/*" onChange={handleChange} />
                        </div>

                        <div className="mb-3">
                            <label className="form-label">Description</label>
                            <textarea name="description" className="form-control" rows="3" value={product.description} onChange={handleChange} required />
                        </div>

                        {/* ATTRIBUTE INPUTS */}
                        <div className="mb-3">
                            <label>Attributes</label>
                            {attributes.map((attr, i) => (
                                <div className="mb-2 row" key={i}>
                                    <div className="d-flex align-items-center mb-2 col-4">
                                        <input type="text" placeholder="Key" className="form-control mb-1" value={attr.key} onChange={(e) => handleAttributeKeyChange(i, e.target.value)} />
                                    </div>
                                    {attr.values.map((val, j) => (
                                        <div key={j} className="d-flex align-items-center col-3 mb-1">
                                            <input type="text" className="form-control mb-1" placeholder={`Value ${j + 1}`} value={val} onChange={(e) => handleAttributeValueChange(i, j, e.target.value)} />
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

                        {/* VARIANTS */}
                        <div className="mb-3">
                            <label>Variants</label>
                            <p className="text-secondary">Please enter featured variant first <span className="text-danger">*</span></p>
                            {variants.map((variant, i) => (
                                <div key={i} className="border-0 shadow-sm rounded p-3 mb-3">
                                    {attributes.filter(attr => attr.key).map(attr => (
                                        <div className="mb-2" key={attr.key}>
                                            <label>{attr.key}</label>
                                            <select className="form-select" value={variant.attributeValues?.[attr.key] || variant.attributes?.[attr.key] || ""} onChange={(e) => handleVariantAttributeChange(i, attr.key, e.target.value)}>
                                                <option value="">Select {attr.key}</option>
                                                {attr.values.map(val => <option key={val} value={val}>{val}</option>)}
                                            </select>
                                        </div>
                                    ))}
                                    <input type="number" className="form-control mb-2" placeholder="Variant Price" value={variant.price} onChange={(e) => handleVariantChange(i, "price", e.target.value)} />
                                    <input type="number" className="form-control mb-2" placeholder="Variant Stock" value={variant.stock} onChange={(e) => handleVariantChange(i, "stock", e.target.value)} />
                                    <input type="file" className="form-control mb-2" onChange={(e) => handleVariantChange(i, "image", e.target.files[0])} />
                                    {i < variants.length - 1 && <button type="button" className="btn btn-danger btn-sm" onClick={() => removeVariant(i)}>Remove Variant</button>}
                                </div>
                            ))}
                            <button type="button" className="btn btn-success" onClick={addVariant}>+ Add Variant</button>
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

export default EditProduct;
