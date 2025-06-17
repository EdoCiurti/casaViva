import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Form, Button, Card, Alert } from "react-bootstrap";
import { motion } from "framer-motion";
import { FaUser, FaEnvelope, FaLock, FaUserPlus, FaSignInAlt, FaMagic } from "react-icons/fa";
import { API_ENDPOINTS } from '../config/api';

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState(null);
  const [darkMode, setDarkMode] = useState(localStorage.getItem("darkMode") === "true");
  const navigate = useNavigate();

  useEffect(() => {
    const handleDarkModeToggle = () => {
      setDarkMode(localStorage.getItem("darkMode") === "true");
    };

    window.addEventListener('darkModeToggle', handleDarkModeToggle);

    return () => {
      window.removeEventListener('darkModeToggle', handleDarkModeToggle);
    };
  }, []);

  const handleAuth = async (e) => {
    e.preventDefault();
    setError(null);

    try {      const url = isRegistering
        ? API_ENDPOINTS.AUTH_REGISTER
        : API_ENDPOINTS.AUTH_LOGIN;

      const response = await axios.post(url, isRegistering ? { email, password, username } : { email, password }, { headers: { 'Content-Type': 'application/json' } });

      if (response) {
        localStorage.setItem("token", response.data.token);
        const loggedInUsername = response.data.username;
        localStorage.setItem("username", loggedInUsername);

        if (loggedInUsername === "admin") {
          navigate('/admin');
        } else {
          navigate('/');
        }
        window.location.reload();
      }
    } catch (err) {
      console.log(err);
      setError("Errore nell'autenticazione. Riprova.");
    }
  };  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className={`login-section d-flex justify-content-center align-items-center vh-100 ${
        darkMode ? 'glassmorphism-bg' : 'glassmorphism-bg light-mode'
      }`}
      style={{
        minHeight: "100vh",
        position: "relative",
        overflow: "hidden"
      }}
    >
      {/* Background Pattern */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `radial-gradient(circle at 20% 20%, rgba(255,255,255,0.1) 1px, transparent 1px),
                           radial-gradient(circle at 80% 80%, rgba(255,255,255,0.05) 1px, transparent 1px)`,
          backgroundSize: "50px 50px",
          opacity: 0.3,
          pointerEvents: "none"
        }}
      />
      
      {/* Floating Elements */}
      <div
        style={{
          position: "absolute",
          top: "20%",
          right: "10%",
          width: "100px",
          height: "100px",
          background: "rgba(255,255,255,0.1)",
          borderRadius: "50%",
          filter: "blur(40px)",
          pointerEvents: "none"
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "20%",
          left: "15%",
          width: "80px",
          height: "80px",
          background: "rgba(255,255,255,0.08)",
          borderRadius: "50%",
          filter: "blur(30px)",
          pointerEvents: "none"
        }}
      />

      <motion.div
        initial={{ scale: 0.8, y: 50, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
        style={{
          background: "rgba(255,255,255,0.1)",
          backdropFilter: "blur(20px)",
          borderRadius: "25px",
          padding: "50px 40px",
          border: "1px solid rgba(255,255,255,0.2)",
          boxShadow: "0 25px 50px rgba(0,0,0,0.2)",
          width: "450px",
          position: "relative",
          zIndex: 10
        }}
      >
        {/* Header with Icon */}
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="text-center mb-5"
        >
          <motion.div
            initial={{ scale: 0, rotate: 180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.6, type: "spring", stiffness: 150 }}
            style={{
              display: "inline-block",
              background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
              borderRadius: "50%",
              padding: "20px",
              marginBottom: "20px",
              boxShadow: "0 15px 35px rgba(79,172,254,0.3)"
            }}
          >
            {isRegistering ? <FaUserPlus size={35} color="#fff" /> : <FaSignInAlt size={35} color="#fff" />}
          </motion.div>
            <h2 
            className="responsive-text-primary"
            style={{ 
              fontWeight: "700",
              fontSize: "2.2rem",
              marginBottom: "10px",
              textShadow: "0 4px 20px rgba(0,0,0,0.3)"
            }}
          >
            {isRegistering ? "Crea Account" : "Benvenuto"}
          </h2>
          <p 
            className="responsive-text-secondary"
            style={{ 
              fontSize: "1.1rem",
              margin: 0
            }}
          >
            {isRegistering ? "Unisciti alla community CasaViva" : "Accedi al tuo account CasaViva"}
          </p>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Alert 
              variant="danger" 
              style={{
                background: "rgba(220,53,69,0.2)",
                border: "1px solid rgba(220,53,69,0.5)",
                color: "#fff",
                borderRadius: "15px",
                marginBottom: "25px"
              }}
            >
              {error}
            </Alert>
          </motion.div>
        )}

        <Form onSubmit={handleAuth}>
          {isRegistering && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8, duration: 0.5 }}
            >              <Form.Group className="mb-4">
                <Form.Label 
                  className="responsive-text-primary"
                  style={{ 
                    fontWeight: "600",
                    fontSize: "1rem",
                    marginBottom: "10px",
                    display: "flex",
                    alignItems: "center"
                  }}
                >
                  <FaUser style={{ marginRight: "8px", fontSize: "0.9rem" }} />
                  Username
                </Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Inserisci il tuo username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="glass-input"
                />
              </Form.Group>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: isRegistering ? 1 : 0.8, duration: 0.5 }}
          >            <Form.Group className="mb-4">
              <Form.Label 
                className="responsive-text-primary"
                style={{ 
                  fontWeight: "600",
                  fontSize: "1rem",
                  marginBottom: "10px",
                  display: "flex",
                  alignItems: "center"
                }}
              >
                <FaEnvelope style={{ marginRight: "8px", fontSize: "0.9rem" }} />
                Email
              </Form.Label>
              <Form.Control
                type="email"
                placeholder="Inserisci la tua email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="glass-input"
              />
            </Form.Group>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: isRegistering ? 1.2 : 1, duration: 0.5 }}
          >            <Form.Group className="mb-4">
              <Form.Label 
                className="responsive-text-primary"
                style={{ 
                  fontWeight: "600",
                  fontSize: "1rem",
                  marginBottom: "10px",
                  display: "flex",
                  alignItems: "center"
                }}
              >
                <FaLock style={{ marginRight: "8px", fontSize: "0.9rem" }} />
                Password
              </Form.Label>
              <Form.Control
                type="password"
                placeholder="Inserisci la tua password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="glass-input"
              />
            </Form.Group>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: isRegistering ? 1.4 : 1.2, duration: 0.5 }}
          >            <Button 
              type="submit" 
              className="glass-button"
              style={{
                padding: "12px 0",
                fontSize: "1rem",
                fontWeight: "600",
                width: "100%",
                marginBottom: "20px",
                borderRadius: "8px"
              }}
            >
              {isRegistering ? (
                <>
                  <FaUserPlus className="me-2" />
                  Crea Account
                </>
              ) : (
                <>
                  <FaSignInAlt className="me-2" />
                  Accedi
                </>
              )}
            </Button>
          </motion.div>
        </Form>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: isRegistering ? 1.6 : 1.4, duration: 0.5 }}
        >          <Button
            variant="link"
            className="w-100 text-center responsive-text-secondary"
            onClick={() => setIsRegistering(!isRegistering)}
            style={{
              textDecoration: "none",
              fontSize: "1rem",
              fontWeight: "500",
              padding: "10px 0",
              transition: "all 0.3s ease"
            }}
            onMouseEnter={(e) => {
              e.target.style.textDecoration = "underline";
            }}
            onMouseLeave={(e) => {
              e.target.style.textDecoration = "none";
            }}
          >
            {isRegistering ? "Hai già un account? Accedi qui" : "Non hai un account? Registrati qui"}
          </Button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default LoginPage;