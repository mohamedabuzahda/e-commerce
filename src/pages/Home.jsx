import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import styles from "../styles/Home.module.css";

const Home = () => {
  const [featuredProduct, setFeaturedProduct] = useState(null);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    axios
      .get("https://dummyjson.com/products?limit=1")
      .then((response) => setFeaturedProduct(response.data.products[0]))
      .catch(() => setFeaturedProduct(null));

    axios
      .get("https://dummyjson.com/products/categories")
      .then((response) => setCategories(response.data))
      .catch(() => setCategories([]));
  }, []);

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <span className={styles.eyebrow}>A LITTLE SOMETHING FOR YOU</span>
          <h1>Discover products made for your life.</h1>
          <p>Find everyday favorites, thoughtful details, and a few lovely surprises.</p>
          <Link to="/products" className={styles.heroLink}>
            Explore the collection
            <span aria-hidden="true">&#8594;</span>
          </Link>
        </div>
        {featuredProduct && (
          <div className={styles.featuredProduct}>
            <span className={styles.featuredLabel}>A customer favorite</span>
            <img
              src={featuredProduct.thumbnail}
              alt={featuredProduct.title}
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
              to={`/products?category=${category.slug}`}
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
