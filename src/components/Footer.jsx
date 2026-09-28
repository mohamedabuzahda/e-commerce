import { Link } from "react-router-dom";
import styles from "../styles/Footer.module.css";

function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brandBlock}>
          <Link to="/" className={styles.brand}>ShopEase</Link>
          <p>Thoughtful finds for everyday life.</p>
        </div>

        <nav className={styles.navigation} aria-label="Footer navigation">
          <Link to="/">Home</Link>
          <Link to="/products">Shop</Link>
          <Link to="/cart">Cart</Link>
        </nav>
      </div>

      <div className={styles.bottom}>
        <span>© {new Date().getFullYear()} ShopEase</span>
        <span>Made for the little things.</span>
      </div>
    </footer>
  );
}

export default Footer;
