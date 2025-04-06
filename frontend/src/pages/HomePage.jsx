import { useEffect, useState, useRef } from "react";
import { Container, Button, Card, Row, Col, Form, Collapse, Modal } from "react-bootstrap";
import { FaHeart, FaFilter, FaArrowLeft, FaArrowRight } from "react-icons/fa";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import { motion } from "framer-motion";
import Slider from "rc-slider"; // Per uno slider elegante
import "rc-slider/assets/index.css"; // Stile per lo slider
import QRCode from "qrcode";
import { useLocation } from "react-router-dom";

const generateQRCode = (url) => {
  let qrCodeDataURL = "";
  QRCode.toDataURL(url, { width: 150, margin: 2 }, (err, url) => {
    if (err) {
      console.error("Errore nella generazione del QR Code:", err);
      return;
    }
    qrCodeDataURL = url;
  });
  return qrCodeDataURL;
};

const HomePage = () => {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [filters, setFilters] = useState({ name: "", price: [0, 10000], color: "", has3D: false, categories: [] });
  const [visibleProducts, setVisibleProducts] = useState(9);
  const [showFilters, setShowFilters] = useState(false);
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState(null); // Per i dettagli del prodotto
  const [wishlist, setWishlist] = useState([]);
  const productsRef = useRef(null);
  const location = useLocation();

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
    const fetchProductsAndCategories = async () => {
      try {
        const productsResponse = await axios.get("http://localhost:5000/api/products");
        setProducts(productsResponse.data);
        setFilteredProducts(productsResponse.data);

        const uniqueCategories = [...new Set(productsResponse.data.map(product => product.category))];
        setCategories(uniqueCategories);
      } catch (error) {
        console.error("Errore nel recupero dei prodotti e categorie", error);
      }
    };

    fetchProductsAndCategories();
  }, []);

  useEffect(() => {
    const filtered = products.filter(product => {
      const matchesName = filters.name
        ? product.name?.toLowerCase().includes(filters.name.toLowerCase())
        : true;
  
      const matchesPrice =
        product.price >= filters.price[0] && product.price <= filters.price[1];
  
      const matchesColor = filters.color
        ? new RegExp(filters.color, "i").test(product.description)
        : true;
  
      const matches3D = filters.has3D
        ? product.link3Dios !== null || product.link3Dandroid !== null
        : true;
  
      const matchesCategories = filters.categories.length > 0
        ? filters.categories.includes(product.category)
        : true;
  
      return matchesName && matchesPrice && matchesColor && matches3D && matchesCategories;
    });
  
    setFilteredProducts(filtered);
  }, [filters, products]);
  
