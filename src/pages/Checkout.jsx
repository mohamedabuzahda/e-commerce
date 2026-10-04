import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useAuth } from "../context/AuthContext";
import { clearCart } from "../store/cartSlice";
import { COUPONS_KEY, ORDERS_KEY, readList, subscribeToStore, writeList } from "../data/commerceStore";
import styles from "../customer/Customer.module.css";

function Checkout() {
  const cart = useSelector((state) => state.cart.items);
  const { user } = useAuth();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponFeedback, setCouponFeedback] = useState("");
  const [coupons, setCoupons] = useState(() => readList(COUPONS_KEY));
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = appliedCoupon
    ? Math.round(Math.min(total, appliedCoupon.type === "Percent" ? total * appliedCoupon.value / 100 : appliedCoupon.value) * 100) / 100
    : 0;
  const finalTotal = Math.max(0, total - discount);

  useEffect(() => subscribeToStore(() => setCoupons(readList(COUPONS_KEY))), []);

  function applyCoupon() {
    const coupon = coupons.find((entry) => entry.code.toUpperCase() === couponCode.trim().toUpperCase() && entry.status === "Active");
    if (!coupon) {
      setAppliedCoupon(null);
      setCouponFeedback("This coupon is invalid or inactive.");
      return;
    }
    if (total < coupon.minimumOrder) {
      setAppliedCoupon(null);
      setCouponFeedback(`This coupon requires a minimum order of $${coupon.minimumOrder.toFixed(2)}.`);
      return;
    }
    setAppliedCoupon(coupon);
    setCouponFeedback(`${coupon.code} applied to your entire order.`);
  }

  function placeOrder(event) {
    event.preventDefault();
    if (!cart.length) return;

    const form = new FormData(event.currentTarget);
    const order = {
      id: `ORD-${Date.now()}`,
      userId: user.id || user.email,
      customerName: user.name,
      customerEmail: user.email,
      address: form.get("address"),
      paymentMethod: form.get("paymentMethod"),
      items: cart.map(({ id, title, price, quantity }) => ({ id, title, price, quantity })),
      subtotal: total,
      discount,
      couponCode: appliedCoupon?.code || null,
      total: finalTotal,
      status: "Pending",
      createdAt: new Date().toISOString(),
    };

    try {
      writeList(ORDERS_KEY, [order, ...readList(ORDERS_KEY)]);
      dispatch(clearCart());
      navigate("/customer", { state: { orderPlaced: true } });
    } catch {
      setError("The order could not be saved. Please try again.");
    }
  }

  if (!cart.length) {
    return <main className={styles.page}><h1>Checkout</h1><p>Your cart is empty.</p><Link to="/products">Browse products</Link></main>;
  }

  return (
    <main className={styles.page}>
      <div className={styles.heading}>
        <div><h1>Checkout</h1><p>Review your order and delivery details.</p></div>
        <strong>${finalTotal.toFixed(2)}</strong>
      </div>
      <section className={styles.section}>
        <h2>Promo code</h2>
        <div className={styles.couponRow}>
          <label className={styles.field}>Coupon code<input value={couponCode} onChange={(event) => { setCouponCode(event.target.value); setAppliedCoupon(null); setCouponFeedback(""); }} /></label>
          <button className={styles.secondaryButton} type="button" onClick={applyCoupon}>Apply</button>
        </div>
        {couponFeedback && <p className={appliedCoupon ? styles.success : styles.error}>{couponFeedback}</p>}
      </section>
      <form className={styles.form} onSubmit={placeOrder}>
        <label className={`${styles.field} ${styles.wide}`}>Delivery address<textarea name="address" required maxLength="300" /></label>
        <label className={styles.field}>Payment method<select name="paymentMethod"><option>Cash on delivery</option><option>Card on delivery</option></select></label>
        <div className={styles.wide}>
          {error && <p className={styles.error}>{error}</p>}
          <button className={styles.button} type="submit">Place order</button>
        </div>
      </form>
      <section className={styles.section}>
        <h2>Order items</h2>
        <div className={styles.tableWrap}>
          <table className={styles.table}><thead><tr><th>Product</th><th>Quantity</th><th>Price</th></tr></thead>
            <tbody>{cart.map((item) => <tr key={item.id}><td>{item.title}</td><td>{item.quantity}</td><td>${(item.price * item.quantity).toFixed(2)}</td></tr>)}</tbody>
          </table>
        </div>
        <p>Subtotal: ${total.toFixed(2)}</p>
        {appliedCoupon && <p className={styles.success}>Discount ({appliedCoupon.code}): -${discount.toFixed(2)}</p>}
        <strong>Order total: ${finalTotal.toFixed(2)}</strong>
      </section>
    </main>
  );
}

export default Checkout
