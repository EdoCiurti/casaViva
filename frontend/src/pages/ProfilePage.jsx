import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import { Spinner } from 'react-bootstrap';

const ProfilePage = () => {
    const [userData, setUserData] = useState({});
    const [orders, setOrders] = useState([]);
    const [cart, setCart] = useState([]);
    const [username, setUsername] = useState(localStorage.getItem("username"));
    const [currentOrderIndex, setCurrentOrderIndex] = useState(0);
    const [loadingOrders, setLoadingOrders] = useState(true);
    const [loadingCart, setLoadingCart] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProfileData = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    navigate('/login');
                    return;
                }

                const userResponse = await axios.get('http://localhost:5000/api/auth/profile', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setUserData(userResponse.data);

                const ordersResponse = await axios.get('http://localhost:5000/api/orders/user', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setOrders(ordersResponse.data);
                setLoadingOrders(false); // Fine caricamento ordini

                const cartResponse = await axios.get('http://localhost:5000/api/cart', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setCart(cartResponse.data);
                setLoadingCart(false); // Fine caricamento carrello
            } catch (error) {
                console.error('Errore nel recupero dei dati del profilo', error);
                setLoadingOrders(false);
                setLoadingCart(false);
            }
        };

        fetchProfileData();
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("username");
        setUsername(null);
        navigate("/login");
        window.location.reload();
    };

    const handleNextOrder = () => {
        setCurrentOrderIndex((prevIndex) => (prevIndex + 1) % orders.length);
    };

    const handlePrevOrder = () => {
        setCurrentOrderIndex((prevIndex) => (prevIndex - 1 + orders.length) % orders.length);
    };

    return (
        <Container className="mt-5 profile-page">
            <Row>
                <Col md={4}>
                    <Card className="profile-card">
                        <Card.Body>
                            <Card.Title >Profilo Utente</Card.Title>
                            <Card.Text><strong>Nome:</strong> {userData.username}</Card.Text>
                            <Card.Text><strong>Email:</strong> {userData.email}</Card.Text>
                            <Button variant="danger" onClick={handleLogout}>Logout</Button>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={8}>
                    <Card className="mb-4 order-card">
                        <Card.Body>
                            <Card.Title>Ordini</Card.Title>
                            {loadingOrders ? (
                                <div className="text-center py-3">
                                    <Spinner animation="border" role="status">
                                        <span className="visually-hidden">Caricamento...</span>
                                    </Spinner>
                                </div>
                            ) : orders.length > 0 ? (
                                <div className="order-container">
                                    <FaArrowLeft className="arrow-icon left-arrow" onClick={handlePrevOrder} />
                                    <div className="order-details">
                                        <strong>Data:</strong> {new Date(orders[currentOrderIndex].createdAt).toLocaleDateString()}<br />
                                        <strong>Prodotti:</strong>
                                        <ul>
                                            {orders[currentOrderIndex].products.map(product => (
                                                <li key={product._id}>
                                                    {product.quantity} x {product.product ? product.product.name : 'Prodotto non disponibile'} - €{product.price}
                                                </li>
                                            ))}
                                        </ul>
                                        <strong>Stato:</strong> {orders[currentOrderIndex].status}
                                    </div>
                                    <FaArrowRight className="arrow-icon right-arrow" onClick={handleNextOrder} />
                                </div>
                            ) : (
                                <p>Nessun ordine disponibile</p>
                            )}
                        </Card.Body>
                    </Card>
                    <Card className="cart-card">
                        <Card.Body>
                            <Card.Title>Carrello</Card.Title>
                            {loadingCart ? (
                                <div className="text-center py-3">
                                    <Spinner animation="border" role="status">
                                        <span className="visually-hidden">Caricamento...</span>
                                    </Spinner>
                                </div>
                            ) : cart.products && cart.products.length > 0 ? (
                                <>
                                    <ul>
                                        {cart.products.map(item => (
                                            <li key={item._id}>
                                                {item.quantity} x {item.product.name} - €{item.product.price}
                                            </li>
                                        ))}
                                    </ul>
                                    <Button variant="dark" className="mt-3" onClick={() => navigate('/cart')}>
                                        Vai al Carrello
                                    </Button>
                                </>
                            ) : (
                                <p>Il carrello è vuoto</p>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
            <style>{`
                .profile-page {
                    font-family: 'Arial', sans-serif;
                    color: #333;
                }
                .profile-card, .order-card, .cart-card {
                    border-radius: 10px;
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                    border: none;
                }
                .profile-card .card-title, .order-card .card-title, .cart-card .card-title {
                    font-size: 1.5rem;
                    font-weight: bold;
                    color: #007bff;
                }
                .profile-card .card-text, .order-card .card-text, .cart-card .card-text {
                    font-size: 1rem;
                    margin-bottom: 1rem;
                }
                .order-container {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    position: relative;
                }
                .arrow-icon {
                    cursor: pointer;
                    font-size: 2rem;
                    color: #007bff;
                    transition: transform 0.2s;
                    position: absolute;
                    top: 50%;
                    transform: translateY(-50%);
                }
                .left-arrow {
                    left: -15px;
                }
                .right-arrow {
                    right: -15px;
                }
                .arrow-icon:hover {
                    transform: translateY(-50%) scale(1.2);
                }
                .order-details {
                    flex: 1;
                    padding: 0 2rem;
                }
                .order-details ul {
                    list-style-type: none;
                    padding: 0;
                }
                .order-details li {
                    margin-bottom: 0.5rem;
                }
                .order-details strong {
                    display: block;
                    margin-bottom: 0.5rem;
                }
                .btn-danger {
                    background-color: #dc3545;
                    border: none;
                    transition: background-color 0.2s;
                }
                .btn-danger:hover {
                    background-color: #c82333;
                }
            `}</style>
        </Container>
    );
};

export default ProfilePage;