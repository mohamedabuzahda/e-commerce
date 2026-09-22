import { createSlice } from "@reduxjs/toolkit";

const cartSlice = createSlice({
  name: "cart",
  initialState: {
    items: [],      // المنتجات في السلة
    stockMap: {},   // الـ stock المتبقي
  },
  reducers: {
    // تسجيل الـ stock أول ما المنتجات تتحمل
    initStock: (state, action) => {
      const map = {};
      action.payload.forEach((p) => {
        map[p.id] = p.stock;
      });
      state.stockMap = map;
    },

    // إضافة للسلة
    addToCart: (state, action) => {
      const product = action.payload;
      if (state.stockMap[product.id] <= 0) return;

      const existing = state.items.find((item) => item.id === product.id);

      if (existing) {
        existing.quantity += 1;
      } else {
        state.items.push({ ...product, quantity: 1 });
      }

      // نقلل الـ stock
      state.stockMap[product.id] -= 1;
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
    },
  },
});

export const {
  initStock,
  addToCart,
  decreaseQty,
  removeFromCart,
  clearCart,
} = cartSlice.actions;

export default cartSlice.reducer;