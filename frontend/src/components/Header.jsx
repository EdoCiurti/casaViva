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
      bg={darkMode ? "dark" : "light"}
      variant={darkMode ? "dark" : "light"}
      expand="lg"
      className="py-3"
      style={{ width: '100%', position: 'fixed', top: 0, zIndex: 1 }}
    >
      <Container>
        <Navbar.Brand as={Link} to="/" style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
          E-Commerce AR
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto">
            {/* Pulsante dark mode */}
            <motion.button
              className="theme-button"
              onClick={toggleDarkMode}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}
            >
              {darkMode ? "🌙" : "☀️"}
            </motion.button>

            {username ? (
              <NavDropdown
                title={`👤 ${username}`}
                id="basic-nav-dropdown"
                className="custom-dropdown"
                style={{ fontSize: '1.2rem', borderRadius: '10px', overflow: 'show', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)' }}
              >
                <NavDropdown.Item as={Link} to="/profile" className="custom-dropdown-item" style={{ padding: '10px 20px', transition: 'background-color 0.3s ease, color 0.3s ease' }}>👤 Profilo</NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/cart" className="custom-dropdown-item" style={{ padding: '10px 20px', transition: 'background-color 0.3s ease, color 0.3s ease' }}>🛒 Carrello</NavDropdown.Item>
                <NavDropdown.Item onClick={handleLogout} className="custom-dropdown-item" style={{ padding: '10px 20px', cursor: 'pointer', transition: 'background-color 0.3s ease, color 0.3s ease' }}>🚪 Logout</NavDropdown.Item>
              </NavDropdown>
            ) : (
              <Nav.Link
                as={Link}
                to="/login"
                style={{ fontSize: '1.2rem' }}
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
      </Container>
      <style>{`
        .theme-button {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
        }
        .custom-dropdown {
          background-color: ${darkMode ? '#343a40' : '#f8f9fa'};
          border-radius: 10px;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          overflow: show;
        }

        .custom-dropdown-item {
          padding: 10px 20px;
          transition: background-color 0.3s ease, color 0.3s ease;
        }

        .custom-dropdown-item:hover {
          background-color: #007bff;
          color: white;
        }
      `}</style>
    </Navbar>
  );
};

export default Header;