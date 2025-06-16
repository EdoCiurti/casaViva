// filepath: c:\Users\edocu\Desktop\casaViva\frontend\src\pages\OrderPage.jsx
import React, { useState, useEffect, useRef } from "react";
import { Container, Row, Col, Form } from "react-bootstrap";
import { motion, AnimatePresence } from "framer-motion";
import { CreditCard, Package, MapPin, User, Globe, Hash, Building, CheckCircle, ShoppingBag, Truck } from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const OrderPage = () => {
  const [cartItems, setCartItems] = useState([]);
  const [productItems, setProductItems] = useState([]);
  const [shippingInfo, setShippingInfo] = useState({ address: "", city: "", postalCode: "", country: "" });
  const [error, setError] = useState(null);
  const [darkMode, setDarkMode] = useState(localStorage.getItem("darkMode") === "true");
  const navigate = useNavigate();
  const addressInputRef = useRef(null);

  useEffect(() => {
    const fetchCartItems = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get("http://localhost:5000/api/cart", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCartItems(response.data.products);
        setProductItems(response.data);
      } catch (err) {
        setError("Errore nel recupero del carrello.");
      }
    };

    fetchCartItems();
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

  useEffect(() => {
    const loadScript = (url, callback) => {
      const script = document.createElement("script");
      script.type = "text/javascript";
      script.src = url;
      script.onload = callback;
      document.head.appendChild(script);
    };

    loadScript(`https://maps.googleapis.com/maps/api/js?key=AIzaSyBUSCdPDCz0xe58_cHSoQWU5zLy4lE_IqE&libraries=places`, () => {
      const autocomplete = new window.google.maps.places.Autocomplete(addressInputRef.current, {
        types: ["address"],
      });

      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        const address = place.formatted_address;
        const city = place.address_components.find(component => component.types.includes("locality"))?.long_name || "";
        const postalCode = place.address_components.find(component => component.types.includes("postal_code"))?.long_name || "";
        const country = place.address_components.find(component => component.types.includes("country"))?.long_name || "";

        setShippingInfo({ address, city, postalCode, country });
      });
    });
  }, []);

  const createOrder = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "http://localhost:5000/api/orders",
        { products: productItems },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data._id; // Assicurati che il server restituisca l'ID dell'ordine creato
    } catch (err) {
      console.error("Errore nella creazione dell'ordine:", err.response?.data || err);
      setError("Errore nella creazione dell'ordine.");
      throw err;
    }
  };

  const handleOrder = async () => {
    try {
      if (cartItems.length === 0) {
        setError("Il carrello è vuoto.");
        return;
      }

      const orderId = await createOrder(); // Crea l'ordine nel database
      const token = localStorage.getItem("token");

      const response = await axios.post(
        "http://localhost:5000/api/payments/create-checkout-session",
        { cartItems, orderId }, // Invia l'ID dell'ordine alla sessione di pagamento
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Svuota il carrello
      await axios.delete("http://localhost:5000/api/cart", {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Reindirizza alla pagina di pagamento Stripe
      window.location.href = response.data.url;
    } catch (err) {
      console.error("Errore nella creazione della sessione di pagamento:", err.response?.data || err);
      setError("Errore nella creazione della sessione di pagamento.");
    }
  };

  const isFormValid = () => {
    return shippingInfo.address && shippingInfo.city && shippingInfo.postalCode && shippingInfo.country;
  };
  return (
    <div className={`glass-background ${darkMode ? 'glass-background-dark' : 'glass-background-light'}`} style={{
      minHeight: '100vh',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Animated Background Elements */}
      <motion.div
        style={{
          position: 'absolute',
          top: '10%',
          left: '10%',
          width: '100px',
          height: '100px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '50%',
          backdropFilter: 'blur(10px)',
        }}
        animate={{
          y: [0, -20, 0],
          x: [0, 10, 0],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div
        style={{
          position: 'absolute',
          top: '60%',
          right: '15%',
          width: '80px',
          height: '80px',
          background: 'rgba(255, 255, 255, 0.08)',
          borderRadius: '30%',
          backdropFilter: 'blur(8px)',
        }}
        animate={{
          y: [0, 15, 0],
          rotate: [0, 180, 360],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "linear"
        }}
      />
      <motion.div
        style={{
          position: 'absolute',
          bottom: '20%',
          left: '20%',
          width: '60px',
          height: '60px',
          background: 'rgba(255, 255, 255, 0.12)',
          borderRadius: '40%',
          backdropFilter: 'blur(6px)',
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.7, 1, 0.7],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      <Container style={{ paddingTop: '120px', paddingBottom: '60px', position: 'relative', zIndex: 1 }}>
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          style={{
            textAlign: 'center',
            marginBottom: '50px'
          }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            style={{
              display: 'inline-block',
              padding: '20px',
              background: 'rgba(255, 255, 255, 0.15)',
              borderRadius: '50%',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              marginBottom: '20px'
            }}
          >            <CreditCard size={48} className="responsive-text-primary" />
          </motion.div>
          <h1 className="responsive-text-primary" style={{
            fontSize: '3.5rem',
            fontWeight: '700',
            background: darkMode ? 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)' : 'linear-gradient(135deg, #000000 0%, #333333 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '20px',
            textShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
          }}>
            Checkout
          </h1>
          <p className="responsive-text-secondary" style={{
            fontSize: '1.2rem',
            maxWidth: '600px',
            margin: '0 auto',
            lineHeight: '1.6'
          }}>
            Complete your order with our secure and fast checkout process
          </p>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}            style={{
              padding: '15px 25px',
              background: 'rgba(220, 53, 69, 0.9)',
              borderRadius: '15px',
              marginBottom: '30px',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(220, 53, 69, 0.3)',
              textAlign: 'center'
            }}
            className="responsive-text-primary"
          >
            {error}
          </motion.div>
        )}

        <Row>
          <Col lg={6}>
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(20px)',
                borderRadius: '25px',
                padding: '35px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                marginBottom: '30px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '30px',
                paddingBottom: '20px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
              }}>                <Package size={24} className="responsive-text-primary" style={{ marginRight: '15px' }} />
                <h3 className="responsive-text-primary" style={{
                  fontWeight: '600',
                  margin: 0,
                  fontSize: '1.5rem'
                }}>
                  Order Summary
                </h3>
              </div>

              <AnimatePresence>
                {cartItems.map((item, index) => (
                  <motion.div
                    key={item.product._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '20px',
                      background: 'rgba(255, 255, 255, 0.08)',
                      borderRadius: '15px',
                      marginBottom: '15px',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      transition: 'all 0.3s ease'
                    }}
                    whileHover={{
                      scale: 1.02,
                      background: 'rgba(255, 255, 255, 0.12)'
                    }}
                  >
                    <div>                      <h6 className="responsive-text-primary" style={{
                        fontWeight: '600',
                        margin: '0 0 8px 0',
                        fontSize: '1.1rem'
                      }}>
                        {item.product.name}
                      </h6>
                      <p className="responsive-text-secondary" style={{
                        margin: 0,
                        fontSize: '0.95rem'
                      }}>
                        Quantity: {item.quantity}
                      </p>
                    </div>
                    <div className="responsive-text-primary" style={{
                      fontWeight: '700',
                      fontSize: '1.2rem'
                    }}>
                      €{(item.product.price * item.quantity).toFixed(2)}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                style={{
                  marginTop: '25px',
                  paddingTop: '20px',
                  borderTop: '2px solid rgba(255, 255, 255, 0.3)',
                  textAlign: 'right'
                }}
              >                <ModernText
                  variant="gradient"
                  style={{
                    fontWeight: '700',
                    fontSize: '1.8rem',
                    margin: 0
                  }}
                >
                  Total: €{cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0).toFixed(2)}
                </ModernText>
              </motion.div>
            </motion.div>
          </Col>

          <Col lg={6}>
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(20px)',
                borderRadius: '25px',
                padding: '35px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                marginBottom: '30px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '30px',
                paddingBottom: '20px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
              }}>                <Truck size={24} className="responsive-text-primary" style={{ marginRight: '15px' }} />
                <h3 className="responsive-text-primary" style={{
                  fontWeight: '600',
                  margin: 0,
                  fontSize: '1.5rem'
                }}>
                  Shipping Information
                </h3>
              </div>

              <Form>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  style={{ marginBottom: '25px' }}
                >                  <label className="responsive-text-primary" style={{
                    fontWeight: '500',
                    marginBottom: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: '1rem'
                  }}>
                    <MapPin size={18} style={{ marginRight: '8px' }} />
                    Address
                  </label>
                  <input
                    type="text"
                    placeholder="Enter your address"
                    value={shippingInfo.address}
                    onChange={(e) => setShippingInfo({ ...shippingInfo, address: e.target.value })}
                    ref={addressInputRef}
                    className="glass-input"
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  style={{ marginBottom: '25px' }}
                >                  <label className="responsive-text-primary" style={{
                    fontWeight: '500',
                    marginBottom: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: '1rem'
                  }}>
                    <Building size={18} style={{ marginRight: '8px' }} />
                    City
                  </label>
                  <input
                    type="text"
                    placeholder="Enter your city"
                    value={shippingInfo.city}
                    onChange={(e) => setShippingInfo({ ...shippingInfo, city: e.target.value })}
                    className="glass-input"
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  style={{ marginBottom: '25px' }}                >
                  <label className="responsive-text-primary" style={{
                    fontWeight: '500',
                    marginBottom: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: '1rem'
                  }}>
                    <Hash size={18} style={{ marginRight: '8px' }} />
                    Postal Code
                  </label>
                  <input
                    type="text"
                    placeholder="Enter postal code"
                    value={shippingInfo.postalCode}
                    onChange={(e) => setShippingInfo({ ...shippingInfo, postalCode: e.target.value })}
                    className="glass-input"
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 }}
                  style={{ marginBottom: '25px' }}                >
                  <label className="responsive-text-primary" style={{
                    fontWeight: '500',
                    marginBottom: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: '1rem'
                  }}>
                    <Globe size={18} style={{ marginRight: '8px' }} />
                    Country
                  </label>
                  <input
                    type="text"
                    placeholder="Enter your country"
                    value={shippingInfo.country}
                    onChange={(e) => setShippingInfo({ ...shippingInfo, country: e.target.value })}
                    className="glass-input"
                  />
                </motion.div>
              </Form>
            </motion.div>
          </Col>
        </Row>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 1 }}
          style={{ textAlign: 'center', marginTop: '40px' }}
        >
          <motion.button
            onClick={handleOrder}
            disabled={!isFormValid()}            style={{
              padding: '18px 50px',
              fontSize: '1.3rem',
              fontWeight: '600',              background: isFormValid() 
                ? 'linear-gradient(135deg, #28a745 0%, #20c997 100%)' 
                : 'rgba(108, 117, 125, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '25px',
              cursor: isFormValid() ? 'pointer' : 'not-allowed',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              margin: '0 auto',
              gap: '12px'
            }}}
            className="responsive-text-primary"
            whileHover={isFormValid() ? {
              scale: 1.05,
              boxShadow: '0 12px 40px rgba(0, 0, 0, 0.2)'
            } : {}}
            whileTap={isFormValid() ? { scale: 0.98 } : {}}
          >
            <CheckCircle size={24} />
            Proceed to Payment
          </motion.button>
        </motion.div>
      </Container>
    </div>
  );
};

export default OrderPage;
