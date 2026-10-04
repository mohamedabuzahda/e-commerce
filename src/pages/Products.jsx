import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { initStock } from "../store/cartSlice";
import ProductCard from "../components/ProductCard";
import styles from "../styles/Products.module.css";

const PER_PAGE = 12;

function Products() {
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();

  // State
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Search & Filters
  const urlQuery = searchParams.get("q") || "";

  const [search, setSearch] = useState(urlQuery);
  const [category, setCategory] = useState("all");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState("default");
  const [page, setPage] = useState(1);

  // Get all products
  useEffect(() => {
    setLoading(true);
    setError(false);

    axios
      .get("https://dummyjson.com/products?limit=0")
      .then((res) => {
        setAllProducts(res.data.products);
        dispatch(initStock(res.data.products));
      })
      .catch((err) => {
        console.error(err);
        setError(true);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [dispatch]);

  // Update search when URL changes
  useEffect(() => {
    setSearch(urlQuery);
  }, [urlQuery]);

  // Reset pagination when filters change
  useEffect(() => {
    setPage(1);
  }, [search, category, minPrice, maxPrice, inStockOnly, sortBy]);

  // Categories
  const categories = useMemo(
    () => ["all", ...new Set(allProducts.map((p) => p.category))],
    [allProducts],
  );

  // Filtering & Sorting
  const filtered = useMemo(() => {
    const list = allProducts.filter((p) => {
      const matchName = p.title
        .toLowerCase()
        .includes(search.trim().toLowerCase());

      const matchCategory = category === "all" || p.category === category;

      const matchMin = minPrice === "" || p.price >= Number(minPrice);

      const matchMax = maxPrice === "" || p.price <= Number(maxPrice);

      const matchStock = !inStockOnly || p.stock > 0;

      return matchName && matchCategory && matchMin && matchMax && matchStock;
    });

    if (sortBy === "price-asc") {
      list.sort((a, b) => a.price - b.price);
    }

    if (sortBy === "price-desc") {
      list.sort((a, b) => b.price - a.price);
    }

    if (sortBy === "rating") {
      list.sort((a, b) => b.rating - a.rating);
    }

    return list;
  }, [allProducts, search, category, minPrice, maxPrice, inStockOnly, sortBy]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));

  const visible = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  // Clear filters
  const clearFilters = () => {
    setSearch("");
    setCategory("all");
    setMinPrice("");
    setMaxPrice("");
    setInStockOnly(false);
    setSortBy("default");
  };

  if (loading) {
    return <div className={styles.loading}>Loading products...</div>;
  }

  if (error) {
    return (
      <div className={styles.loading}>
        Something went wrong, please try again.
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>Products</h1>

      {/* Categories */}
      <div className={styles.pills}>
        {categories.map((c) => (
          <button
            key={c}
            className={`${styles.pill} ${
              category === c ? styles.pillActive : ""
            }`}
            onClick={() => setCategory(c)}
          >
            {c === "all" ? "All" : c.replace(/-/g, " ")}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.field}>
          <label>Search</label>
          <input
            type="text"
            className={styles.input}
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label>Min $</label>
          <input
            type="number"
            min="0"
            className={styles.input}
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label>Max $</label>
          <input
            type="number"
            min="0"
            className={styles.input}
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label>Sort by</label>

          <select
            className={styles.input}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="default">--</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="rating">Top rated</option>
          </select>
        </div>

        <div className={styles.footerRow}>
          <label className={styles.check}>
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => setInStockOnly(e.target.checked)}
            />
            In stock only
          </label>

          <button className={styles.clearBtn} onClick={clearFilters}>
            Clear filters
          </button>
        </div>
      </div>

      <p className={styles.count}>{filtered.length} products found</p>

      {/* Products */}
      {visible.length === 0 ? (
        <div className={styles.empty}>No products match your search.</div>
      ) : (
        <div className={styles.grid}>
          {visible.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

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
