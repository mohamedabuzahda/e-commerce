import { configureStore } from "@reduxjs/toolkit";
import cartReducer from "./cartSlice.js";

function readCartState() {
  try {
    const state = JSON.parse(localStorage.getItem("shopEaseCart") || "null");
    return state && Array.isArray(state.items) ? state : undefined;
  } catch {
    return undefined;
  }
}

export const store = configureStore({
  reducer: {
    cart: cartReducer,
  },
  preloadedState: { cart: readCartState() },
});

store.subscribe(() => {
  try {
    localStorage.setItem("shopEaseCart", JSON.stringify(store.getState().cart));
  } catch (error) {
    console.error("Cart changes could not be saved.", error);
  }
});