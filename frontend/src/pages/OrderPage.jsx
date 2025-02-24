import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Form, Button, Container, Row, Col, Alert, ListGroup } from "react-bootstrap";

const OrderPage = () => {
    const navigate = useNavigate();
    const [cart, setCart] = useState([]);
    const [total, setTotal] = useState(0);
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        taxCode: "",
        address: "",
        city: "",
        province: "",
        postalCode: "",
        phone: "",
        email: "",
        password: "",
        confirmPassword: "",
        newsletter: false,
        invoiceRequest: false
    });
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchCart = async () => {
            try {
                const token = localStorage.getItem("token");
                const response = await axios.get("http://localhost:5000/api/cart", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setCart(response.data.products);
                const totalPrice = response.data.products.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
                setTotal(totalPrice);
            } catch (err) {
                console.error("Errore nel recupero del carrello", err);
                setError("Errore nel caricamento del carrello");
            }
        };
        fetchCart();
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === "checkbox" ? checked : value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem("token");
            const orderResponse = await axios.post("http://localhost:5000/api/orders", {
                products: cart,
                billingInfo: formData
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            const paymentResponse = await axios.post("http://localhost:5000/api/payments/create-checkout-session", {
                cartItems: cart
            });
            
            window.location.href = paymentResponse.data.url;
        } catch (err) {
            console.error("Errore nell'invio dell'ordine", err);
            setError("Errore durante la creazione dell'ordine");
        }
    };

    return (
        <Container>
            <h2>Checkout</h2>
            {error && <Alert variant="danger">{error}</Alert>}
            <Form onSubmit={handleSubmit}>
                <Row>
                    <Col md={6}>
                        <Form.Group controlId="firstName">
                            <Form.Label>Nome *</Form.Label>
                            <Form.Control type="text" name="firstName" value={formData.firstName} onChange={handleChange} required />
                        </Form.Group>
                        <Form.Group controlId="lastName">
                            <Form.Label>Cognome *</Form.Label>
                            <Form.Control type="text" name="lastName" value={formData.lastName} onChange={handleChange} required />
                        </Form.Group>
                        <Form.Group controlId="taxCode">
                            <Form.Label>Codice Fiscale *</Form.Label>
                            <Form.Control type="text" name="taxCode" value={formData.taxCode} onChange={handleChange} required />
                        </Form.Group>
                        <Form.Group controlId="address">
                            <Form.Label>Indirizzo *</Form.Label>
                            <Form.Control type="text" name="address" value={formData.address} onChange={handleChange} required />
                        </Form.Group>
                    </Col>
                    <Col md={6}>
                        <Form.Group controlId="city">
                            <Form.Label>Città *</Form.Label>
                            <Form.Control type="text" name="city" value={formData.city} onChange={handleChange} required />
                        </Form.Group>
                        <Form.Group controlId="province">
                            <Form.Label>Provincia *</Form.Label>
                            <Form.Control type="text" name="province" value={formData.province} onChange={handleChange} required />
                        </Form.Group>
                        <Form.Group controlId="postalCode">
                            <Form.Label>CAP *</Form.Label>
                            <Form.Control type="text" name="postalCode" value={formData.postalCode} onChange={handleChange} required />
                        </Form.Group>
                        <Form.Group controlId="phone">
                            <Form.Label>Telefono *</Form.Label>
                            <Form.Control type="text" name="phone" value={formData.phone} onChange={handleChange} required />
                        </Form.Group>
                    </Col>
                </Row>
                <Form.Group controlId="newsletter">
                    <Form.Check type="checkbox" label="Iscriviti alla nostra newsletter e ricevi subito 10 € sul tuo prossimo acquisto!" name="newsletter" checked={formData.newsletter} onChange={handleChange} />
                </Form.Group>
                <Form.Group controlId="invoiceRequest">
                    <Form.Check type="checkbox" label="Richiedi la fattura" name="invoiceRequest" checked={formData.invoiceRequest} onChange={handleChange} />
                </Form.Group>
                <Button variant="primary" type="submit">Procedi al pagamento</Button>
            </Form>
            <h3 className="mt-4">Riepilogo Ordine</h3>
            <ListGroup>
                {cart.map((item) => (
                    <ListGroup.Item key={item.product._id} className="d-flex justify-content-between align-items-center">
                        <div>
                            <h5>{item.product.name}</h5>
                            <p>Quantità: {item.quantity}</p>
                        </div>
                        <div>
                            <h5>€{(item.product.price * item.quantity).toFixed(2)}</h5>
                        </div>
                    </ListGroup.Item>
                ))}
            </ListGroup>
            <h3 className="mt-4">Totale: €{total.toFixed(2)}</h3>
        </Container>
    );
};

export default OrderPage;