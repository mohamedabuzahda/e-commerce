import React from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { addToCart } from "../store/cartSlice";
import styles from "../styles/ProductCard.module.css";

function ProductCard({ product }) {
  const dispatch = useDispatch();
  const stockMap = useSelector((state) => state.cart.stockMap);

  const remainingStock = stockMap[product.id] ?? product.stock;
  const isOutOfStock = remainingStock <= 0;

  return (
    <div className={styles.card}>
      <span className={`${styles.badge} ${isOutOfStock ? styles.out : styles.in}`}>
        {isOutOfStock ? "Out of stock" : "In stock"}
      </span>

      {/* الصورة قابلة للضغط */}
      <Link to={`/product/${product.id}`}>
        <img
          src={product.thumbnail}
          alt={product.title}
          className={styles.image}
        />
      </Link>

      <div className={styles.info}>
        {/* العنوان قابل للضغط */}
        <Link to={`/product/${product.id}`} className={styles.title}>
          {product.title}
        </Link>

        <p className={styles.brand}>{product.brand}</p>

        <div className={styles.rating}>
          {"★".repeat(Math.round(product.rating))}
          <span className={styles.ratingNumber}>{product.rating}</span>
        </div>

        <div className={styles.priceRow}>
          <span className={styles.price}>${product.price}</span>
        </div>

        <button
          className={styles.addBtn}
          onClick={() => dispatch(addToCart(product))}
          disabled={isOutOfStock}
        >
          {isOutOfStock ? "Out of Stock" : "Add to Cart"}
        </button>
      </div>
    </div>
  );
}

export default ProductCard;