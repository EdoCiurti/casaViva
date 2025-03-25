import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { AnimatePresence, motion } from "framer-motion";
import { useState, useEffect } from "react";
import HomePage from "./pages/HomePage";
import ProfilePage from './pages/ProfilePage';
import CartPage from "./pages/CartPage";
import Layout from "./components/Layout";
import ProductsPage from "./pages/ProductsPage";
import LoginPage from "./pages/LoginPage";
import OrderPage from "./pages/OrderPage";
import SuccessPage from "./pages/SuccessPage";
import AdminHomePage from "./pages/AdminHomePage";
import WishlistPage from "./pages/wishPage"; // Importa la pagina della wishlist
import Footer from "./components/Footer";
import "./App.css";

function App() {
  const location = useLocation();
  const [darkMode, setDarkMode] = useState(localStorage.getItem("darkMode") === "true");

  useEffect(() => {
    const handleDarkModeToggle = () => {
      setDarkMode(localStorage.getItem("darkMode") === "true");
    };

    window.addEventListener("darkModeToggle", handleDarkModeToggle);
    return () => {
      window.removeEventListener("darkModeToggle", handleDarkModeToggle);
    };
  }, []);

  return (
    <motion.div
      key={darkMode} // Permette l'animazione tra light/dark mode
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
      className={darkMode ? "dark-mode" : "light-mode"}
      style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
    >
      <Layout>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<HomePage darkMode={darkMode} />} />
            <Route path="/cart" element={<CartPage darkMode={darkMode} />} />
            <Route path="/products" element={<ProductsPage darkMode={darkMode} />} />
            <Route path="/wishlist" element={<WishlistPage darkMode={darkMode} />} /> {/* Aggiungi la route per la wishlist */}
            <Route path="/login" element={<LoginPage darkMode={darkMode} />} />
            <Route path="/checkout" element={<OrderPage darkMode={darkMode} />} />
            <Route path="/success" element={<SuccessPage darkMode={darkMode} />} />
            <Route path="/admin" element={<AdminHomePage darkMode={darkMode} />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Routes>
        </AnimatePresence>
      </Layout>
      <Footer />
      <ToastContainer />
    </motion.div>
  );
}

const AppWrapper = () => {
  return (
    <Router>
      <App />
    </Router>
  );
};

export default AppWrapper;