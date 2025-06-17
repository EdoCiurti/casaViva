import React, { useState, useEffect } from 'react';
import { Modal, Button } from 'react-bootstrap';
import QRCode from 'qrcode';
import { QrScanner } from '@yudiel/react-qr-scanner';

const QRCodeModal = ({ show, onHide, product }) => {
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [scannedData, setScannedData] = useState(null);

  // Detecta se è mobile
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      const mobileCheck = /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
      const screenCheck = window.innerWidth <= 768;
      setIsMobile(mobileCheck || screenCheck);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Genera QR code quando il prodotto cambia
  useEffect(() => {
    if (product && product.model3DUrl) {
      generateQRCode(product.model3DUrl);
    }
  }, [product]);

  const generateQRCode = async (url) => {
    try {
      const qrDataURL = await QRCode.toDataURL(url, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      setQrCodeUrl(qrDataURL);
    } catch (error) {
      console.error('Errore nella generazione del QR code:', error);
    }
  };

  const handleScanSuccess = (result) => {
    setScannedData(result);
    setShowScanner(false);
    
    // Apri il modello 3D
    if (result?.text) {
      window.open(result.text, '_blank');
    }
  };

  const handleScanError = (error) => {
    console.warn('Errore scansione QR:', error);
  };

  const startAutoScan = () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      setShowScanner(true);
    } else {
      alert('La fotocamera non è disponibile su questo dispositivo');
    }
  };

  const openModel3D = () => {
    if (product?.model3DUrl) {
      window.open(product.model3DUrl, '_blank');
    }
  };

  if (!product) return null;

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton className="bg-gradient-primary text-white">
        <Modal.Title className="d-flex align-items-center">
          <i className="fas fa-cube me-2"></i>
          Modello 3D - {product.name}
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body className="text-center p-4">
        {!showScanner ? (
          <>
            {qrCodeUrl && (
              <div className="qr-container mb-4">
                <img 
                  src={qrCodeUrl} 
                  alt="QR Code per Modello 3D" 
                  className="qr-code mb-3"
                  style={{ maxWidth: '250px', width: '100%' }}
                />
                <p className="text-muted mb-3">
                  Scannerizza questo QR code per visualizzare il modello 3D
                </p>
              </div>
            )}

            <div className="d-flex-responsive justify-content-center">
              {isMobile && (
                <Button 
                  variant="primary" 
                  onClick={startAutoScan}
                  className="btn-lg mb-2 d-flex align-items-center"
                  style={{
                    background: 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)',
                    border: 'none',
                    borderRadius: '25px',
                    padding: '12px 24px',
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    boxShadow: '0 4px 15px rgba(0,123,255,0.3)'
                  }}
                >
                  <i className="fas fa-camera me-2"></i>
                  Scansiona Automaticamente
                </Button>
              )}
              
              <Button 
                variant="success" 
                onClick={openModel3D}
                className="btn-lg d-flex align-items-center"
                style={{
                  background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                  border: 'none',
                  borderRadius: '25px',
                  padding: '12px 24px',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  boxShadow: '0 4px 15px rgba(40,167,69,0.3)'
                }}
              >
                <i className="fas fa-eye me-2"></i>
                Visualizza Modello 3D
              </Button>
            </div>

            {isMobile && (
              <div className="mt-3 p-3 bg-light rounded">
                <small className="text-muted">
                  <i className="fas fa-info-circle me-1"></i>
                  Su mobile puoi usare la scansione automatica della fotocamera
                </small>
              </div>
            )}
          </>
        ) : (
          <div className="scanner-container">
            <h5 className="mb-3">Inquadra il QR Code</h5>
            <div style={{ maxWidth: '300px', margin: '0 auto' }}>
              <QrScanner
                onDecode={handleScanSuccess}
                onError={handleScanError}
                style={{ width: '100%' }}
                constraints={{
                  facingMode: 'environment' // Usa fotocamera posteriore
                }}
              />
            </div>
            <Button 
              variant="secondary" 
              onClick={() => setShowScanner(false)}
              className="mt-3"
            >
              <i className="fas fa-times me-2"></i>
              Annulla Scansione
            </Button>
          </div>
        )}

        {scannedData && (
          <div className="mt-3 p-3 bg-success text-white rounded">
            <i className="fas fa-check-circle me-2"></i>
            QR Code scansionato con successo!
          </div>
        )}
      </Modal.Body>
      
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Chiudi
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default QRCodeModal;
