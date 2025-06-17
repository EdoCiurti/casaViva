import React, { useEffect, useState } from "react";
import { Container, Row, Col } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, Package, Calendar, CreditCard, Home, Truck, Gift } from "lucide-react";
import { API_ENDPOINTS } from '../config/api';

const SuccessPage = () => {
  const [orderDetails, setOrderDetails] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [estimatedDeliveryDate, setEstimatedDeliveryDate] = useState("");
  const [darkMode, setDarkMode] = useState(localStorage.getItem("darkMode") === "true");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(API_ENDPOINTS.CART, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setOrderDetails(response.data.products);
        calculateTotalPrice(response.data.products);
        generateEstimatedDeliveryDate();
      } catch (error) {
        console.error("Errore nel recupero dei dettagli dell'ordine:", error);
      }
    };

    fetchOrderDetails();
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

  const calculateTotalPrice = (products) => {
    const total = products.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
    setTotalPrice(total);
  };

  const generateEstimatedDeliveryDate = () => {
    const today = new Date();
    const randomDaysToAdd = Math.floor(Math.random() * 7) + 3; // Aggiunge tra 3 e 9 giorni
    const estimatedDate = new Date(today);
    estimatedDate.setDate(today.getDate() + randomDaysToAdd);
    setEstimatedDeliveryDate(estimatedDate.toLocaleDateString());
  };

  const handleBackToHome = () => {
    navigate("/");
  };  return (
    <div className={`glass-container ${darkMode ? 'dark-mode' : 'light-mode'}`} style={{
      minHeight: '100vh',
      position: 'relative',
      overflow: 'hidden'
    }}>      {/* Animated Background Elements */}
      <motion.div
        style={{
          position: 'absolute',
          top: '15%',
          left: '8%',
          width: '120px',
          height: '120px',
          background: `rgba(255, 255, 255, ${darkMode ? '0.05' : '0.1'})`,
          borderRadius: '50%',
          backdropFilter: 'blur(10px)',
        }}
        animate={{
          y: [0, -25, 0],
          x: [0, 15, 0],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />      <motion.div
        style={{
          position: 'absolute',
          top: '70%',
          right: '10%',
          width: '90px',
          height: '90px',
          background: `rgba(255, 255, 255, ${darkMode ? '0.04' : '0.08'})`,
          borderRadius: '30%',
          backdropFilter: 'blur(8px)',
        }}
        animate={{
          y: [0, 20, 0],
          rotate: [0, 360],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "linear"
        }}
      />      <motion.div
        style={{
          position: 'absolute',
          bottom: '25%',
          left: '15%',
          width: '70px',
          height: '70px',
          background: `rgba(255, 255, 255, ${darkMode ? '0.06' : '0.12'})`,
          borderRadius: '40%',
          backdropFilter: 'blur(6px)',
        }}
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.6, 1, 0.6],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      <Container style={{ paddingTop: '120px', paddingBottom: '60px', position: 'relative', zIndex: 1 }}>
        <Row className="justify-content-center">
          <Col lg={10} xl={8}>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, type: "spring", stiffness: 100 }}
              style={{
                textAlign: 'center',
                marginBottom: '50px'
              }}
            >
              {/* Success Icon */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                style={{
                  display: 'inline-block',
                  padding: '25px',
                  background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                  borderRadius: '50%',
                  marginBottom: '30px',
                  boxShadow: '0 20px 40px rgba(40, 167, 69, 0.3)'
                }}
              >
                <CheckCircle size={60} color="white" />
              </motion.div>              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="responsive-text-primary"
                style={{
                  fontSize: '3.5rem',
                  fontWeight: '700',
                  background: darkMode 
                    ? 'linear-gradient(135deg, #f0f0f0 0%, #e0e0e0 50%, #d0d0d0 100%)'
                    : 'linear-gradient(135deg, #ffffff 0%, #f8f9ff 50%, #e8ecff 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  marginBottom: '20px',
                  textShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
                }}
              >
                Payment Successful!
              </motion.h1>              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="responsive-text-secondary"
                style={{
                  fontSize: '1.3rem',
                  maxWidth: '600px',
                  margin: '0 auto 40px auto',
                  lineHeight: '1.6'
                }}
              >
                Thank you for your order! Your payment has been processed successfully.
              </motion.p>
            </motion.div>            {/* Order Details Card */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.9 }}
              className="glass-card"
              style={{
                padding: '40px',
                marginBottom: '40px'
              }}
            >              {/* Order Summary Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '35px',
                paddingBottom: '20px',
                borderBottom: `2px solid ${darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.2)'}`
              }}>
                <Package size={28} className="responsive-text-primary" style={{ marginRight: '15px' }} />
                <h2 className="responsive-text-primary" style={{
                  fontWeight: '600',
                  margin: 0,
                  fontSize: '1.8rem'
                }}>
                  Order Summary
                </h2>
              </div>

              {orderDetails.length > 0 && (
                <>
                  {/* Order Items */}
                  <div style={{ marginBottom: '35px' }}>
                    <AnimatePresence>
                      {orderDetails.map((item, index) => (                        <motion.div
                          key={item.product._id}
                          initial={{ opacity: 0, x: -30 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 1 + index * 0.1 }}
                          className="glass-card-inner"
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '20px',
                            marginBottom: '15px'
                          }}
                        >                          <div style={{ flex: 1 }}>
                            <h5 className="responsive-text-primary" style={{
                              fontWeight: '600',
                              margin: '0 0 8px 0',
                              fontSize: '1.2rem'
                            }}>
                              {item.product.name}
                            </h5>
                            <p className="responsive-text-secondary" style={{
                              margin: 0,
                              fontSize: '1rem'
                            }}>
                              Quantity: {item.quantity}
                            </p>
                          </div>
                          <div className="responsive-text-primary" style={{
                            fontWeight: '700',
                            fontSize: '1.3rem'
                          }}>
                            €{(item.product.price * item.quantity).toFixed(2)}
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>

                  {/* Total and Details */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.5 }}
                  >
                    <Row>                      <Col md={4}>
                        <div className="glass-card-inner" style={{
                          padding: '25px',
                          textAlign: 'center',
                          marginBottom: '20px'
                        }}>
                          <CreditCard size={24} className="responsive-text-primary" style={{ marginBottom: '10px' }} />
                          <h4 className="responsive-text-primary" style={{
                            fontWeight: '700',
                            margin: '0 0 5px 0',
                            fontSize: '1.5rem'
                          }}>
                            €{totalPrice.toFixed(2)}
                          </h4>
                          <p className="responsive-text-secondary" style={{
                            margin: 0,
                            fontSize: '0.9rem'
                          }}>
                            Total Paid
                          </p>
                        </div>
                      </Col>
                      <Col md={4}>
                        <div className="glass-card-inner" style={{
                          padding: '25px',
                          textAlign: 'center',
                          marginBottom: '20px'
                        }}>
                          <Calendar size={24} className="responsive-text-primary" style={{ marginBottom: '10px' }} />
                          <h4 className="responsive-text-primary" style={{
                            fontWeight: '700',
                            margin: '0 0 5px 0',
                            fontSize: '1.2rem'
                          }}>
                            {estimatedDeliveryDate}
                          </h4>
                          <p className="responsive-text-secondary" style={{
                            margin: 0,
                            fontSize: '0.9rem'
                          }}>
                            Estimated Delivery
                          </p>
                        </div>
                      </Col>
                      <Col md={4}>
                        <div className="glass-card-inner" style={{
                          padding: '25px',
                          textAlign: 'center',
                          marginBottom: '20px'
                        }}>
                          <Truck size={24} className="responsive-text-primary" style={{ marginBottom: '10px' }} />
                          <h4 className="responsive-text-primary" style={{
                            fontWeight: '700',
                            margin: '0 0 5px 0',
                            fontSize: '1.2rem'
                          }}>
                            Free
                          </h4>
                          <p className="responsive-text-secondary" style={{
                            margin: 0,
                            fontSize: '0.9rem'
                          }}>
                            Shipping
                          </p>
                        </div>
                      </Col>
                    </Row>
                  </motion.div>
                </>
              )}
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 1.7 }}
              style={{ textAlign: 'center' }}
            >              <motion.button
                onClick={handleBackToHome}
                className="glass-button responsive-text-primary"
                style={{
                  padding: '18px 50px',
                  fontSize: '1.3rem',
                  fontWeight: '600',
                  border: 'none',
                  borderRadius: '25px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  margin: '0 auto',
                  gap: '12px'
                }}
                whileHover={{
                  scale: 1.05,
                  boxShadow: '0 12px 40px rgba(0, 0, 0, 0.2)'
                }}
                whileTap={{ scale: 0.98 }}
              >
                <Home size={24} />
                Back to Home
              </motion.button>
            </motion.div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default SuccessPage;