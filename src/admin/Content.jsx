import { useState } from "react";
import { BANNERS_KEY, readList, writeList } from "../data/commerceStore";
import styles from "./AdminSection.module.css";

const initialBanners = [
    { id: 1, title: "Big Season Sale", subtitle: "Up to 50% off on electronics & fashion", image: "https://images.unsplash.com/photo-1607082349566-187342175e2f?auto=format&fit=crop&w=1600&q=80" },
    { id: 2, title: "New Arrivals Every Week", subtitle: "Discover the latest trends handpicked for you", image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1600&q=80" },
];

function Content() {
    const [banners, setBanners] = useState(() => readList(BANNERS_KEY).length ? readList(BANNERS_KEY) : initialBanners);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState("");

    function updateBanner(id, field, value) {
        setBanners((currentBanners) => currentBanners.map((banner) => banner.id === id ? { ...banner, [field]: value } : banner));
        setSaved(false);
    }

    function addBanner() {
        setBanners((currentBanners) => [...currentBanners, { id: Date.now(), title: "New homepage banner", subtitle: "Add a supporting message", image: "" }]);
        setSaved(false);
    }

    async function updateBannerImage(id, event) {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 2 * 1024 * 1024) {
            setError("Choose a JPG, PNG, or WEBP image under 2 MB.");
            event.target.value = "";
            return;
        }

        try {
            const imageUrl = URL.createObjectURL(file);
            const image = new Image();
            const compressedImage = await new Promise((resolve, reject) => {
                image.onload = () => {
                    URL.revokeObjectURL(imageUrl);
                    const scale = Math.min(1, 1200 / Math.max(image.width, image.height));
                    const canvas = document.createElement("canvas");
                    canvas.width = Math.round(image.width * scale);
                    canvas.height = Math.round(image.height * scale);
                    canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
                    let quality = 0.82;
                    let result = canvas.toDataURL("image/jpeg", quality);
                    while (result.length > 650_000 && quality > 0.5) {
                        quality -= 0.08;
                        result = canvas.toDataURL("image/jpeg", quality);
                    }
                    if (result.length > 800_000) reject(new Error("Choose a smaller image."));
                    else resolve(result);
                };
                image.onerror = () => {
                    URL.revokeObjectURL(imageUrl);
                    reject(new Error("The image could not be read."));
                };
                image.src = imageUrl;
            });

            updateBanner(id, "image", compressedImage);
            setError("");
        } catch (imageError) {
            setError(imageError.message);
        } finally {
            event.target.value = "";
        }
    }

    function saveBanners() {
        if (banners.some((banner) => !banner.image)) {
            setError("Choose an image for each banner before saving.");
            return;
        }

        writeList(BANNERS_KEY, banners);
        setError("");
        setSaved(true);
    }

    return (
        <section className={styles.page}>
            <div className={styles.heading}><div><p className={styles.eyebrow}>Storefront</p><h1>Homepage Content (Banners)</h1></div><div className={styles.headingActions}><button className={styles.secondaryButton} onClick={addBanner}>+ Add Banner</button><button className={styles.primaryButton} onClick={saveBanners}>Save Changes</button></div></div>
            {saved && <p className={styles.savedMessage}>Homepage content saved locally.</p>}
            {error && <p className={styles.errorMessage}>{error}</p>}
            <div className={styles.bannerList}>{banners.map((banner) => <article className={styles.bannerCard} key={banner.id}><button className={styles.deleteButton} onClick={() => { setBanners((currentBanners) => currentBanners.filter((item) => item.id !== banner.id)); setSaved(false); }}>Delete</button><label>Title<input value={banner.title} onChange={(event) => updateBanner(banner.id, "title", event.target.value)} /></label><label>Subtitle<input value={banner.subtitle} onChange={(event) => updateBanner(banner.id, "subtitle", event.target.value)} /></label><label>Banner image<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => updateBannerImage(banner.id, event)} />{banner.image && <img className={styles.bannerImagePreview} src={banner.image} alt={`${banner.title} banner preview`} />}</label></article>)}</div>
        </section>
    );
}

export default Content;
