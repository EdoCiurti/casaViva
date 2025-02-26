import { Container, Navbar, Nav, NavDropdown } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

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
            <button className="theme-button" onClick={toggleDarkMode}>
              {darkMode ? "🌙" : "☀️"}
            </button>

            {username ? (
              <NavDropdown title={`👤 ${username}`} id="basic-nav-dropdown" style={{ fontSize: '1.2rem' }}>
                <NavDropdown.Item as={Link} to="/cart">🛒 Carrello</NavDropdown.Item>
                <NavDropdown.Item onClick={handleLogout} style={{ cursor: 'pointer' }}>🚪 Logout</NavDropdown.Item>
              </NavDropdown>
            ) : (
              <Nav.Link as={Link} to="/login" style={{ fontSize: '1.2rem' }}>🔑 Accedi</Nav.Link>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Header;
