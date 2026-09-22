import React, { useEffect, useState } from "react";
import axios from "axios";
import { useDispatch } from "react-redux";
import { initStock } from "../store/cartSlice";
import ProductCard from "../components/ProductCard";
import styles from "../styles/Products.module.css";

function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const dispatch = useDispatch();

  const limit = 16; // عدد المنتجات في الصفحة
  const skip = (page - 1) * limit;
  const totalPages = Math.ceil(total / limit);

  useEffect(() => {
    setLoading(true);

    axios
      .get(`https://dummyjson.com/products?limit=${limit}&skip=${skip}`)
      .then((res) => {
        setProducts(res.data.products);
        setTotal(res.data.total);
        dispatch(initStock(res.data.products));
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [page, dispatch]);

  if (loading) {
    return <div className={styles.loading}>Loading products...</div>;
  }

  return (
    <div className={styles.page}>
      <p className={styles.welcome}>
        Welcome to our shopping website, start browsing...
      </p>

      <div className={styles.grid}>
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {/* Pagination */}
      <div className={styles.pagination}>
        <button
          onClick={() => setPage((p) => Math.max(p - 1, 1))}
          disabled={page === 1}
          className={styles.pageBtn}
        >
          Previous
        </button>

        <span className={styles.pageInfo}>
          Page {page} of {totalPages}
        </span>

        <button
          onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
          disabled={page === totalPages}
          className={styles.pageBtn}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default Products;