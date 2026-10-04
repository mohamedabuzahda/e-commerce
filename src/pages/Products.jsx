import React, { useEffect, useState } from "react";
import axios from "axios";
import { useDispatch } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { initStock } from "../store/cartSlice";
import ProductCard from "../components/ProductCard";
import styles from "../styles/Products.module.css";
import { APPROVED_PRODUCTS_KEY, readList, subscribeToStore } from "../data/commerceStore";

function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [approvedProducts, setApprovedProducts] = useState(() => readList(APPROVED_PRODUCTS_KEY));
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();
  const category = searchParams.get("category");

  const limit = 16; // عدد المنتجات في الصفحة
  const totalPages = Math.max(1, Math.ceil(total / limit));

  useEffect(() => subscribeToStore(() => {
    setApprovedProducts(readList(APPROVED_PRODUCTS_KEY));
  }), []);

  useEffect(() => {
    setLoading(true);

    const matchingApproved = approvedProducts.filter((product) =>
      !category || product.category?.toLowerCase().replaceAll(" ", "-") === category.toLowerCase()
    );
    const offset = (page - 1) * limit;
    const localPage = matchingApproved.slice(offset, offset + limit);
    const remoteSkip = Math.max(0, offset - matchingApproved.length);
    const url = category
      ? `https://dummyjson.com/products/category/${category}?limit=${limit}&skip=${remoteSkip}`
      : `https://dummyjson.com/products?limit=${limit}&skip=${remoteSkip}`;

    axios
      .get(url)
      .then((res) => {
        const remotePage = res.data.products.slice(0, limit - localPage.length);
        const catalog = [...localPage, ...remotePage];
        setProducts(catalog);
        setTotal(res.data.total + matchingApproved.length);
        dispatch(initStock(catalog));
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        const localProducts = localPage;
        setProducts(localProducts);
        setTotal(localProducts.length);
        dispatch(initStock(localProducts));
        setLoading(false);
      });
  }, [page, category, dispatch, approvedProducts]);

  if (loading) {
    return <div className={styles.loading}>Loading products...</div>;
  }

  return (
    <div className={styles.page}>
      <div className={styles.catalogHeading} id="catalog">
        <div>
          <span className={styles.eyebrow}>THE COLLECTION</span>
          <h2>{category ? category.replaceAll("-", " ") : "Popular products"}</h2>
        </div>
        <span className={styles.catalogCount}>{total} thoughtful finds</span>
      </div>

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