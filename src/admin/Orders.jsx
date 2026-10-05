import { useEffect, useState } from "react";
import { createNotification, ORDERS_KEY, readList, subscribeToStore, writeList } from "../data/commerceStore";
import styles from "./AdminSection.module.css";

function Orders() {
    const [orders, setOrders] = useState([]);
    useEffect(() => {
        const refresh = () => setOrders(readList(ORDERS_KEY));
        refresh();
        return subscribeToStore(refresh);
    }, []);

    function updateStatus(id, status) {
        const orders = readList(ORDERS_KEY);
        const order = orders.find((item) => item.id === id);
        if (!order || order.status === status) return;

        writeList(ORDERS_KEY, orders.map((item) => item.id === id ? { ...item, status } : item));
        createNotification(
            order.customerEmail,
            "Order status updated",
            `Your order ${order.orderNumber || order.id} is now ${status.toLowerCase()}.`,
            "order-status",
            `${order.id}-${status}`
        );
    }

    return (
        <section className={styles.page}>
            <div className={styles.heading}>
                <div>
                    <p className={styles.eyebrow}>Fulfillment</p>
                    <h1>Order & Shipping Management</h1>
                </div>
                <span className={styles.count}>{orders.length} orders</span>
            </div>
            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead><tr><th># Order</th><th>Customer</th><th>Date</th><th>Total</th><th>Payment</th><th>Status</th></tr></thead>
                    <tbody>{orders.length === 0 ? <tr><td colSpan="6" className={styles.emptyCell}>No orders placed yet.</td></tr> : orders.map((order) => <tr key={order.id}><td><strong>{order.id}</strong></td><td>{order.customerName}<br />{order.customerEmail}</td><td>{new Date(order.createdAt).toLocaleDateString()}</td><td>${Number(order.total).toFixed(2)}</td><td>{order.paymentMethod}</td><td><select value={order.status} onChange={(event) => updateStatus(order.id, event.target.value)}><option>Pending</option><option>Processing</option><option>Shipped</option><option>Delivered</option><option>Cancelled</option></select></td></tr>)}</tbody>
                </table>
            </div>
        </section>
    );
}

export default Orders;
