import React from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { addToCart, decreaseQty, removeFromCart } from "../store/cartSlice";
import styles from "../styles/Cart.module.css";

function Cart() {
  const dispatch = useDispatch();
  const cart = useSelector((state) => state.cart.items);

  const total = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  if (cart.length === 0) {
    return (
      <div className={styles.empty}>
        <h2>Your cart is empty</h2>
        <Link to="/products" className={styles.link}>
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Cart</h1>

      <div className={styles.table}>
        <div className={styles.header}>
          <span>Description</span>
          <span>Quantity</span>
          <span>Remove</span>
          <span>Price</span>
        </div>

        {cart.map((item) => (
          <div key={item.id} className={styles.row}>
            <div className={styles.desc}>
              <img src={item.thumbnail} alt={item.title} />
              <div>
                <h3>{item.title}</h3>
                <p>Product Code: {item.sku || item.id}</p>
              </div>
            </div>

            <div className={styles.qty}>
              <button onClick={() => dispatch(addToCart(item))}>+</button>
              <span>{item.quantity}</span>
              <button onClick={() => dispatch(decreaseQty(item.id))}>−</button>
            </div>

            <button
              className={styles.remove}
              onClick={() => dispatch(removeFromCart(item.id))}
            >
              ×
            </button>

            <div className={styles.price}>
              ${(item.price * item.quantity).toFixed(2)}
            </div>
          </div>
        ))}
      </div>

      <div className={styles.total}>
        <span>Total</span>
        <strong>${total.toFixed(2)}</strong>
      </div>
      <Link to="/checkout" className={styles.link}>Continue to checkout</Link>
    </div>
  );
}

export default Cart;