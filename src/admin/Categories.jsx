import { useEffect, useState } from "react";
import { adminRequest, collection } from "./adminApi";
import { CATEGORIES_KEY, readList, writeList } from "../data/commerceStore";
import styles from "./AdminSection.module.css";

const categorySlug = (name) => name.toLowerCase().trim().replaceAll(" ", "-");

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
        const name = String(form.get("name") || "").trim();
        const description = String(form.get("description") || "").trim();
        try {
            const createdCategory = await adminRequest("/api/Category", {
                method: "POST",
                body: JSON.stringify({ name, description }),
            });
            const savedCategory = createdCategory?.data || createdCategory || {};
            const localCategory = {
                id: savedCategory.id || `local-${categorySlug(name)}`,
                name: savedCategory.name || name,
                description: savedCategory.description || description,
                slug: categorySlug(savedCategory.name || name),
            };
            writeList(CATEGORIES_KEY, [
                localCategory,
                ...readList(CATEGORIES_KEY).filter((category) => categorySlug(category.name) !== localCategory.slug),
            ]);
            formElement.reset();
            setShowForm(false);
            await loadCategories();
        } catch (requestError) {
            setError(requestError.message);
        }
    }

    async function deleteCategory(id) {
        const deletedCategory = categories.find((category) => category.id === id);
        try {
            await adminRequest(`/api/Category/${id}`, { method: "DELETE" });
            setCategories((currentCategories) => currentCategories.filter((category) => category.id !== id));
            if (deletedCategory) {
                const deletedSlug = categorySlug(deletedCategory.name);
                writeList(CATEGORIES_KEY, readList(CATEGORIES_KEY).filter((category) => categorySlug(category.name) !== deletedSlug));
            }
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
