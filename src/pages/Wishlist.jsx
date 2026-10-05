import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getUserWishlist, subscribeToStore } from "../data/commerceStore";
import ProductCard from "../components/ProductCard";
import styles from "../styles/CustomerPages.module.css";

function Wishlist() {
  const { user } = useAuth();
  const [products, setProducts] = useState(() => getUserWishlist(user.email));

  useEffect(() => {
    const refresh = () => setProducts(getUserWishlist(user.email));
    refresh();
    return subscribeToStore(refresh);
  }, [user.email]);

  return (
    <main className={styles.page}>
      <header className={styles.heading}>
        <div>
          <p className={styles.eyebrow}>Your favorites</p>
          <h1>Wishlist</h1>
          <p>Products you save are collected here.</p>
        </div>
        <span className={styles.count}>{products.length} saved</span>
      </header>

      {products.length ? (
        <div className={styles.productGrid}>
          {products.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      ) : (
        <section className={styles.empty}>
          <h2>Your wishlist is empty</h2>
          <p>Save products with the heart button while browsing the shop.</p>
          <Link to="/products" className={styles.button}>Browse products</Link>
        </section>
      )}
    </main>
  );
}

export default Wishlist;
