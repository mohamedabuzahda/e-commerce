import { useState } from "react";
import styles from "./AdminSection.module.css";

const initialBanners = [
    { id: 1, title: "Big Season Sale", subtitle: "Up to 50% off on electronics & fashion", image: "https://images.unsplash.com/photo-1607082349566-187342175e2f?auto=format&fit=crop&w=1600&q=80" },
    { id: 2, title: "New Arrivals Every Week", subtitle: "Discover the latest trends handpicked for you", image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1600&q=80" },
];

function Content() {
    const [banners, setBanners] = useState(initialBanners);
    const [saved, setSaved] = useState(false);

    function updateBanner(id, field, value) {
        setBanners((currentBanners) => currentBanners.map((banner) => banner.id === id ? { ...banner, [field]: value } : banner));
        setSaved(false);
    }

    function addBanner() {
        setBanners((currentBanners) => [...currentBanners, { id: Date.now(), title: "New homepage banner", subtitle: "Add a supporting message", image: "" }]);
    }

    return (
        <section className={styles.page}>
            <div className={styles.heading}><div><p className={styles.eyebrow}>Storefront</p><h1>Homepage Content (Banners)</h1></div><div className={styles.headingActions}><button className={styles.secondaryButton} onClick={addBanner}>+ Add Banner</button><button className={styles.primaryButton} onClick={() => setSaved(true)}>Save Changes</button></div></div>
            {saved && <p className={styles.savedMessage}>Homepage content saved locally.</p>}
            <div className={styles.bannerList}>{banners.map((banner) => <article className={styles.bannerCard} key={banner.id}><button className={styles.deleteButton} onClick={() => setBanners((currentBanners) => currentBanners.filter((item) => item.id !== banner.id))}>Delete</button><label>Title<input value={banner.title} onChange={(event) => updateBanner(banner.id, "title", event.target.value)} /></label><label>Subtitle<input value={banner.subtitle} onChange={(event) => updateBanner(banner.id, "subtitle", event.target.value)} /></label><label>Image URL<input value={banner.image} onChange={(event) => updateBanner(banner.id, "image", event.target.value)} /></label></article>)}</div>
        </section>
    );
}

export default Content;
