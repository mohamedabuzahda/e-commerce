import { createSlice } from "@reduxjs/toolkit";

// ===== إعدادات الأسعار (عدليها من هنا بس) =====
export const SHIPPING_FEE = 10; // سعر الشحن الثابت
export const FREE_SHIPPING_OVER = 100; // الشحن ببلاش لو الـ subtotal وصل للرقم ده

// ===== أكواد الخصم المتاحة =====
// percent = خصم بنسبة من الـ subtotal | shipping = شحن مجاني
export const PROMOS = {
  SAVE10: { type: "percent", value: 10, label: "10% off your order" },
  SAVE20: { type: "percent", value: 20, label: "20% off your order" },
  FREESHIP: { type: "shipping", value: 0, label: "Free shipping" },
};

// ===== دالة حساب الأسعار (بنستخدمها في السلة وفي الـ Checkout) =====
export function calcTotals(items, promoCode) {
  const round = (n) => Math.round(n * 100) / 100;
  const promo = PROMOS[promoCode] || null;

  const subtotal = round(
    items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  );

  // الخصم بالنسبة
  const discount =
    promo && promo.type === "percent" ? round((subtotal * promo.value) / 100) : 0;

  // الشحن: مجاني لو السلة فاضية أو الطلب كبير أو الكود شحن مجاني
  const freeShipping =
    subtotal === 0 ||
    subtotal >= FREE_SHIPPING_OVER ||
    (promo && promo.type === "shipping");
  const shipping = freeShipping ? 0 : SHIPPING_FEE;

  const total = round(subtotal - discount + shipping);

  return { subtotal, discount, shipping, total };
}

const cartSlice = createSlice({
  name: "cart",
  initialState: {
    items: [],      // المنتجات في السلة
    stockMap: {},   // الـ stock المتبقي
    promo: null,    // كود الخصم المطبق (مثلاً "SAVE10")
  },
  reducers: {
    // تسجيل الـ stock أول ما المنتجات تتحمل
    // بنسجل الـ stock للمنتج مرة واحدة بس، عشان لو رجعنا للصفحة
    // متتصفرش الكميات اللي اتحجزت في السلة
    initStock: (state, action) => {
      action.payload.forEach((p) => {
        if (state.stockMap[p.id] === undefined) {
          state.stockMap[p.id] = p.stock;
        }
      });
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

    // تفريغ السلة (بيرجع الـ stock ويشيل كود الخصم)
    clearCart: (state) => {
      state.items.forEach((item) => {
        state.stockMap[item.id] =
          (state.stockMap[item.id] || 0) + item.quantity;
      });
      state.items = [];
      state.promo = null;
    },

    // تطبيق كود خصم (الكود بيتراجع صحته في الكومبوننت قبل ما نبعته هنا)
    applyPromo: (state, action) => {
      state.promo = action.payload;
    },

    // شيل كود الخصم
    removePromo: (state) => {
      state.promo = null;
    },

    // إتمام الطلب: بنفضي السلة من غير ما نرجع الـ stock
    // (لأن المنتجات اتباعت فعلاً فالـ stock المتبقي يفضل زي ما هو)
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
