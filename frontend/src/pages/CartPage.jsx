import { useEffect, useState } from "react";
import axios from "axios";
import { Button, Alert, ListGroup, Card, Modal } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { Plus, Minus, Trash, ShoppingCart, CreditCard, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import LoadingSpinner from '../components/LoadingSpinner';
import { API_ENDPOINTS } from '../config/api';

const CartPage = () => {  const [cart, setCart] = useState([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage] = useState(5);
  const [isDarkMode, setIsDarkMode] = useState(localStorage.getItem("darkMode") === "true");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const handleDarkModeToggle = () => {
      setIsDarkMode(localStorage.getItem("darkMode") === "true");
    };

    window.addEventListener('darkModeToggle', handleDarkModeToggle);

    return () => {
      window.removeEventListener('darkModeToggle', handleDarkModeToggle);
    };
  }, []);

  useEffect(() => {
    const fetchCart = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(API_ENDPOINTS.CART, {
          headers: { Authorization: `Bearer ${token}` },
        });
  
        const cartData = response.data;
        // Aggiunta di controllo per item.product
        const productsWithDetails = await Promise.all(
          cartData.products.map(async (item) => {
            if (!item.product || !item.product._id) {
              console.warn("Prodotto non trovato o non valido:", item);
              return null; // Ignora prodotti non validi
            }
            const productId = item.product._id;            const productRes = await axios.get(
              API_ENDPOINTS.PRODUCT_BY_ID(productId)
            );
            return { ...productRes.data, quantity: item.quantity, cartItemId: item._id };
          })
        );

        // Filtra prodotti nulli
        const validProducts = productsWithDetails.filter(item => item !== null);
        setCart(validProducts);
        const totalPrice = validProducts.reduce((sum, item) => sum + item.price * item.quantity, 0);
        setTotal(totalPrice);
      } catch (error) {
        console.error("Errore nel recupero del carrello:", error);
        setError("Errore nel recupero del carrello.");
      } finally {
        setLoading(false); // Imposta loading su false dopo il caricamento
      }
    };
  
    fetchCart();
  }, []);



  const updateQuantity = async (productId, newQuantity) => {
    if (newQuantity < 1) return; // Evita quantità negative o zero

    try {
      const token = localStorage.getItem("token");      await axios.put(
        API_ENDPOINTS.CART,
        { productId, quantity: newQuantity },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const updatedCart = cart.map(item =>
        item._id === productId ? { ...item, quantity: newQuantity } : item
      );
      setCart(updatedCart);

      // Ricalcola il totale
      const totalPrice = updatedCart.reduce((sum, item) => sum + item.price * item.quantity, 0);
      setTotal(totalPrice);
    } catch (error) {
      console.error("Errore aggiornamento quantità", error);
    }
  };

  const removeFromCart = async (productId) => {
    console.log("Tentativo di rimozione prodotto con ID:", productId);

    try {
        const token = localStorage.getItem("token");
        await axios.delete(API_ENDPOINTS.CART_REMOVE(productId), { 
            headers: { Authorization: `Bearer ${token}` }
        });

        const updatedCart = cart.filter(item => item._id !== productId);
        setCart(updatedCart);

        const totalPrice = updatedCart.reduce((sum, item) => sum + item.price * item.quantity, 0);
        setTotal(totalPrice);

        setShowModal(false);
    } catch (err) {
        console.error("Errore nella rimozione del prodotto", err);
        setError("Errore nella rimozione del prodotto.");
    }
};



  const clearCart = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(API_ENDPOINTS.CART, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCart([]); // Pulisce lo stato
      setTotal(0);
    } catch {
      setError("Errore nello svuotamento del carrello.");
    }
  };
  const handleShowModal = (item) => {
    setItemToDelete(item._id); // Qui memorizzi già l'ID giusto
    setShowModal(true);
  };


  const handleCloseModal = () => {
    setShowModal(false);
    setItemToDelete(null);
  };  return (
    <div 
      className={isDarkMode ? 'glassmorphism-bg' : 'glassmorphism-bg light-mode'}
      style={{
        minHeight: '100vh',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Animated Background Elements */}
      <div style={{
        position: 'absolute',
        width: '200px',
        height: '200px',
        borderRadius: '50%',
        background: 'rgba(255, 255, 255, 0.1)',
        top: '10%',
        left: '80%',
        animation: 'float 6s ease-in-out infinite'
      }} />
      <div style={{
        position: 'absolute',
        width: '150px',
        height: '150px',
        borderRadius: '50%',
        background: 'rgba(255, 255, 255, 0.05)',
        bottom: '20%',
        left: '10%',
        animation: 'float 8s ease-in-out infinite reverse'
      }} />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="container"
        style={{ paddingTop: '120px', paddingBottom: '60px', position: 'relative', zIndex: 1 }}
      >
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-center mb-5"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3, type: "spring", stiffness: 200 }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(20px)',
              marginBottom: '20px',
              border: '1px solid rgba(255, 255, 255, 0.3)'
            }}
          >
            <ShoppingCart size={40} color="white" />
          </motion.div>          <h1 
            className="responsive-text-primary"
            style={{
              fontSize: '3.5rem',
              fontWeight: '700',
              background: isDarkMode 
                ? 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)'
                : 'linear-gradient(135deg, #000000 0%, #333333 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '10px',
              textShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
            }}
          >
            Il tuo Carrello
          </h1>
          <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '1.2rem' }}>
            Gestisci i tuoi prodotti preferiti
          </p>
        </motion.div>

        {/* Error Alert */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-4"
            >
              <Alert 
                variant="danger" 
                style={{
                  background: 'rgba(220, 53, 69, 0.1)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(220, 53, 69, 0.3)',
                  borderRadius: '20px',
                  color: 'white'
                }}
              >
                {error}
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Cart Container */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)',
            borderRadius: '30px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            padding: '40px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
            marginBottom: '30px'
          }}
        >          {loading ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-5"
            >
              <LoadingSpinner />
            </motion.div>
          ) : cart.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-5"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100px',
                  height: '100px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  marginBottom: '20px'
                }}
              >
                <ShoppingCart size={50} color="rgba(255, 255, 255, 0.6)" />
              </motion.div>
              <h5 style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '1.5rem', fontWeight: '600' }}>
                Il tuo carrello è vuoto
              </h5>
              <p style={{ color: 'rgba(255, 255, 255, 0.6)', marginTop: '10px' }}>
                Aggiungi alcuni prodotti per iniziare!
              </p>
            </motion.div>          ) : (
            <AnimatePresence>
              {(() => {
                // Pagination Logic
                const totalPages = Math.ceil(cart.length / itemsPerPage);
                const startIndex = currentPage * itemsPerPage;
                const endIndex = startIndex + itemsPerPage;
                const currentItems = cart.slice(startIndex, endIndex);

                return (
                  <>
                    {/* Pagination Controls - Top */}
                    {cart.length > itemsPerPage && (                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                        className="cart-pagination-controls"
                        style={{
                          marginBottom: '25px',
                          padding: '15px 20px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          borderRadius: '12px',
                          border: '1px solid rgba(255, 255, 255, 0.1)'
                        }}
                      >
                        <div className="cart-pagination-buttons">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                          disabled={currentPage === 0}
                          style={{
                            background: currentPage === 0 ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.2)',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '8px 16px',
                            color: 'white',
                            cursor: currentPage === 0 ? 'not-allowed' : 'pointer',
                            opacity: currentPage === 0 ? 0.5 : 1,
                            transition: 'all 0.3s ease'
                          }}
                        >
                          ← Precedente
                        </motion.button>                        </div>
                        
                        <span style={{ 
                          color: 'white', 
                          fontWeight: '600',
                          fontSize: '1rem'
                        }}>
                          Pagina {currentPage + 1} di {totalPages} 
                          <span style={{ color: 'rgba(255, 255, 255, 0.7)', marginLeft: '10px' }}>
                            ({cart.length} prodotti totali)
                          </span>
                        </span>
                        
                        <div className="cart-pagination-buttons">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                          disabled={currentPage === totalPages - 1}
                          style={{
                            background: currentPage === totalPages - 1 ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.2)',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '8px 16px',
                            color: 'white',
                            cursor: currentPage === totalPages - 1 ? 'not-allowed' : 'pointer',
                            opacity: currentPage === totalPages - 1 ? 0.5 : 1,
                            transition: 'all 0.3s ease'
                          }}
                        >
                          Successiva →
                        </motion.button>
                        </div>
                      </motion.div>
                    )}

                    {/* Cart Items */}
                    {currentItems.map((item, index) => (                <motion.div
                  key={item._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '20px',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    padding: '25px',
                    marginBottom: '20px'
                  }}
                  className="cart-item-container"
                  whileHover={{ 
                    y: -5,
                    transition: { duration: 0.2 }
                  }}
                >
                  <div className="cart-item-info">
                    <motion.img 
                      src={item.images} 
                      alt={item.name} 
                      className="cart-item-image"
                      style={{ 
                        width: "80px", 
                        height: "80px", 
                        marginRight: "25px",
                        borderRadius: "15px",
                        objectFit: "cover",
                        border: '2px solid rgba(255, 255, 255, 0.2)'
                      }}
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.2 }}
                    />
                    <div>
                      <h5 style={{ 
                        color: 'white', 
                        fontWeight: '700', 
                        marginBottom: '8px',
                        fontSize: '1.3rem'
                      }}>
                        {item.name}
                      </h5>
                      <h6 style={{ 
                        color: '#f093fb', 
                        fontWeight: '600',
                        fontSize: '1.1rem'
                      }}>
                        Totale: €{(item.price * item.quantity).toFixed(2)}
                      </h6>
                      <p style={{ 
                        color: 'rgba(255, 255, 255, 0.7)', 
                        margin: 0,
                        fontSize: '0.9rem'
                      }}>
                        Prezzo unitario: €{item.price.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="cart-item-actions">
                    <div className="cart-quantity-controls">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => updateQuantity(item._id, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                      style={{
                        background: item.quantity <= 1 ? 'rgba(108, 117, 125, 0.3)' : 'rgba(255, 255, 255, 0.2)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        borderRadius: '12px',
                        padding: '8px 12px',
                        color: 'white',
                        marginRight: '15px',
                        cursor: item.quantity <= 1 ? 'not-allowed' : 'pointer'
                      }}
                    >
                      <Minus size={16} />
                    </motion.button>
                    
                    <span style={{ 
                      color: 'white', 
                      fontWeight: '700', 
                      fontSize: '1.2rem',
                      minWidth: '40px',
                      textAlign: 'center',
                      background: 'rgba(255, 255, 255, 0.1)',
                      backdropFilter: 'blur(10px)',
                      borderRadius: '12px',
                      padding: '8px 15px',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      margin: '0 15px'
                    }}>
                      {item.quantity}
                    </span>
                      <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => updateQuantity(item._id, item.quantity + 1)}
                      style={{
                        background: 'rgba(102, 126, 234, 0.3)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(102, 126, 234, 0.5)',
                        borderRadius: '12px',
                        padding: '8px 12px',
                        color: 'white',
                        marginRight: '15px',
                        cursor: 'pointer'
                      }}
                    >
                      <Plus size={16} />
                    </motion.button>
                    </div>
                    
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleShowModal(item)}
                      style={{
                        background: 'rgba(220, 53, 69, 0.3)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(220, 53, 69, 0.5)',
                        borderRadius: '12px',
                        padding: '8px 12px',
                        color: 'white',
                        cursor: 'pointer'
                      }}
                    >
                      <Trash size={16} />
                    </motion.button></div>
                </motion.div>
              ))}
                  </>
                );
              })()}
            </AnimatePresence>
          )}
        </motion.div>

        {/* Cart Summary and Actions */}        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="cart-summary"
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)',
            borderRadius: '25px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            padding: '30px',
            textAlign: 'right'
          }}
        >
          <motion.h3 
            style={{ 
              color: 'white', 
              fontWeight: '700',
              fontSize: '2.2rem',
              marginBottom: '25px',
              background: 'linear-gradient(135deg, #ffffff 0%, #f093fb 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.4, delay: 0.8 }}
          >
            Totale: €{total.toFixed(2)}
          </motion.h3>
          
          <div className="cart-summary-buttons d-flex justify-content-end gap-3">
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={clearCart}
              disabled={cart.length === 0}
              style={{
                background: cart.length === 0 
                  ? 'rgba(108, 117, 125, 0.3)' 
                  : 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)',
                border: 'none',
                borderRadius: '20px',
                padding: '15px 30px',
                color: 'white',
                fontWeight: '600',
                fontSize: '1.1rem',
                cursor: cart.length === 0 ? 'not-allowed' : 'pointer',
                backdropFilter: 'blur(10px)',
                boxShadow: cart.length === 0 ? 'none' : '0 10px 30px rgba(220, 53, 69, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}
            >
              <Trash2 size={20} />
              Svuota Carrello
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/checkout")}
              disabled={cart.length === 0}
              style={{
                background: cart.length === 0 
                  ? 'rgba(108, 117, 125, 0.3)' 
                  : 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                border: 'none',
                borderRadius: '20px',
                padding: '15px 30px',
                color: 'white',
                fontWeight: '600',
                fontSize: '1.1rem',
                cursor: cart.length === 0 ? 'not-allowed' : 'pointer',
                backdropFilter: 'blur(10px)',
                boxShadow: cart.length === 0 ? 'none' : '0 10px 30px rgba(40, 167, 69, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}
            >
              <CreditCard size={20} />
              Procedi al Checkout
            </motion.button>
          </div>
        </motion.div>
      </motion.div>

      {/* Modern Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1050
            }}
            onClick={handleCloseModal}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(20px)',
                borderRadius: '25px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                padding: '40px',
                maxWidth: '500px',
                width: '90%',
                textAlign: 'center'
              }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: 'rgba(220, 53, 69, 0.2)',
                  marginBottom: '20px'
                }}
              >
                <Trash size={30} color="#dc3545" />
              </motion.div>
              
              <h4 style={{ color: 'white', fontWeight: '700', marginBottom: '15px' }}>
                Conferma Eliminazione
              </h4>
              
              <p style={{ color: 'rgba(255, 255, 255, 0.8)', marginBottom: '30px' }}>
                Sei sicuro di voler eliminare questo prodotto dal carrello?
              </p>
              
              <div className="d-flex justify-content-center gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCloseModal}
                  style={{
                    background: 'rgba(108, 117, 125, 0.3)',
                    border: '1px solid rgba(108, 117, 125, 0.5)',
                    borderRadius: '15px',
                    padding: '12px 25px',
                    color: 'white',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Annulla
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => removeFromCart(itemToDelete)}
                  style={{
                    background: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)',
                    border: 'none',
                    borderRadius: '15px',
                    padding: '12px 25px',
                    color: 'white',
                    fontWeight: '600',
                    cursor: 'pointer',
                    boxShadow: '0 5px 15px rgba(220, 53, 69, 0.3)'
                  }}
                >
                  Elimina
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
      `}</style>
    </div>
  );
};

export default CartPage;