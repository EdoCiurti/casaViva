import React, { useEffect, useState } from "react";
import { Container, Row, Col, Card, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";

const SuccessPage = () => {
  const [orderDetails, setOrderDetails] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [estimatedDeliveryDate, setEstimatedDeliveryDate] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get("http://localhost:5000/api/cart", {
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
  };

  return (
    <Container className="mt-5">
        <br></br><br></br>
      <Row className="justify-content-center">
        <Col md={8}>
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="text-center shadow-lg">
              <Card.Header as="h5" className="bg-success text-white">Pagamento Riuscito</Card.Header>
              <Card.Body>
                <Card.Title className="mb-4">Grazie per il tuo ordine!</Card.Title>
                <Card.Text className="mb-4">
                  Il tuo pagamento è stato elaborato con successo.
                </Card.Text>
                {orderDetails.length > 0 && (
                  <>
                    <Card.Text>
                      <strong>Riepilogo Ordine:</strong>
                      <ul className="list-unstyled">
                        {orderDetails.map((item) => (
                          <li key={item.product._id}>
                            {item.product.name} - Quantità: {item.quantity} - Prezzo: €{(item.product.price * item.quantity).toFixed(2)}
                          </li>
                        ))}
                      </ul>
                    </Card.Text>
                    <Card.Text>
                      <strong>Totale Pagato:</strong> €{totalPrice.toFixed(2)}
                    </Card.Text>
                    <Card.Text>
                      <strong>Data di Consegna Stimata:</strong> {estimatedDeliveryDate}
                    </Card.Text>
                  </>
                )}
                <Button variant="primary" onClick={handleBackToHome} className="mt-4">
                  Torna alla Pagina Iniziale
                </Button>
              </Card.Body>
            </Card>
          </motion.div>
        </Col>
      </Row>
      <br></br><br></br><br></br>
    </Container>
  );
};

export default SuccessPage;