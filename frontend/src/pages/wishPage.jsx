import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Trash, Heart, ShoppingCart, Package, ArrowLeft, Star, Calendar } from "lucide-react";
import LoadingSpinner from "../components/LoadingSpinner";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { API_ENDPOINTS } from '../config/api';

const WishlistPage = () => {
  const [wishlist, setWishlist] = useState([]);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [darkMode, setDarkMode] = useState(localStorage.getItem("darkMode") === "true");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const navigate = useNavigate();
  useEffect(() => {
    const fetchWishlist = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(API_ENDPOINTS.WISHLIST, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const wishlistData = response.data;
        const productsWithDetails = await Promise.all(
          wishlistData.products.map(async (item) => {
            const productId = item.product._id;
            const productRes = await axios.get(
              API_ENDPOINTS.PRODUCT_BY_ID(productId)
            );
            return { ...productRes.data, addedAt: item.addedAt };
          })
        );

        setWishlist(productsWithDetails);
      } catch (error) {
        console.error("Errore nel recupero della wishlist:", error);
        setError("Errore nel recupero della wishlist.");
      } finally {
        setLoading(false);
      }
    };

    fetchWishlist();
  }, []);

  useEffect(() => {
    const handleDarkModeToggle = () => {
      setDarkMode(localStorage.getItem("darkMode") === "true");
    };

    window.addEventListener('darkModeToggle', handleDarkModeToggle);

    return () => {
      window.removeEventListener('darkModeToggle', handleDarkModeToggle);
    };
  }, []);

  const removeFromWishlist = async (productId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(API_ENDPOINTS.WISHLIST_REMOVE(productId), {
        headers: { Authorization: `Bearer ${token}` },
      });

      setWishlist((prev) => prev.filter((item) => item._id !== productId));
      setShowModal(false);

      toast.success("Prodotto rimosso dalla wishlist!", {
        position: "top-right",
        autoClose: 3000,
        theme: "colored",
      });
    } catch (err) {
      console.error("Errore nella rimozione del prodotto", err);
      setError("Errore nella rimozione del prodotto.");
    }
  };

  const clearWishlist = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(API_ENDPOINTS.WISHLIST, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setWishlist([]); // Pulisce lo stato
    } catch {
      setError("Errore nello svuotamento della wishlist.");
    }
  };

  const handleShowModal = (item) => {
    setItemToDelete(item._id);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setItemToDelete(null);
  };

  const addToCart = async (productId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Devi essere loggato per aggiungere prodotti al carrello.");
        return;
      }      await axios.post(
        API_ENDPOINTS.CART,
        { productId, quantity: 1 },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Prodotto aggiunto al carrello!", {
        position: "top-right",
        autoClose: 3000,
        theme: "colored",
      });
    } catch (err) {
      console.error("Errore nell'aggiunta al carrello:", err);
      setError("Errore nell'aggiunta al carrello.");
    }
  };
  const addAllToCart = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Devi essere loggato per aggiungere prodotti al carrello.");
        return;
      }

      await Promise.all(
        wishlist.map((item) =>          axios.post(
            API_ENDPOINTS.CART,
            { productId: item._id, quantity: 1 },
            { headers: { Authorization: `Bearer ${token}` } }
          )
        )
      );

      toast.success("Tutti i prodotti sono stati aggiunti al carrello!", {
        position: "top-right",
        autoClose: 3000,
        theme: "colored",
      });

      navigate("/cart");
    } catch (err) {
      console.error("Errore nell'aggiunta dei prodotti al carrello:", err);
      setError("Errore nell'aggiunta dei prodotti al carrello.");
    }
  };

  // Calcola gli elementi da mostrare per la pagina corrente
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = wishlist.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(wishlist.length / itemsPerPage);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };return (
    <div className={`glass-container ${darkMode ? 'dark-mode' : 'light-mode'}`} style={{
      minHeight: '100vh',
      position: 'relative',
      overflow: 'hidden'
    }}>      {/* Animated Background Elements */}
      <motion.div
        animate={{
          rotate: [0, 360],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear"
        }}
        style={{
          position: 'absolute',
          top: '10%',
          left: '10%',
          width: '100px',
          height: '100px',
          background: `rgba(255, 255, 255, ${darkMode ? '0.05' : '0.1'})`,
          borderRadius: '50%',
          zIndex: 1
        }}
      />
      <motion.div
        animate={{
          y: [0, -30, 0],
          rotate: [0, 180, 360],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        style={{
          position: 'absolute',
          top: '60%',
          right: '15%',
          width: '80px',
          height: '80px',
          background: `rgba(255, 255, 255, ${darkMode ? '0.04' : '0.08'})`,
          borderRadius: '20px',
          zIndex: 1
        }}
      />
      <motion.div
        animate={{
          x: [0, 20, -20, 0],
          scale: [1, 1.1, 0.9, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        style={{
          position: 'absolute',
          bottom: '20%',
          left: '20%',
          width: '60px',
          height: '60px',
          background: `rgba(255, 255, 255, ${darkMode ? '0.06' : '0.12'})`,
          borderRadius: '30px',
          zIndex: 1
        }}
      />

      <div style={{ position: 'relative', zIndex: 2, padding: '2rem 1rem' }}>        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="glass-card"
          style={{
            textAlign: 'center',
            marginBottom: '3rem',
            padding: '2rem',
            maxWidth: '800px',
            margin: '0 auto 3rem auto'
          }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
            style={{ marginBottom: '1rem' }}
          >
            <Heart size={60} style={{ color: '#ff6b8a', filter: 'drop-shadow(0 4px 8px rgba(255, 107, 138, 0.3))' }} />
          </motion.div>          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="responsive-text-primary"
            style={{
              background: darkMode 
                ? 'linear-gradient(45deg, #f0f0f0, #e0e0e0)'
                : 'linear-gradient(45deg, #ffffff, #f8f9fa)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontSize: '3rem',
              fontWeight: '700',
              marginBottom: '0.5rem',
              textShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            La tua Wishlist
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="responsive-text-secondary"
            style={{
              fontSize: '1.2rem',
              margin: 0
            }}
          >
            I tuoi prodotti preferiti ti aspettano
          </motion.p>
        </motion.div>        {/* Error Alert */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              style={{
                background: 'rgba(220, 53, 69, 0.9)',
                color: 'white',
                padding: '1rem',
                borderRadius: '15px',
                marginBottom: '2rem',
                maxWidth: '800px',
                margin: '0 auto 2rem auto',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(220, 53, 69, 0.3)'
              }}
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="glass-card"
          style={{
            padding: '2rem',
            maxWidth: '1200px',
            margin: '0 auto'
          }}
        >
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem 0' }}>
              <LoadingSpinner />
            </div>
          ) : wishlist.length === 0 ? (            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card-inner"
              style={{
                textAlign: 'center',
                padding: '3rem 0'
              }}
            >
              <Package size={80} className="responsive-text-muted" style={{ marginBottom: '1rem' }} />
              <h5 className="responsive-text-secondary" style={{ fontSize: '1.5rem', margin: 0 }}>
                Nessun prodotto nella wishlist
              </h5>
              <p className="responsive-text-muted" style={{ marginTop: '0.5rem' }}>
                Inizia ad aggiungere i tuoi prodotti preferiti!
              </p>
            </motion.div>
          ) : (            <div style={{ display: 'grid', gap: '1.5rem' }}>
              <AnimatePresence>
                {currentItems.map((item, index) => (<motion.div
                    key={item._id}
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 30 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                    className="glass-card-inner"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '1.5rem',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                      <motion.img
                        whileHover={{ scale: 1.1 }}
                        src={item.images}
                        alt={item.name}
                        style={{
                          width: '80px',
                          height: '80px',
                          borderRadius: '15px',
                          marginRight: '1.5rem',
                          objectFit: 'cover',
                          border: '2px solid rgba(255, 255, 255, 0.2)'
                        }}
                      />                      <div>
                        <h5 className="responsive-text-primary" style={{ 
                          fontWeight: '600', 
                          marginBottom: '0.5rem',
                          fontSize: '1.3rem'
                        }}>
                          {item.name}
                        </h5>
                        <div style={{ 
                          color: '#4ade80', 
                          fontWeight: '700', 
                          fontSize: '1.2rem',
                          marginBottom: '0.5rem'
                        }}>
                          €{item.price.toFixed(2)}
                        </div>
                        <div className="responsive-text-muted" style={{ 
                          fontSize: '0.9rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}>
                          <Calendar size={14} />
                          Aggiunto il: {new Date(item.addedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => addToCart(item._id)}
                        style={{
                          background: 'linear-gradient(45deg, #4ade80, #22c55e)',
                          border: 'none',
                          borderRadius: '12px',
                          padding: '0.75rem',
                          color: 'white',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 4px 15px rgba(74, 222, 128, 0.3)'
                        }}
                        title="Aggiungi al carrello"
                      >
                        <ShoppingCart size={18} />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleShowModal(item)}
                        style={{
                          background: 'linear-gradient(45deg, #ef4444, #dc2626)',
                          border: 'none',
                          borderRadius: '12px',
                          padding: '0.75rem',
                          color: 'white',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)'
                        }}
                        title="Rimuovi dalla wishlist"
                      >
                        <Trash size={18} />
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>          )}
        </motion.div>

        {/* Pagination Controls */}
        {wishlist.length > itemsPerPage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '1rem',
              marginTop: '2rem'
            }}
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className="glass-button"
              style={{
                padding: '0.75rem 1.5rem',
                fontSize: '1rem',
                fontWeight: '600',
                opacity: currentPage === 1 ? 0.5 : 1,
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                borderRadius: '8px',
                background: 'linear-gradient(45deg, #6b7280, #4b5563)'
              }}
            >
              Precedente
            </motion.button>
            
            <span className="responsive-text-primary" style={{ 
              fontSize: '1rem', 
              fontWeight: '600',
              padding: '0 1rem'
            }}>
              Pagina {currentPage} di {totalPages}
            </span>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="glass-button"
              style={{
                padding: '0.75rem 1.5rem',
                fontSize: '1rem',
                fontWeight: '600',
                opacity: currentPage === totalPages ? 0.5 : 1,
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                borderRadius: '8px',
                background: 'linear-gradient(45deg, #6b7280, #4b5563)'
              }}
            >
              Successiva
            </motion.button>
          </motion.div>
        )}

        {/* Action Buttons */}
        {wishlist.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '1rem',
              marginTop: '2rem',
              flexWrap: 'wrap'
            }}
          >            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={clearWishlist}
              disabled={wishlist.length === 0}
              className="glass-button responsive-text-primary"
              style={{
                padding: '1rem 2rem',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: wishlist.length === 0 ? 'not-allowed' : 'pointer',
                opacity: wishlist.length === 0 ? 0.5 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'linear-gradient(45deg, #ef4444, #dc2626)'
              }}
            >
              <Trash size={20} />
              Svuota Wishlist
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={addAllToCart}
              disabled={wishlist.length === 0}
              className="glass-button responsive-text-primary"
              style={{
                padding: '1rem 2rem',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: wishlist.length === 0 ? 'not-allowed' : 'pointer',
                opacity: wishlist.length === 0 ? 0.5 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'linear-gradient(45deg, #3b82f6, #2563eb)'
              }}
            >
              <ShoppingCart size={20} />
              Aggiungi Tutto al Carrello
            </motion.button>
          </motion.div>
        )}

        {/* Back to Products Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          style={{
            display: 'flex',
            justifyContent: 'center',
            marginTop: '2rem'
          }}
        >          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/", { state: { scrollToProducts: true } })}
            className="glass-button responsive-text-primary"
            style={{
              padding: '1rem 2rem',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'linear-gradient(45deg, #4ade80, #22c55e)'
            }}
          >
            <ArrowLeft size={20} />
            Torna ai Prodotti
          </motion.button>
        </motion.div>
      </div>

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
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              backdropFilter: 'blur(5px)'
            }}
            onClick={handleCloseModal}
          >            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-card"
              style={{
                padding: '2rem',
                maxWidth: '400px',
                width: '90%'
              }}
            >
              <h3 className="responsive-text-primary" style={{ marginBottom: '1rem', textAlign: 'center' }}>
                Conferma Eliminazione
              </h3>
              <p className="responsive-text-secondary" style={{ textAlign: 'center', marginBottom: '2rem' }}>
                Sei sicuro di voler eliminare questo prodotto dalla wishlist?
              </p>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCloseModal}
                  className="glass-button responsive-text-primary"
                  style={{
                    padding: '0.75rem 1.5rem',
                    fontWeight: '600',
                    background: 'linear-gradient(45deg, #6b7280, #4b5563)'
                  }}
                >
                  Annulla
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => removeFromWishlist(itemToDelete)}
                  className="glass-button responsive-text-primary"
                  style={{
                    padding: '0.75rem 1.5rem',
                    fontWeight: '600',
                    background: 'linear-gradient(45deg, #ef4444, #dc2626)'
                  }}
                >
                  Elimina
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ToastContainer />
    </div>
  );
};

export default WishlistPage;