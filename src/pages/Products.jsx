import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useDispatch } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { FiSearch, FiX } from "react-icons/fi";
import { adminRequest, collection } from "../admin/adminApi";
import { initStock } from "../store/cartSlice";
import ProductCard from "../components/ProductCard";
import styles from "../styles/Products.module.css";
import { APPROVED_PRODUCTS_KEY, PUBLISHED_SUBMISSIONS_KEY, readList, subscribeToStore } from "../data/commerceStore";

const normalizeCategory = (value = "") => value.toLowerCase().trim().replaceAll(" ", "-");

function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [approvedProducts, setApprovedProducts] = useState(() => readList(APPROVED_PRODUCTS_KEY));
  const [publishedSubmissions, setPublishedSubmissions] = useState(() => readList(PUBLISHED_SUBMISSIONS_KEY));
  const [searchParams, setSearchParams] = useSearchParams();
  const dispatch = useDispatch();
  const category = searchParams.get("category") || "";
  const search = searchParams.get("search") || "";
  const sort = searchParams.get("sort") || "featured";
  const priceRange = searchParams.get("price") || "";
  const page = Math.max(1, Number(searchParams.get("page")) || 1);

  const limit = 16; // عدد المنتجات في الصفحة

  useEffect(() => subscribeToStore(() => {
    setApprovedProducts(readList(APPROVED_PRODUCTS_KEY));
    setPublishedSubmissions(readList(PUBLISHED_SUBMISSIONS_KEY));
  }), []);

  useEffect(() => {
    Promise.allSettled([
      axios.get("https://dummyjson.com/products?limit=0"),
      adminRequest("/api/Products?Page=1&PageSize=100"),
    ])
      .then(([demoResult, databaseResult]) => {
        const demoProducts = demoResult.status === "fulfilled" ? demoResult.value.data.products : [];
        const databaseProducts = databaseResult.status === "fulfilled"
          ? collection(databaseResult.value).map((product) => {
              const images = Array.isArray(product.images) ? product.images : [];
              const categoryName = typeof product.category === "string"
                ? product.category
                : product.category?.name || product.categoryName || "Other";
              return {
                ...product,
                title: product.title || product.name,
                category: categoryName,
                stock: product.stock ?? product.stockQuantity ?? 0,
                thumbnail: product.thumbnail || product.image || images.find((image) => image.isPrimary)?.imageUrl || images[0]?.imageUrl || "https://placehold.co/600x400?text=Product",
              };
            })
          : [];
        const catalogById = new Map(
          [...demoProducts, ...databaseProducts, ...publishedSubmissions, ...approvedProducts]
            .map((product) => [String(product.id), product])
        );
        const catalog = [...catalogById.values()];
        setProducts(catalog);
        dispatch(initStock(catalog));
        setLoading(false);
      });
  }, [dispatch, approvedProducts, publishedSubmissions]);

  const categoryOptions = useMemo(
    () => [...new Set(products.map((product) => product.category).filter(Boolean))].sort(),
    [products]
  );

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    const matching = products.filter((product) => {
      const matchesCategory = !category || normalizeCategory(product.category) === category;
      const price = Number(product.price);
      const matchesPrice = !priceRange
        || (priceRange === "under-25" && price < 25)
        || (priceRange === "25-100" && price >= 25 && price < 100)
        || (priceRange === "100-500" && price >= 100 && price < 500)
        || (priceRange === "500-plus" && price >= 500);
      const searchableText = [product.title, product.brand, product.category, product.description]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return matchesCategory && matchesPrice && (!query || searchableText.includes(query));
    });

    if (sort === "price-asc") return matching.sort((a, b) => a.price - b.price);
    if (sort === "price-desc") return matching.sort((a, b) => b.price - a.price);
    if (sort === "rating") return matching.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    if (sort === "name") return matching.sort((a, b) => a.title.localeCompare(b.title));
    return matching;
  }, [products, search, category, priceRange, sort]);

  const total = filteredProducts.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const visibleProducts = filteredProducts.slice((page - 1) * limit, page * limit);

  const updateFilter = (key, value) => {
    const nextParams = new URLSearchParams(searchParams);
    if (value) nextParams.set(key, value);
    else nextParams.delete(key);
    if (key !== "page") nextParams.delete("page");
    setSearchParams(nextParams);
  };

  const submitSearch = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    updateFilter("search", String(formData.get("search") || "").trim());
  };

  const clearFilters = () => {
    setSearchParams({});
  };

  if (loading) {
    return <div className={styles.loading}>Loading products...</div>;
  }

  return (
    <div className={styles.page}>
      <div className={styles.catalogHeading} id="catalog">
        <div>
          <span className={styles.eyebrow}>THE COLLECTION</span>
          <h2>{search ? `Results for “${search}”` : category ? category.replaceAll("-", " ") : "Popular products"}</h2>
        </div>
        <span className={styles.catalogCount}>{total} {total === 1 ? "product" : "products"}</span>
      </div>

      <section className={styles.filters} aria-label="Search and filter products">
        <form className={styles.searchForm} role="search" onSubmit={submitSearch}>
          <input
            key={search}
            name="search"
            type="search"
            aria-label="Search products"
            placeholder="Search products, brands..."
            defaultValue={search}
          />
          <button type="submit" aria-label="Search products" title="Search">
            <FiSearch aria-hidden="true" />
          </button>
        </form>

        <select
          aria-label="Filter by category"
          value={category}
          onChange={(event) => updateFilter("category", event.target.value)}
        >
          <option value="">All categories</option>
          {categoryOptions.map((item) => (
            <option key={item} value={normalizeCategory(item)}>{item}</option>
          ))}
        </select>

        <select
          aria-label="Sort products"
          value={sort}
          onChange={(event) => updateFilter("sort", event.target.value === "featured" ? "" : event.target.value)}
        >
          <option value="featured">Featured</option>
          <option value="price-asc">Price: low to high</option>
          <option value="price-desc">Price: high to low</option>
          <option value="rating">Top rated</option>
          <option value="name">Name: A to Z</option>
        </select>

        <select
          aria-label="Filter by price"
          value={priceRange}
          onChange={(event) => updateFilter("price", event.target.value)}
        >
          <option value="">Any price</option>
          <option value="under-25">Under $25</option>
          <option value="25-100">$25–$99.99</option>
          <option value="100-500">$100–$499.99</option>
          <option value="500-plus">$500 and up</option>
        </select>

        {(search || category || priceRange || sort !== "featured") && (
          <button type="button" className={styles.clearButton} onClick={clearFilters}>
            <FiX aria-hidden="true" /> Clear
          </button>
        )}
      </section>

      {visibleProducts.length > 0 ? (
      <div className={styles.grid}>
        {visibleProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
      ) : (
        <div className={styles.emptyState}>
          <h3>No products found</h3>
          <p>Try another search or clear your filters.</p>
          <button type="button" className={styles.clearButton} onClick={clearFilters}>Clear filters</button>
        </div>
      )}

      {totalPages > 1 && <div className={styles.pagination}>
        <button
          onClick={() => updateFilter("page", String(Math.max(page - 1, 1)))}
          disabled={page === 1}
          className={styles.pageBtn}
        >
          Previous
        </button>

        <span className={styles.pageInfo}>
          Page {page} of {totalPages}
        </span>

        <button
          onClick={() => updateFilter("page", String(Math.min(page + 1, totalPages)))}
          disabled={page === totalPages}
          className={styles.pageBtn}
        >
          Next
        </button>
      </div>}
    </div>
  );
}

export default Products;