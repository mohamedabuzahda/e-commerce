import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ORDERS_KEY, readList, subscribeToStore } from "../data/commerceStore";
import styles from "../styles/CustomerPages.module.css";

function Orders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const email = user?.email || window.sessionStorage.getItem("shopEaseGuestEmail") || "";
    const refresh = () => setOrders(
      readList(ORDERS_KEY)
        .filter((order) => order.customerEmail?.toLowerCase() === email.toLowerCase())
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    );
    refresh();
    return subscribeToStore(refresh);
  }, [user?.email]);

  return (
    <main className={styles.page}>
      <header className={styles.heading}>
        <div>
          <p className={styles.eyebrow}>Your account</p>
          <h1>Order history</h1>
          <p>View order totals and follow status updates.</p>
        </div>
        <span className={styles.count}>{orders.length} orders</span>
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
                <span className={styles.muted}>Placed</span>
                <span>{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "—"}</span>
              </div>
              <div>
                <span className={styles.muted}>Total</span>
                <strong>${Number(order.total || 0).toFixed(2)}</strong>
              </div>
              <span className={`${styles.status} ${String(order.status).toLowerCase() === "delivered" ? styles.complete : ""}`}>
                {order.status || "Pending"}
              </span>
              <Link className={styles.button} to={`/orders/${encodeURIComponent(order.id)}`}>View order</Link>
            </article>
          ))}
        </div>
      ) : (
        <section className={styles.empty}>
          <h2>No orders yet</h2>
          <p>Orders placed in this browser will appear here.</p>
          <Link to="/products" className={styles.button}>Start shopping</Link>
        </section>
      )}
    </main>
  );
}

export default Orders;
