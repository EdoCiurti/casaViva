import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { Container, Button, Card, Row, Col, Form, Collapse } from "react-bootstrap";
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
import { FaCloudUploadAlt, FaMagic, FaChair } from "react-icons/fa";
import { analyzeImage, generateRecommendations as generateAIRecommendations } from '../services/imageAnalysisService';
import { generateRecommendations, findMatchingProducts, generateProductReason } from '../services/furnitureRecommendationService';

const VirtualRoomCreator = ({ theme, products, setFilteredProducts, scrollToProducts, handleProductRecommendationClick }) => {
  const [step, setStep] = useState(1); 
  const [uploadedImage, setUploadedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageElement, setImageElement] = useState(null);
  const [requirements, setRequirements] = useState("");
  const [furnitureType, setFurnitureType] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [analysisData, setAnalysisData] = useState({
    colorPalette: [],
    keyFeatures: [],
    roomStyle: "",
    styleDescription: ""
  });
  const [processingStage, setProcessingStage] = useState("");

  // Gestione upload immagine
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        
        // Crea un elemento immagine per l'analisi
        const img = new Image();
        img.src = reader.result;
        img.onload = () => {
          setImageElement(img);
        };
      };
      reader.readAsDataURL(file);
    }
  };

  // Gestione invio richiesta
  const handleSubmit = async () => {
    if (!uploadedImage || !furnitureType || !requirements) {
      toast.error("Completa tutti i campi prima di continuare", {
        position: "top-right",
        autoClose: 3000,
        theme: "colored",
      });
      return;
    }

    setIsLoading(true);
    setProcessingStage("Caricamento dell'immagine...");

    try {
      // Prepara i dati per l'invio
      const formData = new FormData();
      formData.append('image', uploadedImage);
      formData.append('furnitureType', furnitureType);
      formData.append('requirements', requirements);

      // Estrai esplicitamente colori e tipi dai requisiti dell'utente
      const userColorRequirements = extractKeywordsByCategory(requirements, 'colors');
      const userTypeRequirements = extractKeywordsByCategory(requirements, 'types');
      
      console.log("Requisiti colore rilevati:", userColorRequirements);
      console.log("Requisiti tipo rilevati:", userTypeRequirements);
      
      // Aggiungi questi parametri all'API call
      formData.append('explicitColors', JSON.stringify(userColorRequirements));
      formData.append('explicitTypes', JSON.stringify(userTypeRequirements));

      // Analisi dell'immagine lato client
      setProcessingStage("Analisi dei colori e dello stile della stanza...");
      
      // Verifica che l'elemento immagine sia pronto
      if (!imageElement || !imageElement.complete) {
        throw new Error("L'elemento immagine non è valido o non è ancora caricato completamente");
      }
      
      // Genera analisi e raccomandazioni reali basate sull'immagine
      const styleAnalysis = await generateRecommendations(
        imageElement,
        furnitureType,
        requirements
      );
      
      setProcessingStage("Ricerca dei prodotti più adatti...");
      
      // Ottieni prodotti dal server
      const response = await axios.post("http://localhost:5000/api/virtual-room/recommend", formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      // Aggiungi controlli di sicurezza
      const productList = response.data?.products || [];
      
      // Filtra i prodotti per rispettare i requisiti ESPLICITI dell'utente
      const matchingProducts = productList.filter(product => {
        const productText = `${product.name} ${product.description} ${product.color || ''}`
          .toLowerCase();
        
        // Se l'utente specifica un colore, quel colore DEVE essere presente
        if (userColorRequirements.length > 0) {
          const hasRequestedColor = userColorRequirements.some(color => 
            productText.includes(color.toLowerCase())
          );
          if (!hasRequestedColor) return false;
        }
        
        // Filtra per tipo di mobile richiesto
        if (!productText.includes(furnitureType.toLowerCase())) {
          return false;
        }
        
        return true;
      });
      
      console.log(`Trovati ${matchingProducts.length} prodotti che corrispondono esattamente ai requisiti`);
      
      // Genera raccomandazioni personalizzate per ogni prodotto
      const productRecommendations = productList.length > 0 
        ? productList.slice(0, 5).map(product => ({
            ...product,
            reason: generateProductReason(product, styleAnalysis, furnitureType),
            matchScore: product.compatibilityScore || 100
          }))
        : [];

      // Mostra i risultati
      setRecommendations(productRecommendations);
      setAnalysisData(styleAnalysis);
      setStep(3);

      toast.success("Suggerimenti generati con successo!", {
        position: "top-right",
        autoClose: 3000,
        theme: "colored",
      });
    } catch (error) {
      console.error("Errore durante l'elaborazione della richiesta:", error);
      toast.error("Errore durante l'elaborazione. Riprova più tardi.", {
        position: "top-right",
        autoClose: 3000,
        theme: "colored",
      });
      // In caso di errore, imposta un array vuoto
      setRecommendations([]);
    } finally {
      setIsLoading(false);
      setProcessingStage("");
    }
  };


  // Funzione per analizzare l'immagine
  const analyzeImage = async (image) => {
    try {
      const analysisResult = await generateAIRecommendations(image);
      return analysisResult;
    } catch (error) {
      console.error("Errore durante l'analisi dell'immagine:", error);
      throw error;
    }
  };
  
  // Funzione di utility per ottenere il nome del colore da un valore esadecimale
  function getColorName(hexColor) {
    // Mappa semplificata dei colori principali
    const colorMap = {
      '#FF0000': 'rosso',
      '#00FF00': 'verde',
      '#0000FF': 'blu',
      '#FFFF00': 'giallo',
      '#FF00FF': 'magenta',
      '#00FFFF': 'ciano',
      '#FFFFFF': 'bianco',
      '#000000': 'nero',
      '#808080': 'grigio',
      '#A52A2A': 'marrone',
      '#FFA500': 'arancione',
      '#800080': 'viola',
      '#FFB6C1': 'rosa',
      '#8B4513': 'marrone',
    };
    
    // Semplifica il colore arrotondando i valori RGB
    const simplifyColor = (hex) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      
      // Arrotonda al valore più vicino tra 0, 128, 255
      const roundTo = (value) => {
        if (value < 64) return 0;
        if (value < 192) return 128;
        return 255;
      };
      
      const rr = roundTo(r).toString(16).padStart(2, '0');
      const gg = roundTo(g).toString(16).padStart(2, '0');
      const bb = roundTo(b).toString(16).padStart(2, '0');
      
      return `#${rr}${gg}${bb}`.toUpperCase();
    };
    
    const simpleColor = simplifyColor(hexColor);
    
    // Trova il colore più vicino nella mappa
    if (colorMap[simpleColor]) {
      return colorMap[simpleColor];
    }
    
    // Colori di base
    if (simpleColor.slice(1, 3) === "FF") return "rosso";
    if (simpleColor.slice(3, 5) === "FF") return "verde";
    if (simpleColor.slice(5, 7) === "FF") return "blu";
    
    // Default
    return "neutro";
  }

  // Aggiungi questa funzione di utilità per determinare se usare testo nero o bianco in base al colore di sfondo
  function getContrastYIQ(hexcolor) {
    if (!hexcolor || typeof hexcolor !== 'string') return 'black';
    
    // Rimuovi # se presente
    hexcolor = hexcolor.replace('#', '');
    
    // Converti a RGB
    const r = parseInt(hexcolor.substr(0, 2), 16);
    const g = parseInt(hexcolor.substr(2, 2), 16);
    const b = parseInt(hexcolor.substr(4, 2), 16);
    
    // Calcola YIQ per determinare se il colore è chiaro o scuro
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    
    // Ritorna nero se il colore è chiaro, bianco se è scuro
    return (yiq >= 128) ? 'black' : 'white';
  }

  // Filtra i prodotti in base ai suggerimenti dell'IA
  const handleViewRecommendedProducts = () => {
    // Filtra i prodotti in base agli ID suggeriti dall'IA
    const recommendedProductIds = recommendations.map(rec => rec.productId);
    const filteredProducts = products.filter(product => recommendedProductIds.includes(product._id));
    
    // Aggiorna i prodotti filtrati
    setFilteredProducts(filteredProducts);
    
    // Scroll alla sezione dei prodotti
    scrollToProducts();
    
    // Reset del componente
    setStep(1);
    setUploadedImage(null);
    setImagePreview(null);
    setRequirements("");
    setFurnitureType("");
    setRecommendations([]);
  };

  const handleRecommendationClick = (productId) => {
    // Usa la funzione passata dal componente padre
    handleProductRecommendationClick(productId);
    
    // Reset del componente virtual room
    setStep(1);
    setUploadedImage(null);
    setImagePreview(null);
    setRequirements("");
    setFurnitureType("");
    setRecommendations([]);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="virtual-room-container"
      style={{
        backgroundColor: theme === "dark" ? "#2c2c2c" : "#f8f9fa",
        padding: "30px",
        borderRadius: "15px",
        boxShadow: "0px 5px 15px rgba(0,0,0,0.1)",
      }}
    >
      {/* Step Indicator */}
      <div className="step-indicator mb-4 d-flex justify-content-center">
        {[1, 2, 3].map((stepNumber) => (
          <div
            key={stepNumber}
            className="step-dot mx-2"
            style={{
              width: "30px",
              height: "30px",
              borderRadius: "50%",
              backgroundColor: step >= stepNumber
                ? theme === "dark" ? "#007bff" : "#0056b3"
                : theme === "dark" ? "#6c757d" : "#dee2e6",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              color: "#fff",
              fontWeight: "bold",
              transition: "all 0.3s ease",
            }}
          >
            {stepNumber}
          </div>
        ))}
      </div>

      {/* Step 1: Image Upload */}
      {step === 1 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <FaCloudUploadAlt size={50} color={theme === "dark" ? "#007bff" : "#0056b3"} className="mb-3" />
          <h4 style={{ color: theme === "dark" ? "#fff" : "#000" }}>Carica una foto della tua stanza</h4>
          <p style={{ color: theme === "dark" ? "#adb5bd" : "#6c757d" }}>
            Carica un'immagine della stanza che desideri arredare
          </p>
          
          <div 
            className="upload-area mt-3 mb-4 mx-auto"
            style={{
              border: `2px dashed ${theme === "dark" ? "#6c757d" : "#adb5bd"}`,
              borderRadius: "10px",
              padding: "40px 20px",
              cursor: "pointer",
              maxWidth: "500px",
              position: "relative",
            }}
            onClick={() => document.getElementById("room-image-upload").click()}
          >
            <input
              type="file"
              id="room-image-upload"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleImageUpload}
            />
            
            {imagePreview ? (
              <div className="position-relative">
                <img
                  src={imagePreview}
                  alt="Room preview"
                  style={{
                    maxWidth: "100%",
                    maxHeight: "300px",
                    borderRadius: "8px"
                  }}
                />
                <div 
                  className="image-overlay"
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "rgba(0,0,0,0.4)",
                    borderRadius: "8px",
                    opacity: 0,
                    transition: "opacity 0.3s ease",
                    color: "#fff",
                  }}
                  onMouseEnter={(e) => e.target.style.opacity = 1}
                  onMouseLeave={(e) => e.target.style.opacity = 0}
                >
                  Clicca per cambiare immagine
                </div>
              </div>
            ) : (
              <div>
                <FaCloudUploadAlt size={50} color={theme === "dark" ? "#6c757d" : "#adb5bd"} />
                <p className="mt-2 mb-0">Clicca per selezionare un'immagine o trascina qui</p>
              </div>
            )}
          </div>
          
          <Button
            variant={theme === "dark" ? "light" : "dark"}
            size="lg"
            disabled={!imagePreview}
            onClick={() => setStep(2)}
            className="mt-3"
          >
            Continua
          </Button>
        </motion.div>
      )}

      {/* Step 2: User Requirements */}
      {step === 2 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="row">
            <div className="col-md-6">
              <img
                src={imagePreview}
                alt="Your room"
                style={{
                  width: "100%",
                  borderRadius: "10px",
                  boxShadow: "0px 5px 15px rgba(0,0,0,0.2)",
                }}
              />
            </div>
            <div className="col-md-6">
              <h4 style={{ color: theme === "dark" ? "#fff" : "#000" }}>Cosa desideri modificare?</h4>
              
              <Form.Group className="mb-3">
                <Form.Label style={{ color: theme === "dark" ? "#fff" : "#000" }}>
                  Tipo di arredamento
                </Form.Label>
                <Form.Select
                  value={furnitureType}
                  onChange={(e) => setFurnitureType(e.target.value)}
                  style={{
                    backgroundColor: theme === "dark" ? "#212529" : "#fff",
                    color: theme === "dark" ? "#fff" : "#000",
                    border: `1px solid ${theme === "dark" ? "#495057" : "#ced4da"}`,
                  }}
                >
                  <option value="">Seleziona il tipo di arredamento</option>
                  <option value="divano">Divano</option>
                  <option value="tavolo">Tavolo</option>
                  <option value="sedia">Sedia</option>
                  <option value="letto">Letto</option>
                  <option value="armadio">Armadio</option>
                  <option value="libreria">Libreria</option>
                  <option value="mobile-tv">Mobile TV</option>
                  <option value="lampada">Lampada</option>
                </Form.Select>
              </Form.Group>
              
              <Form.Group className="mb-4">
                <Form.Label style={{ color: theme === "dark" ? "#fff" : "#000" }}>
                  Descrivi cosa cerchi
                </Form.Label>
                <Form.Control
                  as="textarea"
                  rows={4}
                  placeholder="Es. Cerco un divano moderno che si abbini ai colori della mia stanza, preferibilmente in tonalità chiare..."
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                  style={{
                    backgroundColor: theme === "dark" ? "#212529" : "#fff",
                    color: theme === "dark" ? "#fff" : "#000",
                    border: `1px solid ${theme === "dark" ? "#495057" : "#ced4da"}`,
                  }}
                />
              </Form.Group>
              
              <div className="d-flex justify-content-between">
                <Button
                  variant="outline-secondary"
                  onClick={() => setStep(1)}
                  disabled={isLoading}
                >
                  Indietro
                </Button>
                <Button
                  variant={theme === "dark" ? "light" : "dark"}
                  onClick={handleSubmit}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      {processingStage}
                    </>
                  ) : (
                    <>
                      <FaMagic className="me-2" /> Genera suggerimenti
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
          
          {/* Mostra le fasi di elaborazione quando è in caricamento */}
          {isLoading && (
            <div className="mt-4 text-center" style={{ color: theme === "dark" ? "#adb5bd" : "#6c757d" }}>
              <div className="progress mb-2" style={{ height: "5px" }}>
                <div
                  className="progress-bar progress-bar-striped progress-bar-animated"
                  role="progressbar"
                  style={{ width: "100%" }}
                ></div>
              </div>
              <p>{processingStage}</p>
              <p className="small">L'analisi dell'immagine viene eseguita direttamente nel tuo browser</p>
            </div>
          )}
        </motion.div>
      )}

      {/* Step 3: Results */}
      {step === 3 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h4 className="text-center mb-4" style={{ color: theme === "dark" ? "#fff" : "#000" }}>
            Ecco i nostri suggerimenti per la tua stanza
          </h4>
          
          <Row>
            <Col md={5}>
              <div className="position-relative">
                <img
                  src={imagePreview}
                  alt="Your room"
                  style={{
                    width: "100%",
                    borderRadius: "10px",
                    boxShadow: "0px 5px 15px rgba(0,0,0,0.2)",
                  }}
                />
                {/* AI visualization overlay - simplified version */}
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    borderRadius: "10px",
                    background: "linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.2))",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      padding: "10px 15px",
                      backgroundColor: "rgba(0,123,255,0.8)",
                      borderRadius: "50px",
                      color: "#fff",
                      fontWeight: "bold",
                    }}
                  >
                    <FaMagic className="me-2" /> IA ha analizzato questa stanza
                  </div>
                </div>
              </div>
            </Col>
            <Col md={7}>
              {/* Aggiungi sezione di analisi IA */}
              {/* Migliora la sezione di analisi IA con grafica più professionale */}
              {analysisData && (
                <Card className="mb-4 analysis-card" style={{
                  backgroundColor: theme === "dark" ? "#343a40" : "#fff",
                  color: theme === "dark" ? "#fff" : "#000",
                  borderColor: theme === "dark" ? "#495057" : "#dee2e6",
                  borderRadius: "12px",
                  overflow: "hidden"
                }}>
                  <Card.Header style={{
                    backgroundColor: theme === "dark" ? "#212529" : "#f8f9fa",
                    borderBottom: `1px solid ${theme === "dark" ? "#495057" : "#dee2e6"}`,
                    padding: "1rem 1.25rem"
                  }}>
                    <div className="d-flex align-items-center">
                      <div style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "50%",
                        backgroundColor: theme === "dark" ? "#007bff" : "#0056b3",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: "12px"
                      }}>
                        <FaMagic color="#fff" size={20} />
                      </div>
                      <h5 style={{ 
                        margin: 0, 
                        color: theme === "dark" ? "#fff" : "#000",
                        fontWeight: 600
                      }}>
                        Analisi IA della tua stanza
                      </h5>
                    </div>
                  </Card.Header>
                  
                  <Card.Body style={{ padding: "1.5rem" }}>
                    <div className="mb-4">
                      <div className="d-flex align-items-center mb-2">
                        <div style={{ 
                          width: "16px", 
                          height: "16px", 
                          backgroundColor: theme === "dark" ? "#007bff" : "#0056b3",
                          borderRadius: "50%",
                          marginRight: "10px"
                        }}></div>
                        <strong>Stile rilevato:</strong>
                      </div>
                      <div className="ms-4 ps-2" style={{
                        borderLeft: `2px solid ${theme === "dark" ? "#495057" : "#dee2e6"}`,
                        padding: "0.5rem 0"
                      }}>
                        <span style={{
                          fontSize: "1.1rem",
                          fontWeight: 500,
                          color: theme === "dark" ? "#e9ecef" : "#212529",
                          textTransform: "capitalize"
                        }}>{analysisData.roomStyle}</span>
                        <p style={{ 
                          margin: "0.5rem 0 0 0", 
                          color: theme === "dark" ? "#adb5bd" : "#6c757d",
                          fontSize: "0.9rem"
                        }}>
                          {analysisData.styleDescription || "Lo stile della tua stanza è stato analizzato in base alle caratteristiche dell'immagine."}
                        </p>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <div className="d-flex align-items-center mb-2">
                        <div style={{ 
                          width: "16px", 
                          height: "16px", 
                          backgroundColor: theme === "dark" ? "#007bff" : "#0056b3",
                          borderRadius: "50%",
                          marginRight: "10px"
                        }}></div>
                        <strong>Palette di colori consigliata:</strong>
                      </div>
                      <div className="ms-4 ps-2" style={{
                        borderLeft: `2px solid ${theme === "dark" ? "#495057" : "#dee2e6"}`,
                        padding: "0.5rem 0"
                      }}>
                        <div className="d-flex mt-2">
                          {analysisData.colorPalette && analysisData.colorPalette.map((color, idx) => (
                            <div key={idx} className="me-2" style={{
                              width: "40px",
                              height: "40px",
                              backgroundColor: color,
                              border: theme === "dark" ? "1px solid #495057" : "1px solid #dee2e6",
                              borderRadius: "8px",
                              position: "relative",
                              boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              overflow: "hidden"
                            }} title={color}>
                              <div style={{
                                position: "absolute",
                                bottom: "2px",
                                fontSize: "8px",
                                color: getContrastYIQ(color) === 'black' ? "#000" : "#fff",
                                textShadow: "0 0 2px rgba(0,0,0,0.4)"
                              }}>{color}</div>
                            </div>
                          ))}
                        </div>
                        <p style={{ 
                          margin: "0.75rem 0 0 0", 
                          color: theme === "dark" ? "#adb5bd" : "#6c757d",
                          fontSize: "0.9rem" 
                        }}>
                          Questi colori sono stati selezionati per armonizzarsi con il tuo ambiente.
                        </p>
                      </div>
                    </div>
                    
                    <div>
                      <div className="d-flex align-items-center mb-2">
                        <div style={{ 
                          width: "16px", 
                          height: "16px", 
                          backgroundColor: theme === "dark" ? "#007bff" : "#0056b3",
                          borderRadius: "50%",
                          marginRight: "10px"
                        }}></div>
                        <strong>Consigli per l'arredamento:</strong>
                      </div>
                      <div className="ms-4 ps-2" style={{
                        borderLeft: `2px solid ${theme === "dark" ? "#495057" : "#dee2e6"}`,
                        padding: "0.5rem 0"
                      }}>
                        <ul className="mt-2 advice-list" style={{ 
                          paddingLeft: "1.25rem" 
                        }}>
                          {analysisData.keyFeatures && analysisData.keyFeatures.map((tip, idx) => (
                            <li key={idx} style={{ 
                              marginBottom: "0.5rem",
                              color: theme === "dark" ? "#e9ecef" : "#212529"
                            }}>{tip}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              )}
              
              <h5 style={{ color: theme === "dark" ? "#fff" : "#000", marginBottom: "20px", fontWeight: "600" }}>
  Prodotti consigliati per la tua stanza:
</h5>

<div className="recommendations-grid">
  {recommendations && recommendations.length > 0 ? (
    <Row className="g-3">
      {recommendations.map((recommendation, index) => (
        <Col lg={6} key={index}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <Card 
              className="recommendation-card h-100" 
              style={{
                backgroundColor: theme === "dark" ? "#343a40" : "#fff",
                color: theme === "dark" ? "#fff" : "#000",
                borderColor: theme === "dark" ? "#495057" : "#dee2e6",
                borderRadius: "12px",
                overflow: "hidden",
                cursor: "pointer",
                transition: "all 0.3s ease",
                border: "none",
                boxShadow: "0 5px 15px rgba(0,0,0,0.1)"
              }}
              onClick={() => handleProductRecommendationClick(recommendation.productId)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-5px)";
                e.currentTarget.style.boxShadow = "0 10px 20px rgba(0,0,0,0.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "none";
                e.currentTarget.style.boxShadow = "0 5px 15px rgba(0,0,0,0.1)";
              }}
            >
              <div className="d-flex h-100">
                <div 
                  className="recommendation-image"
                  style={{
                    width: "40%",
                    position: "relative",
                    overflow: "hidden"
                  }}
                >
                  <img
                    src={recommendation.productImage}
                    alt={recommendation.productName}
                    style={{ 
                      width: "100%",
                      height: "100%", 
                      objectFit: "cover",
                      transition: "transform 0.5s ease"
                    }}
                    className="recommendation-image"
                  />
                  <div 
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: "linear-gradient(to right, rgba(0,0,0,0.1), transparent)"
                    }}
                  ></div>
                </div>
                
                <Card.Body 
                  style={{ 
                    padding: "1.25rem",
                    width: "60%"
                  }}
                >
                  <div className="d-flex flex-column justify-content-between h-100">
                    <div>
                      <h5 
                        style={{ 
                          color: theme === "dark" ? "#fff" : "#000",
                          marginBottom: "0.75rem",
                          fontSize: "1rem",
                          fontWeight: "600",
                          borderBottom: `2px solid ${theme === "dark" ? "#007bff" : "#0056b3"}`,
                          paddingBottom: "0.5rem",
                          display: "inline-block"
                        }}
                      >
                        {recommendation.productName}
                      </h5>
                      
                      <div 
                        style={{ 
                          fontSize: "0.85rem",
                          color: theme === "dark" ? "#adb5bd" : "#6c757d",
                          marginBottom: "0.75rem",
                          maxHeight: "60px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          display: "-webkit-box",
                          WebkitLineClamp: "3",
                          WebkitBoxOrient: "vertical"
                        }}
                      >
                        {recommendation.reason}
                      </div>
                    </div>
                    
                    <div className="d-flex justify-content-between align-items-center">
                      <span
                        style={{ 
                          fontWeight: "bold", 
                          color: theme === "dark" ? "#007bff" : "#0056b3",
                          fontSize: "1.1rem"
                        }}
                      >
                        €{recommendation.price}
                      </span>
                      <div 
                        className="view-details" 
                        style={{
                          fontSize: "0.8rem",
                          color: theme === "dark" ? "#adb5bd" : "#6c757d",
                          textDecoration: "underline",
                          cursor: "pointer"
                        }}
                      >
                        Vedi dettagli ›
                      </div>
                    </div>
                  </div>
                </Card.Body>
              </div>
            </Card>
          </motion.div>
        </Col>
      ))}
    </Row>
  ) : (
    <div className="text-center p-4" style={{ backgroundColor: theme === "dark" ? "#343a40" : "#f8f9fa", borderRadius: "12px", padding: "30px" }}>
      <FaSearch size={48} color={theme === "dark" ? "#495057" : "#dee2e6"} className="mb-3" />
      <p style={{
        color: theme === "dark" ? "#adb5bd" : "#6c757d",
        fontSize: "1.1rem",
        fontWeight: "500"
      }}>Nessun prodotto consigliato disponibile.</p>
      <p style={{
        color: theme === "dark" ? "#adb5bd" : "#6c757d",
        fontSize: "0.9rem"
      }}>Prova a modificare i requisiti o a caricare un'immagine diversa della stanza.</p>
    </div>
  )}
