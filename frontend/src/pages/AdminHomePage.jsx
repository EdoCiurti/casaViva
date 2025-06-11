import React, { useEffect, useState } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import DataTable from 'react-data-table-component';
import { motion, AnimatePresence } from "framer-motion";
import { 
  Settings, 
  Package, 
  ShoppingCart, 
  Users, 
  Plus, 
  Edit3, 
  Trash2, 
  Truck, 
  Image, 
  DollarSign,
  FileText,
  Tag,
  Hash,
  Eye,
  TrendingUp,
  Calendar,
  CheckCircle
} from "lucide-react";
import 'react-toastify/dist/ReactToastify.css';

const AdminHomePage = () => {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [showProductModal, setShowProductModal] = useState(false);
  const [productForm, setProductForm] = useState({ name: "", price: "", description: "", category: "", images: "", stock: "" });
  const [editingProduct, setEditingProduct] = useState(null);
  const [view, setView] = useState(""); // Stato per gestire la visualizzazione delle tabelle
  const [darkMode, setDarkMode] = useState(localStorage.getItem("darkMode") === "true");
  useEffect(() => {
    if (view === "orders") {
      fetchOrders();
    } else if (view === "products") {
      fetchProducts();
    }
  }, [view]);

  useEffect(() => {
    const handleDarkModeToggle = () => {
      setDarkMode(localStorage.getItem("darkMode") === "true");
    };

    window.addEventListener('darkModeToggle', handleDarkModeToggle);

    return () => {
      window.removeEventListener('darkModeToggle', handleDarkModeToggle);
    };
  }, []);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:5000/api/orders", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.status === 200) {
        setOrders(response.data);
      } else {
        console.error("Errore nel recupero degli ordini: Stato della risposta non OK", response.status);
      }
    } catch (error) {
      console.error("Errore nel recupero degli ordini:", error.response ? error.response.data : error.message);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/products");
      setProducts(response.data);
    } catch (error) {
      console.error("Errore nel recupero dei prodotti:", error);
    }
  };

  const handleOrderStatusChange = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(`http://localhost:5000/api/orders/${orderId}/status`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchOrders();
      
      toast.success("Stato dell' ordine aggiornato con successo!", {
                      position: "top-right",
                      autoClose: 3000,
                      hideProgressBar: false,
                      closeOnClick: true,
                      pauseOnHover: true,
                      draggable: true,
                      progress: undefined,
                      theme: "colored",
                  });
    } catch (error) {
      console.error("Errore nell'aggiornamento dello stato dell'ordine:", error);
      
      toast.error("Errore nell'aggiornamento dello stato dell'ordine.");
    }
  };

  const handleProductFormChange = (e) => {
    setProductForm({ ...productForm, [e.target.name]: e.target.value });
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      if (editingProduct) {
        await axios.put(`http://localhost:5000/api/products/${editingProduct._id}`, productForm, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await axios.post("http://localhost:5000/api/products", productForm, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      fetchProducts();
      setShowProductModal(false);
      setProductForm({ name: "", price: "", description: "", category: "", images: "", stock: "" });
      setEditingProduct(null);
      
      toast.success("Prodotto salvato con successo!", {
                      position: "top-right",
                      autoClose: 3000,
                      hideProgressBar: false,
                      closeOnClick: true,
                      pauseOnHover: true,
                      draggable: true,
                      progress: undefined,
                      theme: "colored",
                  });
    } catch (error) {
      console.error("Errore nella gestione del prodotto:", error);
      
      toast.error("Errore nella gestione del prodotto.");
    }
  };

  const handleProductEdit = (product) => {
    setEditingProduct(product);
    setProductForm(product);
    setShowProductModal(true);
  };

  const handleProductDelete = async (productId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:5000/api/products/${productId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchProducts();
     toast.success("Prodotto eliminato con successo!", {
                     position: "top-right",
                     autoClose: 3000,
                     hideProgressBar: false,
                     closeOnClick: true,
                     pauseOnHover: true,
                     draggable: true,
                     progress: undefined,
                     theme: "colored",
                 });
     
      
    } catch (error) {
      console.error("Errore nella rimozione del prodotto:", error);
      
      toast.error("Errore nella rimozione del prodotto.");
    }
  };  const orderColumns = [
    { 
      name: 'ID Ordine', 
      selector: row => row._id, 
      sortable: true, 
      width: '150px',
      cell: row => (
        <div style={{ 
          fontFamily: 'monospace', 
          fontSize: '0.85rem',
          background: 'rgba(59, 130, 246, 0.1)',
          padding: '0.25rem 0.5rem',
          borderRadius: '6px',
          color: '#3b82f6'
        }}>
          {row._id.slice(-8)}
        </div>
      )
    },
    { 
      name: 'Utente', 
      selector: row => row.user.username, 
      sortable: true, 
      width: '150px',
      cell: row => (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.5rem',
          fontWeight: '500'
        }}
        className="responsive-text-primary"
        >
          <Users size={16} style={{ color: '#6b7280' }} />
          {row.user.username}
        </div>
      )
    },
    { 
      name: 'Prodotti', 
      cell: row => (
        <div style={{ fontSize: '0.85rem' }} className="responsive-text-muted">
          {row.products.map((item, index) => (
            <div key={item._id} style={{ marginBottom: '0.25rem' }}>
              <span style={{ fontWeight: '500' }} className="responsive-text-secondary">
                Prodotto {index + 1}
              </span>
              <span style={{ marginLeft: '0.5rem' }}>
                Qty: {item.quantity}
              </span>
            </div>
          ))}
        </div>
      ), 
      width: '300px' 
    },
    { 
      name: 'Totale', 
      selector: row => `€${row.total.toFixed(2)}`, 
      sortable: true, 
      width: '120px',
      cell: row => (
        <div style={{ 
          fontWeight: '700', 
          color: '#059669',
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem'
        }}>
          <DollarSign size={16} />
          €{row.total.toFixed(2)}
        </div>
      )
    },
    { 
      name: 'Stato', 
      selector: row => row.status, 
      sortable: true, 
      width: '140px',
      cell: row => (
        <span style={{
          padding: '0.25rem 0.75rem',
          borderRadius: '12px',
          fontSize: '0.75rem',
          fontWeight: '600',
          background: row.status === "Spedito" ? 'rgba(34, 197, 94, 0.1)' : 'rgba(251, 146, 60, 0.1)',
          color: row.status === "Spedito" ? '#22c55e' : '#fb923c'
        }}>
          {row.status}
        </span>
      )
    },
    { 
      name: 'Azioni', 
      cell: row => (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleOrderStatusChange(row._id, "Spedito")}
          disabled={row.status !== "In elaborazione"}
          style={{
            background: row.status !== "In elaborazione" 
              ? 'rgba(156, 163, 175, 0.3)' 
              : 'linear-gradient(45deg, #3b82f6, #1d4ed8)',
            border: 'none',
            borderRadius: '8px',
            padding: '0.5rem',
            color: 'white',
            cursor: row.status !== "In elaborazione" ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: row.status !== "In elaborazione" ? 0.5 : 1
          }}
          title="Segna come spedito"
        >
          <Truck size={16} />
        </motion.button>
      ), 
      width: '100px' 
    }
  ];
  const productColumns = [
    { 
      name: 'ID', 
      selector: row => row._id, 
      sortable: true, 
      width: '120px',
      cell: row => (
        <div style={{ 
          fontFamily: 'monospace', 
          fontSize: '0.8rem',
          background: 'rgba(99, 102, 241, 0.1)',
          padding: '0.25rem 0.5rem',
          borderRadius: '6px',
          color: '#6366f1'
        }}>
          {row._id.slice(-6)}
        </div>
      )
    },
    { 
      name: 'Nome', 
      selector: row => row.name, 
      sortable: true, 
      width: '200px',
      cell: row => (
        <div style={{ 
          fontWeight: '500', 
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}
        className="responsive-text-primary"
        >
          {row.name}
        </div>
      )
    },
    { 
      name: 'Prezzo', 
      selector: row => `€${row.price.toFixed(2)}`, 
      sortable: true, 
      width: '100px',
      cell: row => (
        <div style={{ 
          fontWeight: '700', 
          color: '#059669',
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem'
        }}>
          <DollarSign size={14} />
          €{row.price.toFixed(2)}
        </div>
      )
    },
    { 
      name: 'Categoria', 
      selector: row => row.category, 
      sortable: true, 
      width: '150px',
      cell: row => (
        <span style={{
          padding: '0.25rem 0.75rem',
          borderRadius: '12px',
          fontSize: '0.75rem',
          fontWeight: '600',
          background: 'rgba(139, 92, 246, 0.1)',
          color: '#8b5cf6'
        }}>
          {row.category}
        </span>
      )
    },
    { 
      name: 'Stock', 
      selector: row => row.stock, 
      sortable: true, 
      width: '80px',
      cell: row => (
        <div style={{ 
          fontWeight: '600',
          color: row.stock > 10 ? '#059669' : row.stock > 0 ? '#d97706' : '#dc2626',
          textAlign: 'center'
        }}>
          {row.stock}
        </div>
      )
    },
    { 
      name: 'Immagini', 
      cell: row => (
        <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }} className="responsive-text-muted">
          <Image size={16} style={{ color: '#6b7280' }} />
          <span style={{ fontSize: '0.75rem' }}>
            {Array.isArray(row.images) ? row.images.length : 1}
          </span>
        </div>
      ), 
      width: '100px' 
    },
    { 
      name: 'Azioni', 
      cell: row => (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleProductEdit(row)}
            style={{
              background: 'linear-gradient(45deg, #f59e0b, #d97706)',
              border: 'none',
              borderRadius: '6px',
              padding: '0.4rem',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Modifica prodotto"
          >
            <Edit3 size={14} />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleProductDelete(row._id)}
            style={{
              background: 'linear-gradient(45deg, #ef4444, #dc2626)',
              border: 'none',
              borderRadius: '6px',
              padding: '0.4rem',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Elimina prodotto"
          >
            <Trash2 size={14} />
          </motion.button>
        </div>
      ), 
      width: '120px' 
    }
  ];
  const customTableStyles = {
    table: {
      style: {
        background: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.15)',
        borderRadius: '15px',
        backdropFilter: 'blur(20px)',
        border: `1px solid ${darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.3)'}`,
        overflow: 'hidden'
      }
    },
    headRow: {
      style: {
        background: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.2)',
        backdropFilter: 'blur(10px)',
        borderBottom: `1px solid ${darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.3)'}`,
        minHeight: '60px'
      }
    },
    headCells: {
      style: {
        color: darkMode ? 'white' : '#1f2937',
        fontWeight: '700',
        fontSize: '0.9rem',
        textTransform: 'uppercase',
        letterSpacing: '0.05em'
      }
    },
    rows: {
      style: {
        backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.1)',
        borderBottom: `1px solid ${darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.2)'}`,
        minHeight: '70px',
        '&:hover': {
          backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.2)',
          transform: 'scale(1.01)',
          transition: 'all 0.2s ease'
        }
      }
    },
    cells: {
      style: {
        color: darkMode ? '#e5e7eb' : '#1f2937',
        fontSize: '0.875rem'
      }
    },
    pagination: {
      style: {
        background: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.15)',
        backdropFilter: 'blur(20px)',
        border: 'none',
        borderTop: `1px solid ${darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.3)'}`,
        color: darkMode ? 'white' : '#1f2937'
      },
      pageButtonsStyle: {
        color: darkMode ? 'white' : '#1f2937',
        fill: darkMode ? 'white' : '#1f2937',
        '&:hover': {
          backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.3)'
        }
      }
    }
  };return (
    <div className={`glass-container ${darkMode ? 'dark-mode' : 'light-mode'}`}
      style={{
        minHeight: '100vh',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Animated Background Elements */}
      <motion.div
        animate={{
          rotate: [0, 360],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "linear"
        }}        style={{
          position: 'absolute',
          top: '15%',
          left: '8%',
          width: '120px',
          height: '120px',
          background: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.08)',
          borderRadius: '50%',
          zIndex: 1
        }}
      />
      <motion.div
        animate={{
          y: [0, -40, 0],
          rotate: [0, 180, 360],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut"
        }}        style={{
          position: 'absolute',
          top: '50%',
          right: '10%',
          width: '90px',
          height: '90px',
          background: darkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.06)',
          borderRadius: '25px',
          zIndex: 1
        }}
      />
      <motion.div
        animate={{
          x: [0, 30, -30, 0],
          scale: [1, 1.15, 0.85, 1],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: "easeInOut"
        }}        style={{
          position: 'absolute',
          bottom: '25%',
          left: '15%',
          width: '70px',
          height: '70px',
          background: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.1)',
          borderRadius: '35px',
          zIndex: 1
        }}
      />

      <div style={{ position: 'relative', zIndex: 2, padding: '2rem 1rem' }}>
        {/* Hero Section */}        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="glass-card"
          style={{
            textAlign: 'center',
            marginBottom: '3rem',
            padding: '2.5rem',
            maxWidth: '800px',
            margin: '0 auto 3rem auto'
          }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
            style={{ marginBottom: '1.5rem' }}
          >
            <Settings 
              size={70} 
              style={{ 
                color: '#60a5fa', 
                filter: 'drop-shadow(0 4px 12px rgba(96, 165, 250, 0.4))' 
              }} 
            />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            style={{
              background: 'linear-gradient(45deg, #ffffff, #f8f9fa)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontSize: '3.5rem',
              fontWeight: '800',
              marginBottom: '0.8rem',
              textShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            Pannello Admin
          </motion.h1>          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="responsive-text-secondary"
            style={{
              fontSize: '1.3rem',
              margin: 0,
              fontWeight: '500'
            }}
          >
            Gestisci ordini e prodotti con facilità
          </motion.p>
        </motion.div>

        {/* Navigation Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '1.5rem',
            marginBottom: '3rem',
            flexWrap: 'wrap'
          }}
        >
          <motion.button
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setView("orders")}
            style={{
              background: view === "orders" 
                ? 'linear-gradient(45deg, #3b82f6, #1d4ed8)' 
                : 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '20px',
              padding: '1.2rem 2.5rem',
              color: 'white',
              fontSize: '1.1rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.8rem',
              backdropFilter: 'blur(15px)',
              boxShadow: view === "orders" 
                ? '0 8px 25px rgba(59, 130, 246, 0.3)' 
                : '0 4px 15px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.3s ease'
            }}
          >
            <ShoppingCart size={24} />
            Gestisci Ordini
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setView("products")}
            style={{
              background: view === "products" 
                ? 'linear-gradient(45deg, #8b5cf6, #7c3aed)' 
                : 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '20px',
              padding: '1.2rem 2.5rem',
              color: 'white',
              fontSize: '1.1rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.8rem',
              backdropFilter: 'blur(15px)',
              boxShadow: view === "products" 
                ? '0 8px 25px rgba(139, 92, 246, 0.3)' 
                : '0 4px 15px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.3s ease'
            }}
          >
            <Package size={24} />
            Gestisci Prodotti
          </motion.button>
        </motion.div>

        {/* Orders View */}
        <AnimatePresence mode="wait">
          {view === "orders" && (
            <motion.div
              key="orders"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.5 }}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '25px',
                padding: '2rem',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                maxWidth: '1400px',
                margin: '0 auto',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)'
              }}
            >              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '1rem', 
                marginBottom: '2rem'
              }}>
                <ShoppingCart size={30} style={{ color: '#60a5fa' }} />
                <h2 style={{ 
                  fontSize: '2rem', 
                  fontWeight: '700', 
                  margin: 0,
                  background: darkMode ? 'linear-gradient(45deg, #ffffff, #e5e7eb)' : 'linear-gradient(45deg, #1f2937, #374151)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  Gestione Ordini
                </h2>
              </div>
              <div style={{ 
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '20px',
                overflow: 'hidden',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <DataTable
                  columns={orderColumns}
                  data={orders}
                  pagination
                  customStyles={customTableStyles}                  noDataComponent={
                    <div style={{ 
                      padding: '3rem', 
                      textAlign: 'center'
                    }}
                    className="responsive-text-secondary"
                    >
                      <ShoppingCart size={50} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                      <p style={{ fontSize: '1.2rem', margin: 0 }}>Nessun ordine trovato</p>
                    </div>
                  }
                />
              </div>
            </motion.div>
          )}

          {/* Products View */}
          {view === "products" && (
            <motion.div
              key="products"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.5 }}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '25px',
                padding: '2rem',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                maxWidth: '1400px',
                margin: '0 auto',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)'
              }}
            >
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                marginBottom: '2rem',
                flexWrap: 'wrap',
                gap: '1rem'
              }}>                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '1rem'
                }}>
                  <Package size={30} style={{ color: '#8b5cf6' }} />
                  <h2 style={{ 
                    fontSize: '2rem', 
                    fontWeight: '700', 
                    margin: 0,
                    background: darkMode ? 'linear-gradient(45deg, #ffffff, #e5e7eb)' : 'linear-gradient(45deg, #1f2937, #374151)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}>
                    Gestione Prodotti
                  </h2>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { 
                    setEditingProduct(null); 
                    setProductForm({ name: "", price: "", description: "", category: "", images: "", stock: "" }); 
                    setShowProductModal(true); 
                  }}
                  style={{
                    background: 'linear-gradient(45deg, #10b981, #059669)',
                    border: 'none',
                    borderRadius: '15px',
                    padding: '1rem 2rem',
                    color: 'white',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 6px 20px rgba(16, 185, 129, 0.3)'
                  }}
                >
                  <Plus size={20} />
                  Aggiungi Prodotto
                </motion.button>
              </div>
              <div style={{ 
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '20px',
                overflow: 'hidden',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <DataTable
                  columns={productColumns}
                  data={products}
                  pagination
                  customStyles={customTableStyles}                  noDataComponent={
                    <div style={{ 
                      padding: '3rem', 
                      textAlign: 'center'
                    }}
                    className="responsive-text-secondary"
                    >
                      <Package size={50} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                      <p style={{ fontSize: '1.2rem', margin: 0 }}>Nessun prodotto trovato</p>
                    </div>
                  }
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modern Product Modal */}
      <AnimatePresence>
        {showProductModal && (
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
              background: 'rgba(0, 0, 0, 0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              backdropFilter: 'blur(10px)',
              padding: '1rem'
            }}
            onClick={() => setShowProductModal(false)}
          >            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className={`glass-container ${darkMode ? 'dark-mode' : 'light-mode'}`}
              style={{
                borderRadius: '25px',
                padding: '2.5rem',
                maxWidth: '600px',
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                boxShadow: '0 25px 50px rgba(0, 0, 0, 0.2)'
              }}
            >              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '1rem', 
                marginBottom: '2rem',
                borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
                paddingBottom: '1rem'
              }}>
                <Package size={28} style={{ color: '#8b5cf6' }} />
                <h3 style={{ 
                  margin: 0, 
                  fontSize: '1.8rem', 
                  fontWeight: '700' 
                }}
                className="responsive-text-primary"
                >
                  {editingProduct ? "Modifica Prodotto" : "Aggiungi Prodotto"}
                </h3>
              </div>
              
              <form onSubmit={handleProductSubmit} style={{ display: 'grid', gap: '1.5rem' }}>
                <div>                  <label style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem',
                    marginBottom: '0.5rem',
                    fontWeight: '600'
                  }}
                  className="responsive-text-secondary"
                  >
                    <Tag size={16} />
                    Nome Prodotto
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={productForm.name}
                    onChange={handleProductFormChange}
                    required
                    className="glass-input"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>                    <label style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.5rem',
                      marginBottom: '0.5rem',
                      fontWeight: '600'
                    }}
                    className="responsive-text-secondary"
                    >
                      <DollarSign size={16} />
                      Prezzo
                    </label>
                    <input
                      type="number"
                      name="price"
                      value={productForm.price}
                      onChange={handleProductFormChange}
                      required
                      step="0.01"
                      className="glass-input"
                    />
                  </div>
                  <div>                    <label style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.5rem',
                      marginBottom: '0.5rem',
                      fontWeight: '600'
                    }}
                    className="responsive-text-secondary"
                    >
                      <Hash size={16} />
                      Stock
                    </label>
                    <input
                      type="number"
                      name="stock"
                      value={productForm.stock}
                      onChange={handleProductFormChange}
                      required
                      className="glass-input"
                    />
                  </div>
                </div>

                <div>                  <label style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem',
                    marginBottom: '0.5rem',
                    fontWeight: '600'
                  }}
                  className="responsive-text-secondary"
                  >
                    <FileText size={16} />
                    Descrizione
                  </label>
                  <textarea
                    name="description"
                    value={productForm.description}
                    onChange={handleProductFormChange}
                    required
                    rows={3}
                    className="glass-textarea"
                  />
                </div>

                <div>                  <label style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem',
                    marginBottom: '0.5rem',
                    fontWeight: '600'
                  }}
                  className="responsive-text-secondary"
                  >
                    <Tag size={16} />
                    Categoria
                  </label>
                  <input
                    type="text"
                    name="category"
                    value={productForm.category}
                    onChange={handleProductFormChange}
                    required
                    className="glass-input"
                  />
                </div>

                <div>
                  <label style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem',
                    marginBottom: '0.5rem',
                    color: '#374151',
                    fontWeight: '600'
                  }}>
                    <Image size={16} />
                    URL Immagini (separate da virgola)
                  </label>
                  <textarea
                    name="images"
                    value={productForm.images}
                    onChange={handleProductFormChange}
                    required
                    rows={2}
                    placeholder="https://esempio.com/immagine1.jpg, https://esempio.com/immagine2.jpg"
                    style={{
                      width: '100%',
                      padding: '1rem',
                      border: '2px solid rgba(0, 0, 0, 0.1)',
                      borderRadius: '12px',
                      fontSize: '1rem',
                      background: 'rgba(255, 255, 255, 0.8)',
                      backdropFilter: 'blur(10px)',
                      outline: 'none',
                      transition: 'all 0.3s ease',
                      resize: 'vertical'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#8b5cf6';
                      e.target.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'rgba(0, 0, 0, 0.1)';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>

                <div style={{ 
                  display: 'flex', 
                  gap: '1rem', 
                  justifyContent: 'flex-end',
                  marginTop: '1rem',
                  paddingTop: '1rem',
                  borderTop: '1px solid rgba(0, 0, 0, 0.1)'
                }}>
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowProductModal(false)}
                    style={{
                      background: 'linear-gradient(45deg, #6b7280, #4b5563)',
                      border: 'none',
                      borderRadius: '12px',
                      padding: '0.75rem 2rem',
                      color: 'white',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    Annulla
                  </motion.button>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    style={{
                      background: 'linear-gradient(45deg, #8b5cf6, #7c3aed)',
                      border: 'none',
                      borderRadius: '12px',
                      padding: '0.75rem 2rem',
                      color: 'white',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    {editingProduct ? <Edit3 size={16} /> : <Plus size={16} />}
                    {editingProduct ? "Aggiorna" : "Aggiungi"}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ToastContainer />
    </div>
  );
};

export default AdminHomePage;