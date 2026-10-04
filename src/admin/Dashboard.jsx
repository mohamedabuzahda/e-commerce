import { useCallback, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import Content from "./Content";
import Categories from "./Categories";
import Discounts from "./Discounts";
import Orders from "./Orders";
import Products from "./Products";
import Users from "./Users";
import {
    APPROVED_PRODUCTS_KEY,
    ORDERS_KEY,
    readList,
    reviewProductSubmission,
    SUBMISSIONS_KEY,
    subscribeToStore,
    USERS_KEY,
} from "../data/commerceStore";
import styles from "./Dashboard.module.css";

function DashboardOverview() {
    const today = new Date().toISOString().slice(0, 10).replaceAll("-", "/");
    const [stats, setStats] = useState({ revenue: 0, orders: 0, products: 0, users: 0 });
    const [submissions, setSubmissions] = useState([]);

    const refreshDashboard = useCallback(() => {
        const orders = readList(ORDERS_KEY);
        const revenue = orders.filter((order) => order.status !== "Cancelled")
            .reduce((total, order) => total + Number(order.total || 0), 0);
        setStats({
            revenue,
            orders: orders.length,
            products: readList(APPROVED_PRODUCTS_KEY).length,
            users: readList(USERS_KEY).length,
        });
        setSubmissions(readList(SUBMISSIONS_KEY));
    }, []);

    useEffect(() => {
        refreshDashboard();
        return subscribeToStore(refreshDashboard);
    }, [refreshDashboard]);
    return (
        <section className={styles.overview}>
            <div className={styles.pageHeading}>
                <div>
                    <p className={styles.eyebrow}>Store operations</p>
                    <h1>Admin Dashboard</h1>
                </div>
                <div className={styles.headingTools}>
                    <button className={styles.refreshButton} onClick={refreshDashboard}>Refresh</button>
                    <span className={styles.date}>{today}</span>
                </div>
            </div>

            <div className={styles.statsGrid}>
                <article className={styles.statCard}>
                    <span className={`${styles.statIcon} ${styles.revenue}`}>$</span>
                    <strong>${stats.revenue.toFixed(2)}</strong>
                    <span>Total Revenue</span>
                </article>
                <article className={styles.statCard}>
                    <span className={`${styles.statIcon} ${styles.orders}`}>▣</span>
                    <strong>{stats.orders}</strong>
                    <span>Total Orders</span>
                </article>
                <article className={styles.statCard}>
                    <span className={`${styles.statIcon} ${styles.products}`}>◆</span>
                    <strong>{stats.products}</strong>
                    <span>Total Products</span>
                </article>
                <article className={styles.statCard}>
                    <span className={`${styles.statIcon} ${styles.users}`}>●</span>
                    <strong>{stats.users}</strong>
                    <span>Total Users</span>
                </article>
            </div>

            <div className={styles.recentOrders}>
                <h2>Customer Product Submissions</h2>
                {submissions.length ? (
                    <div className={styles.submissionTableWrap}>
                        <table className={styles.submissionTable}>
                            <thead><tr><th>Product</th><th>Customer</th><th>Price</th><th>Status</th><th>Decision</th></tr></thead>
                            <tbody>{submissions.map((product) => (
                                <tr key={product.id}>
                                    <td><strong>{product.title}</strong></td>
                                    <td>{product.ownerName}<br />{product.ownerEmail}</td>
                                    <td>${Number(product.price).toFixed(2)}</td>
                                    <td className={styles.submissionStatus}>{product.status}</td>
                                    <td>{product.status === "pending" ? <div className={styles.submissionActions}>
                                        <button className={styles.acceptSubmission} onClick={() => reviewProductSubmission(product, "approved")}>Accept</button>
                                        <button className={styles.rejectSubmission} onClick={() => reviewProductSubmission(product, "rejected")}>Reject</button>
                                    </div> : "Reviewed"}</td>
                                </tr>
                            ))}</tbody>
                        </table>
                    </div>
                ) : <p>No customer products have been submitted.</p>}
            </div>
        </section>
    );
}

function AdminLayout() {

    const [page, setPage] = useState("dashboard");
    const { user } = useAuth();

    if (user?.role !== "admin") return <Navigate to="/" replace />;

    const navigation = [
        ["dashboard", "Dashboard", "◉"],
        ["users", "Users", "♟"],
        ["products", "Products", "◆"],
        ["categories", "Categories", "◇"],
        ["orders", "Orders", "▣"],
        ["discounts", "Coupons", "◇"],
        ["content", "Homepage Content", "▧"],
    ];

    return (
        <div className={styles.layout} >

            <aside className={styles.sidebar}>

                <div className={styles.brand}>
                    <span className={styles.brandMark}>A</span>
                    <div>
                        <p className={styles.eyebrow}>Workspace</p>
                        <h2>{user.name || "Administrator"}</h2>
                    </div>
                </div>

                <nav className={styles.navigation} aria-label="Admin sections">
                {navigation.map(([key, label, icon]) => (
                    <button
                        key={key}
                        className={page === key ? styles.active : ""}
                        onClick={() => setPage(key)}
                    >
                        <span>{label}</span>
                        <span className={styles.navIcon}>{icon}</span>
                    </button>
                ))}
                </nav>

            </aside>


            <main className={styles.main}>

                {page === "dashboard" && <DashboardOverview /> }

                {page === "users" && <Users />}

                {page === "products" && <Products />}

                {page === "categories" && <Categories />}

                {page === "orders" && <Orders />}

                {page === "discounts" && <Discounts />}

                {page === "content" && <Content />}

            </main>

        </div>
    );
}

export default AdminLayout;