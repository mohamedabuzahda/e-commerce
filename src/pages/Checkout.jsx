import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { calcTotals, completeOrder } from "../store/cartSlice";
import OrderSummary from "../components/OrderSummary";
import { ORDERS_KEY, readList, writeList } from "../data/commerceStore";
import styles from "../styles/Checkout.module.css";

// ===== ثوابت =====
const STEPS = ["Address", "Payment", "Review"];
const WALLET_BALANCE = 500; // رصيد المحفظة (تجريبي لحد ما نعمل حسابات المستخدمين)

// طرق الدفع الأربعة
const METHODS = [
  { id: "card", title: "Credit Card", desc: "Visa, Mastercard" },
  { id: "paypal", title: "PayPal", desc: "Pay with your PayPal account" },
  {
    id: "cod",
    title: "Cash on Delivery",
    desc: "Pay when you receive the order",
  },
  {
    id: "wallet",
    title: "Wallet",
    desc: `Balance: $${WALLET_BALANCE.toFixed(2)}`,
  },
];

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// اسم طريقة الدفع اللي بيظهر في المراجعة
const methodLabel = (method, pay) => {
  if (method === "card")
    return `Credit Card •••• ${pay.cardNumber.replace(/\s/g, "").slice(-4)}`;
  if (method === "paypal") return `PayPal (${pay.paypalEmail})`;
  if (method === "cod") return "Cash on Delivery";
  return "Wallet";
};

// حقل الفورم (اللابل + الخانة + رسالة الخطأ)
function Field({ label, error, className = "", children }) {
  return (
    <label className={`${styles.field} ${className}`}>
      <span>{label}</span>
      {children}
      {error && <small className={styles.error}>{error}</small>}
    </label>
  );
}

