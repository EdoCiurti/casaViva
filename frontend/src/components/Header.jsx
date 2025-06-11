import { Container, Navbar, Nav, NavDropdown } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [username, setUsername] = useState(localStorage.getItem("username"));
  const [darkMode, setDarkMode] = useState(localStorage.getItem("darkMode") === "true");

  useEffect(() => {
    const handleStorageChange = () => {
      setUsername(localStorage.getItem("username"));
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [location]);

  // Funzione per attivare/disattivare la dark mode
  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem("darkMode", newMode);
    document.body.classList.toggle("dark-mode", newMode);
    document.body.classList.toggle("light-mode", !newMode);

    // Dispatch custom event
    window.dispatchEvent(new Event('darkModeToggle'));
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    setUsername(null);
    navigate("/login");
  };


  return (
    <Navbar
      expand="lg"
      className={`py-3 glass-nav ${darkMode ? "dark" : "light"}`}
      style={{
        width: '100%',
        position: 'fixed',
        top: 0,
        zIndex: 1000, // Assicura che la navbar sia sopra tutto
        boxShadow: '0 2px 5px rgba(0, 0, 0, 0.2)', // Aggiungi un'ombra
      }}
    >
      <Container>
        <Navbar.Brand 
          as={Link} 
          to="/" 
          style={{ 
            fontSize: '1.5rem', 
            fontWeight: 'bold',
            color: darkMode ? 'white' : '#000'
          }}
        >
          E-Commerce AR
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto">            {/* Pulsante dark mode */}
            <motion.button
              className="glass-button pulse-animation" // Aggiungi la classe qui
              onClick={toggleDarkMode}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}
            >
              {darkMode ? "🌙" : "☀️"}
            </motion.button>            {username ? (              <NavDropdown
                title={`👤 ${username}`}
                id="basic-nav-dropdown"
                className="glass-dropdown"
                style={{ 
                  fontSize: '1.2rem',
                  color: darkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)'
                }}
              ><NavDropdown.Item as={Link} to="/profile" className="glass-dropdown-item" style={{color: 'inherit'}}>
                  👤 Profilo
                </NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/cart" className="glass-dropdown-item" style={{color: 'inherit'}}>
                  🛒 Carrello
                </NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/wishlist" className="glass-dropdown-item" style={{color: 'inherit'}}> {/* Aggiungi la wishlist */}
                  💖 Wishlist
                </NavDropdown.Item>
                <NavDropdown.Item onClick={handleLogout} className="glass-dropdown-item" style={{color: 'inherit'}}>
                  🚪 Logout
                </NavDropdown.Item>
              </NavDropdown>
            ) : (              <Nav.Link
                as={Link}
                to="/login"
                style={{ 
                  fontSize: '1.2rem',
                  color: darkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)'
                }}
                //as={motion.div}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                🔑 Accedi
              </Nav.Link>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>      <style>{`
        .glass-button {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          padding: 8px 12px;
          transition: all 0.3s ease;
        }
        
        .glass-button:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: translateY(-2px);
        }
        
        /* Dropdown Menu Glassmorphism */
        .glass-dropdown .dropdown-menu {
          background: rgba(255, 255, 255, 0.1) !important;
          backdrop-filter: blur(20px) !important;
          border: 1px solid rgba(255, 255, 255, 0.2) !important;
          border-radius: 12px !important;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3) !important;
          padding: 8px !important;
          margin-top: 8px !important;
        }
        
        .glass-dropdown .dropdown-toggle {
          background: rgba(255, 255, 255, 0.1) !important;
          backdrop-filter: blur(10px) !important;
          border: 1px solid rgba(255, 255, 255, 0.2) !important;
          border-radius: 8px !important;
          padding: 8px 16px !important;
          transition: all 0.3s ease !important;
        }
        
        .glass-dropdown .dropdown-toggle:hover {
          background: rgba(255, 255, 255, 0.2) !important;
          transform: translateY(-1px) !important;
        }
        
        .glass-dropdown-item {
          background: transparent !important;
          border: none !important;
          border-radius: 8px !important;
          margin: 2px 0 !important;
          padding: 10px 16px !important;
          transition: all 0.3s ease !important;
          color: inherit !important;
        }
        
        .glass-dropdown-item:hover {
          background: rgba(255, 255, 255, 0.2) !important;
          backdrop-filter: blur(10px) !important;
          transform: translateX(4px) !important;
          color: inherit !important;
        }
        
        .glass-dropdown-item:focus {
          background: rgba(255, 255, 255, 0.2) !important;
          color: inherit !important;
        }
        
        /* Light mode specific styles */
        .light .glass-dropdown .dropdown-menu {
          background: rgba(255, 255, 255, 0.9) !important;
          backdrop-filter: blur(20px) !important;
          border: 1px solid rgba(0, 0, 0, 0.1) !important;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1) !important;
        }
        
        .light .glass-dropdown .dropdown-toggle {
          background: rgba(255, 255, 255, 0.3) !important;
          border: 1px solid rgba(0, 0, 0, 0.1) !important;
          color: #000 !important;
        }
        
        .light .glass-dropdown .dropdown-toggle:hover {
          background: rgba(255, 255, 255, 0.4) !important;
        }
        
        .light .glass-dropdown-item {
          color: rgba(0, 0, 0, 0.8) !important;
        }
        
        .light .glass-dropdown-item:hover {
          background: rgba(0, 0, 0, 0.1) !important;
          color: #000 !important;
        }
        
        .light .glass-dropdown-item:focus {
          background: rgba(0, 0, 0, 0.1) !important;
          color: #000 !important;
        }
        
        .light .glass-button {
          background: rgba(255, 255, 255, 0.3);
          border: 1px solid rgba(0, 0, 0, 0.1);
        }
        
        .light .glass-button:hover {
          background: rgba(255, 255, 255, 0.4);
        }
      `}</style>
    </Navbar>
  );
};

export default Header;