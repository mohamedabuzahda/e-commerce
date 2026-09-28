import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { addToCart } from "../store/cartSlice";
import styles from "../styles/ProductCard.module.css";

// نجوم التقييم: كاملة / نص / فاضية (مثلاً 2.56 → نجمتين ونص)
function Stars({ rating }) {
  return (
    <span className={styles.stars} aria-label={`${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => {
        const part = rating - (i - 1);
        const fill = part >= 0.75 ? 100 : part >= 0.25 ? 50 : 0;
        return (
          <span
            key={i}
            className={styles.star}
            style={{ "--fill": `${fill}%` }}
          >
            ★
          </span>
        );
      })}
    </span>
  );
}

function ProductCard({ product }) {
  const dispatch = useDispatch();
  const stockMap = useSelector((state) => state.cart.stockMap);
  const [liked, setLiked] = useState(false); // شكل القلب بس (اربطيه بالـ Wishlist لاحقاً)

  const remainingStock = stockMap[product.id] ?? product.stock;
  const isOutOfStock = remainingStock <= 0;

  // السعر قبل الخصم (بنحسبه من نسبة الخصم اللي جاية من الـ API)
  const discount = Math.round(product.discountPercentage || 0);
  const oldPrice =
    discount > 0
      ? (product.price / (1 - product.discountPercentage / 100)).toFixed(2)
      : null;

  return (
    <div className={styles.card}>
      <div className={styles.media}>
        {/* الصورة قابلة للضغط */}
        <Link to={`/product/${product.id}`} className={styles.imageWrap}>
          {discount > 0 && <span className={styles.sale}>{discount}% OFF</span>}
          <img
            src={product.thumbnail}
            alt={product.title}
            className={styles.image}
          />
        </Link>

        {/* زرار القلب (برة الـ Link عشان الضغط عليه ميفتحش صفحة المنتج) */}
        <button
          type="button"
          className={`${styles.wish} ${liked ? styles.wishActive : ""}`}
          onClick={() => setLiked((v) => !v)}
          aria-label="Add to wishlist"
          aria-pressed={liked}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill={liked ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8Z" />
          </svg>
        </button>
      </div>

      <div className={styles.info}>
        {/* العنوان قابل للضغط */}
        <Link to={`/product/${product.id}`} className={styles.title}>
          {product.title}
        </Link>

        <p className={styles.brand}>{product.brand || product.category}</p>

        <div className={styles.rating}>
          <Stars rating={product.rating} />
          <span className={styles.ratingNumber}>{product.rating}</span>
        </div>

        <div className={styles.priceRow}>
          <span className={styles.price}>${product.price}</span>
          {oldPrice && <span className={styles.oldPrice}>${oldPrice}</span>}
        </div>

        <span
          className={`${styles.stockPill} ${isOutOfStock ? styles.out : styles.in}`}
        >
          {isOutOfStock ? "Out of stock" : "In stock"}
        </span>

        <button
          className={styles.addBtn}
          onClick={() => dispatch(addToCart(product))}
          disabled={isOutOfStock}
        >
          {/* أيقونة السلة */}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7 18a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm10 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4ZM1 2v2h2l3.6 7.6-1.4 2.4A2 2 0 0 0 7 17h12v-2H7.4l1.1-2h7.5a2 2 0 0 0 1.7-1l3.6-6.5A1 1 0 0 0 20.4 4H5.2l-.9-2H1Z" />
          </svg>
          {isOutOfStock ? "Out of Stock" : "Add to Cart"}
        </button>
      </div>
    </div>
  );
}

export default ProductCard;
