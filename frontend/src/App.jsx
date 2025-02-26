import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ToastContainer } from 'react-toastify';
import HomePage from "./pages/HomePage";
import CartPage from "./pages/CartPage";
import Layout from "./components/Layout";
import ProductsPage from "./pages/ProductsPage";
import LoginPage from "./pages/LoginPage";
import OrderPage from "./pages/OrderPage"; // Importa OrderPage
import SuccessPage from "./pages/SuccessPage";
import AdminHomePage from "./pages/AdminHomePage";
import Footer from "./components/Footer"; // Importa Footer

function App() {
  return (
    <Router>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/checkout" element={<OrderPage />} /> {/* Aggiunta questa riga */}
            <Route path="/success" element={<SuccessPage />} />
            <Route path="/admin" element={<AdminHomePage />} />
          </Routes>
        </Layout>
        <Footer /> {/* Aggiunta questa riga */}
        <ToastContainer />
      </div>
    </Router>
  );
}

export default App;