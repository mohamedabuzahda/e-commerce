import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  APPROVED_PRODUCTS_KEY,
  PUBLISHED_SUBMISSIONS_KEY,
  readList,
  SUBMISSIONS_KEY,
  subscribeToStore,
} from "../data/commerceStore";
import styles from "../styles/CustomerPages.module.css";

function SellerDashboard() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const refresh = () => {
      const ownedProducts = [
        ...readList(SUBMISSIONS_KEY),
        ...readList(APPROVED_PRODUCTS_KEY),
        ...readList(PUBLISHED_SUBMISSIONS_KEY),
      ].filter((product) => product.ownerEmail?.toLowerCase() === user.email.toLowerCase());
      setProducts([...new Map(ownedProducts.map((product) => [String(product.id), product])).values()]);
    };
    refresh();
    return subscribeToStore(refresh);
  }, [user.email]);

  return (
    <main className={styles.page}>
      <header className={styles.heading}>
        <div>
          <p className={styles.eyebrow}>Vendor workspace</p>
          <h1>Seller dashboard</h1>
          <p>Manage your product submissions and review their approval status.</p>
        </div>
        <Link className={styles.button} to="/customer">Add a product</Link>
      </header>

      <section className={styles.panel}>
        <div className={styles.sectionHeading}>
          <h2>Your listings</h2>
          <Link to="/seller/orders">View orders</Link>
        </div>
        {products.length ? (
          <div className={styles.sellerProducts}>
            {products.map((product) => (
              <article className={styles.sellerProduct} key={product.id}>
                {product.thumbnail && <img src={product.thumbnail} alt="" />}
                <div>
                  <strong>{product.title || product.name}</strong>
                  <span>{product.category || "Other"} · ${Number(product.price || 0).toFixed(2)}</span>
                </div>
                <span className={styles.status}>{product.status || "Published"}</span>
                <span>Stock: {Number(product.stock ?? product.stockQuantity ?? 0)}</span>
              </article>
            ))}
          </div>
        ) : (
          <div className={styles.empty}>
            <p>You have not listed any products yet.</p>
            <Link className={styles.button} to="/customer">Create your first listing</Link>
          </div>
        )}
      </section>
      <p className={styles.notice}>
        Seller listings and inventory changes currently use this browser’s local storage. Shared listing and payout tools require the store API to provide seller endpoints.
      </p>
    </main>
  );
}

export default SellerDashboard;
