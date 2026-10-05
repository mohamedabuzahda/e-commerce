import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { adminRequest } from "../admin/adminApi";
import { addToCart } from "../store/cartSlice";
import styles from "../styles/ProductDetails.module.css";
import { APPROVED_PRODUCTS_KEY, PUBLISHED_SUBMISSIONS_KEY, readList } from "../data/commerceStore";

function ProductDetails() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();
  const stockMap = useSelector((state) => state.cart.stockMap);

  useEffect(() => {
    setLoading(true);

    const customerProduct = [
      ...readList(PUBLISHED_SUBMISSIONS_KEY),
      ...readList(APPROVED_PRODUCTS_KEY),
    ].find((item) => String(item.id) === id);
    if (customerProduct) {
      setProduct(customerProduct);
      setLoading(false);
      return;
    }

    axios
      .get(`https://dummyjson.com/products/${id}`)
      .then((res) => {
        setProduct(res.data);
        setLoading(false);
      })
      .catch(() => {
        adminRequest(`/api/Products/${id}`)
          .then((response) => {
            const databaseProduct = response?.data || response;
            const images = Array.isArray(databaseProduct.images) ? databaseProduct.images : [];
            setProduct({
              ...databaseProduct,
              title: databaseProduct.title || databaseProduct.name,
              category: typeof databaseProduct.category === "string"
                ? databaseProduct.category
                : databaseProduct.category?.name || databaseProduct.categoryName || "Other",
              stock: databaseProduct.stock ?? databaseProduct.stockQuantity ?? 0,
              thumbnail: databaseProduct.thumbnail || databaseProduct.image || images.find((image) => image.isPrimary)?.imageUrl || images[0]?.imageUrl || "https://placehold.co/600x400?text=Product",
            });
          })
          .catch(() => setProduct(null))
          .finally(() => setLoading(false));
      });
  }, [id]);

  if (loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  if (!product) {
    return <div className={styles.loading}>Product not found</div>;
  }

  const remainingStock = stockMap[product.id] ?? product.stock;
  const isOutOfStock = remainingStock <= 0;

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

          <div className={styles.rating}>
            {"★".repeat(Math.round(product.rating))} {product.rating}
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

          <button
            className={styles.addBtn}
            onClick={() => dispatch(addToCart(product))}
            disabled={isOutOfStock}
          >
            {isOutOfStock ? "Out of Stock" : "Add to Cart"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductDetails;