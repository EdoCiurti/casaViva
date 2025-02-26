import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Form, Button, Card, Alert } from "react-bootstrap";

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

    try {
      const url = isRegistering
        ? "http://localhost:5000/api/auth/register"
        : "http://localhost:5000/api/auth/login";

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
  };

  return (
    <div className={`login-section d-flex justify-content-center align-items-center vh-100 ${darkMode ? "dark-mode login-dark-text" : "light-mode"}`}>
      <Card style={{ width: "400px" }} className="p-4 shadow-lg">
        <h2 className="text-center mb-4">{isRegistering ? "Registrati" : "Login"}</h2>
        {error && <Alert variant="danger">{error}</Alert>}
        <Form onSubmit={handleAuth}>
          {isRegistering && (
            <Form.Group className="mb-3">
              <Form.Label>Username</Form.Label>
              <Form.Control
                type="text"
                placeholder="Inserisci username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </Form.Group>
          )}
          <Form.Group className="mb-3">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              placeholder="Inserisci email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Password</Form.Label>
            <Form.Control
              type="password"
              placeholder="Inserisci password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </Form.Group>
          <Button variant="primary" type="submit" className="w-100">
            {isRegistering ? "Registrati" : "Accedi"}
          </Button>
        </Form>
        <Button
          variant="link"
          className="mt-3 w-100 text-center"
          onClick={() => setIsRegistering(!isRegistering)}
        >
          {isRegistering ? "Hai già un account? Accedi" : "Non hai un account? Registrati"}
        </Button>
      </Card>
    </div>
  );
};

export default LoginPage;