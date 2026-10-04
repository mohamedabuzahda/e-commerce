import { useEffect, useState } from "react";
import { adminRequest, collection } from "./adminApi";
import styles from "./AdminSection.module.css";

function Categories() {
    const [categories, setCategories] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    async function loadCategories() {
        setLoading(true);
        try {
            setCategories(collection(await adminRequest("/api/Category")));
            setError("");
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadCategories();
    }, []);

    async function addCategory(event) {
        event.preventDefault();
        const formElement = event.currentTarget;
        const form = new FormData(formElement);
        try {
            await adminRequest("/api/Category", {
                method: "POST",
                body: JSON.stringify({
                    name: form.get("name"),
                    description: form.get("description"),
                }),
            });
            formElement.reset();
            setShowForm(false);
            await loadCategories();
        } catch (requestError) {
            setError(requestError.message);
        }
    }

    async function deleteCategory(id) {
        try {
            await adminRequest(`/api/Category/${id}`, { method: "DELETE" });
            setCategories((currentCategories) => currentCategories.filter((category) => category.id !== id));
        } catch (requestError) {
            setError(requestError.message);
        }
    }

    return (
        <section className={styles.page}>
            <div className={styles.heading}>
                <div>
                    <p className={styles.eyebrow}>Catalog</p>
                    <h1>Category Management</h1>
                    <p className={styles.description}>Create categories for products and remove unused ones.</p>
                </div>
                <button className={styles.primaryButton} onClick={() => setShowForm((visible) => !visible)}>
                    {showForm ? "Close" : "+ Add Category"}
                </button>
            </div>

            {showForm && <form className={styles.formCard} onSubmit={addCategory}>
                <label>Category name<input name="name" required placeholder="Electronics" /></label>
                <label>Description<input name="description" required placeholder="Category description" /></label>
                <button className={styles.primaryButton}>Save Category</button>
            </form>}

            {error && <p className={styles.errorMessage}>{error}</p>}
            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead><tr><th>Name</th><th>Description</th><th>Actions</th></tr></thead>
                    <tbody>{loading ? <tr><td colSpan="3" className={styles.emptyCell}>Loading categories...</td></tr> : categories.length === 0 ? <tr><td colSpan="3" className={styles.emptyCell}>No categories yet.</td></tr> : categories.map((category) => <tr key={category.id}><td><strong>{category.name}</strong></td><td>{category.description || "-"}</td><td><button className={styles.deleteButton} onClick={() => deleteCategory(category.id)}>Delete</button></td></tr>)}</tbody>
                </table>
            </div>
        </section>
    );
}

export default Categories;