useEffect(() => {
  if (location.state?.scrollToProducts) {
    productsRef.current.scrollIntoView({ behavior: "smooth" });
  }
}, [location]);

  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === "categories") {
      const category = value;
      setFilters((prev) => ({
        ...prev,
        categories: checked
          ? [...prev.categories, category]
          : prev.categories.filter((cat) => cat !== category),
      }));
    } else {
      setFilters((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
  };

  const handlePriceChange = (e) => {
    const [min, max] = e.target.value.split(",").map(Number);
    setFilters((prev) => ({
      ...prev,
      price: [min, max],
    }));
  };

  const handleCategoryClick = (category) => {
    setFilters((prev) => ({
      ...prev,
      categories: [category], // Filtra solo per la categoria cliccata
    }));
  };

  const handleCategoryScroll = (direction) => {
    const newIndex = direction === "left"
      ? Math.max(currentCategoryIndex - 1, 0)
      : Math.min(currentCategoryIndex + 1, categories.length - 5);
    setCurrentCategoryIndex(newIndex);
  };

  const scrollToProducts = () => {
    productsRef.current.scrollIntoView({ behavior: "smooth" });
  };

  const loadMoreProducts = () => {
    setVisibleProducts((prev) => prev + 9);
  };

  const handleProductClick = (product) => {
    setSelectedProduct(product);
  };

  const handleCloseModal = () => {
    setSelectedProduct(null);
  };

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

const toggleWishlist = async (productId) => {
  const token = localStorage.getItem("token");
  if (!token) {
      navigate("/login");
      return;
  }
  try {
      await axios.post(
          "http://localhost:5000/api/wishlist",
          { productId },
          { headers: { Authorization: `Bearer ${token}` } }
      );
      setWishlist((prev) => [...prev, productId]); // Aggiungi il prodotto alla wishlist
      toast.success("Prodotto aggiunto alla wishlist!", {
          position: "top-right",
          autoClose: 3000,
          theme: "colored",
      });
  } catch (error) {
      console.error("Errore nell'aggiunta alla wishlist", error);
      toast.error("Errore nell'aggiunta alla wishlist", {
          position: "top-right",
          autoClose: 3000,
          theme: "colored",
      });
  }
};

  const resetFilters = () => {
    setFilters({ name: "", price: [0, 10000], color: "", has3D: false, categories: [] });
  };

  return (
    <div style={{ backgroundColor: "#212529", color: "#fff", minHeight: "100vh", margin: 0, padding: 0 }}>
      {/* Hero Section */}
      <div
        style={{
          backgroundColor: "#212529",
          color: "#fff",
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          width: "100%",
        }}
      >
        <motion.h1
          className="display-3 font-weight-bold"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          Benvenuto nel nostro E-commerce
        </motion.h1>
        <motion.p
          className="lead"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
        >
          Sfoglia i nostri prodotti e aggiungili al carrello!
        </motion.p>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 1 }}
        >
          <Button
            variant="dark"
            size="lg"
            className="mt-3 scroll-to-products-btn"
            onClick={scrollToProducts}
            style={{
              border: "2px solid #fff",
              transition: "transform 0.3s ease",
            }}
            onMouseEnter={(e) => (e.target.style.transform = "scale(1.1)")}
            onMouseLeave={(e) => (e.target.style.transform = "scale(1)")}
          >
            Vai ai Prodotti
          </Button>
        </motion.div>
      </div>

      <hr style={{ borderColor: "#fff", opacity: 0.2 }} />

      {/* Filters Section */}
      <div style={{ backgroundColor: "#212529", padding: "20px 0", width: "100%" }}>
        <Container fluid>
          <div className="text-center mb-3">
            <Button
              variant="secondary"
              onClick={() => setShowFilters(!showFilters)}
              aria-controls="filters-collapse"
              aria-expanded={showFilters}
               className="filter-toggle-btn"
            >
              <FaFilter /> Filtri
            </Button>
            <Button
              variant="danger"
              className="ms-3"
              onClick={resetFilters}
            >
              Azzera Filtri
            </Button>
          </div>
          <Collapse in={showFilters}>
            <div id="filters-collapse"  className="filters-container">
              <Form>
                <Row className="gy-3">
                  <Col md={3}>
                    <Form.Group controlId="filterName">
                      <Form.Label className="filter-label">Nome</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Cerca per nome"
                        name="name"
                        value={filters.name}
                        onChange={handleFilterChange}
                        className="filter-input"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group controlId="filterPrice">
                      <Form.Label className="filter-label">Prezzo</Form.Label>
                      <Slider
                        range
                        min={0}
                        max={10000}
                        step={100}
                        value={filters.price}
                        onChange={(value) => setFilters((prev) => ({ ...prev, price: value }))}
                        trackStyle={[{ backgroundColor: "#007bff" }]} // Colore della barra selezionata
                        handleStyle={[
                          { borderColor: "#007bff", backgroundColor: "#fff" }, // Stile dei cursori
                          { borderColor: "#007bff", backgroundColor: "#fff" },
                        ]}
                      />
                      <div className="price-range">
                        <span>€{filters.price[0]}</span>
                        <span>€{filters.price[1]}</span>
                      </div>
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group controlId="filterColor">
                      <Form.Label className="filter-label">Colore</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Cerca per colore"
                        name="color"
                        value={filters.color}
                        onChange={handleFilterChange}
                        className="filter-input"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group controlId="filterHas3D">
                      <Form.Label className="filter-label">Solo con Modello 3D</Form.Label>
                      <Form.Check
                        type="checkbox"
                        name="has3D"
                        checked={filters.has3D}
                        onChange={handleFilterChange}
                        className="filter-checkbox"
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Row className="align-items-center mt-4">
                  <Col md={1} className="text-center">
                    <FaArrowLeft
                      size={30}
                      color="#fff"
                      style={{ cursor: "pointer" }}
                      onClick={() => handleCategoryScroll("left")}
                    />
                  </Col>
                  <Col md={10}>
                    <div className="d-flex justify-content-center">
                      {categories.slice(currentCategoryIndex, currentCategoryIndex + 5).map((category) => (
                        <div
                          key={category}
                          className="text-center mx-2 category-card"
                          style={{
                            width: "150px",
                            height: "150px",
                            position: "relative",
                            overflow: "hidden",
                            cursor: "pointer",
                          }}
                          onClick={() => handleCategoryClick(category)} // Filtra i prodotti al click
                          onMouseEnter={(e) => {
                            e.currentTarget.querySelector("img").style.opacity = "1";
                            e.currentTarget.querySelector("p").style.opacity = "0";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.querySelector("img").style.opacity = "0.7";
                            e.currentTarget.querySelector("p").style.opacity = "1";
                          }}
                        >
                          <img
                            src={categoryImages[category]}
                            alt={category}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                              opacity: 0.7,
                              transition: "opacity 0.3s ease",
                            }}
                          />
                          <p
                            style={{
                              position: "absolute",
                              top: "50%",
                              left: "50%",
                              transform: "translate(-50%, -50%)",
                              color: "#fff",
                              fontWeight: "bold",
                              fontSize: "1.2rem",
                              textAlign: "center",
                              opacity: 1,
                              transition: "opacity 0.3s ease",
                            }}
                            className="category-title"
                          >
                            {category}
                          </p>
                        </div>
                      ))}
                    </div>
                  </Col>
                  <Col md={1} className="text-center">
                    <FaArrowRight
                      size={30}
                      color="#fff"
                      style={{ cursor: "pointer" }}
                      onClick={() => handleCategoryScroll("right")}
                    />
                  </Col>
                </Row>
              </Form>
            </div>
          </Collapse>
        </Container>
      </div>

      <hr style={{ borderColor: "#fff", opacity: 0.2 }} />

      {/* Products Section */}
      <div ref={productsRef} style={{ backgroundColor: "#212529", padding: "40px 0", width: "100%" }}>
        <Container fluid>
          <h2 className="text-center mb-4" style={{ color: "#fff", fontWeight: "bold" }}>Prodotti</h2>
          <Row>
            {filteredProducts.slice(0, visibleProducts).map((product) => (
              <Col key={product._id} md={4} className="mb-4">
                <Card
                  className="shadow-lg"
                  style={{ borderRadius: "15px", overflow: "hidden", cursor: "pointer" }}
                  onClick={() => handleProductClick(product)}
                >
                  <Card.Img
                    variant="top"
                    src={product.images[0]}
                    alt={product.name}
                    style={{ height: "250px", objectFit: "cover" }}
                  />
                  <Card.Body>
                    <Card.Title>{product.name}</Card.Title>
                    <Card.Text>€{product.price}</Card.Text>
                    <div className="d-flex justify-content-between align-items-center">
                      <Button
                        variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(product._id);
                        }}
                      >
                        Aggiungi al carrello
                      </Button>
                      <FaHeart
                        size={24}
                        color={wishlist.includes(product._id) ? "red" : "gray"}
                        style={{ cursor: "pointer" }}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleWishlist(product._id);
                        }}
                      />
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
          {visibleProducts < filteredProducts.length && (
            <div className="text-center mt-4">
              <Button variant="secondary" onClick={loadMoreProducts}>
                Carica altri prodotti
              </Button>
            </div>
          )}
        </Container>
      </div>

      {/* Product Details Modal */}
      {selectedProduct && (
        <Modal show onHide={handleCloseModal} centered>
          <Modal.Header closeButton>
            <Modal.Title>{selectedProduct.name}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <img
              src={selectedProduct.images[0]}
              alt={selectedProduct.name}
              style={{ width: "100%", height: "auto", marginBottom: "20px" }}
            />
            <p>{selectedProduct.description}</p>
            <p>Prezzo: €{selectedProduct.price}</p>
            <div className="d-flex justify-content-between align-items-center">
              <Button
                variant="secondary"
                onClick={() => addToCart(selectedProduct._id)}
              >
                Aggiungi al carrello
              </Button>
              <FaHeart
                size={24}
                color={wishlist.includes(selectedProduct._id) ? "red" : "gray"}
                style={{ cursor: "pointer" }}
                onClick={() => toggleWishlist(selectedProduct._id)}
              />
            </div>
            {/* QR Code per i modelli 3D */}
            {selectedProduct.link3Dios && (
              <div className="mt-4 text-center">
                <h5>Visualizza Modello 3D (iOS)</h5>
                <img
                  src={generateQRCode(selectedProduct.link3Dios)}
                  alt="QR Code iOS"
                  style={{ width: "150px", height: "150px" }}
                />
              </div>
            )}
            {selectedProduct.link3Dandroid && (
              <div className="mt-4 text-center">
                <h5>Visualizza Modello 3D (Android)</h5>
                <img
                  src={generateQRCode(selectedProduct.link3Dandroid)}
                  alt="QR Code Android"
                  style={{ width: "150px", height: "150px" }}
                />
              </div>
            )}
          </Modal.Body>
        </Modal>
      )}

      <ToastContainer />
    </div>
  );
};

export default HomePage;