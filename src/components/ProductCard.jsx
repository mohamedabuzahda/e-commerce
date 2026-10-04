import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { addToCart } from "../store/cartSlice";
import styles from "../styles/ProductCard.module.css";

function ProductCard({ product }) {
  const dispatch = useDispatch();
  const stockMap = useSelector((state) => state.cart.stockMap);
  const remainingStock = stockMap[product.id] ?? product.stock;
  const isOutOfStock = remainingStock <= 0;
  const rating = Number(product.rating) || 0;

  return (
    <div className={styles.card}>
      <span className={`${styles.badge} ${isOutOfStock ? styles.out : styles.in}`}>
        {isOutOfStock ? "Out of stock" : "In stock"}
      </span>

      <Link to={`/product/${product.id}`}>
        <img src={product.thumbnail} alt={product.title} className={styles.image} />
      </Link>

      <div className={styles.info}>
        <Link to={`/product/${product.id}`} className={styles.title}>
          {product.title}
        </Link>

        <p className={styles.brand}>{product.brand || product.category}</p>

        <div className={styles.rating} aria-label={`${rating} out of 5`}>
          {"★".repeat(Math.round(rating))}
          <span className={styles.ratingNumber}>{rating.toFixed(1)}</span>
        </div>

        <div className={styles.priceRow}>
          <span className={styles.price}>${product.price}</span>
        </div>

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
