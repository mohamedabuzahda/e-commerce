import { useEffect, useState } from "react";
import { COUPONS_KEY, readList, subscribeToStore, writeList } from "../data/commerceStore";
import styles from "./AdminSection.module.css";

function Discounts() {
    const [coupons, setCoupons] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const refresh = () => setCoupons(readList(COUPONS_KEY));
        refresh();
        return subscribeToStore(refresh);
    }, []);

    function addCoupon(event) {
        event.preventDefault();
        const formElement = event.currentTarget;
        const form = new FormData(formElement);
        const code = form.get("code").trim().toUpperCase();
        const type = form.get("type");
        const value = Number(form.get("value"));
        const minimumOrder = Number(form.get("minimum"));

        if (coupons.some((coupon) => coupon.code.toUpperCase() === code)) {
            setError("This coupon code already exists.");
            return;
        }

        if (value <= 0 || (type === "Percent" && value > 100)) {
            setError("Enter a valid discount value. Percentage discounts cannot exceed 100%.");
            return;
        }

        const coupon = {
            id: `coupon-${Date.now()}`,
            code,
            type,
            value,
            minimumOrder,
            status: "Active",
            scope: "all",
        };
        writeList(COUPONS_KEY, [coupon, ...readList(COUPONS_KEY)]);
        formElement.reset();
        setError("");
        setShowForm(false);
    }

    function deleteCoupon(id) {
        writeList(COUPONS_KEY, readList(COUPONS_KEY).filter((coupon) => coupon.id !== id));
    }

    return (
        <section className={styles.page}>
            <div className={styles.heading}>
                <div><p className={styles.eyebrow}>Marketing</p><h1>Discounts & Promo Codes</h1>
                    <p className={styles.description}>Active coupons apply to the entire order total.</p>
                </div>
                <button className={styles.primaryButton} onClick={() => setShowForm((visible) => !visible)}>
                    {showForm ? "Close" : "+ New Coupon"}
                </button>
            </div>

            {showForm && (
                <form className={styles.formCard} onSubmit={addCoupon}>
                    <label>Code<input name="code" required maxLength="24" placeholder="WELCOME10" /></label>
                    <label>Type<select name="type"><option>Percent</option><option>Flat</option></select></label>
                    <label>Value<input name="value" type="number" min="0.01" step="0.01" required placeholder="10" /></label>
                    <label>Minimum order<input name="minimum" type="number" min="0" step="0.01" required defaultValue="0" /></label>
                    <button className={styles.primaryButton}>Save Coupon</button>
                </form>
            )}

            {error && <p className={styles.errorMessage}>{error}</p>}
            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead><tr><th>Code</th><th>Type</th><th>Value</th><th>Min. Order</th><th>Applies to</th><th>Status</th><th>Action</th></tr></thead>
                    <tbody>{coupons.length ? coupons.map((coupon) => (
                        <tr key={coupon.id}>
                            <td><strong>{coupon.code}</strong></td>
                            <td>{coupon.type}</td>
                            <td>{coupon.type === "Percent" ? `${coupon.value}%` : `$${coupon.value.toFixed(2)}`}</td>
                            <td>${coupon.minimumOrder.toFixed(2)}</td>
                            <td>Entire order</td>
                            <td><span className={styles.successBadge}>{coupon.status}</span></td>
                            <td><button className={styles.deleteButton} onClick={() => deleteCoupon(coupon.id)}>Delete</button></td>
                        </tr>
                    )) : <tr><td colSpan="7" className={styles.emptyCell}>No coupons created yet.</td></tr>}</tbody>
                </table>
            </div>
        </section>
    );
}


export default Discounts;