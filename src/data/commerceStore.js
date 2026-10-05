export const USERS_KEY = "shopEaseUsers";
export const ORDERS_KEY = "shopEaseOrders";
export const SUBMISSIONS_KEY = "shopEaseProductSubmissions";
export const APPROVED_PRODUCTS_KEY = "shopEaseApprovedProducts";
export const PUBLISHED_SUBMISSIONS_KEY = "shopEasePublishedSubmissions";
export const CATEGORIES_KEY = "shopEaseCategories";
export const BANNERS_KEY = "shopEaseBanners";
export const COUPONS_KEY = "shopEaseCoupons";
export const NOTIFICATIONS_KEY = "shopEaseNotifications";

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
  writeList(SUBMISSIONS_KEY, [
    submission,
    ...readList(SUBMISSIONS_KEY).filter((item) => item.id !== submission.id),
  ]);
  writeList(PUBLISHED_SUBMISSIONS_KEY, [
    submission,
    ...readList(PUBLISHED_SUBMISSIONS_KEY).filter((item) => item.id !== submission.id),
  ]);
  return submission;
}

export function publishProductToShop(product) {
  const publishedProduct = {
    ...product,
    id: product.id || `customer-${Date.now()}`,
  };
  writeList(PUBLISHED_SUBMISSIONS_KEY, [
    publishedProduct,
    ...readList(PUBLISHED_SUBMISSIONS_KEY).filter((item) => item.id !== publishedProduct.id),
  ]);
  return publishedProduct;
}

export function findActiveCoupon(code) {
  const normalizedCode = String(code || "").trim().toUpperCase();
  if (!normalizedCode) return null;

  return readList(COUPONS_KEY).find(
    (coupon) =>
      String(coupon.code || "").trim().toUpperCase() === normalizedCode
      && String(coupon.status || "").toLowerCase() === "active"
  ) || null;
}

export function notifyProductAdded(product, message) {
  if (!product.ownerEmail) return;

  const notificationId = `product-added-${product.id || Date.now()}`;
  const notifications = readList(NOTIFICATIONS_KEY);
  if (notifications.some((notification) => notification.id === notificationId)) return;

  writeList(NOTIFICATIONS_KEY, [
    {
      id: notificationId,
      submissionId: product.id || null,
      recipientEmail: product.ownerEmail.toLowerCase(),
      type: "product-added",
      title: "Product added",
      message,
      createdAt: new Date().toISOString(),
      readAt: null,
    },
    ...notifications,
  ]);
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

    writeList(PUBLISHED_SUBMISSIONS_KEY, readList(PUBLISHED_SUBMISSIONS_KEY).filter((item) => item.id !== product.id));

    if (product.ownerEmail) {
      const notifications = readList(NOTIFICATIONS_KEY);
      const alreadyNotified = notifications.some(
        (notification) => notification.submissionId === product.id && notification.type === "product-approved"
      );

      if (!alreadyNotified) {
        writeList(NOTIFICATIONS_KEY, [
          {
            id: `product-approved-${product.id}`,
            submissionId: product.id,
            recipientEmail: product.ownerEmail.toLowerCase(),
            type: "product-approved",
            title: "Product approved",
            message: `Your product “${product.title}” was approved and added to the store.`,
            createdAt: reviewed.reviewedAt,
            readAt: null,
          },
          ...notifications,
        ]);
      }
    }
  } else if (status === "rejected") {
    writeList(PUBLISHED_SUBMISSIONS_KEY, readList(PUBLISHED_SUBMISSIONS_KEY).filter((item) => item.id !== product.id));
  }
}

export function markNotificationAsRead(notificationId) {
  const notifications = readList(NOTIFICATIONS_KEY);
  const nextNotifications = notifications.map((notification) =>
    notification.id === notificationId && !notification.readAt
      ? { ...notification, readAt: new Date().toISOString() }
      : notification
  );

  if (nextNotifications.some((notification, index) => notification !== notifications[index])) {
    writeList(NOTIFICATIONS_KEY, nextNotifications);
  }
}

export function markAllNotificationsAsRead(email) {
  const normalizedEmail = email.toLowerCase();
  const notifications = readList(NOTIFICATIONS_KEY);
  const readAt = new Date().toISOString();
  const nextNotifications = notifications.map((notification) =>
    notification.recipientEmail?.toLowerCase() === normalizedEmail && !notification.readAt
      ? { ...notification, readAt }
      : notification
  );

  if (nextNotifications.some((notification, index) => notification !== notifications[index])) {
    writeList(NOTIFICATIONS_KEY, nextNotifications);
  }
}

export function subscribeToStore(callback) {
  const onStorageChange = (event) => {
    if (!event.key || [USERS_KEY, ORDERS_KEY, SUBMISSIONS_KEY, APPROVED_PRODUCTS_KEY, PUBLISHED_SUBMISSIONS_KEY, CATEGORIES_KEY, BANNERS_KEY, COUPONS_KEY, NOTIFICATIONS_KEY].includes(event.key)) {
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