</div>
              
              <div className="d-flex justify-content-between mt-4">
                <Button
                  variant="outline-secondary"
                  onClick={() => setStep(2)}
                >
                  Indietro
                </Button>
                <Button
                  variant={theme === "dark" ? "light" : "dark"}
                  onClick={handleViewRecommendedProducts}
                >
                  <FaChair className="me-2" /> Visualizza i prodotti consigliati
                </Button>
              </div>
            </Col>
          </Row>
        </motion.div>
      )}
    </motion.div>
  );
};

// Funzione per estrarre parole chiave dai requisiti utente
function extractKeywordsByCategory(text, category) {
  if (!text) return [];
  
  const lowerText = text.toLowerCase();
  let keywords = [];
  
  if (category === 'colors') {
    const colors = [
      'rosso', 'rossa', 'rossi', 'rosse',
      'nero', 'nera', 'neri', 'nere',
      'bianco', 'bianca', 'bianchi', 'bianche',
      'blu', 'azzurro',
      'verde', 'verdi',
      'giallo', 'gialla', 'gialli',
      'grigio', 'grigia', 'grigi',
      'marrone', 'marroni',
      'viola'
    ];
    
    colors.forEach(color => {
      if (lowerText.includes(color)) {
        // Prendi la forma base del colore (es. da "rossa" a "rosso")
        const baseColor = color.replace(/(a|e|i|o)$/, '');
        if (!keywords.includes(baseColor)) {
          keywords.push(baseColor);
        }
      }
    });
  }
  
  return keywords;
}

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
  const [showFilters, setShowFilters] = useState(true); // Inizia con i filtri aperti
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
  const [sectionsVisibility, setSectionsVisibility] = useState({
    virtualRoom: true,
    products: true
  });

  const productsSectionRef = useRef(null);
  const productRefs = useRef([]); // Array di riferimenti per i prodotti
  const filtersContainerRef = useRef(null); // Aggiungi un ref alla sezione dei filtri
  const location = useLocation();
  const virtualRoomSectionRef = useRef(null);

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
      filtered = filtered.sort((b, a) => a.price - b.price);
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

  // Migliora la funzione di scorrimento delle categorie
