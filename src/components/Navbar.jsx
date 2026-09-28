import React, { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useLanguage } from "../context/LanguageContext";
import styles from "../styles/Navbar.module.css";

function Navbar() {
  const cart = useSelector((state) => state.cart.items);
  const { lang, changeLanguage } = useLanguage();
  const navigate = useNavigate();
  const [term, setTerm] = useState("");

  // مجموع الكميات اللي في السلة (بيظهر في الدايرة الصغيرة)
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  // البحث من النافبار: بنروح لصفحة المنتجات ونبعت الكلمة في الرابط (?q=...)
  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/?q=${encodeURIComponent(term.trim())}`);
  };

  const linkClass = ({ isActive }) =>
    `${styles.link} ${isActive ? styles.active : ""}`;

  return (
    <nav className={styles.navbar}>
      {/* ===== اللوجو ===== */}
      <Link to="/" className={styles.logo}>
        Nova<span>Market</span>
      </Link>

      {/* ===== اللينكات ===== */}
      <div className={styles.links}>
        <NavLink to="/" end className={linkClass}>
          Products
        </NavLink>
      </div>

      {/* ===== بحث النافبار ===== */}
      <form className={styles.searchForm} onSubmit={handleSearch}>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Search products..."
          value={term}
          onChange={(e) => setTerm(e.target.value)}
        />
      </form>

      {/* ===== اللغة + السلة + الحساب ===== */}
      <div className={styles.actions}>
        <button
          className={styles.langBtn}
          onClick={() => changeLanguage(lang === "en" ? "ar" : "en")}
        >
          {/* أيقونة الكرة الأرضية */}
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20" />
          </svg>
          {lang === "en" ? "AR" : "EN"}
        </button>

        <Link to="/cart" className={styles.cartLink} aria-label="Cart">
          {/* أيقونة السلة */}
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7 18a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm10 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4ZM1 2v2h2l3.6 7.6-1.4 2.4A2 2 0 0 0 7 17h12v-2H7.4l1.1-2h7.5a2 2 0 0 0 1.7-1l3.6-6.5A1 1 0 0 0 20.4 4H5.2l-.9-2H1Z" />
          </svg>
          {totalItems > 0 && <span className={styles.badge}>{totalItems}</span>}
        </Link>

        <Link to="/login" className={styles.loginBtn}>
          Login
        </Link>
        <Link to="/register" className={styles.registerBtn}>
          Register
        </Link>
      </div>
    </nav>
  );
}

export default Navbar;
