import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  APPROVED_PRODUCTS_KEY,
  ORDERS_KEY,
  readList,
  submitProductForReview,
  SUBMISSIONS_KEY,
  subscribeToStore,
  writeList,
} from "../data/commerceStore";
import styles from "./Customer.module.css";

function Profile() {
  const { user } = useAuth();
  const location = useLocation();
  const [submissions, setSubmissions] = useState([]);
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(location.state?.orderPlaced ? "Your order was placed." : "");

  useEffect(() => {
    const refresh = () => {
      setSubmissions(readList(SUBMISSIONS_KEY).filter((item) => item.ownerEmail === user.email));
      setOrders(readList(ORDERS_KEY).filter((order) => order.customerEmail === user.email));
    };
    refresh();
    return subscribeToStore(refresh);
  }, [user.email]);

  function submitProduct(event) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const product = {
      id: `customer-${Date.now()}`,
      ownerId: user.id || user.email,
      ownerName: user.name,
      ownerEmail: user.email,
      title: form.get("title").trim(),
      description: form.get("description").trim(),
      category: form.get("category").trim(),
      price: Number(form.get("price")),
      stock: Number(form.get("stock")),
      thumbnail: form.get("image").trim() || "https://placehold.co/600x400?text=Product",
    };

    try {
      submitProductForReview(product);
      formElement.reset();
      setError("");
      setSuccess("Your product was sent to the admin for review.");
    } catch {
      setError("The product could not be saved. Please try again.");
    }
  }

  function deleteProduct(product) {
    writeList(SUBMISSIONS_KEY, readList(SUBMISSIONS_KEY).filter((item) => item.id !== product.id));
    writeList(APPROVED_PRODUCTS_KEY, readList(APPROVED_PRODUCTS_KEY).filter((item) => item.id !== product.id));
  }

  return (
    <main className={styles.page}>
      <header className={styles.heading}>
        <div><h1>Product Management</h1><p>Welcome, {user.name}. Submit products for admin review and manage your orders.</p></div>
      </header>

      <section className={styles.section}>
        <h2>Add a product for review</h2>
        <form className={styles.form} onSubmit={submitProduct}>
          <label className={styles.field}>Product name<input name="title" required maxLength="100" /></label>
          <label className={styles.field}>Category<input name="category" required maxLength="60" /></label>
          <label className={styles.field}>Price<input name="price" type="number" min="0.01" step="0.01" required /></label>
          <label className={styles.field}>Available stock<input name="stock" type="number" min="1" step="1" required /></label>
          <label className={styles.field}>Image URL<input name="image" type="url" placeholder="https://..." /></label>
          <label className={`${styles.field} ${styles.wide}`}>Description<textarea name="description" required maxLength="1000" /></label>
          <div className={styles.wide}>
            {error && <p className={styles.error}>{error}</p>}
            {success && <p className={styles.success}>{success}</p>}
            <button className={styles.button} type="submit">Submit for review</button>
          </div>
        </form>
      </section>

      <section className={styles.section}>
        <h2>My product submissions</h2>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead><tr><th>Product</th><th>Price</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>{submissions.length ? submissions.map((product) => (
              <tr key={product.id}>
                <td><strong>{product.title}</strong><br /><span className={styles.muted}>{product.category}</span></td>
                <td>${product.price.toFixed(2)}</td>
                <td><span className={`${styles.status} ${product.status === "approved" ? styles.statusApproved : product.status === "rejected" ? styles.statusRejected : ""}`}>{product.status}</span></td>
                <td><button className={styles.dangerButton} type="button" onClick={() => deleteProduct(product)}>Delete</button></td>
              </tr>
            )) : <tr><td colSpan="4" className={styles.muted}>You have not submitted any products.</td></tr>}</tbody>
          </table>
        </div>
      </section>

      <section className={styles.section}>
        <h2>My orders</h2>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead><tr><th>Order</th><th>Date</th><th>Items</th><th>Total</th><th>Status</th></tr></thead>
            <tbody>{orders.length ? orders.map((order) => (
              <tr key={order.id}>
                <td><strong>{order.id}</strong></td>
                <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                <td>{order.items.reduce((count, item) => count + item.quantity, 0)}</td>
                <td>${order.total.toFixed(2)}</td>
                <td><span className={`${styles.status} ${order.status === "Delivered" ? styles.statusApproved : order.status === "Cancelled" ? styles.statusCancelled : ""}`}>{order.status}</span></td>
              </tr>
            )) : <tr><td colSpan="5" className={styles.muted}>No orders yet.</td></tr>}</tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

export default Profile;
