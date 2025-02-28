import { useEffect, useState } from "react";
import { Container, Button } from "react-bootstrap";
import { motion } from "framer-motion";

const HomePage = () => {
  const [darkMode, setDarkMode] = useState(localStorage.getItem("darkMode") === "true");

  useEffect(() => {
    const handleDarkModeToggle = () => {
      setDarkMode(localStorage.getItem("darkMode") === "true");
    };

    window.addEventListener('darkModeToggle', handleDarkModeToggle);

    return () => {
      window.removeEventListener('darkModeToggle', handleDarkModeToggle);
    };
  }, []);

  return (
    <Container 
      fluid 
      className={`vh-100 w-100 d-flex flex-column justify-content-center align-items-center ${darkMode ? "bg-dark text-light" : "bg-light text-dark"} text-center`}
      style={{ overflowX: 'hidden' }}
    >
      <motion.h1 
        className="display-3 text-primary font-weight-bold"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
      >
        Benvenuto nel nostro E-commerce
      </motion.h1>
      <motion.p 
        className="lead text-secondary"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.5 }}
      >
        Sfoglia i nostri prodotti e aggiungili al carrello!
      </motion.p>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 1 }}
      >
        <Button variant="outline-primary" size="lg" href="/products" className="mt-3" style={{ width: '100%' }}>
          Esplora i Prodotti
        </Button>
      </motion.div>
    </Container>
  );
};

export default HomePage;