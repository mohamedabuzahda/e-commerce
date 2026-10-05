import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  applyPromo,
  calcTotals,
  PROMOS,
  removePromo,
} from "../store/cartSlice";
import { findActiveCoupon } from "../data/commerceStore";
import styles from "../styles/Cart.module.css";

function CouponCode() {
  const dispatch = useDispatch();
  const items = useSelector((state) => state.cart.items);
  const promo = useSelector((state) => state.cart.promo);
  const subtotal = calcTotals(items).subtotal;
  const [code, setCode] = useState("");
  const [message, setMessage] = useState(null);
  const promoDetails = typeof promo === "string"
    ? { code: promo, ...PROMOS[promo] }
    : promo;

  function handleApply(event) {
    event.preventDefault();
    const normalizedCode = code.trim().toUpperCase();

    if (!normalizedCode) {
      setMessage({ type: "error", text: "Please enter a coupon code." });
      return;
    }

    const coupon = findActiveCoupon(normalizedCode);
    const couponType = String(coupon?.type || "").toLowerCase();
    const selectedPromo = coupon
      ? {
          code: normalizedCode,
          type: couponType === "percent" ? "percent" : "flat",
          value: Number(coupon.value),
          minimumOrder: Number(coupon.minimumOrder || 0),
          label: couponType === "percent"
            ? `${coupon.value}% off your order`
            : `$${Number(coupon.value).toFixed(2)} off your order`,
        }
      : PROMOS[normalizedCode]
        ? { code: normalizedCode, ...PROMOS[normalizedCode] }
        : null;

    if (!selectedPromo) {
      setMessage({ type: "error", text: "This coupon code is not valid." });
      return;
    }

    if (
      !Number.isFinite(Number(selectedPromo.value))
      || Number(selectedPromo.value) < 0
      || (selectedPromo.type === "percent" && Number(selectedPromo.value) > 100)
    ) {
      setMessage({ type: "error", text: "This coupon has an invalid discount." });
      return;
    }

    if (Number(selectedPromo.minimumOrder || 0) > subtotal) {
      setMessage({
        type: "error",
        text: `This coupon requires a minimum order of $${Number(selectedPromo.minimumOrder).toFixed(2)}.`,
      });
      return;
    }

    dispatch(applyPromo(selectedPromo));
    setMessage({ type: "success", text: `${normalizedCode} applied: ${selectedPromo.label}` });
    setCode("");
  }

  function handleRemove() {
    dispatch(removePromo());
    setMessage(null);
  }

  return (
    <div className={styles.coupon}>
      {promo ? (
        <div className={styles.applied}>
          <span>
            <strong>{promoDetails?.code || promo}</strong> · {promoDetails?.label}
          </span>
          <button type="button" onClick={handleRemove}>Remove</button>
        </div>
      ) : (
        <form className={styles.couponForm} onSubmit={handleApply}>
          <input
            type="text"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            placeholder="Enter coupon code (e.g. SAVE10)"
            aria-label="Coupon code"
          />
          <button type="submit">Apply</button>
        </form>
      )}

      {message && (
        <p className={message.type === "error" ? styles.msgError : styles.msgOk} role="status">
          {message.text}
        </p>
      )}
    </div>
  );
}

export default CouponCode;
