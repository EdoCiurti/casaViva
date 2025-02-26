import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Card, Container, Form, Row, Col, Button, ToggleButtonGroup, ToggleButton } from "react-bootstrap";
import { motion } from "framer-motion";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

const ProductsPage = () => {
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [filters, setFilters] = useState({ name: "", price: "", category: "" });
    const [viewMode, setViewMode] = useState("scroll"); // "scroll" or "grid"
    const navigate = useNavigate();
    const itemsPerView = 3;

    const categoryImages = {
        "madie-moderne": "https://www.garneroarredamenti.com/data/cat/img/1/100-82902.png",
        "pareti-attrezzate": "https://www.garneroarredamenti.com/data/cat/img/9/99-13184.png",
        "tavoli-allungabili": "https://www.garneroarredamenti.com/data/cat/img/1/101.png",
        "guardaroba": "https://www.garneroarredamenti.com/data/cat/img/1/102.png",
        "divani-letto": "https://www.garneroarredamenti.com/data/cat/img/1/108.png",
        "camere-da-letto-complete": "https://www.garneroarredamenti.com/data/cat/img/1/105.png",
        "consolle-allungabile": "https://www.garneroarredamenti.com/data/cat/img/1/107.png",
        "mobili-ingresso": "https://www.garneroarredamenti.com/data/cat/img/1/104.png",
        "mobili-tv-moderni": "https://www.garneroarredamenti.com/data/cat/img/1/106.png",
        "vetrinette": "https://www.garneroarredamenti.com/data/cat/img/p/progetto-senza-titolo-1.png",
        "letti-bambini-ragazzi": "https://www.garneroarredamenti.com/data/cat/img/1/109.png",
        "scrivanie-ufficio": "https://www.garneroarredamenti.com/data/cat/img/1/112.png",
        "letti-matrimoniali": "https://www.garneroarredamenti.com/data/cat/img/1/111.png",
        "como": "https://www.garneroarredamenti.com/data/cat/img/1/110.png",
        "librerie": "https://www.garneroarredamenti.com/data/cat/img/1/113.png",
        "cucine-complete": "https://www.garneroarredamenti.com/data/cat/img/p/progetto-senza-titolo.png"
    };

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
            toast.dismiss();
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
            toast.dismiss();
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
                return Math.min(prev + itemsPerView, filteredProducts.length - itemsPerView);
            } else {
                return Math.max(prev - itemsPerView, 0);
            }
        });
    };

    const handleDragEnd = (info) => {
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

    const handleCategoryClick = (category) => {
        setSelectedCategory(category);
        setFilters((prev) => ({ ...prev, category }));
    };

    const handleBackToCategories = () => {
        setSelectedCategory(null);
        setFilters({ name: "", price: "", category: "" });
    };

    const handleViewModeChange = (value) => {
        setViewMode(value);
    };

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
            {selectedCategory ? (
                <>
                    <Button variant="secondary" className="mb-4" onClick={handleBackToCategories}>
                        Torna alle categorie
                    </Button>
                    <div className="d-flex justify-content-end mb-4">
                        <ToggleButtonGroup type="radio" name="viewMode" value={viewMode} onChange={handleViewModeChange}>
                            <ToggleButton id="tbg-radio-1" value="scroll">
                                Scorrimento
                            </ToggleButton>
                            <ToggleButton id="tbg-radio-2" value="grid">
                                Griglia
                            </ToggleButton>
                        </ToggleButtonGroup>
                    </div>
                    {viewMode === "scroll" ? (
                        <>
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
                                    dragConstraints={{ left: -((filteredProducts.length - itemsPerView) * 320), right: 0 }}
                                    onDragEnd={handleDragEnd}
                                >
                                    {filteredProducts.map((product, index) => (
                                        <motion.div
                                            key={product._id}
                                            className="product-card"
                                            initial={{ opacity: 1, scale: 0.9 }}
                                            animate={{
                                                opacity: index >= currentIndex && index < currentIndex + itemsPerView ? 1 : 0.5,
                                                scale: index >= currentIndex && index < currentIndex + itemsPerView ? 1 : 0.8,
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
                                    cursor: currentIndex >= filteredProducts.length - itemsPerView ? "default" : "pointer",
                                    fontSize: "2rem",
                                    right: "10px",
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    zIndex: 1,
                                    opacity: currentIndex >= filteredProducts.length - itemsPerView ? 0.5 : 1,
                                }}
                            />
                        </>
                    ) : (
                        <Row>
                            {filteredProducts.map((product) => (
                                <Col key={product._id} md={4} className="mb-4">
                                    <Card className="shadow-lg" style={{ borderRadius: "15px", overflow: "hidden" }}>
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
                                </Col>
                            ))}
                        </Row>
                    )}
                </>
            ) : (
                <>
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
                            dragConstraints={{ left: -((categories.length - itemsPerView) * 320), right: 0 }}
                            onDragEnd={handleDragEnd}
                        >
                            {categories.map((category, index) => (
                                <motion.div
                                    key={index}
                                    className="category-card"
                                    initial={{ opacity: 1, scale: 0.9 }}
                                    animate={{
                                        opacity: index >= currentIndex && index < currentIndex + itemsPerView ? 1 : 0.5,
                                        scale: index >= currentIndex && index < currentIndex + itemsPerView ? 1 : 0.8,
                                    }}
                                    transition={{ duration: 0.5 }}
                                >
                                    <Card
                                        className="shadow-lg"
                                        style={{ borderRadius: "15px", overflow: "hidden", width: "300px", height: "200px", cursor: "pointer" }}
                                        onClick={() => handleCategoryClick(category)}
                                    >
                                        <Card.Img
                                            variant="top"
                                            src={categoryImages[category]} // Usa l'immagine della categoria
                                            alt={category}
                                            style={{ height: "150px", objectFit: "cover" }}
                                        />
                                        <Card.Body style={{ backgroundColor: "#f8f9fa" }}>
                                            <Card.Title style={{ color: "#343a40", fontWeight: "bold" }}>{category.replace(/-/g, ' ')}</Card.Title>
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
                            cursor: currentIndex >= categories.length - itemsPerView ? "default" : "pointer",
                            fontSize: "2rem",
                            right: "10px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            zIndex: 1,
                            opacity: currentIndex >= categories.length - itemsPerView ? 0.5 : 1,
                        }}
                    />
                </>
            )}
            <ToastContainer />
        </Container>
    );
};

export default ProductsPage;