
import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Container, Form, Row, Col, Button, ToggleButtonGroup, ToggleButton, Modal } from "react-bootstrap";
import { motion } from "framer-motion";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import LoadingSpinner from '../components/LoadingSpinner';

const ProductsPage = () => {
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [filters, setFilters] = useState({ name: "", price: "", category: "" });
    const [viewMode, setViewMode] = useState("scroll"); // "scroll" or "grid"
    const [showPopup, setShowPopup] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [showScrollToTop, setShowScrollToTop] = useState(false);
    const [showQRModal, setShowQRModal] = useState(false);

    const handleShowQRModal = () => setShowQRModal(true);
    const handleCloseQRModal = () => setShowQRModal(false);
    const [loading, setLoading] = useState(true);
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

                // Imposta loading su false dopo il caricamento dei prodotti
                setLoading(false);
            } catch (error) {
                console.error("Errore nel recupero dei prodotti", error);
            }
        };

        fetchProducts();

        const handleScroll = () => {
            if (window.scrollY > 300) {
                setShowScrollToTop(true);
            } else {
                setShowScrollToTop(false);
            }
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);
    useEffect(() => {
        setTimeout(() => {
            // Carica i dati qui
            setLoading(false);
        }, 30000); // Simula un ritardo di 2 secondi
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
            //chiudi il modal
            setShowPopup(false);
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

    const handleScroll = (direction, increment = itemsPerView) => {
        setCurrentIndex((prev) => {
            if (direction === "right") {
                return Math.min(prev + increment, selectedCategory ? filteredProducts.length - itemsPerView : categories.length - itemsPerView);
            } else {
                return Math.max(prev - increment, 0);
            }
        });
    };

    const handleDragEnd = (event, info) => {
        if (info && info.offset && typeof info.offset.x === 'number') {
            if (info.offset.x < -50) {
                handleScroll("right");
            } else if (info.offset.x > 50) {
                handleScroll("left");
            }
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters((prev) => ({ ...prev, [name]: value }));
    };

    useEffect(() => {
        const filtered = products.filter((product) => {
            return (
                (filters.name === "" || product.name.toLowerCase().startsWith(filters.name.toLowerCase())) &&
                (filters.price === "" || product.price <= parseFloat(filters.price)) &&
                (filters.category === "" || product.category === filters.category)
            );
        });
        setFilteredProducts(filtered);
        setCurrentIndex(0);
    }, [filters, products]);

    const handleCategoryClick = (category, index) => {
        if (index < currentIndex || index >= currentIndex + itemsPerView) {
            handleScroll("right");
        } else {
            setSelectedCategory(category);
            setFilters((prev) => ({ ...prev, category }));
        }
    };

    const handleBackToCategories = () => {
        setSelectedCategory(null);
        setFilters({ name: "", price: "", category: "" });
    };

    const handleViewModeChange = (value) => {
        setViewMode(value);
    };

    const handleCardClick = (product, index, event) => {
        if (event.target.tagName === "BUTTON") {
            return;
        }
        if (viewMode === "scroll" && (index < currentIndex || index >= currentIndex + itemsPerView)) {
            handleScroll("right");
        } else {
            setSelectedProduct(product);
            setShowPopup(true);
        }
    };


    const handleClosePopup = () => {
        setShowPopup(false);
        setSelectedProduct(null);
    };

    return (

        <Container className="mt-5 text-center position-relative" style={{ zIndex: 0 }}>
            <br></br> <br></br>
            <h1 className="mb-4" style={{ color: '#007bff', fontWeight: 'bold' }}>I nostri prodotti</h1>
            {selectedCategory && (
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
            )}
            {selectedCategory ? (
                <>
                    <Button variant="secondary" className="mb-4" onClick={handleBackToCategories}>
                        Torna alle categorie
                    </Button>
                    <div className="d-flex justify-content-end mb-4">
                        <ToggleButtonGroup type="radio" name="viewMode" value={viewMode} onChange={handleViewModeChange}>
                            <ToggleButton id="tbg-radio-1" value="scroll" className="custom-toggle-btn">
                                Scorrimento
                            </ToggleButton>
                            <ToggleButton id="tbg-radio-2" value="grid" className="custom-toggle-btn">
                                Griglia
                            </ToggleButton>
                        </ToggleButtonGroup>
                    </div>
                    {viewMode === "scroll" ? (
                        <>
                            <div className="position-relative">
                                <FaArrowLeft
                                    className="arrow-icon"
                                    onClick={() => handleScroll("left")}
                                    style={{
                                        cursor: currentIndex === 0 ? "default" : "pointer",
                                        left: "-50px",
                                        opacity: currentIndex === 0 ? 0.5 : 1,
                                    }}
                                />
                                <div
                                    className="d-flex align-items-center overflow-hidden position-relative"
                                    style={{ maxWidth: "100%", cursor: "grab" }}
                                    onWheel={(e) => handleScroll(e.deltaY > 0 ? "right" : "left", 0.05)}
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
                                                onClick={(event) => handleCardClick(product, index, event)}
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
                                                        <Card.Title style={{ color: "#343a40", fontWeight: "bold" }}>
                                                            {product.name}
                                                        </Card.Title>
                                                        <Card.Text><strong style={{ color: "#28a745" }}>€{product.price}</strong></Card.Text>
                                                        <motion.button
                                                            className="btnCarrello"
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
                                    className="arrow-icon"
                                    onClick={() => handleScroll("right")}
                                    style={{
                                        cursor: currentIndex >= filteredProducts.length - itemsPerView ? "default" : "pointer",
                                        right: "-50px",
                                        opacity: currentIndex >= filteredProducts.length - itemsPerView ? 0.5 : 1,
                                    }}
                                />
                            </div>
                        </>
                    ) : (
                        <Row>
                            {filteredProducts.map((product) => (
                                <Col key={product._id} md={4} className="mb-4">
                                    <Card className="shadow-lg" style={{ borderRadius: "15px", overflow: "hidden" }} onClick={(event) => handleCardClick(product, null, event)}>
                                        <Card.Img
                                            variant="top"
                                            src={product.images}
                                            alt={product.name}
                                            style={{ height: "250px", objectFit: "cover" }}
                                        />
                                        <Card.Body style={{ backgroundColor: "#f8f9fa" }}>
                                            <Card.Title style={{ color: "#343a40", fontWeight: "bold" }}>
                                                {product.name}
                                            </Card.Title>
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
                                    onClick={() => handleCategoryClick(category, index)}
                                >
                                    <Card
                                        className="shadow-lg"
                                        style={{ borderRadius: "15px", overflow: "hidden", width: "300px", height: "200px", cursor: "pointer", backgroundColor: "#f0f0f0" }}
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
            <Modal show={showPopup} onHide={handleClosePopup} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Dettagli Prodotto</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <img src={selectedProduct?.images} alt={selectedProduct?.name} style={{ width: "100%", height: "auto", marginBottom: "20px" }} />
                    <h4>{selectedProduct?.name.split(" ").slice(0, 2).join(" ")}</h4>
                    <p><strong>Prezzo:</strong> €{selectedProduct?.price}</p>
                    <p><strong>Descrizione:</strong> {selectedProduct?.description || "Lorem ipsum dolor sit amet, consectetur adipiscing elit."}</p>
                    <p><strong>Dimensioni:</strong> {selectedProduct?.description.match(/\d+/g)?.join("x") || "200x100x50 cm"}</p>
                    <p><strong>Categoria:</strong> {selectedProduct?.category.replace(/-/g, ' ')}</p>

                    {/* Bottone per aprire il modale con il QR Code */}
                    <Button variant="info" className="mt-3" onClick={() => setShowQRModal(true)}>
                        Visualizza in 3D
                    </Button>

                </Modal.Body>

                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClosePopup}>
                        Chiudi
                    </Button>
                    <Button variant="primary" onClick={() => addToCart(selectedProduct?._id)}>
                        Aggiungi al carrello
                    </Button>

                </Modal.Footer>

            </Modal>
            <Modal show={showQRModal} onHide={() => setShowQRModal(false)} centered>
    <Modal.Header closeButton>
        <Modal.Title>Scansiona per vedere in AR</Modal.Title>
    </Modal.Header>
    <Modal.Body className="text-center">
        {/* QR Code che apre il modello in AR direttamente */}
        <img 
            src={`https://quickchart.io/qr?text=https%3A%2F%2Fcalossoa.github.io%2F3D%2Findex.html`} 
            alt="QR Code AR"
        />
        <p>Scansiona con la fotocamera del tuo smartphone per visualizzare il modello in realtà aumentata.</p>

        {/* Pulsante per aprire in AR */}
        {/* <Button 
            variant="primary" 
            href="https://calossoa.github.io/3D/index.html"
            target="_blank"
        >
            📱 Apri in AR
        </Button> */}

        {/* Modello 3D interattivo nel browser */}
        <model-viewer
            src="https://calossoa.github.io/3D/modello.glb"
            ios-src="https://calossoa.github.io/3D/modello.usdz"
            ar
            ar-modes="webxr scene-viewer quick-look"
            camera-controls
            auto-rotate
            style={{ width: "100%", height: "400px" }}
        >
        </model-viewer>
    </Modal.Body>
    <Modal.Footer>
        <Button variant="secondary" onClick={() => setShowQRModal(false)}>
            Chiudi
        </Button>
    </Modal.Footer>
</Modal>



            <style>{`
            .scroll-to-top-btn {
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 1000;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    transition: opacity 0.3s ease-in-out;
    opacity: 0.7;
    background-color: #007bff; /* Colore blu come il titolo */
    color: white;
    border: none;
}

.scroll-to-top-btn:hover {
    opacity: 1;
    background-color: #007bff; /* Colore blu come il titolo */
}
            .custom-toggle-btn {
                background-color:rgb(125, 111, 108);
                color: white;
                border: none;
                margin: 0 5px;
                padding: 5px 10px;
                font-size: 0.8rem;
                border-radius: 5px;
            }
            .custom-toggle-btn.active {
                background-color:rgb(64, 53, 52);
            }
            .product-card {
                cursor: pointer;
            }
            .category-card {
                cursor: pointer;
            }
            .arrow-icon {
                z-index: 2;
            }
            `}</style>

            {viewMode === "grid" && showScrollToTop && (
                <Button
                    variant="secondary"
                    className="scroll-to-top-btn"
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                >
                    ↑
                </Button>
            )}
            <>
                {loading ? (
                    <LoadingSpinner />
                ) : (
                    <Container className="mt-5 text-center position-relative" style={{ zIndex: 0 }}>
                        {/* Il resto del tuo codice */}
                    </Container>
                )}
            </>
        </Container>
    );
};



export default ProductsPage;
