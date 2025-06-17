import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Container, Form, Row, Col, Button, ToggleButtonGroup, ToggleButton, Modal } from "react-bootstrap";
import { color, motion } from "framer-motion";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import { FaHeart } from "react-icons/fa"; // Importa l'icona del cuore
import 'react-toastify/dist/ReactToastify.css';
import LoadingSpinner from '../components/LoadingSpinner';
import QRCodeModal from '../components/QRCodeModal';
import { useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { useRef } from "react"; // Importa useRef
import QRCode from "qrcode";
import { API_ENDPOINTS } from '../config/api';



const ProductsPage = () => {
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [filters, setFilters] = useState({ name: "", price: "", category: "", color: "", dimension: "", has3D: false });
    const [viewMode, setViewMode] = useState("grid"); // "scroll" or "grid"
    const [showPopup, setShowPopup] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [showScrollToTop, setShowScrollToTop] = useState(false);
    const [showQRModal, setShowQRModal] = useState(false);
    const [wishlist, setWishlist] = useState([]); // Stato per la wishlist
    const [theme, setTheme] = useState(""); // "light" o "dark"
    const [mainImage, setMainImage] = useState(null);
    const [hoveredCategory, setHoveredCategory] = useState(null);
    const handleShowQRModal = (product = selectedProduct) => {
        if (product) {
            setSelectedProduct(product);
        }
        setShowQRModal(true);
    };
    const handleCloseQRModal = () => setShowQRModal(false);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();
    const detailsSectionRef = useRef(null); // Riferimento alla sezione dei dettagli
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
        if (location.state && location.state.fromHome) {
            // Resettiamo tutto se l'utente arriva dalla home
            setSelectedCategory(null);
            setSelectedProduct(null);
            localStorage.removeItem("selectedCategory");
            localStorage.removeItem("selectedProduct");
        }
    }, [location]);

    useEffect(() => {        const fetchProducts = async () => {
            try {
                const response = await axios.get(API_ENDPOINTS.PRODUCTS);
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

        const fetchWishlist = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) return;

                const response = await axios.get(API_ENDPOINTS.WISHLIST, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setWishlist(response.data.products.map((item) => item.product._id)); // Salva solo gli ID dei prodotti
            } catch (error) {
                console.error("Errore nel recupero della wishlist", error);
            }
        };


        fetchProducts();
        fetchWishlist();

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

    useEffect(() => {
        if (selectedProduct && selectedProduct.images.length > 0) {
            setMainImage(selectedProduct.images[0]); // Imposta la prima immagine come predefinita
        }
    }, [selectedProduct]);

    useEffect(() => {
        const handleDarkModeToggle = () => {
            setTheme(localStorage.getItem("darkMode") === "true" ? "dark" : "light");

            // Ricarica il prodotto selezionato dal localStorage solo se non è già impostato
            if (!selectedProduct) {
                const savedProduct = localStorage.getItem("selectedProduct");
                if (savedProduct) {
                    const product = JSON.parse(savedProduct);
                    setSelectedProduct(product);
                    setMainImage(product.images[0]); // Imposta l'immagine principale
                }
            }
        };

        // Ascolta l'evento personalizzato
        window.addEventListener("darkModeToggle", handleDarkModeToggle);

        // Imposta il tema iniziale
        handleDarkModeToggle();

        return () => {
            window.removeEventListener("darkModeToggle", handleDarkModeToggle);
        };
    }, [selectedProduct]);

    const addToCart = async (productId) => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/login");
            return;
        }
        try {            await axios.post(
                API_ENDPOINTS.CART,
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
    useEffect(() => {
        const filtered = products.filter((product) => {
            return (
                (filters.name === "" || (product.name && product.name.toLowerCase().includes(filters.name.toLowerCase()))) &&
                (filters.price === "" || (product.price && product.price <= parseFloat(filters.price))) &&
                (filters.category === "" || product.category === filters.category) &&
                (filters.color === "" || (product.description && product.description.toLowerCase().includes(filters.color.toLowerCase()))) &&
                (filters.dimension === "" || (product.dimension && parseFloat(product.dimension) <= parseFloat(filters.dimension))) &&
                (!filters.has3D || (product.link3Dios || product.link3Dandroid)) // Controlla se il prodotto ha un modello 3D
            );
        })
            .sort((a, b) => b.price - a.price); // Ordina i prodotti dal più caro al meno caro

        setFilteredProducts(filtered);
        setCurrentIndex(0);
    }, [filters, products]);

    const handleScroll = (direction, increment = itemsPerView) => {
        setCurrentIndex((prev) => {
            const newIndex =
                direction === "right"
                    ? Math.min(
                          prev + increment,
                          selectedCategory
                              ? filteredProducts.length - itemsPerView
                              : categories.length - itemsPerView
                      )
                    : Math.max(prev - increment, 0);
    
            // Evidenzia la card centrale
            const container = document.querySelector(".categories-wrapper");
            if (container) {
                const cards = Array.from(container.children);
                cards.forEach((card, index) => {
                    if (index === newIndex) {
                        card.classList.add("focused");
                    } else {
                        card.classList.remove("focused");
                    }
                });
            }
    
            return newIndex;
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

    const handleCategoryHover = (category) => {
        setHoveredCategory(category);
    };

    const handleCategoryClick = (category) => {
        // Filtra i prodotti per la categoria selezionata
        setSelectedCategory(category);
        setFilters((prev) => ({ ...prev, category }));
        localStorage.setItem("selectedCategory", category);
    };


    const handleBackToCategories = () => {
        setSelectedCategory(null);
        setFilters({ name: "", price: "", category: "", color: "", dimension: "" });
        setFilteredProducts(products);
        localStorage.removeItem("selectedCategory");
        localStorage.removeItem("selectedProduct"); // 🔹 Rimuove il prodotto salvat
    };

    useEffect(() => {
        if (selectedProduct) {
            localStorage.setItem("selectedProduct", JSON.stringify(selectedProduct));
        }
    }, [selectedProduct]);

    const handleViewModeChange = (value) => {
        setViewMode(value);
    };

    const handleCardClick = async (product) => {
        setSelectedProduct(product);
        setMainImage(product.images[0]); // Imposta l'immagine principale
        localStorage.setItem("selectedProduct", JSON.stringify(product)); // Salva il prodotto selezionato nel localStorage

        // Recupera immagini da Google basate sulla descrizione del prodotto
        // const googleImages = await fetchGoogleImages(product.description);

        // Aggiungi le immagini di Google alle immagini secondarie, se disponibili
        // const updatedImages = [...product.images, ...googleImages];

        // setSelectedProduct({ ...product, images: updatedImages });

        // Scorri verso la sezione dei dettagli
        if (detailsSectionRef.current) {
            detailsSectionRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    };

    useEffect(() => {
        const savedProduct = localStorage.getItem("selectedProduct");
        if (savedProduct) {
            const product = JSON.parse(savedProduct);
            setSelectedProduct(product);
            setMainImage(product.images[0]); // Imposta l'immagine principale
        }
    }, []);



    const handleClosePopup = () => {
        setShowPopup(false);
        setSelectedProduct(null); // Resetta il prodotto selezionato
        localStorage.removeItem("selectedProduct");
    };

    // const fetchGoogleImages = async (description) => {
    //     try {
    //         const response = await axios.get("https://www.googleapis.com/customsearch/v1", {
    //             params: {
    //                 q: description, // Query basata sulla descrizione del prodotto
    //                 searchType: "image", // Cerca solo immagini
    //                 cx: "26fd197d4bac947f6", // Sostituisci con il tuo ID del motore di ricerca
    //                 key: "AIzaSyB5S5rU7-YvS35aklX3HpzU4XU_NCKTN0c", // Sostituisci con la tua chiave API
    //                 num: 3, // Ottieni fino a 3 immagini
    //             },
    //         });

    //         // Restituisci gli URL delle immagini
    //         return response.data.items.map((item) => item.link).slice(0, 3);
    //     } catch (error) {
    //         console.error("Errore nel recupero delle immagini da Google", error);
    //         return [];
    //     }
    // };

    const addToWishlist = async (productId) => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/login");
            return;
        }
        try {            await axios.post(
                API_ENDPOINTS.WISHLIST,
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


    useEffect(() => {
        if (!selectedCategory) {
            // Se nessuna categoria è selezionata, rimuovi il prodotto salvato
            setSelectedProduct(null);
            localStorage.removeItem("selectedProduct");
        }
    }, [selectedCategory]);
    const removeFromWishlist = async (productId) => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/login");
            return;
        }
        try {
            await axios.delete(API_ENDPOINTS.WISHLIST_REMOVE(productId), {
                headers: { Authorization: `Bearer ${token}` },
            });
            setWishlist((prev) => prev.filter((id) => id !== productId)); // Rimuovi il prodotto dalla wishlist
            toast.success("Prodotto rimosso dalla wishlist!", {
                position: "top-right",
                autoClose: 3000,
                theme: "colored",
            });
        } catch (error) {
            console.error("Errore nella rimozione dalla wishlist", error);
            toast.error("Errore nella rimozione dalla wishlist", {
                position: "top-right",
                autoClose: 3000,
                theme: "colored",
            });
        }
    };

    useEffect(() => {
        const savedCategory = localStorage.getItem("selectedCategory");
        if (savedCategory) {
            setSelectedCategory(savedCategory);
            setFilters((prev) => ({ ...prev, category: savedCategory }));
        }
    }, []);

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 300) {
                setShowScrollToTop(true); // Rimuove il blur
            } else {
                setShowScrollToTop(false); // Mantiene il blur
            }
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);
    return (
        <Container
            className={`mt-5 text-center position-relative ${selectedProduct && !showScrollToTop ? "blur-background" : "no-blur"
                }`}
            style={{ zIndex: 0 }}
        >            {selectedCategory && (
                <Form className="filters-container">
                    <Row className="filters-row">
                        <Col md={3} className="filter-col">
                            <Form.Group controlId="filterName" className="filter-group">
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
                        <Col md={3} className="filter-col">
                            <Form.Group controlId="filterPrice" className="filter-group">
                                <Form.Label className="filter-label">Prezzo Max (€)</Form.Label>
                                <Form.Control
                                    type="number"
                                    placeholder="Es. 1500"
                                    name="price"
                                    value={filters.price}
                                    onChange={handleFilterChange}
                                    className="filter-input"
                                />
                            </Form.Group>
                        </Col>
                        <Col md={3} className="filter-col">
                            <Form.Group controlId="filterColor" className="filter-group">
                                <Form.Label className="filter-label">Colore</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="Es. nero, bianco"
                                    name="color"
                                    value={filters.color}
                                    onChange={handleFilterChange}
                                    className="filter-input"
                                />
                            </Form.Group>
                        </Col>                        <Col md={3} className="filter-col">
                            <Form.Group controlId="filterHas3D" className="filter-group">
                                <Form.Label className="filter-label">Modello 3D</Form.Label>
                                <div className="filter-checkbox-container">
                                    <Form.Check
                                        type="checkbox"
                                        name="has3D"
                                        checked={filters.has3D}
                                        onChange={(e) => setFilters((prev) => ({ ...prev, has3D: e.target.checked }))}
                                        className="filter-checkbox"
                                        label="Solo con 3D"
                                    />
                                </div>
                            </Form.Group>
                        </Col>
                    </Row>
                    <Row className="mt-3">
                        <Col className="text-center">
                            <Button 
                                variant="danger" 
                                className="filter-reset-button"
                                onClick={() => setFilters({ name: "", price: "", category: selectedCategory, color: "", dimension: "", has3D: false })}
                            >
                                <i className="fas fa-undo me-2"></i>
                                Resetta Filtri
                            </Button>
                        </Col>
                    </Row>
                </Form>
            )}<AnimatePresence>
                {selectedProduct && selectedCategory && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: theme === "dark" 
                                ? 'rgba(0, 0, 0, 0.85)' 
                                : 'rgba(0, 0, 0, 0.75)',
                            backdropFilter: 'blur(25px)',
                            zIndex: 1000,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '20px'
                        }}
                        onClick={() => {
                            setSelectedProduct(null);
                            localStorage.removeItem("selectedProduct");
                        }}
                    >
                        <motion.div
                            ref={detailsSectionRef}
                            initial={{ scale: 0.7, opacity: 0, rotateY: -15 }}
                            animate={{ scale: 1, opacity: 1, rotateY: 0 }}
                            exit={{ scale: 0.8, opacity: 0, rotateY: 15 }}
                            transition={{
                                type: "spring",
                                stiffness: 300,
                                damping: 30,
                                duration: 0.6
                            }}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                background: theme === "dark" 
                                    ? 'linear-gradient(145deg, rgba(30, 30, 47, 0.95), rgba(45, 45, 70, 0.85))' 
                                    : 'linear-gradient(145deg, rgba(255, 255, 255, 0.98), rgba(248, 249, 250, 0.95))',
                                backdropFilter: 'blur(40px)',
                                borderRadius: '35px',
                                border: theme === "dark" 
                                    ? '1px solid rgba(255, 255, 255, 0.15)' 
                                    : '1px solid rgba(0, 0, 0, 0.1)',
                                boxShadow: theme === "dark"
                                    ? `0 35px 80px rgba(0, 0, 0, 0.4),
                                       0 20px 40px rgba(138, 92, 246, 0.15),
                                       inset 0 1px 0 rgba(255, 255, 255, 0.1)`
                                    : `0 35px 80px rgba(0, 0, 0, 0.15),
                                       0 20px 40px rgba(59, 130, 246, 0.1),
                                       inset 0 1px 0 rgba(255, 255, 255, 0.8)`,
                                maxWidth: '95vw',
                                maxHeight: '95vh',
                                width: '1200px',
                                overflow: 'hidden',
                                position: 'relative'
                            }}
                        >
                            {/* Floating Close Button */}
                            <motion.button
                                whileHover={{ scale: 1.1, rotate: 90 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => {
                                    setSelectedProduct(null);
                                    localStorage.removeItem("selectedProduct");
                                }}
                                style={{
                                    position: 'absolute',
                                    top: '25px',
                                    right: '25px',
                                    background: theme === "dark" 
                                        ? 'rgba(255, 255, 255, 0.1)' 
                                        : 'rgba(0, 0, 0, 0.05)',
                                    backdropFilter: 'blur(20px)',
                                    border: 'none',
                                    borderRadius: '50%',
                                    width: '50px',
                                    height: '50px',
                                    color: theme === "dark" ? '#ffffff' : '#000000',
                                    fontSize: '24px',
                                    cursor: 'pointer',
                                    zIndex: 10,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                ✕
                            </motion.button>

                            <div style={{ 
                                display: 'grid', 
                                gridTemplateColumns: '1fr 1fr', 
                                height: '100%',
                                minHeight: '600px'
                            }}>
                                {/* Left Section - Image Gallery */}
                                <motion.div
                                    initial={{ opacity: 0, x: -30 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.2, duration: 0.6 }}
                                    style={{
                                        padding: '40px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        position: 'relative'
                                    }}
                                >
                                    {/* Main Image Container */}
                                    <motion.div
                                        style={{
                                            position: 'relative',
                                            borderRadius: '25px',
                                            overflow: 'hidden',
                                            background: theme === "dark" 
                                                ? 'rgba(255, 255, 255, 0.05)' 
                                                : 'rgba(0, 0, 0, 0.02)',
                                            backdropFilter: 'blur(10px)',
                                            border: theme === "dark" 
                                                ? '1px solid rgba(255, 255, 255, 0.1)' 
                                                : '1px solid rgba(0, 0, 0, 0.05)',
                                            height: '400px',
                                            marginBottom: '25px'
                                        }}
                                    >
                                        <motion.img
                                            key={mainImage}
                                            initial={{ scale: 1.1, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            transition={{ duration: 0.5 }}
                                            src={mainImage}
                                            alt={selectedProduct.name}
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover'
                                            }}
                                        />
                                        
                                        {/* Image Overlay Gradient */}
                                        <div style={{
                                            position: 'absolute',
                                            bottom: 0,
                                            left: 0,
                                            right: 0,
                                            height: '30%',
                                            background: 'linear-gradient(to top, rgba(0,0,0,0.4), transparent)',
                                            pointerEvents: 'none'
                                        }} />
                                    </motion.div>

                                    {/* Thumbnail Gallery */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.4, duration: 0.6 }}
                                        style={{
                                            display: 'flex',
                                            gap: '12px',
                                            justifyContent: 'center',
                                            flexWrap: 'wrap',
                                            maxHeight: '120px',
                                            overflowY: 'auto',
                                            padding: '10px 0'
                                        }}
                                    >
                                        {selectedProduct.images.map((image, index) => (
                                            <motion.div
                                                key={index}
                                                whileHover={{ scale: 1.1, y: -5 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => {
                                                    const temp = mainImage;
                                                    setMainImage(image);
                                                    const updatedImages = [...selectedProduct.images];
                                                    updatedImages[0] = image;
                                                    updatedImages[index] = temp;
                                                    setSelectedProduct({ ...selectedProduct, images: updatedImages });
                                                }}
                                                style={{
                                                    width: '80px',
                                                    height: '80px',
                                                    borderRadius: '15px',
                                                    overflow: 'hidden',
                                                    cursor: 'pointer',
                                                    background: theme === "dark" 
                                                        ? 'rgba(255, 255, 255, 0.05)' 
                                                        : 'rgba(0, 0, 0, 0.02)',
                                                    border: mainImage === image 
                                                        ? `3px solid ${theme === "dark" ? '#8b5cf6' : '#3b82f6'}` 
                                                        : `2px solid ${theme === "dark" ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                                                    position: 'relative'
                                                }}
                                            >
                                                <img
                                                    src={image}
                                                    alt={`View ${index + 1}`}
                                                    style={{
                                                        width: '100%',
                                                        height: '100%',
                                                        objectFit: 'cover'
                                                    }}
                                                />
                                                {mainImage === image && (
                                                    <div style={{
                                                        position: 'absolute',
                                                        inset: '0',
                                                        background: theme === "dark" 
                                                            ? 'rgba(139, 92, 246, 0.2)' 
                                                            : 'rgba(59, 130, 246, 0.2)',
                                                        backdropFilter: 'blur(2px)'
                                                    }} />
                                                )}
                                            </motion.div>
                                        ))}
                                    </motion.div>
                                </motion.div>

                                {/* Right Section - Product Details */}
                                <motion.div
                                    initial={{ opacity: 0, x: 30 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.3, duration: 0.6 }}
                                    style={{
                                        padding: '40px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'space-between',
                                        background: theme === "dark" 
                                            ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.05), rgba(59, 130, 246, 0.03))' 
                                            : 'linear-gradient(135deg, rgba(59, 130, 246, 0.03), rgba(139, 92, 246, 0.02))',
                                        position: 'relative'
                                    }}
                                >
                                    {/* Content Section */}
                                    <div>
                                        {/* Product Title */}
                                        <motion.h1
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.5, duration: 0.6 }}
                                            style={{
                                                fontSize: '2.8rem',
                                                fontWeight: '800',
                                                marginBottom: '15px',
                                                background: theme === "dark" 
                                                    ? 'linear-gradient(135deg, #ffffff, #e2e8f0)' 
                                                    : 'linear-gradient(135deg, #1e293b, #475569)',
                                                WebkitBackgroundClip: 'text',
                                                WebkitTextFillColor: 'transparent',
                                                lineHeight: '1.2'
                                            }}
                                        >
                                            {selectedProduct.name}
                                        </motion.h1>

                                        {/* Price */}
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: 0.6, duration: 0.6 }}
                                            style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                background: theme === "dark" 
                                                    ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(16, 185, 129, 0.1))' 
                                                    : 'linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(16, 185, 129, 0.05))',
                                                padding: '15px 25px',
                                                borderRadius: '20px',
                                                border: theme === "dark" 
                                                    ? '1px solid rgba(34, 197, 94, 0.3)' 
                                                    : '1px solid rgba(34, 197, 94, 0.2)',
                                                marginBottom: '30px'
                                            }}
                                        >
                                            <span style={{
                                                fontSize: '2.2rem',
                                                fontWeight: '700',
                                                color: theme === "dark" ? '#22c55e' : '#16a34a'
                                            }}>
                                                €{selectedProduct.price}
                                            </span>
                                        </motion.div>

                                        {/* Product Details */}
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.7, duration: 0.6 }}
                                            style={{ marginBottom: '30px' }}
                                        >
                                            {/* Description */}
                                            <div style={{ 
                                                marginBottom: '25px',
                                                padding: '20px',
                                                background: theme === "dark" 
                                                    ? 'rgba(255, 255, 255, 0.03)' 
                                                    : 'rgba(0, 0, 0, 0.02)',
                                                borderRadius: '15px',
                                                border: theme === "dark" 
                                                    ? '1px solid rgba(255, 255, 255, 0.05)' 
                                                    : '1px solid rgba(0, 0, 0, 0.05)'
                                            }}>
                                                <h3 style={{
                                                    fontSize: '1.1rem',
                                                    fontWeight: '600',
                                                    color: theme === "dark" ? '#e2e8f0' : '#475569',
                                                    marginBottom: '10px'
                                                }}>
                                                    Descrizione
                                                </h3>
                                                <p style={{
                                                    fontSize: '1rem',
                                                    lineHeight: '1.6',
                                                    color: theme === "dark" ? '#cbd5e1' : '#64748b',
                                                    margin: 0
                                                }}>
                                                    {selectedProduct.description}
                                                </p>
                                            </div>

                                            {/* Specifications Grid */}
                                            <div style={{
                                                display: 'grid',
                                                gridTemplateColumns: '1fr 1fr',
                                                gap: '15px',
                                                marginBottom: '25px'
                                            }}>
                                                <div style={{
                                                    padding: '15px',
                                                    background: theme === "dark" 
                                                        ? 'rgba(255, 255, 255, 0.03)' 
                                                        : 'rgba(0, 0, 0, 0.02)',
                                                    borderRadius: '12px',
                                                    border: theme === "dark" 
                                                        ? '1px solid rgba(255, 255, 255, 0.05)' 
                                                        : '1px solid rgba(0, 0, 0, 0.05)'
                                                }}>
                                                    <div style={{
                                                        fontSize: '0.85rem',
                                                        fontWeight: '500',
                                                        color: theme === "dark" ? '#94a3b8' : '#64748b',
                                                        marginBottom: '5px'
                                                    }}>
                                                        Dimensioni
                                                    </div>
                                                    <div style={{
                                                        fontSize: '1rem',
                                                        fontWeight: '600',
                                                        color: theme === "dark" ? '#e2e8f0' : '#1e293b'
                                                    }}>
                                                        {selectedProduct.dimensioni || "Non specificate"}
                                                    </div>
                                                </div>
                                                <div style={{
                                                    padding: '15px',
                                                    background: theme === "dark" 
                                                        ? 'rgba(255, 255, 255, 0.03)' 
                                                        : 'rgba(0, 0, 0, 0.02)',
                                                    borderRadius: '12px',
                                                    border: theme === "dark" 
                                                        ? '1px solid rgba(255, 255, 255, 0.05)' 
                                                        : '1px solid rgba(0, 0, 0, 0.05)'
                                                }}>
                                                    <div style={{
                                                        fontSize: '0.85rem',
                                                        fontWeight: '500',
                                                        color: theme === "dark" ? '#94a3b8' : '#64748b',
                                                        marginBottom: '5px'
                                                    }}>
                                                        Disponibilità
                                                    </div>
                                                    <div style={{
                                                        fontSize: '1rem',
                                                        fontWeight: '600',
                                                        color: selectedProduct.stock > 0 
                                                            ? (theme === "dark" ? '#22c55e' : '#16a34a')
                                                            : (theme === "dark" ? '#ef4444' : '#dc2626')
                                                    }}>
                                                        {selectedProduct.stock > 0 
                                                            ? `${selectedProduct.stock} disponibili` 
                                                            : "Non disponibile"}
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>

                                        {/* 3D/AR Section */}
                                        {(selectedProduct.link3Dios || selectedProduct.link3Dandroid) && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.8, duration: 0.6 }}
                                                style={{
                                                    padding: '20px',
                                                    background: theme === "dark" 
                                                        ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.1), rgba(139, 92, 246, 0.05))' 
                                                        : 'linear-gradient(135deg, rgba(168, 85, 247, 0.05), rgba(139, 92, 246, 0.03))',
                                                    borderRadius: '15px',
                                                    border: theme === "dark" 
                                                        ? '1px solid rgba(168, 85, 247, 0.2)' 
                                                        : '1px solid rgba(168, 85, 247, 0.1)',
                                                    marginBottom: '30px'
                                                }}
                                            >
                                                <h3 style={{
                                                    fontSize: '1.1rem',
                                                    fontWeight: '600',
                                                    color: theme === "dark" ? '#c084fc' : '#8b5cf6',
                                                    marginBottom: '15px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '10px'
                                                }}>
                                                    🥽 Visualizza in Realtà Aumentata
                                                </h3>
                                                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                                    {selectedProduct.link3Dios && (
                                                        <motion.button
                                                            whileHover={{ scale: 1.05, y: -2 }}
                                                            whileTap={{ scale: 0.95 }}
                                                            onClick={() => handleShowQRModal(selectedProduct.link3Dios)}
                                                            style={{
                                                                background: 'linear-gradient(135deg, #007AFF, #0051D0)',
                                                                border: 'none',
                                                                borderRadius: '12px',
                                                                padding: '12px 20px',
                                                                color: 'white',
                                                                fontWeight: '600',
                                                                fontSize: '0.9rem',
                                                                cursor: 'pointer',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '8px'
                                                            }}
                                                        >
                                                            📱 iOS
                                                        </motion.button>
                                                    )}
                                                    {selectedProduct.link3Dandroid && (
                                                        <motion.button
                                                            whileHover={{ scale: 1.05, y: -2 }}
                                                            whileTap={{ scale: 0.95 }}
                                                            onClick={() => handleShowQRModal(selectedProduct.link3Dandroid)}
                                                            style={{
                                                                background: 'linear-gradient(135deg, #34A853, #137333)',
                                                                border: 'none',
                                                                borderRadius: '12px',
                                                                padding: '12px 20px',
                                                                color: 'white',
                                                                fontWeight: '600',
                                                                fontSize: '0.9rem',
                                                                cursor: 'pointer',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '8px'
                                                            }}
                                                        >
                                                            🤖 Android
                                                        </motion.button>
                                                    )}
                                                </div>
                                            </motion.div>
                                        )}
                                    </div>

                                    {/* Action Buttons */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 30 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.9, duration: 0.6 }}
                                        style={{
                                            display: 'flex',
                                            gap: '15px',
                                            alignItems: 'center'
                                        }}
                                    >
                                        <motion.button
                                            whileHover={{ scale: 1.05, y: -3 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => addToCart(selectedProduct._id)}
                                            style={{
                                                flex: 1,
                                                background: theme === "dark" 
                                                    ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)' 
                                                    : 'linear-gradient(135deg, #2563eb, #1e40af)',
                                                border: 'none',
                                                borderRadius: '20px',
                                                padding: '18px 30px',
                                                color: 'white',
                                                fontWeight: '700',
                                                fontSize: '1.1rem',
                                                cursor: 'pointer',
                                                boxShadow: theme === "dark" 
                                                    ? '0 10px 30px rgba(59, 130, 246, 0.3)' 
                                                    : '0 10px 30px rgba(37, 99, 235, 0.3)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '10px'
                                            }}
                                        >
                                            🛒 Aggiungi al Carrello
                                        </motion.button>

                                        <motion.button
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => {
                                                wishlist.includes(selectedProduct._id)
                                                    ? removeFromWishlist(selectedProduct._id)
                                                    : addToWishlist(selectedProduct._id);
                                            }}
                                            style={{
                                                width: '60px',
                                                height: '60px',
                                                borderRadius: '50%',
                                                border: 'none',
                                                background: wishlist.includes(selectedProduct._id)
                                                    ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                                                    : theme === "dark" 
                                                        ? 'rgba(255, 255, 255, 0.1)' 
                                                        : 'rgba(0, 0, 0, 0.05)',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '1.5rem',
                                                boxShadow: wishlist.includes(selectedProduct._id)
                                                    ? '0 10px 30px rgba(239, 68, 68, 0.3)'
                                                    : 'none'
                                            }}
                                        >
                                            <FaHeart
                                                color={wishlist.includes(selectedProduct._id) 
                                                    ? "#ffffff" 
                                                    : theme === "dark" ? "#64748b" : "#94a3b8"}
                                            />
                                        </motion.button>
                                    </motion.div>
                                </motion.div>
                            </div>

                            {/* Floating Design Elements */}
                            <div style={{
                                position: 'absolute',
                                top: '-100px',
                                right: '-100px',
                                width: '200px',
                                height: '200px',
                                borderRadius: '50%',
                                background: theme === "dark" 
                                    ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(59, 130, 246, 0.05))' 
                                    : 'linear-gradient(135deg, rgba(139, 92, 246, 0.05), rgba(59, 130, 246, 0.03))',
                                filter: 'blur(40px)',
                                pointerEvents: 'none'
                            }} />
                            <div style={{
                                position: 'absolute',
                                bottom: '-50px',
                                left: '-50px',
                                width: '150px',
                                height: '150px',
                                borderRadius: '50%',
                                background: theme === "dark" 
                                    ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(16, 185, 129, 0.05))' 
                                    : 'linear-gradient(135deg, rgba(34, 197, 94, 0.05), rgba(16, 185, 129, 0.03))',
                                filter: 'blur(30px)',
                                pointerEvents: 'none'
                            }} />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>


            {selectedCategory && !selectedProduct && (
                <Button variant="secondary" className="mb-4" onClick={handleBackToCategories}>
                    Torna alle categorie
                </Button>
            )}
            {/* Bottoni per cambiare modalità di visualizzazione */}
            {!selectedProduct && (
                <div className="view-mode-toggle mb-4">
                    <ToggleButtonGroup
                        type="radio"
                        name="viewMode"
                        value={viewMode}
                        onChange={handleViewModeChange}
                    >
                        <ToggleButton
                            id="grid-view"
                            value="grid"
                            variant={"dark"}
                            style={{ border: "2px solid #343a40" }}
                        >
                            Griglia
                        </ToggleButton>
                        <ToggleButton
                            id="scroll-view"
                            value="scroll"
                            variant={"dark"}
                            style={{ border: "2px solid #343a40" }}
                        >
                            Scorrimento
                        </ToggleButton>
                    </ToggleButtonGroup>
                </div>
            )}
            {selectedCategory ? (
                <>
                    {filteredProducts.length === 0 ? (
                        <div className="text-center mt-4">
                            <p style={{ fontSize: "1.2rem", fontWeight: "bold", color: theme === "dark" ? "#ffffff" : "#000000" }}>
                                Non ci sono prodotti per i filtri selezionati.
                            </p>
                        </div>
                    ) : viewMode === "scroll" ? (
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
                                                className={`product-card ${index >= currentIndex && index < currentIndex + itemsPerView ? "" : "inactive"}`}
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
                                                        src={product.images[0]}
                                                        alt={product.name}
                                                        style={{ height: "250px", objectFit: "cover" }}
                                                    />
                                                    <Card.Body style={{ backgroundColor: "#f8f9fa" }}>
                                                        <Card.Title style={{ color: "#343a40", fontWeight: "bold" }}>
                                                            {product.name}
                                                        </Card.Title>
                                                        <Card.Text><strong style={{ color: "#28a745" }}>€{product.price}</strong></Card.Text>
                                                        <div className="d-flex justify-content-between align-items-center">
                                                            <motion.button
                                                                variant="dark"
                                                                className="btnCarrello"
                                                                whileHover={{ scale: 1.1 }}
                                                                whileTap={{ scale: 0.9 }}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    addToCart(product._id)
                                                                }}
                                                            >
                                                                Aggiungi al carrello
                                                            </motion.button>
                                                            <FaHeart
                                                                size={24}
                                                                color={wishlist.includes(product._id) ? "red" : "gray"}
                                                                style={{ cursor: "pointer" }}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    wishlist.includes(product._id)
                                                                        ? removeFromWishlist(product._id)
                                                                        : addToWishlist(product._id);
                                                                }}
                                                            />
                                                        </div>
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
                    ) : (                        <div className="products-grid">
                            {filteredProducts.map((product) => (
                                <div key={product._id} className="product-item">
                                    <Card
                                        className="product-card shadow-lg"
                                        style={{ borderRadius: "15px", overflow: "hidden", cursor: "pointer" }}
                                        onClick={() => handleCardClick(product)}
                                    >
                                        <Card.Img
                                            variant="top"
                                            src={product.images[0]}
                                            alt={product.name}
                                            className="product-image"
                                            style={{ height: "250px", objectFit: "cover" }}
                                        />                                        <Card.Body className="product-body" style={{ backgroundColor: "#f8f9fa" }}>
                                            <Card.Title className="product-title" style={{ color: "#343a40", fontWeight: "bold" }}>
                                                {product.name}
                                            </Card.Title>
                                            <Card.Text className="product-price">
                                                <strong style={{ color: "#28a745" }}>€{product.price}</strong>
                                            </Card.Text>
                                            <div className="d-flex-responsive justify-content-between align-items-center">
                                                <motion.button
                                                    className="btn btn-dark"
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        addToCart(product._id);
                                                    }}
                                                >
                                                    Aggiungi al carrello
                                                </motion.button>
                                                <FaHeart
                                                    size={24}
                                                    color={wishlist.includes(product._id) ? "red" : "gray"}
                                                    style={{ cursor: "pointer" }}
                                                    onClick={(e) => {                                                        e.stopPropagation();
                                                        wishlist.includes(product._id)
                                                            ? removeFromWishlist(product._id)
                                                            : addToWishlist(product._id);
                                                    }}
                                                />
                                            </div>
                                        </Card.Body>
                                    </Card>
                                </div>
                            ))}
                        </div>
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
                    <div className="categories-container" onWheel={(e) => handleScroll(e.deltaY > 0 ? "right" : "left")}>
                        <motion.div
                            className="categories-wrapper"
                            animate={{ x: -currentIndex * 320 }}
                            transition={{ type: "spring", stiffness: 100, damping: 20 }}
                            drag="x"
                            dragConstraints={{ left: -((categories.length - itemsPerView) * 320), right: 0 }}
                        >
                            {categories.map((category, index) => (
                                <motion.div
                                    key={index}
                                    className="category-card"
                                    animate={{
                                        opacity: index >= currentIndex && index < currentIndex + itemsPerView ? 1 : 0.5,
                                        scale: index >= currentIndex && index < currentIndex + itemsPerView ? 1 : 0.8,
                                    }}
                                    transition={{ duration: 0.5 }}
                                    onClick={() => setCurrentIndex(index)}
                                    whileHover={{ scale: 1.05 }}
                                >
                                    {/* filepath: c:\Users\edocu\Desktop\casaViva\frontend\src\pages\ProductsPage.jsx */}                                    <Card className="category-card glowing-card" style={{ height: "300px", overflow: "hidden", position: "relative" }} onClick={() => handleCategoryClick(category)}>
                                        <Card.Img
                                            variant="top"
                                            src={categoryImages[category]}
                                            alt={category}
                                            className="category-image"
                                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                        />
                                        <Card.Title className="card-title-overlay text-responsive">{category}</Card.Title>
                                    </Card>
                                </motion.div>
                            ))}
                        </motion.div>
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
                    </div>
                </>
            )}
            <ToastContainer />
            <Modal show={showPopup} onHide={handleClosePopup} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Dettagli Prodotto</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <img
                        src={selectedProduct?.images[0]}
                        alt={selectedProduct?.name}
                        style={{ width: "100%", height: "auto", marginBottom: "20px" }}
                    />
                    <h4>{selectedProduct?.name}</h4>
                    <p><strong>Prezzo:</strong> €{selectedProduct?.price}</p>
                    <p><strong>Descrizione:</strong> {selectedProduct?.description}</p>
                    <p><strong>Dimensioni:</strong> {selectedProduct?.dimensioni || "Non specificate"}</p>
                    <p><strong>Disponibilità:</strong> {selectedProduct?.stock > 0 ? `${selectedProduct.stock} pezzi disponibili` : "Non disponibile"}</p>
                    {(selectedProduct?.link3Dios || selectedProduct?.link3Dandroid) && (
                        <>
                            <p><strong>Visualizza in 3D:</strong></p>
                            {selectedProduct.link3Dios && (
                                <Button
                                    variant="dark"
                                    className="mt-2"
                                    onClick={() => handleShowQRModal(selectedProduct.link3Dios)}
                                >
                                    Visualizza su iOS
                                </Button>
                            )}
                            {selectedProduct.link3Dandroid && (
                                <Button
                                    variant="dark"
                                    className="mt-2"
                                    onClick={() => handleShowQRModal(selectedProduct.link3Dandroid)}
                                >
                                    Visualizza su Android
                                </Button>
                            )}
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClosePopup}>
                        Chiudi
                    </Button>
                    <Button variant="dark" onClick={() => addToCart(selectedProduct?._id)}>                        Aggiungi al carrello
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Nuovo QR Code Modal Responsivo */}
            <QRCodeModal 
                show={showQRModal} 
                onHide={() => setShowQRModal(false)} 
                product={selectedProduct} 
            />

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
                    background-color: #007bff;
                    color: white;
                    border: none;
                }
                .scroll-to-top-btn:hover {
                    opacity: 1;
                    background-color: #007bff;
                }
                .custom-toggle-btn {
                    background-color: rgb(125, 111, 108);
                    color: white;
                    border: none;
                    margin: 0 5px;
                    padding: 5px 10px;
                    font-size: 0.8rem;
                    border-radius: 5px;
                }
                .custom-toggle-btn.active {
                    background-color: rgb(64, 53, 52);
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
                .product-card {
                    cursor: pointer;
                    transition: opacity 0.3s ease-in-out;
                }

                .product-card.inactive {
                    pointer-events: none; /* Disabilita l'interazione */
                    opacity: 0.5; /* Rende il prodotto opaco */
                }
                   /* Generale: Modalità chiara e scura */
.light-mode {
  background-color: #ffffff; /* Sfondo bianco */
  color: #000000; /* Testo nero */
}

.dark-mode {
  background-color: #212529; /* Sfondo scuro */
  color: #ffffff; /* Testo bianco */
}

/* Sezione dei dettagli del prodotto */
.product-details-section.light-mode {
  background-color: #ffffff; /* Sfondo bianco */
  color: #000000; /* Testo nero */
  border: 1px solid #ddd; /* Bordo grigio chiaro */
}

.product-details-section.dark-mode {
  background-color: #2c2c2c; /* Sfondo scuro */
  color: #ffffff; /* Testo bianco */
  border: 1px solid #555; /* Bordo grigio scuro */
}

/* Contenuto dei dettagli */
.details-content.light-mode {
  color: #000000; /* Testo nero */
}

.details-content.dark-mode {
  color: #ffffff; /* Testo bianco */
}


.similar-images img:hover {
  transform: scale(1.1);
  border-color: #007bff;
}

/* Pulsanti */
.btnCarrello {
  background-color: #212529; /* Sfondo nero */
  color: #ffffff; /* Testo bianco */
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  font-size: 1rem;
}

.btnCarrello:hover {
  background-color: #000000; /* Sfondo nero più scuro */
}

/* Titoli */
.product-details-section h3 {
  font-size: 1.8rem;
  font-weight: bold;
  margin-bottom: 15px;
}

.product-details-section p {
  font-size: 1rem;
  margin-bottom: 10px;
}

/* Pulsanti per il tema */
.theme-button {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.8rem;
  transition: transform 0.3s ease-in-out;
  color: inherit;
}

.theme-button:hover {
  transform: rotate(20deg);
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


export default ProductsPage;
