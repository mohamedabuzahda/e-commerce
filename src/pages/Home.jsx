import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { FiSearch } from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import { adminRequest, collection } from "../admin/adminApi";
import {
  APPROVED_PRODUCTS_KEY,
  BANNERS_KEY,
  CATEGORIES_KEY,
  PUBLISHED_SUBMISSIONS_KEY,
  readList,
  subscribeToStore,
} from "../data/commerceStore";
import styles from "../styles/Home.module.css";

const slugify = (value) => value.toLowerCase().trim().replaceAll(" ", "-");

function normalizeCategories(items) {
  const uniqueCategories = new Map();

  items.forEach((item) => {
    const name = typeof item === "string" ? item : item?.name || item?.title;
    if (!name) return;

    const slug = typeof item === "object" && item.slug ? item.slug : slugify(name);
    if (!uniqueCategories.has(slug)) uniqueCategories.set(slug, { slug, name });
  });

  return [...uniqueCategories.values()];
}

const Home = () => {
  const [featuredProduct, setFeaturedProduct] = useState(null);
  const [builtInCategories, setBuiltInCategories] = useState([]);
  const [adminCategories, setAdminCategories] = useState([]);
  const [banners, setBanners] = useState(() => readList(BANNERS_KEY));
  const [savedCategories, setSavedCategories] = useState(() => readList(CATEGORIES_KEY));
  const [customerProducts, setCustomerProducts] = useState(() => [
    ...readList(PUBLISHED_SUBMISSIONS_KEY),
    ...readList(APPROVED_PRODUCTS_KEY),
  ]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const navigate = useNavigate();
  const categories = useMemo(
    () => normalizeCategories([
      ...builtInCategories,
      ...adminCategories,
      ...savedCategories,
      ...customerProducts.map((product) => product.category),
    ]),
    [builtInCategories, adminCategories, savedCategories, customerProducts]
  );
  const activeBanner = banners[0];

  useEffect(() => {
    axios
      .get("https://dummyjson.com/products?limit=1")
      .then((response) => setFeaturedProduct(response.data.products[0]))
      .catch(() => setFeaturedProduct(null));

    axios
      .get("https://dummyjson.com/products/categories")
      .then((response) => setBuiltInCategories(response.data))
      .catch(() => setBuiltInCategories([]));

    adminRequest("/api/Category")
      .then((response) => setAdminCategories(collection(response)))
      .catch(() => setAdminCategories([]));
  }, []);

  useEffect(() => subscribeToStore(() => {
    setSavedCategories(readList(CATEGORIES_KEY));
    setBanners(readList(BANNERS_KEY));
    setCustomerProducts([
      ...readList(PUBLISHED_SUBMISSIONS_KEY),
      ...readList(APPROVED_PRODUCTS_KEY),
    ]);
  }), []);

  const handleSearch = (event) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (category) params.set("category", category);
    navigate(`/products${params.size ? `?${params.toString()}` : ""}`);
  };

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <span className={styles.eyebrow}>A LITTLE SOMETHING FOR YOU</span>
          <h1>{activeBanner?.title || "Discover products made for your life."}</h1>
          <p>{activeBanner?.subtitle || "Find everyday favorites, thoughtful details, and a few lovely surprises."}</p>
          <form className={styles.searchForm} role="search" onSubmit={handleSearch}>
            <input
              type="search"
              aria-label="Search products"
              placeholder="Search products"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <select
              aria-label="Choose a category"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              <option value="">All categories</option>
              {categories.map((item) => (
                <option key={item.slug} value={item.slug}>{item.name}</option>
              ))}
            </select>
            <button type="submit" aria-label="Search" title="Search">
              <FiSearch aria-hidden="true" />
            </button>
          </form>
          <Link to="/products" className={styles.heroLink}>
            Explore the collection
            <span aria-hidden="true">&#8594;</span>
          </Link>
        </div>
        {(activeBanner?.image || featuredProduct) && (
          <div className={styles.featuredProduct}>
            <span className={styles.featuredLabel}>{activeBanner ? "Featured collection" : "A customer favorite"}</span>
            <img
              src={activeBanner?.image || featuredProduct.thumbnail}
              alt={activeBanner?.title || featuredProduct.title}
              className={styles.heroImage}
            />
          </div>
        )}
      </section>

      <section className={styles.categorySection} aria-labelledby="category-title">
        <div className={styles.sectionHeading}>
          <div>
            <span className={styles.eyebrow}>FIND YOUR NEXT FAVORITE</span>
            <h2 id="category-title">Shop by category</h2>
          </div>
          <Link to="/products" className={styles.viewAll}>
            View all products <span aria-hidden="true">&#8594;</span>
          </Link>
        </div>

        <div className={styles.categoryGrid}>
          {categories.map((category) => (
            <Link
              key={category.slug}
              to={`/products?category=${encodeURIComponent(category.slug)}`}
              className={styles.categoryLink}
            >
              <span className={styles.categoryIcon} aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M20 13 13 20 4 11V4h7z" />
                  <circle cx="8" cy="8" r="1" />
                </svg>
              </span>
              <span className={styles.categoryName}>{category.name}</span>
              <span className={styles.categoryArrow} aria-hidden="true">&#8594;</span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
};

export default Home;
