import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { adminRequest, collection } from "../admin/adminApi";
import {
  APPROVED_PRODUCTS_KEY,
  CATEGORIES_KEY,
  ORDERS_KEY,
  notifyProductAdded,
  publishProductToShop,
  PUBLISHED_SUBMISSIONS_KEY,
  readList,
  submitProductForReview,
  SUBMISSIONS_KEY,
  subscribeToStore,
  writeList,
} from "../data/commerceStore";
import styles from "./Customer.module.css";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function normalizeCategoryOptions(...sources) {
  const categoriesById = new Map();

  sources.flat().forEach((category) => {
    const id = category?.id || category?.categoryId;
    const name = category?.name || category?.title || category?.categoryName;
    if (!id || !name || !UUID_PATTERN.test(String(id))) return;
    categoriesById.set(String(id), { id: String(id), name: String(name) });
  });

  return [...categoriesById.values()];
}

function compressProductImage(file) {
  return new Promise((resolve, reject) => {
    const imageUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(imageUrl);
      const maxDimension = 900;
      const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(image.width * scale);
      canvas.height = Math.round(image.height * scale);
      canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);

      let quality = 0.82;
      let dataUrl = canvas.toDataURL("image/jpeg", quality);
      while (dataUrl.length > 550_000 && quality > 0.5) {
        quality -= 0.08;
        dataUrl = canvas.toDataURL("image/jpeg", quality);
      }

      if (dataUrl.length > 700_000) {
        reject(new Error("The image could not be compressed enough. Choose a smaller image."));
        return;
      }

      resolve(dataUrl);
    };

    image.onerror = () => {
      URL.revokeObjectURL(imageUrl);
      reject(new Error("The image could not be read. Please choose it again."));
    };

    image.src = imageUrl;
  });
}

