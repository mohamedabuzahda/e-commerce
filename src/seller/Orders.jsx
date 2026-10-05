import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  APPROVED_PRODUCTS_KEY,
  createNotification,
  ORDERS_KEY,
  readList,
  SUBMISSIONS_KEY,
  subscribeToStore,
} from "../data/commerceStore";
import styles from "../styles/CustomerPages.module.css";

function SellerOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const refresh = () => {
      const productIds = new Set(
        [...readList(SUBMISSIONS_KEY), ...readList(APPROVED_PRODUCTS_KEY)]
          .filter((product) => product.ownerEmail?.toLowerCase() === user.email.toLowerCase())
          .map((product) => String(product.id))
      );
      setOrders(readList(ORDERS_KEY).flatMap((order) => {
        const items = order.items?.filter((item) => productIds.has(String(item.id))) || [];
        return items.length ? [{ ...order, items }] : [];
      }));
    };
    refresh();
    return subscribeToStore(refresh);
  }, [user.email]);

  function updateStatus(orderId, status) {
    const allOrders = readList(ORDERS_KEY);
    const order = allOrders.find((item) => item.id === orderId);
    if (!order || order.status === status) return;

    writeList(
      ORDERS_KEY,
      allOrders.map((item) => item.id === orderId ? { ...item, status } : item)
    );
    createNotification(
      order.customerEmail,
      "Order status updated",
      `Your order ${order.orderNumber || order.id} is now ${status.toLowerCase()}.`,
      "order-status",
      `${order.id}-${status}`
    );
  }

  return (
    <main className={styles.page}>
      <header className={styles.heading}>
        <div>
          <p className={styles.eyebrow}>Vendor workspace</p>
          <h1>Orders containing your products</h1>
          <p>Order processing is available for orders saved on this browser.</p>
        </div>
      </header>

      {orders.length ? (
        <div className={styles.orderList}>
          {orders.map((order) => (
            <article className={styles.orderCard} key={order.id}>
              <div>
                <span className={styles.muted}>Order</span>
                <strong>{order.orderNumber || order.id}</strong>
              </div>
              <div>
                <span className={styles.muted}>Customer</span>
                <span>{order.customerName}</span>
              </div>
              <div>
                <span className={styles.muted}>Status</span>
                <select
                  aria-label={`Update order ${order.id} status`}
                  value={order.status || "Pending"}
                  onChange={(event) => updateStatus(order.id, event.target.value)}
                >
                  <option>Pending</option>
                  <option>Processing</option>
                  <option>Shipped</option>
                  <option>Delivered</option>
                </select>
              </div>
              <div>
                {order.items.map((item) => (
                  <span key={`${order.id}-${item.id}`}>{item.title} × {item.quantity}</span>
                ))}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <section className={styles.empty}>
          <h2>No seller orders yet</h2>
          <p>Orders containing your products will appear here once the listing is in the catalog.</p>
        </section>
      )}
    </main>
  );
}

export default SellerOrders;
