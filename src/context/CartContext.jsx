import React, { createContext, useContext, useState } from "react";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [stockMap, setStockMap] = useState({});

  const initStock = (products) => {
    const map = {};
    products.forEach((p) => {
      map[p.id] = p.stock;
    });
    setStockMap(map);
  };

  const addToCart = (product) => {
    if (stockMap[product.id] <= 0) return;

    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });

    setStockMap((prev) => ({
      ...prev,
      [product.id]: prev[product.id] - 1,
    }));
  };

  // ===== دالة تقليل الكمية =====
  const decreaseQty = (id) => {
    setCart((prev) => {
      const item = prev.find((i) => i.id === id);
      if (!item) return prev;

      if (item.quantity === 1) {
        // لو الكمية 1 → نشيله من الكارت
        return prev.filter((i) => i.id !== id);
      }

      // نقلل الكمية
      return prev.map((i) =>
        i.id === id ? { ...i, quantity: i.quantity - 1 } : i
      );
    });

    // نرجع الـ stock
    setStockMap((prev) => ({
      ...prev,
      [id]: (prev[id] || 0) + 1,
    }));
  };

  const removeFromCart = (id) => {
    const item = cart.find((i) => i.id === id);
    if (item) {
      setStockMap((prev) => ({
        ...prev,
        [id]: prev[id] + item.quantity,
      }));
    }
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const clearCart = () => {
    const newStock = { ...stockMap };
    cart.forEach((item) => {
      newStock[item.id] = (newStock[item.id] || 0) + item.quantity;
    });
    setStockMap(newStock);
    setCart([]);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        decreaseQty,      // ← ضيفناها
        removeFromCart,
        clearCart,
        stockMap,
        initStock,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);