function Profile() {
  const { user, apiSessionLoading } = useAuth();
  const location = useLocation();
  const [submissions, setSubmissions] = useState([]);
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(location.state?.orderPlaced ? "Your order was placed." : "");
  const [imageData, setImageData] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [imageLoading, setImageLoading] = useState(false);
  const [databaseCategories, setDatabaseCategories] = useState([]);
  const [savedCategories, setSavedCategories] = useState(() => readList(CATEGORIES_KEY));
  const [categoryError, setCategoryError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const refresh = () => {
      setSubmissions(readList(SUBMISSIONS_KEY).filter((item) => item.ownerEmail === user.email));
      setOrders(readList(ORDERS_KEY).filter((order) => order.customerEmail === user.email));
    };
    refresh();
    return subscribeToStore(refresh);
  }, [user.email]);

  useEffect(() => {
    return subscribeToStore(() => setSavedCategories(readList(CATEGORIES_KEY)));
  }, []);

  useEffect(() => {
    if (apiSessionLoading) return undefined;

    adminRequest("/api/Category")
      .then((response) => {
        const loadedCategories = collection(response);
        setDatabaseCategories(Array.isArray(loadedCategories) ? loadedCategories : []);
        setCategoryError("");
      })
      .catch((categoryRequestError) => {
        setCategoryError(readList(CATEGORIES_KEY).length
          ? "Showing saved database categories; the latest categories could not be refreshed."
          : `Database categories could not be loaded: ${categoryRequestError.message}`);
      });
  }, [apiSessionLoading]);

  const categories = normalizeCategoryOptions(databaseCategories, savedCategories);

  function handleImageChange(event) {
    const file = event.target.files?.[0];
    setImageData("");
    setImagePreview("");
    setError("");

    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Choose a JPG, PNG, or WEBP image.");
      event.target.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError("The image must be 2 MB or smaller.");
      event.target.value = "";
      return;
    }

    setImageLoading(true);
    compressProductImage(file)
      .then((dataUrl) => {
      setImageData(dataUrl);
      setImagePreview(dataUrl);
      setImageLoading(false);
      })
      .catch((imageError) => {
        setError(imageError.message);
        setImageLoading(false);
        event.target.value = "";
      });
  }

  async function submitProduct(event) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const categoryId = form.get("category");
    const title = form.get("title").trim();
    const selectedCategory = categories.find((category) => category.id === categoryId);
    const localProduct = {
      ownerId: user.id || user.email,
      ownerName: user.name,
      ownerEmail: user.email,
      title,
      description: form.get("description").trim(),
      category: selectedCategory?.name || "Other",
      price: Number(form.get("price")),
      stock: Number(form.get("stock")),
      thumbnail: imageData || "https://placehold.co/600x400?text=Product",
      rating: 5,
    };

    setSubmitting(true);
    try {
      const response = await adminRequest("/api/Products", {
        method: "POST",
        body: JSON.stringify({
          name: title,
          description: form.get("description").trim(),
          price: Number(form.get("price")),
          stockQuantity: Number(form.get("stock")),
          categoryId,
        }),
      });
      const createdProduct = response?.data || response;
      const publishedProduct = publishProductToShop({
        ...localProduct,
        id: createdProduct?.id || createdProduct?.productId,
      });

      if (imageData && createdProduct?.id) {
        try {
          await adminRequest(`/api/products/${createdProduct.id}/images`, {
            method: "POST",
            body: JSON.stringify({ imageUrl: imageData, isPrimary: true }),
          });
        } catch {
          setError("Product saved to the database, but its image could not be saved.");
        }
      }

      notifyProductAdded(
        { id: publishedProduct.id, ownerEmail: user.email },
        `Your product “${title}” was added to the store database.`
      );
      formElement.reset();
      setImageData("");
      setImagePreview("");
      setSuccess(`“${title}” was added to the database products.`);
    } catch (submitError) {
      const authRejected = submitError.status === 401
        || submitError.status === 403
        || /database API rejected this customer account|database session could not be renewed/i.test(submitError.message);

      if (authRejected) {
        try {
          const localSubmission = submitProductForReview(localProduct);
          notifyProductAdded(
            localSubmission,
            `Your product “${title}” was added to Shop and sent to the admin review queue.`
          );
          formElement.reset();
          setImageData("");
          setImagePreview("");
          setError("The database API denied access. This product is now visible in Shop and saved locally, but is not synchronized with the database.");
          setSuccess(`“${title}” is now visible in Shop and the admin review queue.`);
        } catch {
          setError("The database API denied access and the product could not be saved locally either.");
        }
      } else {
        setError(`Product was not saved: ${submitError.message}`);
      }
    } finally {
      setSubmitting(false);
    }
  }

  function deleteProduct(product) {
    writeList(SUBMISSIONS_KEY, readList(SUBMISSIONS_KEY).filter((item) => item.id !== product.id));
    writeList(APPROVED_PRODUCTS_KEY, readList(APPROVED_PRODUCTS_KEY).filter((item) => item.id !== product.id));
    writeList(PUBLISHED_SUBMISSIONS_KEY, readList(PUBLISHED_SUBMISSIONS_KEY).filter((item) => item.id !== product.id));
  }

  return (
    <main className={styles.page}>
      <header className={styles.heading}>
        <div><h1>Product Management</h1><p>Welcome, {user.name}. Submit products for admin review and manage your orders.</p></div>
      </header>

      <section className={styles.section}>
          <h2>Add a product</h2>
          <p className={styles.fieldHint}>{apiSessionLoading ? "Restoring your database session..." : "Your product is saved directly to the store database."}</p>
        <form className={styles.form} onSubmit={submitProduct}>
          <label className={styles.field}>Product name<input name="title" required maxLength="100" /></label>
          <label className={styles.field}>Category<select name="category" required defaultValue="" disabled={!categories.length}><option value="" disabled>{categories.length ? "Choose a category" : "Database categories unavailable"}</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
          <label className={styles.field}>Price<input name="price" type="number" min="0.01" step="0.01" required /></label>
          <label className={styles.field}>Available stock<input name="stock" type="number" min="1" step="1" required /></label>
          <div className={styles.field}>
            <label htmlFor="product-image">Product image</label>
            <input
              id="product-image"
              name="image"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageChange}
              className={styles.fileInput}
            />
            <span className={styles.fieldHint}>JPG, PNG, or WEBP. Maximum size: 2 MB.</span>
            {imageLoading && <span className={styles.fieldHint}>Preparing image...</span>}
            {imagePreview && <img className={styles.imagePreview} src={imagePreview} alt="Product preview" />}
          </div>
          <label className={`${styles.field} ${styles.wide}`}>Description<textarea name="description" required maxLength="1000" /></label>
          <div className={styles.wide}>
            {categoryError && <p className={styles.error}>{categoryError}</p>}
            {error && <p className={styles.error}>{error}</p>}
            {success && <p className={styles.success}>{success}</p>}
            <button className={styles.button} type="submit" disabled={imageLoading || submitting || apiSessionLoading || !categories.length}>{submitting || apiSessionLoading ? "Connecting..." : "Add product"}</button>
          </div>
        </form>
      </section>

      <section className={styles.section}>
        <h2>My product submissions</h2>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead><tr><th>Product</th><th>Price</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>{submissions.length ? submissions.map((product) => (
              <tr key={product.id}>
                <td><strong>{product.title}</strong><br /><span className={styles.muted}>{product.category}</span></td>
                <td>${product.price.toFixed(2)}</td>
                <td><span className={`${styles.status} ${product.status === "approved" ? styles.statusApproved : product.status === "rejected" ? styles.statusRejected : ""}`}>{product.status}</span></td>
                <td><button className={styles.dangerButton} type="button" onClick={() => deleteProduct(product)}>Delete</button></td>
              </tr>
            )) : <tr><td colSpan="4" className={styles.muted}>You have not submitted any products.</td></tr>}</tbody>
          </table>
        </div>
      </section>

      <section className={styles.section}>
        <h2>My orders</h2>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead><tr><th>Order</th><th>Date</th><th>Items</th><th>Total</th><th>Status</th></tr></thead>
            <tbody>{orders.length ? orders.map((order) => (
              <tr key={order.id}>
                <td><strong>{order.id}</strong></td>
                <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                <td>{order.items.reduce((count, item) => count + item.quantity, 0)}</td>
                <td>${order.total.toFixed(2)}</td>
                <td><span className={`${styles.status} ${order.status === "Delivered" ? styles.statusApproved : order.status === "Cancelled" ? styles.statusCancelled : ""}`}>{order.status}</span></td>
              </tr>
            )) : <tr><td colSpan="5" className={styles.muted}>No orders yet.</td></tr>}</tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

export default Profile;
