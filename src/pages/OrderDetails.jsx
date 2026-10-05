import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ORDERS_KEY, readList, subscribeToStore } from "../data/commerceStore";
import styles from "../styles/CustomerPages.module.css";

function OrderDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    const email = user?.email || window.sessionStorage.getItem("shopEaseGuestEmail") || "";
    const refresh = () => setOrder(
      readList(ORDERS_KEY).find(
        (item) => String(item.id) === id
          && item.customerEmail?.toLowerCase() === email.toLowerCase()
      ) || null
    );
    refresh();
    return subscribeToStore(refresh);
  }, [id, user?.email]);

  if (!order) {
    return (
      <main className={styles.page}>
        <section className={styles.empty}>
          <h1>Order not found</h1>
          <p>This order is unavailable for the signed-in account.</p>
          <Link to="/orders" className={styles.button}>Back to orders</Link>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <Link className={styles.back} to="/orders">← Back to orders</Link>
      <header className={styles.heading}>
        <div>
          <p className={styles.eyebrow}>Order details</p>
          <h1>{order.orderNumber || order.id}</h1>
          <p>Placed {order.createdAt ? new Date(order.createdAt).toLocaleString() : "date unavailable"}</p>
        </div>
        <span className={styles.status}>{order.status || "Pending"}</span>
      </header>

      <section className={styles.panel}>
        <h2>Items</h2>
        {Array.isArray(order.items) && order.items.map((item) => (
          <div className={styles.orderItem} key={item.id}>
            {item.thumbnail && <img src={item.thumbnail} alt="" />}
            <span>{item.title || item.name}</span>
            <span>Qty {item.quantity || 1}</span>
            <strong>${(Number(item.price || 0) * Number(item.quantity || 1)).toFixed(2)}</strong>
          </div>
        ))}
      </section>

      <section className={styles.panel}>
        <h2>Payment and delivery</h2>
        <dl className={styles.summary}>
          <dt>Deliver to</dt><dd>{order.customerName}<br />{order.address}</dd>
          <dt>Payment method</dt><dd>{order.paymentMethod || "Not specified"}</dd>
          <dt>Subtotal</dt><dd>${Number(order.subtotal || 0).toFixed(2)}</dd>
          <dt>Discount {order.promoCode ? `(${order.promoCode})` : ""}</dt><dd>−${Number(order.discount || 0).toFixed(2)}</dd>
          <dt>Shipping</dt><dd>${Number(order.shipping || 0).toFixed(2)}</dd>
          <dt className={styles.totalLabel}>Total</dt><dd className={styles.totalValue}>${Number(order.total || 0).toFixed(2)}</dd>
        </dl>
      </section>
    </main>
  );
}

export default OrderDetails;
