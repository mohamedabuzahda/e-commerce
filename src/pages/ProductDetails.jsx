import React, { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { adminRequest } from "../admin/adminApi";
import { useAuth } from "../context/AuthContext";
import { addToCart } from "../store/cartSlice";
import styles from "../styles/ProductDetails.module.css";
import {
  APPROVED_PRODUCTS_KEY,
  isProductInWishlist,
  PUBLISHED_SUBMISSIONS_KEY,
  readList,
  readProductReviews,
  saveProductReview,
  subscribeToStore,
  toggleWishlistProduct,
} from "../data/commerceStore";

function normalizeProduct(product) {
  const images = Array.isArray(product.images) ? product.images : [];
  return {
    ...product,
    title: product.title || product.name,
    category: typeof product.category === "string"
      ? product.category
      : product.category?.name || product.categoryName || "Other",
    stock: product.stock ?? product.stockQuantity ?? 0,
    rating: Number(product.rating?.rate ?? product.rating) || 0,
    ratingCount: Number(product.rating?.count ?? product.ratingCount) || 0,
    thumbnail: product.thumbnail
      || product.image
      || images.find((image) => image.isPrimary)?.imageUrl
      || images[0]?.imageUrl
      || "https://placehold.co/600x400?text=Product",
  };
}

function ProductDetails() {
  const { id } = useParams();
  const [remoteProduct, setRemoteProduct] = useState(null);
  const [loadedProductId, setLoadedProductId] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [reviewMessage, setReviewMessage] = useState("");
  const dispatch = useDispatch();
  const stockMap = useSelector((state) => state.cart.stockMap);
  const { user } = useAuth();
  const subscribe = useCallback((onStoreChange) => subscribeToStore(onStoreChange), []);
  const getSnapshot = useCallback(
    () => {
      const customerProduct = [
        ...readList(PUBLISHED_SUBMISSIONS_KEY),
        ...readList(APPROVED_PRODUCTS_KEY),
      ].find((item) => String(item.id) === id);

      return JSON.stringify({
        reviews: readProductReviews(id),
        saved: isProductInWishlist(id, user?.email),
        customerProduct: customerProduct ? normalizeProduct(customerProduct) : null,
      });
    },
    [id, user?.email]
  );
  const snapshot = useSyncExternalStore(
    subscribe,
    getSnapshot,
    () => JSON.stringify({ reviews: [], saved: false })
  );
  const { reviews, saved, customerProduct } = JSON.parse(snapshot);
  const customerProductId = customerProduct?.id;
  const product = customerProduct || (loadedProductId === id ? remoteProduct : null);
  const loading = !customerProduct && loadedProductId !== id;

  useEffect(() => {
    if (customerProductId) return;

    axios
      .get(`https://dummyjson.com/products/${id}`)
      .then((res) => {
        setRemoteProduct(normalizeProduct(res.data));
        setLoadedProductId(id);
      })
      .catch(() => {
        adminRequest(`/api/Products/${id}`)
          .then((response) => {
            const databaseProduct = response?.data || response;
            setRemoteProduct(normalizeProduct(databaseProduct));
          })
          .catch(() => setRemoteProduct(null))
          .finally(() => setLoadedProductId(id));
      });
  }, [id, customerProductId]);

  if (loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  if (!product) {
    return <div className={styles.loading}>Product not found</div>;
  }

  const remainingStock = stockMap[product.id] ?? product.stock;
  const isOutOfStock = remainingStock <= 0;
  const averageRating = reviews.length
    ? reviews.reduce((total, review) => total + review.rating, 0) / reviews.length
    : product.rating;

  function submitReview(event) {
    event.preventDefault();
    if (!user) {
      setReviewMessage("Sign in to leave a review.");
      return;
    }
    if (reviewText.trim().length < 5) {
      setReviewMessage("Please write at least 5 characters.");
      return;
    }

    try {
      saveProductReview({
        productId: product.id,
        productTitle: product.title,
        customerName: user.name,
        customerEmail: user.email,
        rating: reviewRating,
        comment: reviewText.trim(),
      });
      setReviewText("");
      setReviewMessage("Your review has been saved.");
    } catch (error) {
      setReviewMessage(error.message);
    }
  }

  return (
    <div className={styles.page}>
      <Link to="/products" className={styles.back}>
        ← Back to Products
      </Link>

      <div className={styles.container}>
        <img
          src={product.thumbnail}
          alt={product.title}
          className={styles.image}
        />

        <div className={styles.info}>
          <h1>{product.title}</h1>
          <p className={styles.brand}>{product.brand}</p>
          <p className={styles.category}>{product.category}</p>

          <div className={styles.rating} aria-label={`${averageRating.toFixed(1)} out of 5`}>
            {"★".repeat(Math.round(averageRating))} {averageRating.toFixed(1)}
            {reviews.length > 0 && <span> ({reviews.length} reviews)</span>}
          </div>

          <p className={styles.price}>${product.price}</p>

          <p className={styles.stock}>
            {isOutOfStock ? (
              <span className={styles.out}>Out of stock</span>
            ) : (
              <span className={styles.in}>
                In stock ({remainingStock} available)
              </span>
            )}
          </p>

          <p className={styles.description}>{product.description}</p>

          <div className={styles.actions}>
            <button
              className={styles.addBtn}
              onClick={() => dispatch(addToCart(product))}
              disabled={isOutOfStock}
            >
              {isOutOfStock ? "Out of Stock" : "Add to Cart"}
            </button>
            {user && (
              <button
                type="button"
                className={styles.favoriteBtn}
                aria-pressed={saved}
                onClick={() => setSaved(toggleWishlistProduct(product, user.email))}
              >
                {saved ? "♥ Saved" : "♡ Save to wishlist"}
              </button>
            )}
          </div>
        </div>
      </div>

      <section className={styles.reviews}>
        <h2>Customer reviews</h2>
        {reviews.length ? reviews.map((review) => (
          <article className={styles.review} key={review.id}>
            <div className={styles.reviewHeading}>
              <strong>{review.customerName}</strong>
              <span aria-label={`${review.rating} out of 5 stars`}>
                {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
              </span>
            </div>
            <p>{review.comment}</p>
            <time dateTime={review.createdAt}>{new Date(review.createdAt).toLocaleDateString()}</time>
          </article>
        )) : <p>No reviews yet. Be the first to review this product.</p>}

        <form className={styles.reviewForm} onSubmit={submitReview}>
          <h3>Write a review</h3>
          {user ? (
            <>
              <label>
                Your rating
                <select
                  value={reviewRating}
                  onChange={(event) => setReviewRating(Number(event.target.value))}
                >
                  {[5, 4, 3, 2, 1].map((rating) => (
                    <option key={rating} value={rating}>{rating} star{rating === 1 ? "" : "s"}</option>
                  ))}
                </select>
              </label>
              <label>
                Review
                <textarea
                  value={reviewText}
                  onChange={(event) => setReviewText(event.target.value)}
                  minLength={5}
                  maxLength={1000}
                  required
                  placeholder="What did you think of this product?"
                />
              </label>
              <button type="submit" className={styles.addBtn}>Submit review</button>
            </>
          ) : <p>Sign in to submit a review.</p>}
          {reviewMessage && <p role="status">{reviewMessage}</p>}
        </form>
      </section>
    </div>
  );
}

export default ProductDetails;