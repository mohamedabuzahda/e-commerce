import React from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { useLanguage } from "../context/LanguageContext";
import styles from "../styles/Navbar.module.css";

function Navbar() {
  const cart = useSelector((state) => state.cart.items);
  const { lang, changeLanguage } = useLanguage();
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <nav className={styles.navbar}>
      <Link to="/" className={styles.logo}>
        Products App
      </Link>

      <div className={styles.links}>
        <select
          value={lang}
          onChange={(e) => changeLanguage(e.target.value)}
          className={styles.langSelect}
        >
          <option value="en">English</option>
          <option value="ar">العربية</option>
        </select>

        <Link to="/">Products</Link>
        <Link to="/cart">
          Cart{" "}
          {totalItems > 0 && (
            <span className={styles.badge}>{totalItems}</span>
          )}
        </Link>
        <Link to="/register">Register</Link>
        <Link to="/login">Login</Link>
      </div>
    </nav>
  );
}

export default Navbar;