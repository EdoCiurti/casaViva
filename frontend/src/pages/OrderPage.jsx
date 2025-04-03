import React, { useState, useEffect, useRef } from "react";
import { Container, Row, Col, Card, Form, Button, Alert } from "react-bootstrap";
import { motion } from "framer-motion";
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

  // useEffect(() => {
  //   const loadScript = (url, callback) => {
  //     const script = document.createElement("script");
  //     script.type = "text/javascript";
  //     script.src = url;
  //     script.onload = callback;
  //     document.head.appendChild(script);
  //   };

  //   loadScript(`https://maps.googleapis.com/maps/api/js?key=AIzaSyBUSCdPDCz0xe58_cHSoQWU5zLy4lE_IqE&libraries=places`, () => {
  //     const autocomplete = new window.google.maps.places.Autocomplete(addressInputRef.current, {
  //       types: ["address"],
  //     });

  //     autocomplete.addListener("place_changed", () => {
  //       const place = autocomplete.getPlace();
  //       const address = place.formatted_address;
  //       const city = place.address_components.find(component => component.types.includes("locality"))?.long_name || "";
  //       const postalCode = place.address_components.find(component => component.types.includes("postal_code"))?.long_name || "";
  //       const country = place.address_components.find(component => component.types.includes("country"))?.long_name || "";

  //       setShippingInfo({ address, city, postalCode, country });
  //     });
  //   });
  // }, []);

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
    <Container className={`mt-5 ${darkMode ? "dark-mode order-dark-text" : "light-mode"}`}>
      <br></br><br></br>
      <motion.h1
        className="text-center mb-4 checkout-title"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Checkout
      </motion.h1>
      {error && <Alert variant="danger">{error}</Alert>}
      <Row>
        <Col md={6}>
          <motion.div
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="mb-4 shadow-lg">
              <Card.Header as="h5">Riepilogo Ordine</Card.Header>
              <Card.Body>

                {cartItems.map((item) => (
                  <div key={item.product._id} className="d-flex justify-content-between align-items-center mb-3">
                    <div>
                      <h6>{item.product.name}</h6>
                      <p>Quantità: {item.quantity}</p>
                    </div>
                    <p>€{(item.product.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
                <h5 className="text-end">Totale: €{cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0).toFixed(2)}</h5>
              </Card.Body>
            </Card>
          </motion.div>
        </Col>
        <Col md={6}>
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="mb-4 shadow-lg">
              <Card.Header as="h5">Informazioni di Spedizione</Card.Header>
              <Card.Body>
                <Form>
                  <Form.Group className="mb-3">
                    <Form.Label>Indirizzo</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Inserisci indirizzo"
                      value={shippingInfo.address}
                      onChange={(e) => setShippingInfo({ ...shippingInfo, address: e.target.value })}
                      ref={addressInputRef}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Città</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Inserisci città"
                      value={shippingInfo.city}
                      onChange={(e) => setShippingInfo({ ...shippingInfo, city: e.target.value })}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Codice Postale</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Inserisci codice postale"
                      value={shippingInfo.postalCode}
                      onChange={(e) => setShippingInfo({ ...shippingInfo, postalCode: e.target.value })}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Paese</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Inserisci paese"
                      value={shippingInfo.country}
                      onChange={(e) => setShippingInfo({ ...shippingInfo, country: e.target.value })}
                    />
                  </Form.Group>
                </Form>
              </Card.Body>
            </Card>
          </motion.div>
        </Col>
      </Row>
      <motion.div
        className="text-center"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Button variant="success" size="lg" onClick={handleOrder} disabled={!isFormValid()}>
          Procedi al Pagamento
        </Button>
      </motion.div>
    </Container>
  );
};

export default OrderPage;