import { createSlice } from "@reduxjs/toolkit";

export const SHIPPING_FEE = 10;
export const FREE_SHIPPING_OVER = 100;
export const PROMOS = {
  SAVE10: { type: "percent", value: 10, label: "10% off your order" },
  SAVE20: { type: "percent", value: 20, label: "20% off your order" },
  FREESHIP: { type: "shipping", value: 0, label: "Free shipping" },
};

export function calcTotals(items, promoValue) {
  const round = (value) => Math.round(value * 100) / 100;
  const promo = typeof promoValue === "string" ? PROMOS[promoValue] : promoValue;
  const promoType = promo?.type?.toLowerCase();
  const subtotal = round(items.reduce((sum, item) => sum + item.price * item.quantity, 0));
  const minimumOrder = Number(promo?.minimumOrder || 0);
  const value = Number(promo?.value);
  const meetsMinimum = subtotal >= minimumOrder;
  const discount = !meetsMinimum || !Number.isFinite(value)
    ? 0
    : promoType === "percent"
      ? Math.min(subtotal, round(subtotal * value / 100))
      : promoType === "flat"
        ? Math.min(subtotal, round(value))
        : 0;
  const freeShipping = subtotal === 0 || subtotal >= FREE_SHIPPING_OVER || promoType === "shipping";
  const shipping = freeShipping ? 0 : SHIPPING_FEE;

  return { subtotal, discount, shipping, total: round(subtotal - discount + shipping) };
}

const cartSlice = createSlice({
  name: "cart",
  initialState: {
    items: [],      // المنتجات في السلة
    stockMap: {},   // الـ stock المتبقي
    promo: null,
  },
  reducers: {
    // تسجيل الـ stock أول ما المنتجات تتحمل
    initStock: (state, action) => {
      action.payload.forEach((product) => {
        if (state.stockMap[product.id] === undefined) {
          state.stockMap[product.id] = product.stock;
        }
      });
    },

    // إضافة للسلة
    addToCart: (state, action) => {
      const product = action.payload;
      const remaining = state.stockMap[product.id] ?? product.stock ?? 0;
      if (remaining <= 0) return;

      const existing = state.items.find((item) => item.id === product.id);

      if (existing) {
        existing.quantity += 1;
      } else {
        state.items.push({ ...product, quantity: 1 });
      }

      // نقلل الـ stock
      state.stockMap[product.id] = remaining - 1;
    },

    // تقليل الكمية
    decreaseQty: (state, action) => {
      const id = action.payload;
      const item = state.items.find((i) => i.id === id);

      if (!item) return;

      if (item.quantity === 1) {
        state.items = state.items.filter((i) => i.id !== id);
      } else {
        item.quantity -= 1;
      }

      // نرجع الـ stock
      state.stockMap[id] = (state.stockMap[id] || 0) + 1;
    },

    // حذف المنتج بالكامل
    removeFromCart: (state, action) => {
      const id = action.payload;
      const item = state.items.find((i) => i.id === id);

      if (item) {
        state.stockMap[id] = (state.stockMap[id] || 0) + item.quantity;
      }

      state.items = state.items.filter((i) => i.id !== id);
    },

    // تفريغ السلة
    clearCart: (state) => {
      state.items.forEach((item) => {
        state.stockMap[item.id] =
          (state.stockMap[item.id] || 0) + item.quantity;
      });
      state.items = [];
      state.promo = null;
    },

    applyPromo: (state, action) => {
      state.promo = action.payload;
    },

    removePromo: (state) => {
      state.promo = null;
    },

    completeOrder: (state) => {
      state.items = [];
      state.promo = null;
    },
  },
});

export const {
  initStock,
  addToCart,
  decreaseQty,
  removeFromCart,
  clearCart,
  applyPromo,
  removePromo,
  completeOrder,
} = cartSlice.actions;

export default cartSlice.reducer;