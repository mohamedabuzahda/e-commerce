import React from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { FiChevronDown, FiShoppingCart } from "react-icons/fi";
import { useLanguage } from "../context/LanguageContext";
import styles from "../styles/Navbar.module.css";

function LanguageFlag({ language }) {
  return (
    <svg className={styles.languageFlag} viewBox="0 0 24 16" aria-hidden="true">
      {language === "en" ? (
        <>
          <rect width="24" height="16" fill="#012169" />
          <path d="M0 0 24 16M24 0 0 16" stroke="#fff" strokeWidth="4" />
          <path d="M0 0 24 16M24 0 0 16" stroke="#c8102e" strokeWidth="1.5" />
          <path d="M12 0v16M0 8h24" stroke="#fff" strokeWidth="6" />
          <path d="M12 0v16M0 8h24" stroke="#c8102e" strokeWidth="3" />
        </>
      ) : (
        <>
          <rect width="24" height="16" rx="1" fill="#006c35" />
          <text x="12" y="6.5" textAnchor="middle" fill="#fff" fontSize="2.2" direction="rtl">لا إله إلا الله</text>
          <path d="M6 10.5h12" stroke="#fff" strokeWidth="0.8" />
          <path d="M8 12h8" stroke="#fff" strokeWidth="0.7" />
        </>
      )}
    </svg>
  );
}

function Navbar() {
  const cart = useSelector((state) => state.cart.items);
  const { lang, changeLanguage } = useLanguage();
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <nav className={styles.navbar}>
      <Link to="/" className={styles.logo}>
        ShopEase
      </Link>

      <div className={styles.links}>
        <Link to="/" className={styles.textLink}>Home</Link>
        <Link to="/products" className={styles.textLink}>Shop</Link>
        <Link to="/cart" className={styles.iconLink} aria-label={`Cart${totalItems ? `, ${totalItems} items` : ""}`} title="Cart">
          <FiShoppingCart aria-hidden="true" />
          {totalItems > 0 && <span className={styles.badge}>{totalItems}</span>}
        </Link>
        <details className={styles.languageMenu}>
          <summary
            className={styles.languageTrigger}
            aria-label={`Select language. Current: ${lang === "en" ? "English" : "العربية"}`}
            title="Select language"
          >
            <LanguageFlag language={lang} />
            <FiChevronDown className={styles.dropdownCaret} aria-hidden="true" />
          </summary>
          <div className={styles.languageOptions}>
            <button
              type="button"
              className={`${styles.languageOption} ${lang === "en" ? styles.selectedLanguage : ""}`}
              onClick={(event) => {
                changeLanguage("en");
                event.currentTarget.closest("details").open = false;
              }}
            >
              <LanguageFlag language="en" />
              English
            </button>
            <button
              type="button"
              className={`${styles.languageOption} ${lang === "ar" ? styles.selectedLanguage : ""}`}
              onClick={(event) => {
                changeLanguage("ar");
                event.currentTarget.closest("details").open = false;
              }}
            >
              <LanguageFlag language="ar" />
              العربية
            </button>
          </div>
        </details>
      </div>
    </nav>
  );
}

export default Navbar;