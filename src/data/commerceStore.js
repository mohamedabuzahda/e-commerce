export const USERS_KEY = "shopEaseUsers";
export const ORDERS_KEY = "shopEaseOrders";
export const SUBMISSIONS_KEY = "shopEaseProductSubmissions";
export const APPROVED_PRODUCTS_KEY = "shopEaseApprovedProducts";
export const COUPONS_KEY = "shopEaseCoupons";

export function readList(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export function writeList(key, items) {
  localStorage.setItem(key, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent("shopease:data-change", { detail: { key } }));
}

export function submitProductForReview(product) {
  const submission = {
    ...product,
    id: product.id || `customer-${Date.now()}`,
    status: "pending",
    createdAt: product.createdAt || new Date().toISOString(),
  };
  writeList(SUBMISSIONS_KEY, [submission, ...readList(SUBMISSIONS_KEY)]);
  return submission;
}

export function reviewProductSubmission(product, status) {
  const reviewed = { ...product, status, reviewedAt: new Date().toISOString() };
  writeList(SUBMISSIONS_KEY, readList(SUBMISSIONS_KEY).map((item) => item.id === product.id ? reviewed : item));

  if (status === "approved") {
    const approvedProduct = {
      ...reviewed,
      name: reviewed.title,
      brand: reviewed.ownerName,
      rating: 5,
    };
    writeList(APPROVED_PRODUCTS_KEY, [
      ...readList(APPROVED_PRODUCTS_KEY).filter((item) => item.id !== product.id),
      approvedProduct,
    ]);
  }
}

export function subscribeToStore(callback) {
  const onStorageChange = (event) => {
    if (!event.key || [USERS_KEY, ORDERS_KEY, SUBMISSIONS_KEY, APPROVED_PRODUCTS_KEY, COUPONS_KEY].includes(event.key)) {
      callback();
    }
  };
  const onLocalChange = () => callback();

  window.addEventListener("storage", onStorageChange);
  window.addEventListener("shopease:data-change", onLocalChange);
  return () => {
    window.removeEventListener("storage", onStorageChange);
    window.removeEventListener("shopease:data-change", onLocalChange);
  };
}
