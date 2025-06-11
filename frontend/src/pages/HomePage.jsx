import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { Container, Button, Card, Row, Col, Form, Collapse } from "react-bootstrap";
import { FaHeart, FaFilter, FaArrowLeft, FaArrowRight, FaSearch } from "react-icons/fa";
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
  const [step, setStep] = useState(1);   const [uploadedImage, setUploadedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageElement, setImageElement] = useState(null);
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
    if (!uploadedImage || !furnitureType) {
      toast.error("Completa tutti i campi prima di continuare", {
        position: "top-right",
        autoClose: 3000,
        theme: "colored",
      });
      return;
    }

    setIsLoading(true);
    setProcessingStage("Caricamento dell'immagine...");

    try {      // Prepara i dati per l'invio
      const formData = new FormData();
      formData.append('image', uploadedImage);
      formData.append('furnitureType', furnitureType);
      formData.append('requirements', ''); // Empty requirements since we now rely on color detection      // Since requirements field is removed, we don't extract explicit color requirements from user text
      // The system now relies entirely on color detection from the image
      const userColorRequirements = [];
      const userTypeRequirements = [];
      
      console.log("Requisiti colore rilevati:", userColorRequirements);
      console.log("Requisiti tipo rilevati:", userTypeRequirements);
      
      // Aggiungi questi parametri all'API call
      formData.append('explicitColors', JSON.stringify(userColorRequirements));
      formData.append('explicitTypes', JSON.stringify(userTypeRequirements));      // Analisi dell'immagine lato client
      setProcessingStage("Analisi dei colori e dello stile della stanza...");
      
      // Verifica che l'elemento immagine sia pronto
      if (!imageElement || !imageElement.complete) {
        throw new Error("L'elemento immagine non è valido o non è ancora caricato completamente");
      }
      
      // Estrai i colori dominanti dall'immagine
      const detectedColors = extractColorsFromImage(imageElement);
      console.log("Colori rilevati dall'immagine:", detectedColors);
      
      // Aggiungi i colori rilevati ai dati del form
      formData.append('detectedColors', JSON.stringify(detectedColors.map(color => color.hex)));
      
      setProcessingStage("Ricerca dei prodotti più adatti...");
      
      // Ottieni prodotti dal server
      const response = await axios.post("http://localhost:5000/api/virtual-room/recommend", formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
        // Aggiungi controlli di sicurezza e gestisci la risposta del backend
      const productList = response.data?.products || [];
      const backendMessage = response.data?.message || null;
      
      console.log(`Ricevuti ${productList.length} prodotti dal backend`);
      
      // Se il backend ha restituito un messaggio (es. "no products available")
      if (backendMessage && productList.length === 0) {
        console.log("Messaggio dal backend:", backendMessage);
        
        // Mostra i risultati dell'analisi ma senza prodotti
        setRecommendations([]);
        setAnalysisData({
          colorPalette: detectedColors.map(color => color.hex),
          detectedColors: detectedColors,
          keyFeatures: [],
          roomStyle: "Analisi basata sui colori",
          styleDescription: `Colori dominanti rilevati: ${detectedColors.slice(0, 3).map(c => c.name).join(', ')}`,
          noProductsMessage: backendMessage // Aggiungi il messaggio del backend
        });
        setStep(3);

        // Mostra un toast informativo invece di successo
        toast.info(backendMessage, {
          position: "top-right",
          autoClose: 5000,
          theme: "colored",
        });
        
        return; // Esce dalla funzione
      }
      
      // Filtra i prodotti per rispettare i requisiti ESPLICITI dell'utente (filtro aggiuntivo frontend)
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
      
      console.log(`Dopo filtro frontend: ${matchingProducts.length} prodotti che corrispondono esattamente ai requisiti`);
      
      // Genera raccomandazioni personalizzate per ogni prodotto usando i colori rilevati
      const productRecommendations = matchingProducts.length > 0 
        ? matchingProducts.slice(0, 5).map(product => ({
            ...product,
            reason: generateProductReason(product, { detectedColors }, furnitureType),
            matchScore: product.compatibilityScore || 100
          }))
        : [];

      // Mostra i risultati
      setRecommendations(productRecommendations);
      setAnalysisData({
        colorPalette: detectedColors.map(color => color.hex),
        detectedColors: detectedColors,
        keyFeatures: [],
        roomStyle: "Analisi basata sui colori",
        styleDescription: `Colori dominanti rilevati: ${detectedColors.slice(0, 3).map(c => c.name).join(', ')}`
      });
      setStep(3);

      // Toast di successo solo se ci sono prodotti
      if (productRecommendations.length > 0) {
        toast.success(`Trovati ${productRecommendations.length} prodotti perfetti per la tua stanza!`, {
          position: "top-right",
          autoClose: 3000,
          theme: "colored",
        });
      } else {
        toast.warning("Analisi completata, ma nessun prodotto corrisponde perfettamente ai tuoi criteri specifici.", {
          position: "top-right",
          autoClose: 5000,
          theme: "colored",
        });
      }
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
  // Funzione per estrarre i colori dominanti dall'immagine con algoritmo migliorato
  const extractColorsFromImage = (imageElement) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Ridimensiona per performance migliori ma mantieni qualità sufficiente
    const targetWidth = 300;
    const targetHeight = (imageElement.height / imageElement.width) * targetWidth;
    
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    
    // Disegna l'immagine sul canvas
    ctx.drawImage(imageElement, 0, 0, targetWidth, targetHeight);
    
    // Estrai i dati dei pixel
    const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
    const data = imageData.data;
    
    // Conta i colori con campionamento più denso per migliore accuratezza
    const colorCount = {};
    const step = 8; // Campiona ogni 8 pixel (ridotto da 16)
    
    console.log(`Analizzando ${data.length / 4} pixel totali, campionando ogni ${step}`);
    
    for (let i = 0; i < data.length; i += step * 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];
      
      // Ignora pixel trasparenti o quasi trasparenti
      if (a < 128) continue;
      
      // Ignora pixel troppo chiari o troppo scuri per evitare rumore
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      if (luminance > 0.95 || luminance < 0.05) continue;
      
      // Raggruppa colori simili con granularità più fine per rossi
      let groupedR, groupedG, groupedB;
      
      // Per i rossi, usa granularità più fine
      if (r > Math.max(g, b) * 1.1) {
        groupedR = Math.floor(r / 16) * 16;
        groupedG = Math.floor(g / 20) * 20;
        groupedB = Math.floor(b / 20) * 20;
      } else {
        groupedR = Math.floor(r / 24) * 24;
        groupedG = Math.floor(g / 24) * 24;
        groupedB = Math.floor(b / 24) * 24;
      }
      
      const colorKey = `${groupedR},${groupedG},${groupedB}`;
      colorCount[colorKey] = (colorCount[colorKey] || 0) + 1;
    }
    
    console.log(`Trovati ${Object.keys(colorCount).length} colori unici`);
    
    // Ordina per frequenza e prendi i primi 10 colori per migliore analisi
    const sortedColors = Object.entries(colorCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([color, count]) => {
        const [r, g, b] = color.split(',').map(Number);
        const hex = rgbToHex(r, g, b);
        const name = getColorName(hex);
        
        console.log(`Colore estratto: ${hex} (${name}) - frequenza: ${count}`);
        
        return {
          rgb: `rgb(${r}, ${g}, ${b})`,
          hex,
          count,
          name
        };
      });
    
    // Filtra i colori per rimuovere duplicati molto simili e prioritizzare i rossi
    const uniqueColors = [];
    const seenNames = new Set();
    
    // Prima passa: aggiungi colori non neutri
    for (const color of sortedColors) {
      if (!seenNames.has(color.name) && color.name !== 'neutro') {
        uniqueColors.push(color);
        seenNames.add(color.name);
        
        if (uniqueColors.length >= 6) break;
      }
    }
    
    // Seconda passa: aggiungi neutri se necessario
    for (const color of sortedColors) {
      if (!seenNames.has(color.name) && uniqueColors.length < 8) {
        uniqueColors.push(color);
        seenNames.add(color.name);
      }
    }
    
    console.log('Colori finali estratti:', uniqueColors.map(c => `${c.name} (${c.hex})`));
    
    return uniqueColors;
  };

  // Funzione per convertire RGB in HEX
  const rgbToHex = (r, g, b) => {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
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
    // Funzione avanzata per ottenere il nome del colore da un valore esadecimale
  function getColorName(hexColor) {
    // Converti hex a RGB
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);

    console.log(`Analizzando colore ${hexColor}: R=${r}, G=${g}, B=${b}`);

    // Calcola la luminosità per identificare grigi/bianchi/neri
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    // Controlla se è un colore neutro (differenze piccole tra componenti RGB)
    const maxComponent = Math.max(r, g, b);
    const minComponent = Math.min(r, g, b);
    const saturation = maxComponent === 0 ? 0 : (maxComponent - minComponent) / maxComponent;

    // Se saturation è bassa, è probabilmente un grigio
    if (saturation < 0.15) {
      if (luminance < 0.15) return "nero";
      if (luminance < 0.35) return "grigio scuro";
      if (luminance < 0.65) return "grigio";
      if (luminance < 0.85) return "grigio chiaro";
      return "bianco";
    }

    // Converti in HSV per una migliore identificazione dei colori
    const max = maxComponent / 255;
    const min = minComponent / 255;
    const diff = max - min;
    
    let hue = 0;
    if (diff !== 0) {
      if (max === r / 255) {
        hue = ((g - b) / 255 / diff) % 6;
      } else if (max === g / 255) {
        hue = ((b - r) / 255 / diff) + 2;
      } else {
        hue = ((r - g) / 255 / diff) + 4;
      }
    }
    hue = Math.round(hue * 60);
    if (hue < 0) hue += 360;

    console.log(`Hue calcolato: ${hue}, Saturation: ${saturation.toFixed(2)}, Luminance: ${luminance.toFixed(2)}`);

    // Identifica il colore basandosi sulla hue
    if (saturation > 0.3) {  // Colori sufficientemente saturi
      if (hue >= 0 && hue < 15) return "rosso";
      if (hue >= 15 && hue < 45) return "arancione";
      if (hue >= 45 && hue < 75) return "giallo";
      if (hue >= 75 && hue < 150) return "verde";
      if (hue >= 150 && hue < 210) return "turchese";
      if (hue >= 210 && hue < 270) return "blu";
      if (hue >= 270 && hue < 330) return "viola";
      if (hue >= 330 && hue < 360) return "rosso";
    }

    // Per colori meno saturi, usa il componente dominante
    if (r > g && r > b) {
      if (r > 1.2 * Math.max(g, b)) return "rosso";
      if (g > 0.7 * r) return "arancione";
      return "rosa";
    } else if (g > r && g > b) {
      if (g > 1.2 * Math.max(r, b)) return "verde";
      if (r > 0.7 * g) return "giallo";
      return "verde chiaro";
    } else if (b > r && b > g) {
      if (b > 1.2 * Math.max(r, g)) return "blu";
      if (r > 0.7 * b) return "viola";
      return "azzurro";
    }

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
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="virtual-room-container"
      style={{
        background: theme === "dark" 
          ? "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)"
          : "linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)",
        padding: "40px",
        borderRadius: "24px",
        boxShadow: theme === "dark" 
          ? "0 25px 50px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.1)"
          : "0 25px 50px rgba(102,126,234,0.2), 0 0 0 1px rgba(255,255,255,0.2)",
        position: "relative",
        overflow: "hidden",
        backdropFilter: "blur(20px)",
      }}
    >
      {/* Background Pattern */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `radial-gradient(circle at 20% 20%, rgba(255,255,255,0.1) 1px, transparent 1px),
                           radial-gradient(circle at 80% 80%, rgba(255,255,255,0.05) 1px, transparent 1px)`,
          backgroundSize: "50px 50px",
          opacity: 0.3,
          pointerEvents: "none"
        }}
      />
      
      {/* Floating Elements */}
      <div
        style={{
          position: "absolute",
          top: "20px",
          right: "30px",
          width: "100px",
          height: "100px",
          background: "rgba(255,255,255,0.1)",
          borderRadius: "50%",
          filter: "blur(40px)",
          pointerEvents: "none"
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "30px",
          left: "50px",
          width: "80px",
          height: "80px",
          background: "rgba(255,255,255,0.08)",
          borderRadius: "50%",
          filter: "blur(30px)",
          pointerEvents: "none"
        }}
      />

      {/* Enhanced Step Indicator */}
      <div className="step-indicator mb-5 d-flex justify-content-center position-relative">
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "15%",
            right: "15%",
            height: "3px",
            background: "rgba(255,255,255,0.2)",
            borderRadius: "2px",
            transform: "translateY(-50%)",
            zIndex: 1
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "15%",
            height: "3px",
            width: `${((step - 1) / 2) * 70}%`,
            background: "linear-gradient(90deg, #00f2fe 0%, #4facfe 100%)",
            borderRadius: "2px",
            transform: "translateY(-50%)",
            transition: "width 0.8s ease",
            zIndex: 2
          }}
        />
        {[1, 2, 3].map((stepNumber) => (
          <motion.div
            key={stepNumber}
            className="step-dot mx-4"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: stepNumber * 0.2, type: "spring", stiffness: 200 }}
            style={{
              width: "60px",
              height: "60px",
              borderRadius: "50%",
              background: step >= stepNumber
                ? "linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)"
                : "rgba(255,255,255,0.2)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              color: "#fff",
              fontWeight: "700",
              fontSize: "1.2rem",
              transition: "all 0.4s ease",
              position: "relative",
              zIndex: 3,
              border: step >= stepNumber ? "3px solid rgba(255,255,255,0.3)" : "3px solid transparent",
              boxShadow: step >= stepNumber 
                ? "0 10px 30px rgba(79,172,254,0.4)" 
                : "0 5px 15px rgba(0,0,0,0.1)"
            }}
          >
            {step > stepNumber ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                ✓
              </motion.div>
            ) : (
              stepNumber
            )}
          </motion.div>
        ))}
      </div>      {/* Step 1: Image Upload - Modern Glass Design */}
      {step === 1 && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center position-relative"
          style={{ zIndex: 10 }}
        >
          {/* Hero Section */}
          <div className="mb-5">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.8, type: "spring", stiffness: 100 }}
              style={{
                display: "inline-block",
                background: "linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%)",
                borderRadius: "50%",
                padding: "25px",
                marginBottom: "20px",
                boxShadow: "0 15px 35px rgba(255,154,158,0.3)"
              }}
            >
              <FaCloudUploadAlt size={60} color="#fff" />
            </motion.div>
            
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              style={{ 
                color: "#fff",
                fontWeight: "800",
                fontSize: "2.5rem",
                marginBottom: "15px",
                textShadow: "0 4px 20px rgba(0,0,0,0.3)",
                background: "linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.8) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text"
              }}
            >
              Trasforma la tua stanza
            </motion.h2>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              style={{ 
                color: "rgba(255,255,255,0.9)",
                fontSize: "1.2rem",
                fontWeight: "400",
                lineHeight: "1.6",
                maxWidth: "600px",
                margin: "0 auto"
              }}
            >
              Carica un'immagine della tua stanza e lascia che l'IA analizzi i colori per suggerirti l'arredamento perfetto
            </motion.p>
          </div>
          
          {/* Upload Area - Glass Morphism */}
          <motion.div 
            className="upload-area mt-4 mb-5 mx-auto"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            style={{
              background: "rgba(255,255,255,0.1)",
              backdropFilter: "blur(20px)",
              border: "2px dashed rgba(255,255,255,0.3)",
              borderRadius: "20px",
              padding: "50px 30px",
              cursor: "pointer",
              maxWidth: "600px",
              position: "relative",
              transition: "all 0.4s ease",
              overflow: "hidden"
            }}
            onClick={() => document.getElementById("room-image-upload").click()}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-5px)";
              e.currentTarget.style.boxShadow = "0 20px 40px rgba(0,0,0,0.2)";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.5)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "none";
              e.currentTarget.style.boxShadow = "none";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)";
            }}
          >
            {/* Animated Background */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: "linear-gradient(45deg, rgba(255,255,255,0.05) 25%, transparent 25%), linear-gradient(-45deg, rgba(255,255,255,0.05) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(255,255,255,0.05) 75%), linear-gradient(-45deg, transparent 75%, rgba(255,255,255,0.05) 75%)",
                backgroundSize: "20px 20px",
                backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
                opacity: 0.3,
                pointerEvents: "none"
              }}
            />
            
            <input
              type="file"
              id="room-image-upload"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleImageUpload}
            />
            
            {imagePreview ? (
              <motion.div 
                className="position-relative"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <img
                  src={imagePreview}
                  alt="Room preview"
                  style={{
                    maxWidth: "100%",
                    maxHeight: "300px",
                    borderRadius: "15px",
                    boxShadow: "0 15px 35px rgba(0,0,0,0.2)",
                    border: "3px solid rgba(255,255,255,0.2)"
                  }}
                />
                <motion.div 
                  className="image-overlay"
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "rgba(0,0,0,0.7)",
                    borderRadius: "15px",
                    color: "#fff",
                    fontSize: "1.1rem",
                    fontWeight: "600"
                  }}
                >
                  <div className="text-center">
                    <FaCloudUploadAlt size={30} className="mb-2" />
                    <div>Clicca per cambiare immagine</div>
                  </div>
                </motion.div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.9, duration: 0.5 }}
              >
                <motion.div
                  animate={{ 
                    y: [0, -10, 0],
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <FaCloudUploadAlt size={80} color="rgba(255,255,255,0.8)" />
                </motion.div>
                <h4 style={{ 
                  color: "rgba(255,255,255,0.9)", 
                  marginTop: "20px",
                  marginBottom: "10px",
                  fontWeight: "600"
                }}>
                  Scegli un'immagine della tua stanza
                </h4>
                <p style={{ 
                  color: "rgba(255,255,255,0.7)", 
                  margin: 0,
                  fontSize: "1rem"
                }}>
                  Trascina qui il file oppure clicca per selezionare
                </p>
                <div style={{
                  marginTop: "15px",
                  fontSize: "0.9rem",
                  color: "rgba(255,255,255,0.6)"
                }}>
                  Formati supportati: JPG, PNG (max 5MB)
                </div>
              </motion.div>
            )}
          </motion.div>
          
          {/* Action Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.5 }}
          >
            <Button
              disabled={!imagePreview}
              onClick={() => setStep(2)}
              style={{
                background: imagePreview 
                  ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                  : "rgba(255,255,255,0.2)",                border: "none",
                borderRadius: "8px",
                padding: "15px 40px",
                fontSize: "1.1rem",
                fontWeight: "600",
                color: "#fff",
                transition: "all 0.4s ease",
                boxShadow: imagePreview ? "0 10px 30px rgba(102,126,234,0.4)" : "none",
                cursor: imagePreview ? "pointer" : "not-allowed"
              }}
              onMouseEnter={(e) => {
                if (imagePreview) {
                  e.target.style.transform = "translateY(-3px) scale(1.05)";
                  e.target.style.boxShadow = "0 15px 40px rgba(102,126,234,0.5)";
                }
              }}
              onMouseLeave={(e) => {
                if (imagePreview) {
                  e.target.style.transform = "none";
                  e.target.style.boxShadow = "0 10px 30px rgba(102,126,234,0.4)";
                }
              }}
            >
              {imagePreview ? (
                <>
                  <FaMagic className="me-2" />
                  Analizza la stanza
                </>
              ) : (
                "Carica prima un'immagine"
              )}
            </Button>
          </motion.div>
        </motion.div>
      )}      {/* Step 2: Furniture Selection - Modern Card Design */}
      {step === 2 && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          style={{ position: "relative", zIndex: 10 }}
        >
          <div className="row align-items-center">
            {/* Image Preview */}
            <div className="col-md-5">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                style={{
                  position: "relative",
                  borderRadius: "20px",
                  overflow: "hidden",
                  boxShadow: "0 20px 40px rgba(0,0,0,0.2)"
                }}
              >
                <img
                  src={imagePreview}
                  alt="Your room"
                  style={{
                    width: "100%",
                    borderRadius: "20px",
                    border: "3px solid rgba(255,255,255,0.2)"
                  }}
                />
                {/* Glass overlay with AI analysis indicator */}
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: "linear-gradient(transparent, rgba(0,0,0,0.7))",
                    padding: "30px 20px 20px",
                    color: "#fff"
                  }}
                >
                  <div className="d-flex align-items-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: "12px"
                      }}
                    >
                      <FaMagic color="#fff" size={18} />
                    </motion.div>
                    <div>
                      <div style={{ fontWeight: "600", fontSize: "1rem" }}>Immagine pronta per l'analisi</div>
                      <div style={{ fontSize: "0.85rem", opacity: 0.8 }}>L'IA analizzerà i colori automaticamente</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
            
            {/* Selection Form */}
            <div className="col-md-7">
              <motion.div
                initial={{ x: 30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                style={{
                  background: "rgba(255,255,255,0.1)",
                  backdropFilter: "blur(20px)",
                  borderRadius: "20px",
                  padding: "40px",
                  border: "1px solid rgba(255,255,255,0.2)"
                }}
              >
                <motion.h3
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                  style={{ 
                    color: "#fff",
                    fontWeight: "700",
                    fontSize: "2rem",
                    marginBottom: "30px",
                    textAlign: "center"
                  }}
                >
                  Quale arredo stai cercando?
                </motion.h3>
                
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.8, duration: 0.5 }}
                >
                  <Form.Group className="mb-4">
                    <Form.Label style={{ 
                      color: "rgba(255,255,255,0.9)",
                      fontWeight: "600",
                      fontSize: "1.1rem",
                      marginBottom: "15px",
                      display: "block"
                    }}>
                      Seleziona il tipo di mobile
                    </Form.Label>
                    <Form.Select
                      value={furnitureType}
                      onChange={(e) => setFurnitureType(e.target.value)}
                      style={{
                        background: "rgba(255,255,255,0.1)",
                        backdropFilter: "blur(10px)",
                        color: "#fff",
                        border: "2px solid rgba(255,255,255,0.2)",
                        borderRadius: "15px",
                        padding: "15px 20px",
                        fontSize: "1rem",
                        fontWeight: "500",
                        transition: "all 0.3s ease"
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = "rgba(79,172,254,0.6)";
                        e.target.style.boxShadow = "0 0 20px rgba(79,172,254,0.3)";
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = "rgba(255,255,255,0.2)";
                        e.target.style.boxShadow = "none";
                      }}
                    >
                      <option value="" style={{background: "#2d3748", color: "#fff"}}>
                        Scegli il tipo di arredamento...
                      </option>
                      <option value="divano" style={{background: "#2d3748", color: "#fff"}}>🛋️ Divano</option>
                      <option value="tavolo" style={{background: "#2d3748", color: "#fff"}}>🪑 Tavolo</option>
                      <option value="sedia" style={{background: "#2d3748", color: "#fff"}}>💺 Sedia</option>
                      <option value="letto" style={{background: "#2d3748", color: "#fff"}}>🛏️ Letto</option>
                      <option value="armadio" style={{background: "#2d3748", color: "#fff"}}>🚪 Armadio</option>
                      <option value="libreria" style={{background: "#2d3748", color: "#fff"}}>📚 Libreria</option>
                      <option value="mobile-tv" style={{background: "#2d3748", color: "#fff"}}>📺 Mobile TV</option>
                      <option value="lampada" style={{background: "#2d3748", color: "#fff"}}>💡 Lampada</option>
                    </Form.Select>
                  </Form.Group>
                  
                  {/* Info Card */}
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 1, duration: 0.5 }}
                    style={{
                      background: "rgba(79,172,254,0.1)",
                      border: "1px solid rgba(79,172,254,0.3)",
                      borderRadius: "15px",
                      padding: "20px",
                      marginBottom: "30px"
                    }}
                  >
                    <div className="d-flex align-items-center mb-2">
                      <div style={{
                        width: "30px",
                        height: "30px",
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: "12px"
                      }}>
                        <FaMagic color="#fff" size={14} />
                      </div>
                      <h6 style={{ color: "#fff", margin: 0, fontWeight: "600" }}>
                        Analisi automatica con IA
                      </h6>
                    </div>
                    <p style={{ 
                      color: "rgba(255,255,255,0.8)", 
                      margin: 0, 
                      fontSize: "0.9rem",
                      lineHeight: "1.5"
                    }}>
                      L'intelligenza artificiale analizzerà automaticamente i colori della tua stanza per trovare l'arredamento più adatto alla tua palette cromatica.
                    </p>
                  </motion.div>
                  
                  {/* Action Buttons */}
                  <motion.div 
                    className="d-flex justify-content-between"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 1.2, duration: 0.5 }}
                  >
                    <Button
                      onClick={() => setStep(1)}
                      disabled={isLoading}
                      style={{
                        background: "rgba(255,255,255,0.1)",
                        backdropFilter: "blur(10px)",                        border: "2px solid rgba(255,255,255,0.2)",
                        borderRadius: "8px",
                        padding: "12px 30px",
                        color: "#fff",
                        fontWeight: "600",
                        transition: "all 0.3s ease"
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = "rgba(255,255,255,0.2)";
                        e.target.style.transform = "translateY(-2px)";
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = "rgba(255,255,255,0.1)";
                        e.target.style.transform = "none";
                      }}
                    >
                      <FaArrowLeft className="me-2" /> Indietro
                    </Button>
                    
                    <Button
                      onClick={handleSubmit}
                      disabled={isLoading || !furnitureType}
                      style={{
                        background: (isLoading || !furnitureType) 
                          ? "rgba(255,255,255,0.2)"
                          : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",                        border: "none",
                        borderRadius: "8px",
                        padding: "12px 35px",
                        color: "#fff",
                        fontWeight: "600",
                        fontSize: "1rem",
                        transition: "all 0.4s ease",
                        boxShadow: (!isLoading && furnitureType) ? "0 10px 30px rgba(102,126,234,0.4)" : "none",
                        cursor: (!isLoading && furnitureType) ? "pointer" : "not-allowed"
                      }}
                      onMouseEnter={(e) => {
                        if (!isLoading && furnitureType) {
                          e.target.style.transform = "translateY(-3px) scale(1.05)";
                          e.target.style.boxShadow = "0 15px 40px rgba(102,126,234,0.5)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isLoading && furnitureType) {
                          e.target.style.transform = "none";
                          e.target.style.boxShadow = "0 10px 30px rgba(102,126,234,0.4)";
                        }
                      }}
                    >
                      {isLoading ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            style={{ display: "inline-block", marginRight: "8px" }}
                          >
                            <FaMagic />
                          </motion.div>
                          {processingStage || "Elaborazione..."}
                        </>
                      ) : (
                        <>
                          <FaMagic className="me-2" /> Inizia l'analisi IA
                        </>
                      )}
                    </Button>
                  </motion.div>
                </motion.div>
              </motion.div>
            </div>
          </div>
          
          {/* Loading Progress - Enhanced */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mt-5 text-center"
              style={{
                background: "rgba(255,255,255,0.1)",
                backdropFilter: "blur(20px)",
                borderRadius: "20px",
                padding: "30px",
                border: "1px solid rgba(255,255,255,0.2)"
              }}
            >
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  opacity: [0.7, 1, 0.7]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                style={{
                  display: "inline-block",
                  background: "linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)",
                  borderRadius: "50%",
                  padding: "20px",
                  marginBottom: "20px"
                }}
              >
                <FaMagic size={30} color="#fff" />
              </motion.div>
              
              <h4 style={{ color: "#fff", marginBottom: "15px", fontWeight: "600" }}>
                {processingStage || "Analisi in corso..."}
              </h4>
              
              <div style={{
                background: "rgba(255,255,255,0.2)",
                borderRadius: "50px",
                height: "8px",
                marginBottom: "15px",
                overflow: "hidden"
              }}>
                <motion.div
                  animate={{ x: [-100, 300] }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  style={{
                    width: "100px",
                    height: "100%",
                    background: "linear-gradient(90deg, transparent, #00f2fe, transparent)",
                    borderRadius: "50px"
                  }}
                />
              </div>
              
              <p style={{ 
                color: "rgba(255,255,255,0.8)", 
                margin: 0,
                fontSize: "0.95rem"
              }}>
                L'IA sta analizzando i colori e lo stile della tua stanza per trovare i prodotti perfetti
              </p>
            </motion.div>
          )}
        </motion.div>
      )}      {/* Step 3: Results - Revolutionary Modern Design */}
      {step === 3 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{ position: "relative", zIndex: 10 }}
        >
          {/* Hero Results Header */}
          <motion.div
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-center mb-5"
          >
            <motion.div
              initial={{ scale: 0, rotate: 360 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.8, type: "spring", stiffness: 150 }}
              style={{
                display: "inline-block",
                background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
                borderRadius: "50%",
                padding: "25px",
                marginBottom: "25px",
                boxShadow: "0 20px 40px rgba(79,172,254,0.3)"
              }}
            >
              <FaMagic size={50} color="#fff" />
            </motion.div>
            
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              style={{ 
                color: "#fff",
                fontWeight: "800",
                fontSize: "2.8rem",
                marginBottom: "15px",
                textShadow: "0 4px 20px rgba(0,0,0,0.3)",
                background: "linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.8) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text"
              }}
            >
              Analisi Completata!
            </motion.h2>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              style={{ 
                color: "rgba(255,255,255,0.9)",
                fontSize: "1.2rem",
                fontWeight: "400",
                maxWidth: "700px",
                margin: "0 auto",
                lineHeight: "1.6"
              }}
            >
              La nostra IA ha analizzato la tua stanza e trovato l'arredamento perfetto per te
            </motion.p>
          </motion.div>
          
          <Row className="g-4">
            {/* Enhanced Image Analysis Section */}
            <Col lg={5}>
              <motion.div
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                style={{
                  background: "rgba(255,255,255,0.1)",
                  backdropFilter: "blur(20px)",
                  borderRadius: "25px",
                  padding: "25px",
                  border: "1px solid rgba(255,255,255,0.2)",
                  position: "relative",
                  overflow: "hidden"
                }}
              >
                {/* Animated background pattern */}
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundImage: `radial-gradient(circle at 25% 25%, rgba(79,172,254,0.1) 2px, transparent 2px),
                                     radial-gradient(circle at 75% 75%, rgba(0,242,254,0.1) 2px, transparent 2px)`,
                    backgroundSize: "30px 30px",
                    opacity: 0.4,
                    pointerEvents: "none"
                  }}
                />
                
                <div className="position-relative" style={{ zIndex: 2 }}>
                  <motion.h4
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                    style={{ 
                      color: "#fff",
                      fontWeight: "700",
                      fontSize: "1.5rem",
                      marginBottom: "20px",
                      textAlign: "center"
                    }}
                  >
                    La Tua Stanza Analizzata
                  </motion.h4>
                  
                  <motion.div 
                    className="position-relative"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    style={{
                      borderRadius: "20px",
                      overflow: "hidden",
                      boxShadow: "0 25px 50px rgba(0,0,0,0.3)"
                    }}
                  >
                    <img
                      src={imagePreview}
                      alt="Your analyzed room"
                      style={{
                        width: "100%",
                        borderRadius: "20px",
                        border: "3px solid rgba(255,255,255,0.3)"
                      }}
                    />
                    
                    {/* Enhanced AI Analysis Overlay */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.8, duration: 0.8 }}
                      style={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        background: "linear-gradient(transparent, rgba(0,0,0,0.8))",
                        padding: "40px 20px 20px",
                        color: "#fff"
                      }}
                    >
                      <div className="d-flex align-items-center justify-content-center">
                        <motion.div
                          animate={{ 
                            scale: [1, 1.1, 1],
                            rotate: [0, 360]
                          }}
                          transition={{ 
                            scale: { duration: 2, repeat: Infinity, ease: "easeInOut" },
                            rotate: { duration: 3, repeat: Infinity, ease: "linear" }
                          }}
                          style={{
                            width: "50px",
                            height: "50px",
                            borderRadius: "50%",
                            background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            marginRight: "15px",
                            boxShadow: "0 10px 30px rgba(79,172,254,0.4)"
                          }}
                        >
                          <FaMagic color="#fff" size={20} />
                        </motion.div>
                        <div>
                          <div style={{ fontWeight: "700", fontSize: "1.1rem", marginBottom: "5px" }}>
                            Analisi IA Completata
                          </div>
                          <div style={{ fontSize: "0.9rem", opacity: 0.9 }}>
                            Colori e stile identificati con successo
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>
                </div>
              </motion.div>
            </Col>
            
            {/* Modern Analysis Results Section */}
            <Col lg={7}>              <motion.div
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.5 }}
              >
                {/* Enhanced AI Analysis Display */}
                {analysisData && (
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                    style={{
                      background: "rgba(255,255,255,0.1)",
                      backdropFilter: "blur(20px)",
                      borderRadius: "25px",
                      border: "1px solid rgba(255,255,255,0.2)",
                      overflow: "hidden",
                      position: "relative",
                      marginBottom: "30px"
                    }}
                  >
                    {/* Header with gradient background */}
                    <div style={{
                      background: "linear-gradient(135deg, rgba(79,172,254,0.3) 0%, rgba(0,242,254,0.3) 100%)",
                      padding: "25px",
                      borderBottom: "1px solid rgba(255,255,255,0.1)"
                    }}>
                      <div className="d-flex align-items-center">
                        <motion.div
                          initial={{ rotate: -90, scale: 0 }}
                          animate={{ rotate: 0, scale: 1 }}
                          transition={{ delay: 0.8, type: "spring", stiffness: 200 }}
                          style={{
                            width: "50px",
                            height: "50px",
                            borderRadius: "50%",
                            background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            marginRight: "15px",
                            boxShadow: "0 10px 25px rgba(79,172,254,0.4)"
                          }}
                        >
                          <FaMagic color="#fff" size={22} />
                        </motion.div>
                        <h5 style={{ 
                          margin: 0, 
                          color: "#fff",
                          fontWeight: "700",
                          fontSize: "1.4rem"
                        }}>
                          Analisi Intelligente della Stanza
                        </h5>
                      </div>
                    </div>
                    
                    <div style={{ padding: "30px" }}>
                      {/* Style Analysis Section */}
                      <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 1, duration: 0.5 }}
                        className="mb-4"
                      >
                        <div className="d-flex align-items-center mb-3">
                          <div style={{ 
                            width: "20px", 
                            height: "20px", 
                            background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
                            borderRadius: "50%",
                            marginRight: "12px",
                            boxShadow: "0 5px 15px rgba(79,172,254,0.3)"
                          }}></div>
                          <strong style={{ color: "#fff", fontSize: "1.1rem" }}>Stile Identificato</strong>
                        </div>
                        <div 
                          style={{
                            marginLeft: "32px",
                            padding: "20px",
                            background: "rgba(255,255,255,0.05)",
                            borderRadius: "15px",
                            border: "1px solid rgba(255,255,255,0.1)"
                          }}
                        >
                          <span style={{
                            fontSize: "1.2rem",
                            fontWeight: "600",
                            color: "#fff",
                            textTransform: "capitalize",
                            display: "block",
                            marginBottom: "10px"
                          }}>
                            {analysisData.roomStyle}
                          </span>
                          <p style={{ 
                            margin: 0, 
                            color: "rgba(255,255,255,0.8)",
                            fontSize: "1rem",
                            lineHeight: "1.5"
                          }}>
                            {analysisData.styleDescription || "Lo stile della tua stanza è stato analizzato in base alle caratteristiche dell'immagine."}
                          </p>
                        </div>
                      </motion.div>
                      
                      {/* Color Palette Section */}
                      <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 1.2, duration: 0.5 }}
                        className="mb-4"
                      >
                        <div className="d-flex align-items-center mb-3">
                          <div style={{ 
                            width: "20px", 
                            height: "20px", 
                            background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
                            borderRadius: "50%",
                            marginRight: "12px",
                            boxShadow: "0 5px 15px rgba(79,172,254,0.3)"
                          }}></div>
                          <strong style={{ color: "#fff", fontSize: "1.1rem" }}>Palette Colori Rilevata</strong>
                        </div>
                        <div 
                          style={{
                            marginLeft: "32px",
                            padding: "20px",
                            background: "rgba(255,255,255,0.05)",
                            borderRadius: "15px",
                            border: "1px solid rgba(255,255,255,0.1)"
                          }}
                        >
                          <div className="d-flex flex-wrap gap-3 mb-3">
                            {analysisData.colorPalette && analysisData.colorPalette.map((color, idx) => (
                              <motion.div 
                                key={idx}
                                initial={{ scale: 0, rotate: 180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ 
                                  delay: 1.4 + (idx * 0.1), 
                                  type: "spring", 
                                  stiffness: 300 
                                }}
                                style={{
                                  width: "50px",
                                  height: "50px",
                                  backgroundColor: color,
                                  border: "3px solid rgba(255,255,255,0.3)",
                                  borderRadius: "12px",
                                  position: "relative",
                                  boxShadow: "0 8px 25px rgba(0,0,0,0.2)",
                                  cursor: "pointer",
                                  transition: "transform 0.3s ease"
                                }} 
                                title={color}
                                whileHover={{ scale: 1.1, y: -5 }}
                              >
                                <div style={{
                                  position: "absolute",
                                  bottom: "-25px",
                                  left: "50%",
                                  transform: "translateX(-50%)",
                                  fontSize: "10px",
                                  color: "#fff",
                                  background: "rgba(0,0,0,0.7)",
                                  padding: "2px 6px",
                                  borderRadius: "4px",
                                  whiteSpace: "nowrap"
                                }}>
                                  {color}
                                </div>
                              </motion.div>
                            ))}
                          </div>
                          <p style={{ 
                            margin: 0, 
                            color: "rgba(255,255,255,0.8)",
                            fontSize: "1rem"
                          }}>
                            Questi colori sono stati identificati come dominanti nel tuo ambiente e formeranno la base per i nostri suggerimenti di arredamento.
                          </p>
                        </div>
                      </motion.div>
                      
                      {/* AI Recommendations Section */}
                      <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 1.4, duration: 0.5 }}
                      >
                        <div className="d-flex align-items-center mb-3">
                          <div style={{ 
                            width: "20px", 
                            height: "20px", 
                            background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
                            borderRadius: "50%",
                            marginRight: "12px",
                            boxShadow: "0 5px 15px rgba(79,172,254,0.3)"
                          }}></div>
                          <strong style={{ color: "#fff", fontSize: "1.1rem" }}>Consigli IA per l'Arredamento</strong>
                        </div>
                        <div 
                          style={{
                            marginLeft: "32px",
                            padding: "20px",
                            background: "rgba(255,255,255,0.05)",
                            borderRadius: "15px",
                            border: "1px solid rgba(255,255,255,0.1)"
                          }}
                        >
                          <div style={{ color: "rgba(255,255,255,0.9)", fontSize: "1rem" }}>
                            {analysisData.keyFeatures && analysisData.keyFeatures.length > 0 ? (
                              <ul style={{ 
                                paddingLeft: "20px",
                                margin: 0
                              }}>
                                {analysisData.keyFeatures.map((tip, idx) => (
                                  <motion.li 
                                    key={idx}
                                    initial={{ x: -20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ delay: 1.6 + (idx * 0.1) }}
                                    style={{ 
                                      marginBottom: "10px",
                                      color: "rgba(255,255,255,0.9)",
                                      lineHeight: "1.5"
                                    }}
                                  >
                                    {tip}
                                  </motion.li>
                                ))}
                              </ul>
                            ) : (
                              <p style={{ margin: 0, fontStyle: "italic" }}>
                                L'IA ha analizzato la tua stanza e sta generando raccomandazioni personalizzate basate sui colori e lo stile identificati.
                              </p>
                            )}
                          </div>
                        </div>
                      </motion.div>                    </div>
                  </motion.div>
                )}
                
                {/* Modern Product Recommendations Section */}
                <motion.div
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 1.6, duration: 0.6 }}
                >
                  <h5 style={{ 
                    color: "#fff", 
                    marginBottom: "25px", 
                    fontWeight: "700",
                    fontSize: "1.6rem",
                    textAlign: "center"
                  }}>
                    🎯 Prodotti Consigliati per la Tua Stanza
                  </h5>

                  <div className="recommendations-grid">
                    {recommendations && recommendations.length > 0 ? (
                      <Row className="g-4">
                        {recommendations.map((recommendation, index) => (
                          <Col lg={6} key={index}>
                            <motion.div
                              initial={{ opacity: 0, y: 30, scale: 0.9 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              transition={{ 
                                duration: 0.6, 
                                delay: 1.8 + (index * 0.15),
                                type: "spring",
                                stiffness: 100
                              }}
                              whileHover={{ y: -8, scale: 1.02 }}
                              style={{
                                background: "rgba(255,255,255,0.1)",
                                backdropFilter: "blur(20px)",
                                borderRadius: "20px",
                                border: "1px solid rgba(255,255,255,0.2)",
                                overflow: "hidden",
                                cursor: "pointer",
                                boxShadow: "0 15px 35px rgba(0,0,0,0.2)"
                              }}
                              onClick={() => handleRecommendationClick(recommendation.productId)}
                            >
                              <div className="d-flex h-100">
                                {/* Enhanced Product Image */}
                                <div 
                                  style={{
                                    width: "45%",
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
                                      transition: "transform 0.6s ease"
                                    }}
                                  />
                                  {/* Gradient overlay */}
                                  <div 
                                    style={{
                                      position: "absolute",
                                      top: 0,
                                      left: 0,
                                      right: 0,
                                      bottom: 0,
                                      background: "linear-gradient(135deg, rgba(79,172,254,0.1) 0%, rgba(0,242,254,0.1) 100%)"
                                    }}
                                  />
                                  {/* Match score badge */}
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 2 + (index * 0.15), type: "spring" }}
                                    style={{
                                      position: "absolute",
                                      top: "15px",
                                      right: "15px",
                                      background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
                                      color: "#fff",
                                      padding: "8px 12px",
                                      borderRadius: "20px",
                                      fontSize: "0.8rem",
                                      fontWeight: "700",
                                      boxShadow: "0 5px 15px rgba(79,172,254,0.4)"
                                    }}
                                  >
                                    {recommendation.matchScore || 95}% Match
                                  </motion.div>
                                </div>
                                
                                {/* Enhanced Product Details */}
                                <div 
                                  style={{ 
                                    padding: "25px",
                                    width: "55%",
                                    display: "flex",
                                    flexDirection: "column",
                                    justifyContent: "space-between"
                                  }}
                                >
                                  <div>
                                    <motion.h6
                                      initial={{ opacity: 0, x: 20 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: 2.2 + (index * 0.15) }}
                                      style={{ 
                                        color: "#fff",
                                        marginBottom: "12px",
                                        fontSize: "1.1rem",
                                        fontWeight: "700",
                                        lineHeight: "1.3"
                                      }}
                                    >
                                      {recommendation.productName}
                                    </motion.h6>
                                    
                                    <motion.div
                                      initial={{ opacity: 0, x: 20 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: 2.4 + (index * 0.15) }}
                                      style={{ 
                                        fontSize: "0.9rem",
                                        color: "rgba(255,255,255,0.8)",
                                        marginBottom: "15px",
                                        lineHeight: "1.4",
                                        display: "-webkit-box",
                                        WebkitLineClamp: "3",
                                        WebkitBoxOrient: "vertical",
                                        overflow: "hidden"
                                      }}
                                    >
                                      {recommendation.reason}
                                    </motion.div>
                                  </div>
                                  
                                  <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 2.6 + (index * 0.15) }}
                                    className="d-flex justify-content-between align-items-center"
                                  >
                                    <div
                                      style={{ 
                                        fontWeight: "800", 
                                        color: "#fff",
                                        fontSize: "1.3rem",
                                        background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
                                        WebkitBackgroundClip: "text",
                                        WebkitTextFillColor: "transparent",
                                        backgroundClip: "text"
                                      }}
                                    >
                                      €{recommendation.price}
                                    </div>
                                    <motion.div 
                                      whileHover={{ x: 5 }}
                                      style={{
                                        fontSize: "0.9rem",
                                        color: "rgba(255,255,255,0.9)",
                                        fontWeight: "600",
                                        display: "flex",
                                        alignItems: "center"
                                      }}
                                    >
                                      Vedi dettagli
                                      <FaArrowRight style={{ marginLeft: "8px", fontSize: "0.8rem" }} />
                                    </motion.div>
                                  </motion.div>
                                </div>
                              </div>
                            </motion.div>
                          </Col>
                        ))}
                      </Row>
                    ) : (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 1.8, duration: 0.6 }}
                        className="text-center"
                        style={{ 
                          background: "rgba(255,255,255,0.1)", 
                          backdropFilter: "blur(20px)",
                          borderRadius: "20px", 
                          padding: "50px 30px",
                          border: "1px solid rgba(255,255,255,0.2)"
                        }}
                      >
                        <motion.div
                          animate={{ 
                            scale: [1, 1.1, 1],
                            opacity: [0.7, 1, 0.7]
                          }}
                          transition={{ 
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                          style={{
                            display: "inline-block",
                            background: "linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.1) 100%)",
                            borderRadius: "50%",
                            padding: "20px",
                            marginBottom: "20px"
                          }}
                        >
                          <FaSearch size={40} color="rgba(255,255,255,0.8)" />
                        </motion.div>
                        
                        {analysisData.noProductsMessage ? (
                          <>
                            <h5 style={{
                              color: "#fff",
                              fontSize: "1.4rem",
                              fontWeight: "700",
                              marginBottom: "15px"
                            }}>
                              {analysisData.noProductsMessage}
                            </h5>
                            <p style={{
                              color: "rgba(255,255,255,0.8)",
                              fontSize: "1.1rem",
                              marginBottom: "20px",
                              lineHeight: "1.5"
                            }}>
                              I colori rilevati nella tua stanza sono specifici e al momento non abbiamo prodotti che corrispondono esattamente a questa palette.
                            </p>
                            
                            {/* Color display */}
                            <div className="mb-4">
                              <p style={{
                                color: "rgba(255,255,255,0.9)",
                                fontSize: "1rem",
                                fontWeight: "600",
                                marginBottom: "15px"
                              }}>
                                Colori rilevati nella tua stanza:
                              </p>
                              <div className="d-flex justify-content-center gap-3">
                                {analysisData.detectedColors && analysisData.detectedColors.slice(0, 5).map((color, idx) => (
                                  <motion.div 
                                    key={idx}
                                    initial={{ scale: 0, rotate: 180 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ 
                                      delay: 2 + (idx * 0.1), 
                                      type: "spring", 
                                      stiffness: 200 
                                    }}
                                    style={{
                                      width: "45px",
                                      height: "45px",
                                      backgroundColor: color.hex,
                                      border: "3px solid rgba(255,255,255,0.3)",
                                      borderRadius: "50%",
                                      boxShadow: "0 8px 25px rgba(0,0,0,0.2)"
                                    }} 
                                    title={`${color.name} (${color.hex})`}
                                  />
                                ))}
                              </div>
                            </div>
                            
                            <p style={{
                              color: "rgba(255,255,255,0.7)",
                              fontSize: "1rem",
                              fontStyle: "italic"
                            }}>
                              💡 <strong>Suggerimento:</strong> Prova a cercare prodotti in colori neutri come bianco, nero o grigio che si abbinano a qualsiasi palette, oppure carica un'immagine diversa.
                            </p>
                          </>
                        ) : (
                          <>
                            <h5 style={{
                              color: "rgba(255,255,255,0.9)",
                              fontSize: "1.3rem",
                              fontWeight: "600",
                              marginBottom: "15px"
                            }}>
                              Nessun prodotto consigliato disponibile
                            </h5>
                            <p style={{
                              color: "rgba(255,255,255,0.7)",
                              fontSize: "1rem"
                            }}>
                              Prova a modificare i requisiti o a caricare un'immagine diversa della stanza.
                            </p>
                          </>
                        )}
                      </motion.div>
                    )}
                  </div>
                  
                  {/* Enhanced Action Buttons */}
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 2.5, duration: 0.6 }}
                    className="d-flex justify-content-between mt-5"
                  >
                    <Button
                      onClick={() => setStep(2)}
                      style={{
                        background: "rgba(255,255,255,0.1)",
                        backdropFilter: "blur(10px)",                        border: "2px solid rgba(255,255,255,0.2)",
                        borderRadius: "8px",
                        padding: "15px 30px",
                        color: "#fff",
                        fontWeight: "600",
                        fontSize: "1rem",
                        transition: "all 0.3s ease"
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = "rgba(255,255,255,0.2)";
                        e.target.style.transform = "translateY(-3px)";
                        e.target.style.boxShadow = "0 10px 25px rgba(0,0,0,0.2)";
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = "rgba(255,255,255,0.1)";
                        e.target.style.transform = "none";
                        e.target.style.boxShadow = "none";
                      }}
                    >
                      <FaArrowLeft className="me-2" /> Analizza Nuovamente
                    </Button>
                    
                    {recommendations && recommendations.length > 0 && (
                      <Button
                        onClick={handleViewRecommendedProducts}
                        style={{
                          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",                          border: "none",
                          borderRadius: "8px",
                          padding: "15px 35px",
                          color: "#fff",
                          fontWeight: "600",
                          fontSize: "1rem",
                          transition: "all 0.4s ease",
                          boxShadow: "0 15px 35px rgba(102,126,234,0.4)"
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.transform = "translateY(-3px) scale(1.05)";
                          e.target.style.boxShadow = "0 20px 45px rgba(102,126,234,0.5)";
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = "none";
                          e.target.style.boxShadow = "0 15px 35px rgba(102,126,234,0.4)";
                        }}
                      >
                        <FaChair className="me-2" /> Esplora Tutti i Prodotti
                      </Button>
                    )}
                  </motion.div>
                </motion.div>
              </motion.div>
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
  const [selectedCategory, setSelectedCategory] = useState(null);  const [sectionsVisibility, setSectionsVisibility] = useState({
    virtualRoom: false,
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
  setSectionsVisibility(prev => ({
    ...prev, 
    virtualRoom: !prev.virtualRoom
  }));
  
  // If we're showing the section, scroll to it after a brief delay for animation
  if (!sectionsVisibility.virtualRoom) {
    setTimeout(() => {
      scrollToSection(virtualRoomSectionRef);
    }, 300);
  }
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

    <div className={`glass-container ${theme === "dark" ? "dark-mode" : "light-mode"}`} style={{ backgroundColor: "transparent", color: theme === "dark" ? "#fff" : "#000" }}>      {/* Hero Section - sempre visibile */}
      <div
        className="glass-hero"
        style={{
          boxShadow: "0px 15px 25px rgba(0,0,0,0.15)",
          color: theme === "dark" ? "#fff" : "#000",
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          width: "100%",
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
        >          <Button
            size="lg"
            className="mt-3 me-3 glass-button"
            onClick={scrollToProducts}
            style={{
              transition: "transform 0.3s ease",
            }}
            onMouseEnter={(e) => (e.target.style.transform = "scale(1.1)")}
            onMouseLeave={(e) => (e.target.style.transform = "scale(1)")}
          >
            Vai ai Prodotti
          </Button>          <Button
            size="lg"
            className="mt-3 glass-button-outline"
            onClick={scrollToVirtualRoom}
            style={{
              transition: "transform 0.3s ease",
            }}
            onMouseEnter={(e) => (e.target.style.transform = "scale(1.1)")}
            onMouseLeave={(e) => (e.target.style.transform = "scale(1)")}
          >
            <FaMagic className="me-2" /> 
            {sectionsVisibility.virtualRoom ? 'Nascondi Stanza Virtuale' : 'Crea la tua stanza virtuale'}
          </Button>
        </motion.div>
      </div>      {/* Virtual Room Creator Section */}
      <AnimatePresence>
        {sectionsVisibility.virtualRoom && (
          <motion.div 
            ref={virtualRoomSectionRef} 
            initial={{ opacity: 0, height: 0, y: -50 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -50 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className={`glass-virtual-room ${theme === "dark" ? "dark-mode" : "light-mode"}`}
            style={{
              color: theme === "dark" ? "#fff" : "#000",
              overflow: "hidden"
            }}
          >
            <Container>
              <motion.h2
                className="text-center mb-4"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                style={{
                  color: theme === "dark" ? "#fff" : "#000",
                  fontWeight: "bold",
                }}
              >
                Crea la tua stanza virtuale
              </motion.h2>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <VirtualRoomCreator 
                  theme={theme} 
                  products={products} 
                  setFilteredProducts={setFilteredProducts} 
                  scrollToProducts={scrollToProducts} 
                  handleProductRecommendationClick={handleAIRecommendationClick}
                />
              </motion.div>
            </Container>
          </motion.div>
        )}
      </AnimatePresence>      {/* Product Details Section */}
      <AnimatePresence>
        {selectedProduct && (
          <motion.div
            className={`glass-product-details ${theme === "dark" ? "dark-mode" : "light-mode"}`}
            initial={{ opacity: 0, scale: 0.8, rotateX: -15, y: 100 }}
            animate={{ opacity: 1, scale: 1, rotateX: 0, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, rotateX: 15, y: 100 }}
            transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
            style={{
              perspective: "1000px",
              position: "relative",
              zIndex: 10,
              maxWidth: "90%",
              margin: "30px auto",
              color: theme === "dark" ? "#fff" : "#000"
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
      </AnimatePresence>      {/* Products Section */}
      <div ref={productsSectionRef} className="glass-section" style={{
        color: theme === "dark" ? "#fff" : "#000"
      }}>
        <Container fluid>

          <h2 className="text-center mb-4" style={{
            color: theme === "dark" ? "#fff" : "#000", // Cambia colore in base al tema
            fontWeight: "bold",
          }}>Prodotti</h2>          {/* Filters Section */}
          <div 
            ref={filtersContainerRef}
            className="glass-filters"
            style={{
              color: theme === "dark" ? "#fff" : "#000"
            }}
          >
            <Container fluid>              <div className="text-center mb-3" >
                <Button
                  className="glass-button filter-toggle-btn"
                  style={{ border: "1px solid rgba(255, 255, 255, 0.2)" }}
                  onClick={() => setShowFilters(!showFilters)}
                  aria-controls="filters-collapse"
                  aria-expanded={showFilters}
                >
                  <FaFilter /> Filtri
                </Button>
                {showFilters && (
                  <Button
                    className="glass-button-danger ms-3"
                    style={{ marginBottom: "30px" }}
                    onClick={resetFilters}
                  >
                    Azzera Filtri
                  </Button>
                )}
              </div>              <Collapse 
                in={showFilters} 
                id="filtri"
                className="glass-collapse"
                style={{ color: theme === "dark" ? "#fff" : "#000" }}
              >
                <div id="filters-collapse" className="filters-container">
                  <Form>
                    <Row className="gy-3">
                      <Col md={3}>
                        <Form.Group controlId="filterName">
                          <Form.Label className="filter-label" style={{
                            // Cambia colore in base al tema
                            fontWeight: "bold",
                          }}>Nome</Form.Label>                        <Form.Control
                            type="text"
                            placeholder="Cerca per nome"
                            name="name"
                            style={{
                              backgroundColor: theme === "dark" ? "#212529" : "#fff",
                              color: theme === "dark" ? "#fff" : "#000",
                              border: theme === "dark" ? "1px solid #495057" : "1px solid #ced4da",
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
                          }}>Colore</Form.Label>                        <Form.Control
                            style={{ 
                              backgroundColor: theme === "dark" ? "#212529" : "#fff", 
                              color: theme === "dark" ? "#fff" : "#000",
                              border: theme === "dark" ? "1px solid #495057" : "1px solid #ced4da",
                            }}
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
                >                  <Card
                    className={`product-card h-100 ${theme === "dark" ? "dark-mode" : "light-mode"}`}
                    style={{
                      borderRadius: "20px",
                      overflow: "hidden",
                      cursor: "pointer",
                      border: highlightedProductId === product._id
                        ? `3px solid ${theme === "dark" ? "#007bff" : "#0056b3"}`
                        : "1px solid rgba(255, 255, 255, 0.1)",
                      transition: "transform 0.3s ease, box-shadow 0.3s ease",
                      transform: highlightedProductId === product._id ? "translateY(-5px)" : "none",
                      boxShadow: highlightedProductId === product._id
                        ? "0 20px 40px rgba(0,0,0,0.2)"
                        : "0 10px 25px rgba(0,0,0,0.1)",
                      background: theme === "dark" 
                        ? "rgba(255, 255, 255, 0.05)" 
                        : "rgba(0, 0, 0, 0.02)",
                      backdropFilter: "blur(10px)",
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
                      background: theme === "dark" 
                        ? "rgba(255, 255, 255, 0.03)" 
                        : "rgba(0, 0, 0, 0.01)",
                      backdropFilter: "blur(5px)",
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
      </div>      {showScrollTop && (
  <button
    onClick={() => {
      // Scorri all'intera sezione dei filtri, non solo all'elemento con id="filtri"
      if (filtersContainerRef.current) {
        filtersContainerRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }}
    className={`glass-scroll-button ${theme === "dark" ? "dark-mode" : "light-mode"}`}
    style={{
      position: "fixed",
      bottom: "20px",
      left: "20px",
      zIndex: 1000,
      width: "50px",
      height: "50px",
      fontSize: "24px",
      color: "white",
      border: "none",
      cursor: "pointer",
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

