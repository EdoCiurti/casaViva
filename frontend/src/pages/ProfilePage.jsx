import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { FaArrowLeft, FaArrowRight, FaUser, FaEnvelope, FaSignOutAlt, FaShoppingCart, FaBox } from 'react-icons/fa';
import { User, Mail, LogOut, ShoppingCart, Package, ChevronLeft, ChevronRight, Calendar, CreditCard } from 'lucide-react';
import { Spinner } from 'react-bootstrap';

const ProfilePage = () => {
    const [userData, setUserData] = useState({});
    const [orders, setOrders] = useState([]);
    const [cart, setCart] = useState([]);
    const [username, setUsername] = useState(localStorage.getItem("username"));
    const [currentOrderIndex, setCurrentOrderIndex] = useState(0);
    const [loadingOrders, setLoadingOrders] = useState(true);
    const [loadingCart, setLoadingCart] = useState(true);
    const [darkMode, setDarkMode] = useState(localStorage.getItem("darkMode") === "true");
    const [currentCartPage, setCurrentCartPage] = useState(1);
    const [cartItemsPerPage] = useState(5);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProfileData = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    console.warn("Token non trovato, reindirizzamento al login.");
                    navigate('/login');
                    return;
                }

                const userResponse = await axios.get('http://localhost:5000/api/auth/profile', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setUserData(userResponse.data);

                const ordersResponse = await axios.get('http://localhost:5000/api/orders/user', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setOrders(ordersResponse.data);
                setLoadingOrders(false);

                const cartResponse = await axios.get('http://localhost:5000/api/cart', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setCart(cartResponse.data);
                setLoadingCart(false);
            } catch (error) {
                console.error('Errore nel recupero dei dati del profilo:', error);
                alert('Si è verificato un errore durante il caricamento dei dati. Riprova più tardi.');
                setLoadingOrders(false);
                setLoadingCart(false);
            }
        };

        fetchProfileData();
    }, [navigate]);

    useEffect(() => {
        const handleDarkModeToggle = () => {
            setDarkMode(localStorage.getItem("darkMode") === "true");
        };

        window.addEventListener('darkModeToggle', handleDarkModeToggle);

        return () => {
            window.removeEventListener('darkModeToggle', handleDarkModeToggle);
        };
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("username");
        setUsername(null);
        navigate("/login");
        window.location.reload();
    };

    const handleNextOrder = () => {
        setCurrentOrderIndex((prevIndex) => (prevIndex + 1) % orders.length);
    };    const handlePrevOrder = () => {
        setCurrentOrderIndex((prevIndex) => (prevIndex - 1 + orders.length) % orders.length);
    };

    // Logica paginazione carrello
    const indexOfLastCartItem = currentCartPage * cartItemsPerPage;
    const indexOfFirstCartItem = indexOfLastCartItem - cartItemsPerPage;
    const currentCartItems = cart.products ? cart.products.slice(indexOfFirstCartItem, indexOfLastCartItem) : [];
    const totalCartPages = cart.products ? Math.ceil(cart.products.length / cartItemsPerPage) : 0;

    const handleNextCartPage = () => {
        if (currentCartPage < totalCartPages) {
            setCurrentCartPage(currentCartPage + 1);
        }
    };

    const handlePrevCartPage = () => {
        if (currentCartPage > 1) {
            setCurrentCartPage(currentCartPage - 1);
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
            <div style={{
                position: 'absolute',
                width: '250px',
                height: '250px',
                borderRadius: '50%',
                background: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.1)',
                top: '15%',
                right: '10%',
                animation: 'float 8s ease-in-out infinite'
            }} />
            <div style={{
                position: 'absolute',
                width: '180px',
                height: '180px',
                borderRadius: '50%',
                background: darkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.05)',
                bottom: '20%',
                left: '5%',
                animation: 'float 6s ease-in-out infinite reverse'
            }} />

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6 }}
                style={{ 
                    paddingTop: '120px', 
                    paddingBottom: '60px',
                    position: 'relative',
                    zIndex: 1
                }}
            >
                <Container>
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
                                background: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.2)',
                                backdropFilter: 'blur(20px)',
                                marginBottom: '20px',
                                border: '1px solid rgba(255, 255, 255, 0.3)'
                            }}
                        >
                            <User size={40} color={darkMode ? 'white' : 'white'} />
                        </motion.div>
                        <h1 
                            style={{
                                fontSize: '3.5rem',
                                fontWeight: '700',
                                background: darkMode ? 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)' : 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                marginBottom: '10px',
                                textShadow: darkMode ? '0 4px 6px rgba(0, 0, 0, 0.3)' : '0 4px 6px rgba(0, 0, 0, 0.1)'
                            }}
                        >
                            Il tuo Profilo
                        </h1>                        <p className="responsive-text-secondary" style={{ fontSize: '1.2rem' }}>
                            Gestisci il tuo account e visualizza i tuoi ordini
                        </p>
                    </motion.div>

                    <Row>
                        {/* User Profile Card */}
                        <Col lg={4} className="mb-4">                            <motion.div
                                initial={{ opacity: 0, x: -30 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.8, delay: 0.4 }}
                                className="glass-card"
                                style={{
                                    padding: '40px',
                                    height: 'fit-content'
                                }}
                            >
                                <div className="text-center mb-4">
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            width: '100px',
                                            height: '100px',
                                            borderRadius: '50%',
                                            background: darkMode ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                            marginBottom: '20px',
                                            boxShadow: darkMode ? '0 10px 30px rgba(255, 255, 255, 0.3)' : '0 10px 30px rgba(102, 126, 234, 0.3)'
                                        }}
                                    >
                                        <User size={50} color="white" />
                                    </motion.div>                                    <h3 className="responsive-text-primary" style={{ 
                                        fontWeight: '700',
                                        marginBottom: '10px'
                                    }}>
                                        Profilo Utente
                                    </h3>
                                </div>

                                <div className="mb-4">                                    <div className="glass-card-inner" style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        padding: '15px 20px',
                                        marginBottom: '15px'
                                    }}><FaUser size={18} color="rgba(255, 255, 255, 0.7)" style={{ marginRight: '15px' }} />
                                        <div>
                                            <p className="responsive-text-muted" style={{ margin: 0, fontSize: '0.9rem' }}>
                                                Nome utente
                                            </p>
                                            <p className="responsive-text-primary" style={{ margin: 0, fontWeight: '600', fontSize: '1.1rem' }}>
                                                {userData.username || 'Caricamento...'}
                                            </p>
                                        </div>
                                    </div>                                    <div className="glass-card-inner" style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        padding: '15px 20px'
                                    }}><Mail size={18} color="rgba(255, 255, 255, 0.7)" style={{ marginRight: '15px' }} />
                                        <div>
                                            <p className="responsive-text-muted" style={{ margin: 0, fontSize: '0.9rem' }}>
                                                Email
                                            </p>
                                            <p className="responsive-text-primary" style={{ margin: 0, fontWeight: '600', fontSize: '1.1rem' }}>
                                                {userData.email || 'Caricamento...'}
                                            </p>
                                        </div>
                                    </div>
                                </div>                                <motion.button
                                    whileHover={{ scale: 1.05, y: -2 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleLogout}
                                    className="glass-button"                                    style={{
                                        width: '100%',
                                        background: darkMode ? 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)' : 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)',
                                        borderRadius: '8px',
                                        padding: '15px 30px',
                                        color: 'white',
                                        fontWeight: '600',
                                        fontSize: '1.1rem',
                                        cursor: 'pointer',
                                        boxShadow: darkMode ? '0 10px 30px rgba(220, 53, 69, 0.3)' : '0 10px 30px rgba(220, 53, 69, 0.3)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '10px'
                                    }}
                                >
                                    <LogOut size={20} />
                                    Logout
                                </motion.button>
                            </motion.div>
                        </Col>

                        {/* Orders and Cart Section */}
                        <Col lg={8}>
                            {/* Orders Section */}                            <motion.div
                                initial={{ opacity: 0, x: 30 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.8, delay: 0.5 }}
                                className="glass-card"
                                style={{
                                    padding: '40px',
                                    marginBottom: '30px',
                                    position: 'relative'
                                }}
                            >
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    marginBottom: '30px'
                                }}>
                                    <Package size={28} color="white" style={{ marginRight: '15px' }} />
                                    <h3 className="responsive-text-primary" style={{ fontWeight: '700', margin: 0 }}>
                                        I tuoi Ordini
                                    </h3>
                                </div>

                                {loadingOrders ? (
                                    <motion.div 
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="text-center py-5"
                                    >                                        <Spinner animation="border" variant="light" />
                                        <p className="responsive-text-secondary" style={{ marginTop: '20px' }}>
                                            Caricamento ordini...
                                        </p>
                                    </motion.div>                                ) : orders.length > 0 ? (
                                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '20px' }}>
                                        {/* Freccia sinistra */}
                                        {orders.length > 1 && (
                                            <motion.button
                                                whileHover={{ scale: 1.2 }}
                                                whileTap={{ scale: 0.9 }}
                                                onClick={handlePrevOrder}
                                                style={{
                                                    width: '50px',
                                                    height: '50px',
                                                    borderRadius: '50%',
                                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                    border: '2px solid rgba(255, 255, 255, 0.5)',
                                                    color: 'white',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    cursor: 'pointer',
                                                    backdropFilter: 'blur(10px)',
                                                    boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)'
                                                }}
                                            >
                                                <ChevronLeft size={24} />
                                            </motion.button>
                                        )}

                                        {/* Card dell'ordine */}
                                        <motion.div
                                            key={currentOrderIndex}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ duration: 0.4 }}
                                            className="glass-card-inner"
                                            style={{
                                                padding: '25px',
                                                flex: 1
                                            }}
                                        >
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                marginBottom: '20px'
                                            }}>                                                <Calendar size={20} color="rgba(255, 255, 255, 0.7)" style={{ marginRight: '10px' }} />
                                                <span className="responsive-text-primary" style={{ fontWeight: '600' }}>
                                                    {new Date(orders[currentOrderIndex].createdAt).toLocaleDateString('it-IT')}
                                                </span>
                                                <span style={{ 
                                                    marginLeft: 'auto',
                                                    background: orders[currentOrderIndex].status === 'completed' 
                                                        ? 'rgba(40, 167, 69, 0.3)' 
                                                        : 'rgba(255, 193, 7, 0.3)',
                                                    color: 'white',
                                                    padding: '5px 15px',
                                                    borderRadius: '20px',
                                                    fontSize: '0.9rem',
                                                    fontWeight: '600'
                                                }}>
                                                    {orders[currentOrderIndex].status}
                                                </span>
                                            </div>                                            <h6 className="responsive-text-secondary" style={{ marginBottom: '15px', fontWeight: '600' }}>
                                                Prodotti ordinati:
                                            </h6>
                                            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                                {orders[currentOrderIndex].products.map((product, index) => (                                                    <motion.li 
                                                        key={product._id}
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: index * 0.1 }}
                                                        className="glass-card-inner"
                                                        style={{
                                                            padding: '15px',
                                                            marginBottom: '10px',
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            alignItems: 'center'
                                                        }}
                                                    ><span className="responsive-text-primary">
                                                            <strong>{product.quantity}x</strong> {product.product ? product.product.name : 'Prodotto non disponibile'}
                                                        </span>
                                                        <span style={{ color: '#f093fb', fontWeight: '600' }}>
                                                            €{product.price}
                                                        </span>
                                                    </motion.li>
                                                ))}
                                            </ul>                                            {orders.length > 1 && (
                                                <div className="responsive-text-muted" style={{
                                                    textAlign: 'center',
                                                    marginTop: '20px',
                                                    fontSize: '0.9rem'
                                                }}>
                                                    Ordine {currentOrderIndex + 1} di {orders.length}
                                                </div>
                                            )}
                                        </motion.div>

                                        {/* Freccia destra */}
                                        {orders.length > 1 && (
                                            <motion.button
                                                whileHover={{ scale: 1.2 }}
                                                whileTap={{ scale: 0.9 }}
                                                onClick={handleNextOrder}
                                                style={{
                                                    width: '50px',
                                                    height: '50px',
                                                    borderRadius: '50%',
                                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                    border: '2px solid rgba(255, 255, 255, 0.5)',
                                                    color: 'white',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    cursor: 'pointer',
                                                    backdropFilter: 'blur(10px)',
                                                    boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)'
                                                }}
                                            >
                                                <ChevronRight size={24} />
                                            </motion.button>
                                        )}
                                    </div>
                                ) : (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="text-center py-4"
                                    >                                        <Package size={60} color="rgba(255, 255, 255, 0.4)" style={{ marginBottom: '20px' }} />
                                        <p className="responsive-text-secondary" style={{ fontSize: '1.1rem' }}>
                                            Nessun ordine disponibile
                                        </p>
                                        <p className="responsive-text-muted">
                                            Inizia a fare shopping per vedere i tuoi ordini qui!
                                        </p>
                                    </motion.div>
                                )}
                            </motion.div>

                            {/* Cart Section */}                            <motion.div
                                initial={{ opacity: 0, x: 30 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.8, delay: 0.6 }}
                                className="glass-card"
                                style={{
                                    padding: '40px'
                                }}
                            ><div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    marginBottom: '30px'
                                }}>
                                    <ShoppingCart size={28} color="white" style={{ marginRight: '15px' }} />
                                    <h3 className="responsive-text-primary" style={{ fontWeight: '700', margin: 0 }}>
                                        Il tuo Carrello
                                    </h3>
                                </div>

                                {loadingCart ? (
                                    <motion.div 
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="text-center py-5"
                                    >                                        <Spinner animation="border" variant="light" />
                                        <p className="responsive-text-secondary" style={{ marginTop: '20px' }}>
                                            Caricamento carrello...
                                        </p>
                                    </motion.div>
                                ) : cart.products && cart.products.length > 0 ? (
                                    <>
                                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, marginBottom: '25px' }}>
                                            {currentCartItems.map((item, index) => (                                                <motion.li 
                                                    key={item._id}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: index * 0.1 }}
                                                    className="glass-card-inner"
                                                    style={{
                                                        padding: '20px',
                                                        marginBottom: '15px',
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center'
                                                    }}
                                                ><span className="responsive-text-primary" style={{ fontWeight: '500' }}>
                                                        <strong>{item.quantity}x</strong> {item.product ? item.product.name : 'Prodotto non disponibile'}
                                                    </span>
                                                    <span style={{ color: '#f093fb', fontWeight: '600' }}>
                                                        €{item.product ? (item.product.price * item.quantity).toFixed(2) : 'N/A'}
                                                    </span>
                                                </motion.li>
                                            ))}                                        </ul>

                                        {/* Cart Pagination Controls */}
                                        {cart.products.length > cartItemsPerPage && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.3 }}
                                                style={{
                                                    display: 'flex',
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                    gap: '1rem',
                                                    marginBottom: '25px'
                                                }}
                                            >                                                <motion.button
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={handlePrevCartPage}
                                                    disabled={currentCartPage === 1}
                                                    className="glass-button"
                                                    style={{
                                                        padding: '0.5rem 1rem',
                                                        fontSize: '0.9rem',
                                                        fontWeight: '600',
                                                        opacity: currentCartPage === 1 ? 0.5 : 1,
                                                        cursor: currentCartPage === 1 ? 'not-allowed' : 'pointer',
                                                        borderRadius: '8px',
                                                        background: 'linear-gradient(45deg, #6b7280, #4b5563)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.5rem'
                                                    }}
                                                >
                                                    <ChevronLeft size={16} />
                                                    Precedente
                                                </motion.button>
                                                
                                                <span className="responsive-text-primary" style={{ 
                                                    fontSize: '0.9rem', 
                                                    fontWeight: '600',
                                                    padding: '0 0.5rem'
                                                }}>
                                                    {currentCartPage} di {totalCartPages}
                                                </span>
                                                  <motion.button
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={handleNextCartPage}
                                                    disabled={currentCartPage === totalCartPages}
                                                    className="glass-button"
                                                    style={{
                                                        padding: '0.5rem 1rem',
                                                        fontSize: '0.9rem',
                                                        fontWeight: '600',
                                                        opacity: currentCartPage === totalCartPages ? 0.5 : 1,
                                                        cursor: currentCartPage === totalCartPages ? 'not-allowed' : 'pointer',
                                                        borderRadius: '8px',
                                                        background: 'linear-gradient(45deg, #6b7280, #4b5563)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.5rem'
                                                    }}
                                                >
                                                    Successiva
                                                    <ChevronRight size={16} />
                                                </motion.button>
                                            </motion.div>
                                        )}

                                          <motion.button
                                            whileHover={{ scale: 1.05, y: -2 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => navigate('/cart')}
                                            className="glass-button"
                                            style={{                                                background: darkMode ? 'linear-gradient(135deg, #28a745 0%, #20c997 100%)' : 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                                                borderRadius: '8px',
                                                padding: '15px 30px',
                                                color: 'white',
                                                fontWeight: '600',
                                                fontSize: '1.1rem',
                                                cursor: 'pointer',
                                                boxShadow: darkMode ? '0 10px 30px rgba(40, 167, 69, 0.3)' : '0 10px 30px rgba(40, 167, 69, 0.3)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '10px',
                                                width: '100%'
                                            }}
                                        >
                                            <CreditCard size={20} />
                                            Vai al Carrello
                                        </motion.button>
                                    </>
                                ) : (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="text-center py-4"
                                    >                                        <ShoppingCart size={60} color="rgba(255, 255, 255, 0.4)" style={{ marginBottom: '20px' }} />
                                        <p className="responsive-text-secondary" style={{ fontSize: '1.1rem' }}>
                                            Il carrello è vuoto
                                        </p>
                                        <p className="responsive-text-muted">
                                            Aggiungi alcuni prodotti per iniziare!
                                        </p>
                                    </motion.div>
                                )}
                            </motion.div>
                        </Col>
                    </Row>
                </Container>
            </motion.div>

            <style jsx>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(-20px) rotate(180deg); }
                }
            `}</style>
        </div>
    );
};

export default ProfilePage;