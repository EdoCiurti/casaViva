import React, { useEffect, useState, useRef } from "react";
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
import { AnimatePresence } from "framer-motion"; // Importa Framer Motion
import { FaSortAmountUp, FaSortAmountDown } from "react-icons/fa";
import ChatPopup from "../components/ChatPopup";


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
  const [filters, setFilters] = useState({ name: "", price: [0, 5000], color: "", has3D: false, categories: [] });
  const [visibleProducts, setVisibleProducts] = useState(9);
  const [showFilters, setShowFilters] = useState(false);
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState(null); // Per i dettagli del prodotto
  const [wishlist, setWishlist] = useState([]);
  const [theme, setTheme] = useState("");
  const [showHero, setShowHero] = useState(true); // Stato per mostrare/nascondere la hero section
  const [mainImage, setMainImage] = useState(""); // Immagine principale del prodotto
  const [sortOrder, setSortOrder] = useState(""); // Stato per l'ordinamento
  const [selectedProductRef, setSelectedProductRef] = useState(null);
  const [highlightedProductId, setHighlightedProductId] = useState(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const productsSectionRef = useRef(null);
  const productRefs = useRef([]); // Array di riferimenti per i prodotti
  const filtersContainerRef = useRef(null); // Aggiungi un ref alla sezione dei filtri
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
    const handleScroll = () => {
      // Usa il riferimento invece di cercare l'elemento per ID
      if (filtersContainerRef.current) {
        const rect = filtersContainerRef.current.getBoundingClientRect();
        const isScrolledPastFilters = rect.bottom < 0;
        setShowScrollTop(isScrolledPastFilters);
        console.log("Filtri container bottom:", rect.bottom, "ShowScrollTop:", isScrolledPastFilters);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    // Inizializza i riferimenti per ogni prodotto
    productRefs.current = filteredProducts.map((_, i) => productRefs.current[i] || React.createRef());
  }, [filteredProducts]);

  useEffect(() => {
    let filtered = products.filter(product => {
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

    // Applica l'ordinamento
    if (sortOrder === "asc") {
      filtered = filtered.sort((a, b) => a.price - b.price);
    } else if (sortOrder === "desc") {
      filtered = filtered.sort((a, b) => b.price - a.price);
    }

    setFilteredProducts(filtered);
  }, [filters, products, sortOrder]);

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
    const handleDarkModeToggle = () => {
      setTheme(localStorage.getItem("darkMode") === "true" ? "dark" : "light");
    };

    window.addEventListener("darkModeToggle", handleDarkModeToggle);
    handleDarkModeToggle(); // imposta il tema iniziale

    return () => {
      window.removeEventListener("darkModeToggle", handleDarkModeToggle);
    };
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
      productsSectionRef.current.scrollIntoView({ behavior: "smooth" });
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
  useEffect(() => {
    if (selectedCategory) {
      setTimeout(() => {
        if (productRefs.current[0] && typeof productRefs.current[0].scrollIntoView === "function") {
          productRefs.current[0].scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 300); // Piccolo delay per sicurezza
    }
  }, [selectedCategory]);
  const handleCategoryClick = (category) => {
    setFilters((prev) => ({
      ...prev,
      categories: [category], // Filtra solo per la categoria cliccata
    }));
    // Scorri al primo prodotto visibile
    const handleCategoryClick = (category) => {
      setFilters((prev) => ({
        ...prev,
        categories: [category], // Filtra solo per la categoria cliccata
      }));
      setSelectedCategory(category); // Imposta la categoria selezionata
    };
  };

  const handleCategoryScroll = (direction) => {
    const maxIndex = Math.max(categories.length - 3, 0); // Mostra sempre 3 categorie
    const newIndex = direction === "left"
      ? Math.max(currentCategoryIndex - 1, 0)
      : Math.min(currentCategoryIndex + 1, maxIndex);
    setCurrentCategoryIndex(newIndex);
  };

  const scrollToProducts = () => {
    productsSectionRef.current.scrollIntoView({ behavior: "smooth" });
    window.scrollBy(0, 600); // Scorri leggermente più in alto (100px)
  };

  const loadMoreProducts = () => {
    setVisibleProducts((prev) => prev + 9);
  };

  const handleProductClick = async (product, index) => {
    setSelectedProduct(product); // Imposta il prodotto selezionato
    setMainImage(product.images[0]); // Imposta l'immagine principale
    setHighlightedProductId(product._id); // Evidenzia il prodotto cliccato
    // Imposta il riferimento al prodotto successivo (se esiste)
    const nextIndex = index;
    if (productRefs.current[nextIndex]) {
      setSelectedProductRef(productRefs.current[nextIndex].current);
    }
    setShowHero(false); // Nascondi la hero section
    window.scrollTo({ top: 0, behavior: "smooth" }); // Scorri all'inizio della pagina

    localStorage.setItem("selectedProduct", JSON.stringify(product)); // Salva il prodotto selezionato nel localStorage 

    // // Recupera immagini da Google basate sulla descrizione del prodotto
    const googleImages = await fetchGoogleImages(product.description);

    // // Aggiungi le immagini di Google alle immagini secondarie, se disponibili
    const updatedImages = [...product.images, ...googleImages];

    setSelectedProduct({ ...product, images: updatedImages });

    // // Scorri verso la sezione dei dettagli
    if (detailsSectionRef.current) {
      detailsSectionRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };



  const fetchGoogleImages = async (description) => {
        try {
            const response = await axios.get("https://www.googleapis.com/customsearch/v1", {
                params: {
                    q: description, // Query basata sulla descrizione del prodotto
                    searchType: "image", // Cerca solo immagini
                    cx: "26fd197d4bac947f6", // Sostituisci con il tuo ID del motore di ricerca
                    key: "AIzaSyB5S5rU7-YvS35aklX3HpzU4XU_NCKTN0c", // Sostituisci con la tua chiave API
                    num: 3, // Ottieni fino a 3 immagini
                },
            });

            // Restituisci gli URL delle immagini
            return response.data.items.map((item) => item.link).slice(0, 3);
        } catch (error) {
            console.error("Errore nel recupero delle immagini da Google", error);
            return [];
        }
    };




  const handleCloseModal = () => {
    setSelectedProduct(null);
  };

  const handleCloseDetails = () => {
    setSelectedProduct(null);
    setShowHero(true); // Mostra di nuovo la hero section
  };

  useEffect(() => {
    if (selectedProduct === null) {
      setTimeout(() => {
        if (selectedProductRef && typeof selectedProductRef.scrollIntoView === "function") {
          selectedProductRef.scrollIntoView({ behavior: "smooth", block: "center" });
        } else {
          const maxScroll = document.body.scrollHeight;
          window.scrollTo({ top: maxScroll, behavior: "smooth" });
        }
      }, 100); // piccolo delay per sicurezza
    }
  }, [selectedProduct]);


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
    setFilters({ name: "", price: [0, 5000], color: "", has3D: false, categories: [] });
    setSortOrder(""); // Resetta l'ordinamento
  };

  return (

    <div className={theme === "dark" ? "dark-mode" : "light-mode"} style={{ backgroundColor: theme === "dark" ? "#212529" : "#fff", color: theme === "dark" ? "#fff" : "#000" }}>
      {/* Hero Section */}
      {showHero && (
        <div
          style={{
            boxShadow: "10px 10px 5px rgba(0,0,0,0.5)",
            backgroundColor: theme === "dark" ? "#212529" : "#fff",
            color: theme === "dark" ? "#fff" : "#000",
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


      )}

      {/* Product Details Section */}
      <AnimatePresence>
        {selectedProduct && (
          <motion.div
            className="led-effect"
            initial={{ opacity: 0, scale: 0.8, rotateX: -15, y: 100 }}
            animate={{ opacity: 1, scale: 1, rotateX: 0, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, rotateX: 15, y: 100 }}
            transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
            style={{
              perspective: "1000px",
              position: "relative",
              zIndex: 10,
              backgroundColor: theme === "dark" ? "#212529" : "#fff",
              padding: "30px",
              borderRadius: "15px",
              boxShadow: "0 0 60px rgba(255, 255, 255, 0.2)",
              maxWidth: "90%",
              margin: "30px auto",
            }}
          >
            <Row>
              {/* Colonna sinistra: Foto */}
              <Col md={6} className={`product-details-section ${theme === "dark" ? "dark-mode" : "light-mode"}`}>
                <div className="text-center">
                  <img
                    src={mainImage}
                    alt={selectedProduct.name}
                    className="img-fluid mb-3"
                    style={{
                      maxHeight: "400px",
                      objectFit: "cover",
                      borderRadius: "15px",
                      backgroundColor: theme === "dark" ? "#1e1e2f" : "#ffffff",
                      boxShadow: "0px 10px 20px rgba(0, 0, 0, 0.2)",
                    }}
                  />
                  <div className="similar-images d-flex flex-wrap justify-content-center">
                    {selectedProduct.images.map((image, index) => (
                      <img
                        key={index}
                        src={image}
                        alt={`Immagine secondaria ${index + 1}`}
                        className="img-thumbnail mx-2"
                        style={{
                          maxHeight: "100px",
                          maxWidth: "100px",
                          objectFit: "cover",
                          cursor: "pointer",
                          border: mainImage === image ? "3px solid blue" : "2px solid #ddd",
                          borderRadius: "10px",
                        }}
                        onClick={() => setMainImage(image)}
                      />
                    ))}
                  </div>
                </div>
              </Col>
              {/* Colonna destra: Dettagli */}
              <Col md={6} className={`product-details-section ${theme === "dark" ? "dark-mode" : "light-mode"}`}>
                <motion.div
                  className="details-content text-center"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  style={{
                    padding: "20px",
                    borderRadius: "10px",
                  }}
                >
                  <Button
                    variant="light"
                    className="close-details-btn"
                    onClick={handleCloseDetails}
                    style={{
                      position: "absolute",
                      top: "10px",
                      right: "10px",
                      border: "none",
                      background: "transparent",
                      fontSize: "1.5rem",
                      fontWeight: "bold",
                      cursor: "pointer",
                      color: theme === "dark" ? "#fff" : "#000",
                    }}
                  >
                    ✕
                  </Button>
                  <h3>{selectedProduct.name}</h3>
                  <p><strong>Prezzo:</strong> €{selectedProduct.price}</p>
                  <p><strong>Descrizione:</strong> {selectedProduct.description}</p>
                  <p><strong>Dettagli aggiuntivi:</strong> {selectedProduct.additionalDetails || "Non disponibili"}</p>
                  
                  {/* QR Codes per i modelli 3D */}
                  {(selectedProduct.link3Dios || selectedProduct.link3Dandroid) && (
                    <div className="qr-codes-container mt-4">
                      <h5>Visualizza il modello 3D</h5>
                      <div className="d-flex justify-content-center mt-3">
                        {selectedProduct.link3Dios && (
                          <div className="qr-code-item mx-3">
                            <p><strong>iOS</strong></p>
                            <img
                              src={generateQRCode(selectedProduct.link3Dios)}
                              alt="QR Code per iOS"
                              style={{ width: 120, height: 120 }}
                            />
                          </div>
                        )}
                        {selectedProduct.link3Dandroid && (
                          <div className="qr-code-item mx-3">
                            <p><strong>Android</strong></p>
                            <img
                              src={generateQRCode(selectedProduct.link3Dandroid)}
                              alt="QR Code per Android"
                              style={{ width: 120, height: 120 }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-4">
                    <Button variant={theme === "dark" ? "light" : "dark"} onClick={() => addToCart(selectedProduct._id)}>
                      Aggiungi al carrello
                    </Button>
                    <FaHeart
                      size={24}
                      color={wishlist.includes(selectedProduct._id) ? "red" : "gray"}
                      style={{ cursor: "pointer", marginLeft: "15px" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleWishlist(selectedProduct._id);
                      }}
                    />
                  </div>
                </motion.div>
              </Col>
            </Row>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Products Section */}
      <div ref={productsSectionRef} style={{
        backgroundColor: theme === "dark" ? "#212529" : "#fff", color: theme === "dark" ? "#fff" : "#000", /*mettimi un box shadow*/
        boxShadow: "20px 20px 30px rgba(0,0,0,0.9)",
      }}>
        <Container fluid>

          <h2 className="text-center mb-4" style={{
            color: theme === "dark" ? "#fff" : "#000", // Cambia colore in base al tema
            fontWeight: "bold",
          }}>Prodotti</h2>
          {/* Filters Section */}
          <div 
            ref={filtersContainerRef}
            style={{
              backgroundColor: theme === "dark" ? "#212529" : "#fff", 
              color: theme === "dark" ? "#fff" : "#000",
              boxShadow: "10px 10px 5px rgba(0,0,0,0.5)",
            }}
          >
            <Container fluid>
              <div className="text-center mb-3" >
                <Button
                  variant="dark"
                  style={{ border: "0.5px solid " }}
                  onClick={() => setShowFilters(!showFilters)}
                  aria-controls="filters-collapse"
                  aria-expanded={showFilters}
                  className="filter-toggle-btn"
                >
                  <FaFilter /> Filtri
                </Button>
                {showFilters && (
                  <Button
                    variant="danger"
                    style={{ marginBottom: "30px" }}
                    className="ms-3"
                    onClick={resetFilters}
                  >
                    Azzera Filtri
                  </Button>
                )}
              </div>
              <Collapse 
                in={showFilters} 
                id="filtri"
                style={{ backgroundColor: theme === "dark" ? "#212529" : "#fff", color: theme === "dark" ? "#fff" : "#000" }}
              >
                <div id="filters-collapse" className="filters-container">
                  <Form>
                    <Row className="gy-3">
                      <Col md={3}>
                        <Form.Group controlId="filterName">
                          <Form.Label className="filter-label" style={{
                            // Cambia colore in base al tema
                            fontWeight: "bold",
                          }}>Nome</Form.Label>
                          <Form.Control
                            type="text"
                            placeholder="Cerca per nome"
                            name="name"
                            style={{
                              backgroundColor: theme === "dark" ? "#212529" : "#fff",
                              color: "white",
                              fontWeight: "bold",
                            }}
                            value={filters.name}
                            onChange={handleFilterChange}
                            className="filter-input"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group controlId="filterPrice">
                          <Form.Label className="filter-label" style={{
                            color: theme === "dark" ? "#fff" : "#000", // Cambia colore in base al tema
                            fontWeight: "bold",
                            marginLeft: "auto",
                            marginRight: "auto",
                            textAlign: "center",
                          }}>Prezzo</Form.Label>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <FaSortAmountUp
                              size={24}
                              style={{
                                cursor: "pointer",
                                color: sortOrder === "asc" ? "#007bff" : theme === "dark" ? "#fff" : "#000",
                                marginRight: "10px",
                              }}
                              onClick={() => setSortOrder((prev) => (prev === "asc" ? "" : "asc"))} // Deseleziona al secondo clic
                            />
                            <Slider
                              range
                              min={0}
                              max={5000}
                              step={50}
                              value={filters.price}
                              onChange={(value) => setFilters((prev) => ({ ...prev, price: value }))}
                              trackStyle={[{ backgroundColor: "#007bff" }]} // Colore della barra selezionata
                              handleStyle={[
                                { borderColor: "#007bff", backgroundColor: "#fff" }, // Stile dei cursori
                                { borderColor: "#007bff", backgroundColor: "#fff" },
                              ]}
                              style={{
                                width: "200px",
                                marginTop: "10px",
                              }} // larghezza diminuita del slider
                            />
                            <FaSortAmountDown
                              size={24}
                              style={{
                                cursor: "pointer",
                                color: sortOrder === "desc" ? "#007bff" : theme === "dark" ? "#fff" : "#000",
                                marginLeft: "10px",
                              }}
                              onClick={() => setSortOrder((prev) => (prev === "desc" ? "" : "desc"))} // Deseleziona al secondo clic
                            />
                          </div>
                          <div className="price-range" style={{
                            color: theme === "dark" ? "#fff" : "#000", // Cambia colore in base al tema
                            fontWeight: "bold",
                            textAlign: "center",
                          }}>
                            <span style={{
                              marginLeft: "auto",
                              marginRight: "auto",
                            }}>€{filters.price[0]}</span>
                            <span style={{
                              marginLeft: "auto",
                              marginRight: "auto",
                            }}>€{filters.price[1]}</span>
                          </div>
                        </Form.Group>
                      </Col>

                      <Col md={3}>
                        <Form.Group controlId="filterColor">
                          <Form.Label className="filter-label" style={{
                            color: theme === "dark" ? "#fff" : "#000", // Cambia colore in base al tema
                            fontWeight: "bold",
                          }}>Colore</Form.Label>
                          <Form.Control
                            style={{ backgroundColor: theme === "dark" ? "#212529" : "#fff", color: theme === "dark" ? "#fff" : "#000" }}
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
                          <Form.Label className="filter-label" style={{
                            color: theme === "dark" ? "#fff" : "#000", // Cambia colore in base al tema
                            fontWeight: "bold",
                          }}>Solo con Modello 3D</Form.Label>
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
                        <motion.div
                          whileHover={{ scale: 1.2 }} // Ingrandisce leggermente l'icona al passaggio del mouse
                          whileTap={{ scale: 0.9 }} // Riduce leggermente l'icona al clic
                        >
                          <FaArrowLeft
                            size={30}
                            style={{
                              color: theme === "dark" ? "#fff" : "#000",
                              fontWeight: "bold",
                              cursor: "pointer",
                            }}
                            onClick={() => handleCategoryScroll("left")}
                          />
                        </motion.div>
                      </Col>
                      <Col md={10}>
                        <div className="d-flex justify-content-center">
                          <AnimatePresence>
                            {categories.slice(currentCategoryIndex, currentCategoryIndex + 3).map((category) => (
                              <motion.div
                                key={category}
                                className="text-center mx-2 category-card"
                                initial={{ opacity: 0, y: 20 }} // Stato iniziale: leggermente in basso e trasparente
                                animate={{ opacity: 1, y: 0 }} // Stato animato: visibile e in posizione
                                exit={{ opacity: 0, y: 23 }} // Stato di uscita: leggermente in alto e trasparente
                                transition={{
                                  duration: 0.2, // Durata della transizione
                                  ease: [0.4, 0.8, 0.4, 1], // Curva di Bezier per un'animazione fluida
                                }}
                                whileHover={{
                                  scale: 1.1, // Ingrandisce leggermente al passaggio del mouse
                                  boxShadow: "0 10px 20px rgba(0, 0, 0, 0.3)", // Aggiunge un'ombra più pronunciata
                                }}
                                whileTap={{ scale: 0.95 }} // Riduce leggermente al clic
                                style={{
                                  width: "150px",
                                  height: "150px",
                                  position: "relative",
                                  overflow: "hidden",
                                  cursor: "pointer",
                                  borderRadius: "10px",
                                  boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)", // Ombra standard
                                  transition: "box-shadow 0.3s ease",
                                }}
                                onClick={() => handleCategoryClick(category)}
                              >
                                <img
                                  src={categoryImages[category]}
                                  alt={category}
                                  style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    opacity: 0.8,
                                    transition: "opacity 0.3s ease",
                                  }}
                                />
                                <h7 className="category-title" >{category}</h7>
                              </motion.div>
                            ))}
                          </AnimatePresence>
                        </div>
                      </Col>
                      <Col md={1} className="text-center">
                        <motion.div
                          whileHover={{ scale: 1.2 }} // Ingrandisce leggermente l'icona al passaggio del mouse
                        // Riduce leggermente l'icona al clic
                        >
                          <FaArrowRight
                            size={30}
                            style={{
                              color: theme === "dark" ? "#fff" : "#000",
                              fontWeight: "bold",
                              cursor: "pointer",
                            }}
                            onClick={() => handleCategoryScroll("right")}
                          />
                        </motion.div>
                      </Col>
                    </Row>
                  </Form>
                </div>
              </Collapse>
            </Container>
          </div>

          <hr style={{ borderColor: "#fff", opacity: 0.2 }} />

          {filteredProducts.length === 0 ? (
            <div className="text-center mt-4">
              <h4 style={{ color: theme === "dark" ? "#fff" : "#000" }}>Nessun prodotto disponibile</h4>
            </div>
          ) : (
            <Row>
              {filteredProducts.slice(0, visibleProducts).map((product, index) => (
                <Col
                  key={product._id}
                  md={4}
                  className={`mb-4 ${highlightedProductId === product._id ? "highlighted-product" : ""}`}
                  ref={productRefs.current[index]}
                >
                  <Card
                    className="shadow-lg"
                    style={{
                      borderRadius: "15px",
                      overflow: "hidden",
                      cursor: "pointer",
                      border: highlightedProductId === product._id
                        ? theme === "dark"
                          ? "3px solid white"
                          : "3px solid black"
                        : "none", // Evidenzia il bordo
                    }}
                    onClick={() => handleProductClick(product, index)}
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
                          style={{
                            display: "block",
                            margin: "0 auto",
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
          )}
         


          {visibleProducts < filteredProducts.length && (
            <div className="text-center mt-4">
              <Button variant="secondary" onClick={loadMoreProducts}>
                Carica altri prodotti
              </Button>
            </div>
          )}
        </Container>
      </div>
      {showScrollTop && (
  <button
    onClick={() => {
      // Scorri all'intera sezione dei filtri, non solo all'elemento con id="filtri"
      if (filtersContainerRef.current) {
        filtersContainerRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }}
    style={{
      position: "fixed",
      bottom: "20px",
      left: "20px",
      zIndex: 1000,
      borderRadius: "50%",
      width: "50px",
      height: "50px",
      fontSize: "24px",
      backgroundColor: "#007bff",
      color: "white",
      border: "none",
      cursor: "pointer",
      boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
    }}
    aria-label="Torna ai filtri"
  >
    ↑
  </button>
)}  
      <ToastContainer />
      <ChatPopup />
    </div>
  );
};

export default HomePage;