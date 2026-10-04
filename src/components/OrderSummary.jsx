import React from "react";
import { useSelector } from "react-redux";
import {
  calcTotals,
  PROMOS,
  FREE_SHIPPING_OVER,
} from "../store/cartSlice";
import styles from "../styles/OrderSummary.module.css";

// ملخص الطلب (بيظهر في السلة وفي الـ Checkout)
// أي حاجة نبعتها جواه (children) بتظهر تحت الإجمالي، زي زرار Checkout
function OrderSummary({ children }) {
  const items = useSelector((state) => state.cart.items);
  const promo = useSelector((state) => state.cart.promo);

  const { subtotal, discount, shipping, total } = calcTotals(items, promo);
  const itemsCount = items.reduce((sum, item) => sum + item.quantity, 0);

  // بنعرض شريط الشحن المجاني بس لو مفيش كود شحن مجاني والطلب لسه أقل من الحد
  const hasFreeShipPromo = promo && PROMOS[promo]?.type === "shipping";
  const remainingForFree = FREE_SHIPPING_OVER - subtotal;
  const showShipHint = !hasFreeShipPromo && subtotal > 0 && remainingForFree > 0;
  const progress = Math.min(100, (subtotal / FREE_SHIPPING_OVER) * 100);

  return (
    <aside className={styles.box}>
      <h2 className={styles.title}>Order Summary</h2>

      {/* ===== تفاصيل الأسعار ===== */}
      <div className={styles.row}>
        <span>Subtotal ({itemsCount} {itemsCount === 1 ? "item" : "items"})</span>
        <span>${subtotal.toFixed(2)}</span>
      </div>

      {/* الخصم بيظهر بس لو في كود مطبق */}
      {discount > 0 && (
        <div className={`${styles.row} ${styles.discount}`}>
          <span>Discount ({promo})</span>
          <span>−${discount.toFixed(2)}</span>
        </div>
      )}

      <div className={styles.row}>
        <span>Shipping</span>
        <span className={shipping === 0 ? styles.free : ""}>
          {shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}
        </span>
      </div>

      {/* ===== شريط الشحن المجاني ===== */}
      {showShipHint && (
        <div className={styles.hint}>
          <p>
            Add <strong>${remainingForFree.toFixed(2)}</strong> more for free shipping
          </p>
          <div className={styles.bar}>
            <div className={styles.fill} style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {/* ===== الإجمالي ===== */}
      <div className={styles.total}>
        <span>Total</span>
        <strong>${total.toFixed(2)}</strong>
      </div>

      {/* الزرار أو أي محتوى إضافي */}
      {children}
    </aside>
  );
}

export default OrderSummary;
