import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  addToCart,
  decreaseQty,
  removeFromCart,
  applyPromo,
  removePromo,
  PROMOS,
} from "../store/cartSlice";
import OrderSummary from "../components/OrderSummary";
import styles from "../styles/Cart.module.css";

function Cart() {
  const dispatch = useDispatch();
  const cart = useSelector((state) => state.cart.items);
  const stockMap = useSelector((state) => state.cart.stockMap);
  const promo = useSelector((state) => state.cart.promo);

  // ===== كود الخصم: الكلمة المكتوبة + رسالة النجاح/الخطأ =====
  const [code, setCode] = useState("");
  const [message, setMessage] = useState(null);

  // تطبيق كود الخصم
  const handleApply = (e) => {
    e.preventDefault();
    const key = code.trim().toUpperCase();

    if (!key) {
      setMessage({ type: "error", text: "Please enter a coupon code." });
      return;
    }
    if (!PROMOS[key]) {
      setMessage({ type: "error", text: "This coupon code is not valid." });
      return;
    }

    dispatch(applyPromo(key));
    setMessage({
      type: "success",
      text: `${key} applied: ${PROMOS[key].label}`,
    });
    setCode("");
  };

  // شيل كود الخصم
  const handleRemovePromo = () => {
    dispatch(removePromo());
    setMessage(null);
  };

  // ===== السلة فاضية =====
  if (cart.length === 0) {
    return (
      <div className={styles.empty}>
        <h2>Your cart is empty</h2>
        <p>Looks like you haven't added anything yet.</p>
        <Link to="/" className={styles.shopBtn}>
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Cart</h1>

      <div className={styles.layout}>
        {/* ===== العمود الأيسر: المنتجات + كود الخصم ===== */}
        <div className={styles.left}>
          <div className={styles.items}>
            {cart.map((item) => {
              const remaining = stockMap[item.id] ?? 0;

              return (
                <div key={item.id} className={styles.item}>
                  {/* الصورة قابلة للضغط */}
                  <Link to={`/product/${item.id}`} className={styles.thumb}>
                    <img src={item.thumbnail} alt={item.title} />
                  </Link>

                  {/* الاسم وسعر القطعة */}
                  <div className={styles.details}>
                    <Link to={`/product/${item.id}`} className={styles.name}>
                      {item.title}
                    </Link>
                    <span className={styles.unit}>${item.price} each</span>
                    {remaining <= 0 && (
                      <span className={styles.maxNote}>
                        Maximum quantity reached
                      </span>
                    )}
                  </div>

                  {/* تعديل الكمية (+ بيقفل لما الـ stock يخلص) */}
                  <div className={styles.qty}>
                    <button
                      onClick={() => dispatch(decreaseQty(item.id))}
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      onClick={() => dispatch(addToCart(item))}
                      disabled={remaining <= 0}
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>

                  {/* سعر المنتج × الكمية */}
                  <div className={styles.lineTotal}>
                    ${(item.price * item.quantity).toFixed(2)}
                  </div>

                  {/* حذف المنتج */}
                  <button
                    className={styles.remove}
                    onClick={() => dispatch(removeFromCart(item.id))}
                    aria-label="Remove item"
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>

          {/* ===== كود الخصم ===== */}
          <div className={styles.coupon}>
            {promo ? (
              // لو في كود مطبق نعرضه مع زرار الحذف
              <div className={styles.applied}>
                <span>
                  <strong>{promo}</strong> · {PROMOS[promo]?.label}
                </span>
                <button onClick={handleRemovePromo}>Remove</button>
              </div>
            ) : (
              <form className={styles.couponForm} onSubmit={handleApply}>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Enter coupon code (e.g. SAVE10)"
                />
                <button type="submit">Apply</button>
              </form>
            )}

            {message && (
              <p
                className={
                  message.type === "error" ? styles.msgError : styles.msgOk
                }
              >
                {message.text}
              </p>
            )}
          </div>

          <Link to="/" className={styles.continue}>
            ← Continue shopping
          </Link>
        </div>

        {/* ===== العمود الأيمن: ملخص الطلب + زرار Checkout ===== */}
        <div className={styles.right}>
          <OrderSummary>
            <Link to="/checkout" className={styles.checkoutBtn}>
              Proceed to Checkout
            </Link>
          </OrderSummary>
        </div>
      </div>
    </div>
  );
}

export default Cart;
