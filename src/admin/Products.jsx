import { useCallback, useEffect, useState } from "react";
import { adminRequest, collection } from "./adminApi";
import {
    APPROVED_PRODUCTS_KEY,
    readList,
    reviewProductSubmission,
    SUBMISSIONS_KEY,
    subscribeToStore,
    writeList,
} from "../data/commerceStore";
import styles from "./AdminSection.module.css";

function Products() {
    const [submissions, setSubmissions] = useState([]);
    const [approvedProducts, setApprovedProducts] = useState([]);
    const [databaseProducts, setDatabaseProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [databaseError, setDatabaseError] = useState("");
    const [showDatabaseForm, setShowDatabaseForm] = useState(false);
    const [editingDatabaseProduct, setEditingDatabaseProduct] = useState(null);

    const refreshProducts = useCallback(() => {
        setSubmissions(readList(SUBMISSIONS_KEY));
        setApprovedProducts(readList(APPROVED_PRODUCTS_KEY));
    }, []);

    useEffect(() => {
        refreshProducts();
        return subscribeToStore(refreshProducts);
    }, [refreshProducts]);

    async function loadDatabaseProducts() {
        try {
            const [productResponse, categoryResponse] = await Promise.all([
                adminRequest("/api/Products?Page=1&PageSize=100"),
                adminRequest("/api/Category"),
            ]);
            setDatabaseProducts(collection(productResponse));
            setCategories(collection(categoryResponse));
            setDatabaseError("");
        } catch (requestError) {
            setDatabaseError(requestError.message);
        }
    }

    useEffect(() => { loadDatabaseProducts(); }, []);

    function reviewProduct(product, status) {
        reviewProductSubmission(product, status);
    }

    function removeApprovedProduct(productId) {
        writeList(APPROVED_PRODUCTS_KEY, readList(APPROVED_PRODUCTS_KEY).filter((item) => item.id !== productId));
        writeList(SUBMISSIONS_KEY, readList(SUBMISSIONS_KEY).filter((item) => item.id !== productId));
    }

    async function saveDatabaseProduct(event) {
        event.preventDefault();
        const formElement = event.currentTarget;
        const form = new FormData(formElement);
        const payload = {
            name: String(form.get("name") || "").trim(),
            description: String(form.get("description") || "").trim(),
            price: Number(form.get("price")),
            stockQuantity: Number(form.get("stockQuantity")),
            categoryId: String(form.get("categoryId") || ""),
        };

        try {
            const response = editingDatabaseProduct
                ? await adminRequest(`/api/Products/${editingDatabaseProduct.id}`, {
                    method: "PUT",
                    body: JSON.stringify({ id: editingDatabaseProduct.id, ...payload }),
                })
                : await adminRequest("/api/Products", { method: "POST", body: JSON.stringify(payload) });
            const product = response?.data || response;
            const productId = product.id || editingDatabaseProduct?.id;
            const imageUrl = String(form.get("imageUrl") || "").trim();
            if (imageUrl && productId) {
                await adminRequest(`/api/products/${productId}/images`, {
                    method: "POST",
                    body: JSON.stringify({ imageUrl, isPrimary: true }),
                });
            }
            formElement.reset();
            setEditingDatabaseProduct(null);
            setShowDatabaseForm(false);
            await loadDatabaseProducts();
        } catch (requestError) {
            setDatabaseError(requestError.message);
        }
    }

    async function editDatabaseProduct(product) {
        try {
            const response = await adminRequest(`/api/Products/${product.id}`);
            setEditingDatabaseProduct(response?.data || response || product);
            setShowDatabaseForm(true);
        } catch (requestError) {
            setDatabaseError(requestError.message);
        }
    }

    async function deleteDatabaseProduct(productId) {
        try {
            await adminRequest(`/api/Products/${productId}`, { method: "DELETE" });
            setDatabaseProducts((current) => current.filter((product) => product.id !== productId));
        } catch (requestError) {
            setDatabaseError(requestError.message);
        }
    }

    async function deleteProductImage(productId, imageId) {
        try {
            await adminRequest(`/api/products/${productId}/images/${imageId}`, { method: "DELETE" });
            await loadDatabaseProducts();
        } catch (requestError) {
            setDatabaseError(requestError.message);
        }
    }

    async function setPrimaryImage(productId, imageId) {
        try {
            await adminRequest(`/api/products/${productId}/images/${imageId}/primary`, { method: "PUT" });
            await loadDatabaseProducts();
        } catch (requestError) {
            setDatabaseError(requestError.message);
        }
    }

    return (
        <section className={styles.page}>
            <div className={styles.heading}>
                <div>
                    <p className={styles.eyebrow}>Catalog</p>
                    <h1>Product Management</h1>
                    <p className={styles.description}>Review customer products and decide whether to add them to the store.</p>
                </div>
                <div className={styles.rowActions}>
                    <span className={styles.count}>{submissions.filter((item) => item.status === "pending").length} awaiting review</span>
                    <button className={styles.secondaryButton} onClick={refreshProducts}>Refresh</button>
                </div>
            </div>

            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead><tr><th>Product</th><th>Customer</th><th>Price</th><th>Stock</th><th>Status</th><th>Review</th></tr></thead>
                    <tbody>{submissions.length ? submissions.map((product) => (
                        <tr key={product.id}>
                            <td><strong>{product.title}</strong><br />{product.category}</td>
                            <td>{product.ownerName}<br />{product.ownerEmail}</td>
                            <td>${product.price.toFixed(2)}</td>
                            <td>{product.stock}</td>
                            <td>{product.status}</td>
                            <td>{product.status === "pending" ? <div className={styles.rowActions}>
                                <button className={styles.approveButton} onClick={() => reviewProduct(product, "approved")}>Accept</button>
                                <button className={styles.deleteButton} onClick={() => reviewProduct(product, "rejected")}>Reject</button>
                            </div> : "Reviewed"}</td>
                        </tr>
                    )) : <tr><td colSpan="6" className={styles.emptyCell}>No customer products are waiting for review.</td></tr>}</tbody>
                </table>
            </div>

            <div className={styles.heading} style={{ marginTop: 32 }}>
                <div><p className={styles.eyebrow}>Database catalog</p><h2>Products</h2></div>
                <div className={styles.rowActions}><span className={styles.count}>{databaseProducts.length} products</span><button className={styles.primaryButton} onClick={() => { setEditingDatabaseProduct(null); setShowDatabaseForm((visible) => !visible); }}>Add product</button><button className={styles.secondaryButton} onClick={loadDatabaseProducts}>Refresh</button></div>
            </div>
            {databaseError && <p className={styles.errorMessage}>{databaseError}</p>}
            {showDatabaseForm && <form className={styles.formCard} onSubmit={saveDatabaseProduct}>
                <label>Name<input name="name" required defaultValue={editingDatabaseProduct?.name || editingDatabaseProduct?.title || ""} /></label>
                <label>Category<select name="categoryId" required defaultValue={editingDatabaseProduct?.categoryId || editingDatabaseProduct?.category?.id || ""}><option value="" disabled>Select a category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
                <label>Price<input name="price" type="number" min="0.01" step="0.01" required defaultValue={editingDatabaseProduct?.price ?? ""} /></label>
                <label>Stock<input name="stockQuantity" type="number" min="0" step="1" required defaultValue={editingDatabaseProduct?.stockQuantity ?? editingDatabaseProduct?.stock ?? ""} /></label>
                <label>Description<input name="description" required defaultValue={editingDatabaseProduct?.description || ""} /></label>
                <label>Image URL<input name="imageUrl" type="url" placeholder="https://..." /></label>
                <button className={styles.primaryButton}>{editingDatabaseProduct ? "Update product" : "Create product"}</button>
            </form>}
            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Images</th><th>Actions</th></tr></thead>
                    <tbody>{databaseProducts.length ? databaseProducts.map((product) => <tr key={product.id}>
                        <td><strong>{product.name || product.title}</strong></td>
                        <td>{product.category?.name || product.categoryName || "—"}</td>
                        <td>${Number(product.price || 0).toFixed(2)}</td>
                        <td>{product.stockQuantity ?? product.stock ?? 0}</td>
                        <td>{(product.images || []).map((image) => <div key={image.id} className={styles.rowActions}><span>{image.isPrimary ? "Primary" : "Image"}</span>{!image.isPrimary && <button className={styles.secondaryButton} onClick={() => setPrimaryImage(product.id, image.id)}>Set primary</button>}<button className={styles.deleteButton} onClick={() => deleteProductImage(product.id, image.id)}>Remove</button></div>)}</td>
                        <td><div className={styles.rowActions}><button className={styles.secondaryButton} onClick={() => editDatabaseProduct(product)}>Edit</button><button className={styles.deleteButton} onClick={() => deleteDatabaseProduct(product.id)}>Delete</button></div></td>
                    </tr>) : <tr><td colSpan="6" className={styles.emptyCell}>No database products found.</td></tr>}</tbody>
                </table>
            </div>

            <div className={styles.heading} style={{ marginTop: 32 }}>
                <div><p className={styles.eyebrow}>Live catalog</p><h2>Approved products</h2></div>
                <span className={styles.count}>{approvedProducts.length} products</span>
            </div>
            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead><tr><th>Product</th><th>Customer</th><th>Price</th><th>Action</th></tr></thead>
                    <tbody>{approvedProducts.length ? approvedProducts.map((product) => (
                        <tr key={product.id}>
                            <td><strong>{product.title}</strong></td>
                            <td>{product.ownerName}</td>
                            <td>${product.price.toFixed(2)}</td>
                            <td><button className={styles.deleteButton} onClick={() => removeApprovedProduct(product.id)}>Remove</button></td>
                        </tr>
                    )) : <tr><td colSpan="4" className={styles.emptyCell}>No approved customer products yet.</td></tr>}</tbody>
                </table>
            </div>
        </section>
    );
}

export default Products;
