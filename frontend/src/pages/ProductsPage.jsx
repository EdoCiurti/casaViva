import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Card, Container, Form, Row, Col } from "react-bootstrap";
import { motion } from "framer-motion";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
<<<<<<< HEAD
=======
import { ToastContainer, toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
>>>>>>> c9e96e1 (carrelloOk e inizio checkOut)

const ProductsPage = () => {
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [categories, setCategories] = useState([]);
    const [filters, setFilters] = useState({ name: "", price: "", category: "" });
    const navigate = useNavigate();
    const productsPerView = 3;

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await axios.get("http://localhost:5000/api/products");
                setProducts(response.data);
                setFilteredProducts(response.data);

                // Extract unique categories from products
                const uniqueCategories = [...new Set(response.data.map(product => product.category))];
                setCategories(uniqueCategories);
            } catch (error) {
                console.error("Errore nel recupero dei prodotti", error);
            }
        };

        fetchProducts();
    }, []);

    const addToCart = async (productId) => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/login");
            return;
        }
        try {
            await axios.post(
                "http://localhost:5000/api/cart",
                { productId, quantity: 1 },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success("Prodotto aggiunto al carrello!", {
                position: "top-right",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: "colored",
            });
        } catch (error) {
            console.error("Errore nell'aggiunta al carrello", error);
            toast.error("Errore nell'aggiunta al carrello", {
                position: "top-right",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: "colored",
            });
        }
    };

    const handleScroll = (direction) => {
        setCurrentIndex((prev) => {
            if (direction === "right") {
                return Math.min(prev + productsPerView, filteredProducts.length - productsPerView);
            } else {
                return Math.max(prev - productsPerView, 0);
            }
        });
    };

    const handleDragEnd = (event, info) => {
        if (info.offset.x < -50) {
            handleScroll("right");
        } else if (info.offset.x > 50) {
            handleScroll("left");
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters((prev) => ({ ...prev, [name]: value }));
    };

    useEffect(() => {
        const filtered = products.filter((product) => {
            return (
                (filters.name === "" || product.name.toLowerCase().includes(filters.name.toLowerCase())) &&
                (filters.price === "" || product.price <= parseFloat(filters.price)) &&
                (filters.category === "" || product.category === filters.category)
            );
        });
        setFilteredProducts(filtered);
        setCurrentIndex(0);
    }, [filters, products]);

    return (
        <Container className="mt-5 text-center position-relative">
            <br></br> <br></br> 
            <h1 className="mb-4" style={{ color: '#007bff', fontWeight: 'bold' }}>I nostri prodotti</h1>
            <Form className="mb-4">
                <Row>
                    <Col md={4}>
                        <Form.Group controlId="filterName">
                            <Form.Label>Nome</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Cerca per nome"
                                name="name"
                                value={filters.name}
                                onChange={handleFilterChange}
                            />
                        </Form.Group>
                    </Col>
                    <Col md={4}>
                        <Form.Group controlId="filterPrice">
                            <Form.Label>Prezzo massimo</Form.Label>
                            <Form.Control
                                type="number"
                                placeholder="Cerca per prezzo"
                                name="price"
                                value={filters.price}
                                onChange={handleFilterChange}
                            />
                        </Form.Group>
                    </Col>
                    <Col md={4}>
                        <Form.Group controlId="filterCategory">
                            <Form.Label>Categoria</Form.Label>
                            <Form.Control
                                as="select"
                                name="category"
                                value={filters.category}
                                onChange={handleFilterChange}
                            >
                                <option value="">Tutte le categorie</option>
                                {categories.map((category, index) => (
                                    <option key={index} value={category}>
                                        {category.replace(/-/g, ' ')}
                                    </option>
                                ))}
                            </Form.Control>
                        </Form.Group>
                    </Col>
                </Row>
            </Form>
            <FaArrowLeft
                className="arrow-icon position-absolute"
                onClick={() => handleScroll("left")}
                style={{
                    cursor: currentIndex === 0 ? "default" : "pointer",
                    fontSize: "2rem",
                    left: "-50px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    zIndex: 1,
                    opacity: currentIndex === 0 ? 0.5 : 1,
                }}
            />
            <div
                className="d-flex align-items-center overflow-hidden position-relative"
                style={{ maxWidth: "100%", cursor: "grab" }}
                onWheel={(e) => handleScroll(e.deltaY > 0 ? "right" : "left")}
            >
                <motion.div
                    className="d-flex"
                    style={{ display: "flex", gap: "20px" }}
                    animate={{ x: -currentIndex * 320 }}
                    transition={{ type: "spring", stiffness: 100, damping: 20 }}
                    drag="x"
                    dragConstraints={{ left: -((filteredProducts.length - productsPerView) * 320), right: 0 }}
                    onDragEnd={handleDragEnd}
                >
                    {filteredProducts.map((product, index) => (
                        <motion.div
                            key={product._id}
                            className="product-card"
                            initial={{ opacity: 1, scale: 0.9 }}
                            animate={{
                                opacity: index >= currentIndex && index < currentIndex + productsPerView ? 1 : 0.5,
                                scale: index >= currentIndex && index < currentIndex + productsPerView ? 1 : 0.8,
                            }}
                            transition={{ duration: 0.5 }}
                        >
                            <Card
                                className="shadow-lg"
                                style={{ borderRadius: "15px", overflow: "hidden", width: "300px", height: "500px" }}
                            >
                                <Card.Img
                                    variant="top"
                                    src={product.images}
                                    alt={product.name}
                                    style={{ height: "250px", objectFit: "cover" }}
                                />
                                <Card.Body style={{ backgroundColor: "#f8f9fa" }}>
                                    <Card.Title style={{ color: "#343a40", fontWeight: "bold" }}>{product.name}</Card.Title>
                                    <Card.Text><strong style={{ color: "#28a745" }}>€{product.price}</strong></Card.Text>
                                    <motion.button
                                        className="btn btn-primary mt-auto"
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => addToCart(product._id)}
                                    >
                                        Aggiungi al carrello
                                    </motion.button>
                                </Card.Body>
                            </Card>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
            <FaArrowRight
                className="arrow-icon position-absolute"
                onClick={() => handleScroll("right")}
                style={{
                    cursor: currentIndex >= filteredProducts.length - productsPerView ? "default" : "pointer",
                    fontSize: "2rem",
                    right: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    zIndex: 1,
                    opacity: currentIndex >= filteredProducts.length - productsPerView ? 0.5 : 1,
                }}
            />
<<<<<<< HEAD
=======
            <ToastContainer />
>>>>>>> c9e96e1 (carrelloOk e inizio checkOut)
        </Container>
    );
};

export default ProductsPage;