const handleCategoryScroll = (direction) => {
  const increment = 3; // Numero di categorie da scorrere
  const maxIndex = Math.max(categories.length - 3, 0);
  
  if (direction === "left") {
    setCurrentCategoryIndex(prev => Math.max(prev - increment, 0));
  } else {
    setCurrentCategoryIndex(prev => Math.min(prev + increment, maxIndex));
  }
  
  // Anima lo scorrimento
  const container = document.querySelector(".categories-container");
  if (container) {
    container.style.transition = "transform 0.5s ease";
  }
};

  // Migliora la navigazione tra le sezioni aggiungendo un offset per evitare problemi con navbar fisse o altri elementi
const scrollToSection = (ref) => {
  if (ref && ref.current) {
    const yOffset = -80; // Offset per dare spazio in alto (utile se hai una navbar fissa)
    const y = ref.current.getBoundingClientRect().top + window.pageYOffset + yOffset;
    window.scrollTo({top: y, behavior: 'smooth'});
  }
};

// Poi sostituisci le chiamate a scrollToProducts e scrollToVirtualRoom con
const scrollToProducts = () => {
  scrollToSection(productsSectionRef);
};

const scrollToVirtualRoom = () => {
  scrollToSection(virtualRoomSectionRef);
};

  const loadMoreProducts = () => {
    setVisibleProducts((prev) => prev + 9);
  };

  const handleProductClick = useCallback((product, index) => {
    setSelectedProduct(product);
    setMainImage(product.images[0]);
    setHighlightedProductId(product._id);
    
    // Salva la posizione di scroll corrente per tornare qui dopo
    const scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
    localStorage.setItem("lastScrollPosition", scrollPosition);
    
    setSectionsVisibility(prev => ({...prev, virtualRoom: false}));
    localStorage.setItem("selectedProduct", JSON.stringify(product));
    
    // Aspetta che il DOM sia aggiornato con il componente dei dettagli
    setTimeout(() => {
      const detailsSection = document.querySelector(".led-effect");
      if (detailsSection) {
        // Scorri con precisione all'inizio della sezione dettagli
        const topPosition = detailsSection.getBoundingClientRect().top + window.pageYOffset;
        window.scrollTo({
          top: topPosition - 20, // Un piccolo offset per non essere troppo in cima
          behavior: "smooth"
        });
      }
    }, 200); // Aumentato il timeout per garantire che il DOM sia aggiornato
  }, []);

  const handleCloseDetails = () => {
    setSelectedProduct(null);
    setSectionsVisibility({virtualRoom: true, products: true});
    
    // Dopo che il componente è stato rimosso, scorri alla sezione prodotti
    setTimeout(() => {
      // Recupera l'ultima posizione di scroll o vai alla sezione prodotti
      const lastPosition = localStorage.getItem("lastScrollPosition");
      
      if (lastPosition) {
        window.scrollTo({
          top: parseInt(lastPosition, 10),
          behavior: "smooth"
        });
        localStorage.removeItem("lastScrollPosition");
      } else {
        // Fallback alla sezione prodotti
        if (productsSectionRef.current) {
          productsSectionRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    }, 100);
  };

  useEffect(() => {
    // Forza lo scroll all'inizio della pagina quando il componente viene montato
    window.scrollTo(0, 0);
    
    // Disattiva temporaneamente il ripristino della posizione di scroll del browser
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
    
    return () => {
      // Ripristina il comportamento predefinito quando il componente viene smontato
      if ('scrollRestoration' in history) {
        history.scrollRestoration = 'auto';
      }
    };
  }, []);

  useEffect(() => {
    if (selectedProduct === null) {
      // Rimuovi il setTimeout e la logica di scrolling automatico
      // Lascia che l'utente rimanga nella posizione attuale
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

  // Aggiungi questa funzione nel componente principale HomePage

const handleAIRecommendationClick = (productId) => {
  // Trova il prodotto completo utilizzando l'ID
  const recommendedProduct = products.find(product => product._id === productId);
  if (recommendedProduct) {
    // Chiudi la sezione AI e apri i dettagli del prodotto
    setSelectedProduct(recommendedProduct);
    setMainImage(recommendedProduct.images[0]);
    setHighlightedProductId(recommendedProduct._id);
    setSectionsVisibility(prev => ({...prev, virtualRoom: false}));
    
    // Aspetta che il componente dei dettagli sia renderizzato
    setTimeout(() => {
      // Scorri alla sezione dei dettagli del prodotto
      const detailsSection = document.querySelector(".led-effect");
      if (detailsSection) {
        detailsSection.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);
  } else {
    toast.error("Prodotto non trovato", {
      position: "top-right",
      autoClose: 3000,
      theme: "colored",
    });
  }
};

const filteredProductsMemo = useMemo(() => {
  let filtered = products.filter(product => {
    const matchesName = filters.name
      ? product.name?.toLowerCase().includes(filters.name.toLowerCase())
      : true;
    // Aggiungi queste definizioni mancanti
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

  return filtered;
}, [filters, products, sortOrder]);

  return (

    <div className={theme === "dark" ? "dark-mode" : "light-mode"} style={{ backgroundColor: theme === "dark" ? "#212529" : "#fff", color: theme === "dark" ? "#fff" : "#000" }}>
      {/* Hero Section - sempre visibile */}
      <div
        style={{
          boxShadow: "0px 15px 25px rgba(0,0,0,0.15)",
          backgroundColor: theme === "dark" ? "#1a1d20" : "#f8f9fa",
          color: theme === "dark" ? "#fff" : "#000",
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          width: "100%",
          backgroundImage: theme === "dark" 
            ? "linear-gradient(135deg, rgba(30,32,35,0.95) 0%, rgba(50,52,55,0.95) 100%)"
            : "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(245,245,245,0.95) 100%)",
          backgroundSize: "cover",
          position: "relative",
          overflow: "hidden"
        }}
      >
        {/* Aggiungi elementi decorativi in background */}
        <div style={{
          position: "absolute",
          width: "200px",
          height: "200px",
          borderRadius: "50%",
          backgroundColor: theme === "dark" ? "rgba(0,123,255,0.05)" : "rgba(0,123,255,0.03)",
          top: "20%",
          right: "10%",
          zIndex: 0
        }}></div>
        <div style={{
          position: "absolute",
          width: "300px",
          height: "300px",
          borderRadius: "50%",
          backgroundColor: theme === "dark" ? "rgba(0,123,255,0.03)" : "rgba(0,123,255,0.02)",
          bottom: "15%",
          left: "5%",
          zIndex: 0
        }}></div>
        
        {/* Contenuto esistente della hero section... */}
        <motion.h1
          className="display-3"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          style={{
            fontWeight: "700",
            letterSpacing: "-1px",
            textAlign: "center",
            marginBottom: "1rem",
            position: "relative",
            zIndex: 1
          }}
        >
          Benvenuto nel nostro <span style={{color: "#007bff"}}>E-commerce</span>
        </motion.h1>
        
        {/* Resto del contenuto esistente... */}
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
            className="mt-3 me-3"
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
          <Button
            variant="outline-light"
            size="lg"
            className="mt-3"
            onClick={scrollToVirtualRoom}
            style={{
              transition: "transform 0.3s ease",
            }}
            onMouseEnter={(e) => (e.target.style.transform = "scale(1.1)")}
            onMouseLeave={(e) => (e.target.style.transform = "scale(1)")}
          >
            <FaMagic className="me-2" /> Crea la tua stanza virtuale
          </Button>
        </motion.div>
      </div>


      {/* Virtual Room Creator Section */}
      {(!selectedProduct || sectionsVisibility.virtualRoom) && (
      <div ref={virtualRoomSectionRef} style={{
        backgroundColor: theme === "dark" ? "#212529" : "#fff",
        color: theme === "dark" ? "#fff" : "#000",
        padding: "40px 0",
        boxShadow: "0px 10px 20px rgba(0,0,0,0.1)",
        marginBottom: "40px"
      }}>
        <Container>
          <motion.h2
            className="text-center mb-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            style={{
              color: theme === "dark" ? "#fff" : "#000",
              fontWeight: "bold",
            }}
          >
            Crea la tua stanza virtuale
          </motion.h2>
          <VirtualRoomCreator 
            theme={theme} 
            products={products} 
            setFilteredProducts={setFilteredProducts} 
            scrollToProducts={scrollToProducts} 
            handleProductRecommendationClick={handleAIRecommendationClick}  // Aggiungi questa prop
          />
        </Container>
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
<p className="mb-3" style={{ color: theme === "dark" ? "#adb5bd" : "#6c757d" }}>
  {selectedProduct.description}
</p>
                  <p style={{ fontSize: "1.5rem", fontWeight: "bold", color: theme === "dark" ? "#007bff" : "#0056b3" }}>
                    €{selectedProduct.price}
                  </p>
                  
                  {/* Sezione per QR code dei modelli 3D */}
                  {(selectedProduct.link3Dios || selectedProduct.link3Dandroid) && (
                    <div className="mt-4 mb-2">
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
                        <div className="categories-container d-flex justify-content-center">
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
                                  display: "flex",
                                  flexDirection: "column",
                                }}
                                onClick={() => handleCategoryClick(category)}
                              >
                                <div style={{position: "relative", height: "100%", width: "100%"}}>
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
                                  <div 
                                    className="category-title" 
                                    style={{
                                      position: "absolute",
                                      bottom: 0,
                                      left: 80,
                                      right: 0,
                                     
                                      color: "white",
                                      padding: "10px 5px",
                                      textAlign: "center",    // Questo è già corretto
                                      fontSize: "13px",
                                      fontWeight: "600",
                                      width: "100%",          // Questo è già corretto
                                      textTransform: "capitalize",
                                      letterSpacing: "0.5px",
                                      textShadow: "0 1px 2px rgba(0,0,0,0.8)",
                                      display: "flex",        // Aggiungi questo
                                      justifyContent: "center", // Aggiungi questo
                                      alignItems: "center"    // Aggiungi questo
                                    }}
                                  >
                                    {category.replace(/-/g, ' ')}
                                  </div>
                                </div>
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
              {filteredProductsMemo.slice(0, visibleProducts).map((product, index) => (
                <Col
                  key={product._id}
                  md={4}
                  className={`mb-4 ${highlightedProductId === product._id ? "highlighted-product" : ""}`}
                  ref={productRefs.current[index]}
                >
                  <Card
                    className="product-card h-100"
                    style={{
                      borderRadius: "12px",
                      overflow: "hidden",
                      cursor: "pointer",
                      border: highlightedProductId === product._id
                        ? `3px solid ${theme === "dark" ? "#007bff" : "#0056b3"}`
                        : "none",
                      transition: "transform 0.3s ease, box-shadow 0.3s ease",
                      transform: highlightedProductId === product._id ? "translateY(-5px)" : "none",
                      boxShadow: highlightedProductId === product._id
                        ? "0 15px 30px rgba(0,0,0,0.2)"
                        : "0 5px 15px rgba(0,0,0,0.1)",
                      backgroundColor: theme === "dark" ? "#2c2c2c" : "#fff",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-5px)";
                      e.currentTarget.style.boxShadow = "0 10px 25px rgba(0,0,0,0.2)";
                    }}
                    onMouseLeave={(e) => {
                      if (highlightedProductId !== product._id) {
                        e.currentTarget.style.transform = "none";
                        e.currentTarget.style.boxShadow = "0 5px 15px rgba(0,0,0,0.1)";
                      }
                    }}
                    onClick={() => handleProductClick(product, index)}
                  >
                    {/* Badge "Nuovo" per prodotti aggiunti recentemente */}
                    {product.createdAt && (new Date() - new Date(product.createdAt)) / (1000*60*60*24) < 30 && (
                      <div style={{
                        position: "absolute",
                        top: "10px",
                        right: "10px",
                        backgroundColor: "#007bff",
                        color: "white",
                        padding: "5px 10px",
                        borderRadius: "20px",
                        fontSize: "0.8rem",
                        zIndex: 2,
                        fontWeight: "bold"
                      }}>Nuovo</div>
                    )}
                    
                    <div style={{ overflow: "hidden", position: "relative" }}>
                      <Card.Img
                        variant="top"
                        src={product.images[0]}
                        alt={product.name}
                        style={{ 
                          height: "250px", 
                          objectFit: "cover",
                          transition: "transform 0.5s ease"
                        }}
                        className="product-image"
                      />
                    </div>
                    
                    <Card.Body style={{ 
                      padding: "1.25rem",
                      backgroundColor: theme === "dark" ? "#2c2c2c" : "#fff",
                      color: theme === "dark" ? "#fff" : "#000"
                    }}>
                      <Card.Title style={{ 
                        fontSize: "1.1rem", 
                        fontWeight: "600",
                        marginBottom: "0.75rem", 
                        height: "40px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "-webkit-box",
                        WebkitLineClamp: "2",
                        WebkitBoxOrient: "vertical"
                      }}>{product.name}</Card.Title>
                      
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <Card.Text style={{ 
                          fontSize: "1.25rem", 
                          fontWeight: "700", 
                          color: theme === "dark" ? "#007bff" : "#0056b3",
                          margin: 0
                        }}>€{product.price}</Card.Text>
                        
                        {product.category && (
                          <span style={{
                            fontSize: "0.8rem",
                            color: theme === "dark" ? "#adb5bd" : "#6c757d",
                            backgroundColor: theme === "dark" ? "#343a40" : "#e9ecef",
                            padding: "3px 8px",
                            borderRadius: "20px"
                          }}>{product.category}</span>
                        )}
                      </div>
                      
                      <div className="d-flex justify-content-between align-items-center mt-3">
                        <Button
                          variant={theme === "dark" ? "outline-light" : "outline-dark"}
                          className="add-to-cart-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            addToCart(product._id);
                          }}
                          style={{
                            borderRadius: "20px",
                            fontSize: "0.9rem",
                            padding: "0.375rem 0.75rem",
                            transition: "all 0.2s ease"
                          }}
                        >
                          Aggiungi al carrello
                        </Button>
                        
                        <FaHeart
                          size={22}
                          color={wishlist.includes(product._id) ? "#dc3545" : theme === "dark" ? "#6c757d" : "#adb5bd"}
                          style={{ 
                            cursor: "pointer",
                            transition: "transform 0.2s ease, color 0.2s ease"
                          }}
                          className="wishlist-icon"
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

