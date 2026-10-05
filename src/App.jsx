import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { LanguageProvider } from "./context/LanguageContext";
import Navbar from "./components/Navbar";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Products from "./pages/Products";
import ProductDetails from "./pages/ProductDetails";
import Cart from "./pages/Cart";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./admin/Dashboard";
import Checkout from "./pages/Checkout";
import CustomerProfile from "./customer/Profile";
import SupportChat from "./components/SupportChat";
import Wishlist from "./pages/Wishlist";
import Orders from "./pages/Orders";
import OrderDetails from "./pages/OrderDetails";
import SellerDashboard from "./seller/Dashboard";
import SellerOrders from "./seller/Orders";

function RequireAuth({ children }) {
  const { user } = useAuth();
  const location = useLocation();

  return user ? children : <Navigate to="/login" state={{ from: location }} replace />;
}

function RequireAdmin({ children }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return user.role === "admin" ? children : <Navigate to="/" replace />;
}

function RequireCustomer({ children }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return user.role === "admin" ? <Navigate to="/admin" replace /> : children;
}

function RequireSeller({ children }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return user.role === "seller" ? children : <Navigate to="/" replace />;
}

function AppLayout() {
  const { pathname } = useLocation();
  const isAuthPage = pathname === "/login" || pathname === "/register";
  const isAdminPage = pathname.startsWith("/admin");

  return (
    <>
      {!isAuthPage && <Navbar />}
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Home />} />
        <Route path="/admin" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
        <Route path="/customer" element={<RequireCustomer><CustomerProfile /></RequireCustomer>} />
        <Route path="/seller" element={<RequireSeller><SellerDashboard /></RequireSeller>} />
        <Route path="/seller/orders" element={<RequireSeller><SellerOrders /></RequireSeller>} />
        <Route path="/products" element={<Products />} />
        <Route path="/product/:id" element={<ProductDetails />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/wishlist" element={<RequireAuth><Wishlist /></RequireAuth>} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/orders/:id" element={<OrderDetails />} />
        <Route path="*" element={<RequireAuth><NotFound /></RequireAuth>} />
      </Routes>
      {!isAuthPage && <SupportChat />}
      {!isAuthPage && !isAdminPage && <Footer />}
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <BrowserRouter>
          <AppLayout />
        </BrowserRouter>
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;