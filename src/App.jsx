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
        <Route path="/products" element={<RequireAuth><Products /></RequireAuth>} />
        <Route path="/product/:id" element={<RequireAuth><ProductDetails /></RequireAuth>} />
        <Route path="/cart" element={<RequireAuth><Cart /></RequireAuth>} />
        <Route path="/checkout" element={<RequireAuth><Checkout /></RequireAuth>} />
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