import { useCallback, useEffect, useState } from "react";
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

    const refreshProducts = useCallback(() => {
        setSubmissions(readList(SUBMISSIONS_KEY));
        setApprovedProducts(readList(APPROVED_PRODUCTS_KEY));
    }, []);

    useEffect(() => {
        refreshProducts();
        return subscribeToStore(refreshProducts);
    }, [refreshProducts]);

    function reviewProduct(product, status) {
        reviewProductSubmission(product, status);
    }

    function removeApprovedProduct(productId) {
        writeList(APPROVED_PRODUCTS_KEY, readList(APPROVED_PRODUCTS_KEY).filter((item) => item.id !== productId));
        writeList(SUBMISSIONS_KEY, readList(SUBMISSIONS_KEY).filter((item) => item.id !== productId));
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