function Checkout() {
  const dispatch = useDispatch();
  const cart = useSelector((state) => state.cart.items);
  const promo = useSelector((state) => state.cart.promo);
  const totals = calcTotals(cart, promo);

  // ===== الـ State =====
  const [step, setStep] = useState(1); // الخطوة الحالية (1 عنوان / 2 دفع / 3 مراجعة)
  const [address, setAddress] = useState({
    fullName: "",
    email: "",
    phone: "",
    city: "",
    street: "",
  });
  const [method, setMethod] = useState("card");
  const [pay, setPay] = useState({
    cardNumber: "",
    cardName: "",
    expiry: "",
    cvv: "",
    paypalEmail: "",
  });
  const [errors, setErrors] = useState({});
  const [order, setOrder] = useState(null); // بيتملى بعد ما الطلب يتأكد

  // ===== تغيير قيم العنوان =====
  const onAddress = (e) => {
    const { name, value } = e.target;
    setAddress((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  // ===== تغيير قيم الدفع (مع تنسيق رقم الكارت والتاريخ) =====
  const onPay = (e) => {
    const { name } = e.target;
    let { value } = e.target;

    if (name === "cardNumber") {
      // أرقام بس (16 رقم) ومقسمة كل 4
      value = value
        .replace(/\D/g, "")
        .slice(0, 16)
        .replace(/(.{4})/g, "$1 ")
        .trim();
    }
    if (name === "expiry") {
      // MM/YY
      const digits = value.replace(/\D/g, "").slice(0, 4);
      value =
        digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
    }
    if (name === "cvv") {
      value = value.replace(/\D/g, "").slice(0, 4);
    }

    setPay((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  // ===== التحقق من العنوان =====
  const validateAddress = () => {
    const err = {};
    if (address.fullName.trim().length < 3)
      err.fullName = "Please enter your full name.";
    if (!emailRegex.test(address.email.trim()))
      err.email = "Please enter a valid email.";
    if (!/^[0-9+\-\s]{8,15}$/.test(address.phone.trim()))
      err.phone = "Please enter a valid phone number.";
    if (!address.city.trim()) err.city = "City is required.";
    if (address.street.trim().length < 5)
      err.street = "Please enter your street address.";
    return err;
  };

  // ===== التحقق من الدفع (حسب الطريقة المختارة) =====
  const validatePayment = () => {
    const err = {};

    if (method === "card") {
      if (pay.cardNumber.replace(/\s/g, "").length !== 16)
        err.cardNumber = "Card number must be 16 digits.";
      if (pay.cardName.trim().length < 3)
        err.cardName = "Enter the name on the card.";

      // تاريخ الانتهاء لازم يكون صح ومنتهاش
      const match = /^(0[1-9]|1[0-2])\/(\d{2})$/.exec(pay.expiry);
      if (!match) {
        err.expiry = "Use MM/YY format.";
      } else if (
        new Date(2000 + Number(match[2]), Number(match[1]), 1) <= new Date()
      ) {
        err.expiry = "This card has expired.";
      }

      if (!/^\d{3,4}$/.test(pay.cvv)) err.cvv = "Invalid CVV.";
    }

    if (method === "paypal" && !emailRegex.test(pay.paypalEmail.trim())) {
      err.paypalEmail = "Enter your PayPal email.";
    }

    if (method === "wallet" && totals.total > WALLET_BALANCE) {
      err.wallet = "Your wallet balance is not enough for this order.";
    }

    return err;
  };

  // ===== الانتقال بين الخطوات =====
  const goTo = (n) => {
    setStep(n);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const continueToPayment = (e) => {
    e.preventDefault();
    const err = validateAddress();
    setErrors(err);
    if (Object.keys(err).length === 0) goTo(2);
  };

  const continueToReview = (e) => {
    e.preventDefault();
    const err = validatePayment();
    setErrors(err);
    if (Object.keys(err).length === 0) goTo(3);
  };

  // ===== تأكيد الطلب =====
  const placeOrder = () => {
    const number = `NM-${Date.now().toString().slice(-8)}`;
    const payment = methodLabel(method, pay);
    const orderRecord = {
      id: number,
      orderNumber: number,
      customerName: address.fullName,
      customerEmail: address.email,
      address: `${address.street}, ${address.city}`,
      items: cart.map(({ id, title, price, quantity, thumbnail }) => ({ id, title, price, quantity, thumbnail })),
      subtotal: totals.subtotal,
      discount: totals.discount,
      shipping: totals.shipping,
      total: totals.total,
      promoCode: typeof promo === "string" ? promo : promo?.code || null,
      paymentMethod: payment,
      status: "Pending",
      createdAt: new Date().toISOString(),
    };

    try {
      writeList(ORDERS_KEY, [orderRecord, ...readList(ORDERS_KEY)]);
      setOrder({ number, items: cart, totals, address, payment });
      dispatch(completeOrder());
    } catch {
      setErrors((currentErrors) => ({
        ...currentErrors,
        save: "Your order could not be saved. Please try again.",
      }));
      return;
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ===== صفحة نجاح الطلب =====
  if (order) {
    return (
      <div className={styles.page}>
        <div className={styles.success}>
          <div className={styles.successIcon}>✓</div>
          <h1>Thank you, {order.address.fullName.split(" ")[0]}!</h1>
          <p className={styles.successText}>
            Your order has been placed successfully.
          </p>

          <div className={styles.orderBox}>
            <div className={styles.orderRow}>
              <span>Order number</span>
              <strong>{order.number}</strong>
            </div>
            <div className={styles.orderRow}>
              <span>Payment</span>
              <strong>{order.payment}</strong>
            </div>
            <div className={styles.orderRow}>
              <span>Deliver to</span>
              <strong>
                {order.address.street}, {order.address.city}
              </strong>
            </div>
            <div className={styles.orderRow}>
              <span>Total paid</span>
              <strong>${order.totals.total.toFixed(2)}</strong>
            </div>
          </div>

          <Link to="/" className={styles.primaryBtn}>
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  // ===== السلة فاضية (ومفيش طلب اتأكد) =====
  if (cart.length === 0) {
    return (
      <div className={styles.page}>
        <div className={styles.success}>
          <h1>Your cart is empty</h1>
          <p className={styles.successText}>
            Add some products before checking out.
          </p>
          <Link to="/" className={styles.primaryBtn}>
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>Checkout</h1>

      {/* ===== شريط الخطوات (Address → Payment → Review) ===== */}
      <div className={styles.stepper}>
        {STEPS.map((label, i) => {
          const n = i + 1;
          return (
            <div
              key={label}
              className={`${styles.step} ${step > n ? styles.done : ""} ${step === n ? styles.active : ""}`}
            >
              <span className={styles.circle}>{step > n ? "✓" : n}</span>
              <span className={styles.stepLabel}>{label}</span>
            </div>
          );
        })}
      </div>

      <div className={styles.layout}>
        <div className={styles.card}>
          {/* ================= الخطوة 1: العنوان ================= */}
          {step === 1 && (
            <form onSubmit={continueToPayment} noValidate>
              <h2 className={styles.cardTitle}>Shipping Address</h2>

              {/* Guest checkout: مفيش لزوم لتسجيل حساب */}
              <p className={styles.guestNote}>
                Checking out as a guest, no account needed.
              </p>

              <div className={styles.grid}>
                <Field label="Full name" error={errors.fullName}>
                  <input
                    name="fullName"
                    value={address.fullName}
                    onChange={onAddress}
                    autoComplete="name"
                  />
                </Field>
                <Field label="Email" error={errors.email}>
                  <input
                    type="email"
                    name="email"
                    value={address.email}
                    onChange={onAddress}
                    autoComplete="email"
                  />
                </Field>
                <Field label="Phone" error={errors.phone}>
                  <input
                    name="phone"
                    value={address.phone}
                    onChange={onAddress}
                    placeholder="01xxxxxxxxx"
                    autoComplete="tel"
                  />
                </Field>
                <Field label="City" error={errors.city}>
                  <input
                    name="city"
                    value={address.city}
                    onChange={onAddress}
                    autoComplete="address-level2"
                  />
                </Field>
                <Field
                  label="Street address"
                  error={errors.street}
                  className={styles.full}
                >
                  <input
                    name="street"
                    value={address.street}
                    onChange={onAddress}
                    autoComplete="street-address"
                  />
                </Field>
              </div>

              <div className={styles.actions}>
                <Link to="/cart" className={styles.backBtn}>
                  ← Back to cart
                </Link>
                <button type="submit" className={styles.primaryBtn}>
                  Continue to Payment
                </button>
              </div>
            </form>
          )}

          {/* ================= الخطوة 2: الدفع ================= */}
          {step === 2 && (
            <form onSubmit={continueToReview} noValidate>
              <h2 className={styles.cardTitle}>Payment Method</h2>

              {/* اختيار طريقة الدفع */}
              <div className={styles.methods}>
                {METHODS.map((m) => (
                  <label
                    key={m.id}
                    className={`${styles.method} ${method === m.id ? styles.methodActive : ""}`}
                  >
                    <input
                      type="radio"
                      name="method"
                      value={m.id}
                      checked={method === m.id}
                      onChange={() => {
                        setMethod(m.id);
                        setErrors({});
                      }}
                    />
                    <span className={styles.radio} />
                    <span>
                      <strong>{m.title}</strong>
                      <small>{m.desc}</small>
                    </span>
                  </label>
                ))}
              </div>

              {/* --- بيانات الكارت --- */}
              {method === "card" && (
                <div className={`${styles.grid} ${styles.methodBody}`}>
                  <Field
                    label="Card number"
                    error={errors.cardNumber}
                    className={styles.full}
                  >
                    <input
                      name="cardNumber"
                      value={pay.cardNumber}
                      onChange={onPay}
                      placeholder="1234 5678 9012 3456"
                      inputMode="numeric"
                      autoComplete="cc-number"
                    />
                  </Field>
                  <Field
                    label="Name on card"
                    error={errors.cardName}
                    className={styles.full}
                  >
                    <input
                      name="cardName"
                      value={pay.cardName}
                      onChange={onPay}
                      autoComplete="cc-name"
                    />
                  </Field>
                  <Field label="Expiry date" error={errors.expiry}>
                    <input
                      name="expiry"
                      value={pay.expiry}
                      onChange={onPay}
                      placeholder="MM/YY"
                      inputMode="numeric"
                      autoComplete="cc-exp"
                    />
                  </Field>
                  <Field label="CVV" error={errors.cvv}>
                    <input
                      name="cvv"
                      value={pay.cvv}
                      onChange={onPay}
                      placeholder="123"
                      inputMode="numeric"
                      autoComplete="cc-csc"
                    />
                  </Field>
                </div>
              )}

              {/* --- PayPal --- */}
              {method === "paypal" && (
                <div className={`${styles.grid} ${styles.methodBody}`}>
                  <Field
                    label="PayPal email"
                    error={errors.paypalEmail}
                    className={styles.full}
                  >
                    <input
                      type="email"
                      name="paypalEmail"
                      value={pay.paypalEmail}
                      onChange={onPay}
                      placeholder="you@example.com"
                    />
                  </Field>
                </div>
              )}

              {/* --- الدفع عند الاستلام --- */}
              {method === "cod" && (
                <p className={`${styles.info} ${styles.methodBody}`}>
                  You will pay <strong>${totals.total.toFixed(2)}</strong> in
                  cash when your order arrives.
                </p>
              )}

              {/* --- المحفظة --- */}
              {method === "wallet" && (
                <div className={styles.methodBody}>
                  <p className={styles.info}>
                    Wallet balance:{" "}
                    <strong>${WALLET_BALANCE.toFixed(2)}</strong>
                    {totals.total <= WALLET_BALANCE && (
                      <>
                        {" "}
                        · After this order:{" "}
                        <strong>
                          ${(WALLET_BALANCE - totals.total).toFixed(2)}
                        </strong>
                      </>
                    )}
                  </p>
                  {errors.wallet && (
                    <small className={styles.error}>{errors.wallet}</small>
                  )}
                </div>
              )}

              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.backBtn}
                  onClick={() => goTo(1)}
                >
                  ← Back
                </button>
                <button type="submit" className={styles.primaryBtn}>
                  Review Order
                </button>
              </div>
            </form>
          )}

          {/* ================= الخطوة 3: المراجعة ================= */}
          {step === 3 && (
            <div>
              <h2 className={styles.cardTitle}>Review Your Order</h2>

              {/* العنوان */}
              <div className={styles.reviewBlock}>
                <div className={styles.reviewHead}>
                  <h3>Shipping to</h3>
                  <button type="button" onClick={() => goTo(1)}>
                    Edit
                  </button>
                </div>
                <p>{address.fullName}</p>
                <p>
                  {address.street}, {address.city}
                </p>
                <p>
                  {address.phone} · {address.email}
                </p>
              </div>

              {/* طريقة الدفع */}
              <div className={styles.reviewBlock}>
                <div className={styles.reviewHead}>
                  <h3>Payment</h3>
                  <button type="button" onClick={() => goTo(2)}>
                    Edit
                  </button>
                </div>
                <p>{methodLabel(method, pay)}</p>
              </div>

              {/* المنتجات */}
              <div className={styles.reviewBlock}>
                <div className={styles.reviewHead}>
                  <h3>Items</h3>
                  <Link to="/cart">Edit cart</Link>
                </div>
                {cart.map((item) => (
                  <div key={item.id} className={styles.reviewItem}>
                    <img src={item.thumbnail} alt={item.title} />
                    <span className={styles.reviewName}>{item.title}</span>
                    <span className={styles.reviewQty}>× {item.quantity}</span>
                    <strong>${(item.price * item.quantity).toFixed(2)}</strong>
                  </div>
                ))}
              </div>

              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.backBtn}
                  onClick={() => goTo(2)}
                >
                  ← Back
                </button>
                <button
                  type="button"
                  className={styles.primaryBtn}
                  onClick={placeOrder}
                >
                  Place Order · ${totals.total.toFixed(2)}
                </button>
              </div>
              {errors.save && <small className={styles.error}>{errors.save}</small>}
            </div>
          )}
        </div>

        {/* ===== ملخص الطلب على الجنب ===== */}
        <OrderSummary />
      </div>
    </div>
  );
}

export default Checkout;
