import { useEffect, useState } from "react";
import { readList, subscribeToStore, USERS_KEY, writeList } from "../data/commerceStore";
import styles from "./AdminSection.module.css";

function Users() {
    const [users, setUsers] = useState([]);
    const currentUser = JSON.parse(localStorage.getItem("shopEaseUser") || "null");

    useEffect(() => {
        const refresh = () => setUsers(readList(USERS_KEY));
        refresh();
        return subscribeToStore(refresh);
    }, []);

    function toggleUserBlock(email) {
        writeList(USERS_KEY, readList(USERS_KEY).map((user) => user.email === email
            ? { ...user, status: user.status?.toLowerCase() === "blocked" ? "active" : "blocked" }
            : user));
    }

    return (
        <section className={styles.page}>
            <div className={styles.heading}>
                <div><p className={styles.eyebrow}>Administration</p><h1>User Management</h1></div>
                <span className={styles.count}>{users.length} users</span>
            </div>
            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Action</th></tr></thead>
                    <tbody>{users.map((user) => {
                        const isBlocked = user.status?.toLowerCase() === "blocked";
                        const isCurrentUser = currentUser?.email === user.email;
                        return <tr key={user.email}>
                            <td><strong>{user.name}</strong></td><td>{user.email}</td><td><span className={styles.badge}>{user.role}</span></td>
                            <td><span className={isBlocked ? styles.warningBadge : styles.successBadge}>{isBlocked ? "Blocked" : "Active"}</span></td>
                            <td><button className={isBlocked ? styles.approveButton : styles.deleteButton} disabled={isCurrentUser} title={isCurrentUser ? "You cannot block your current account" : undefined} onClick={() => toggleUserBlock(user.email)}>{isBlocked ? "Unblock" : "Block"}</button></td>
                        </tr>;
                    })}{users.length === 0 && <tr><td colSpan="5" className={styles.emptyCell}>No accounts are registered yet.</td></tr>}</tbody>
                </table>
            </div>
        </section>
    );
}

export default Users;
