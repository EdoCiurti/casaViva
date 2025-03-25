import { useEffect, useState } from "react";
import axios from "axios";
import { Button, Alert, ListGroup, Card, Modal } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { Trash } from "lucide-react";
import LoadingSpinner from "../components/LoadingSpinner";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const WishlistPage = () => {
  const [wishlist, setWishlist] = useState([]);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchWishlist = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get("http://localhost:5000/api/wishlist", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const wishlistData = response.data;
        const productsWithDetails = await Promise.all(
          wishlistData.products.map(async (item) => {
            const productId = item.product._id;
            const productRes = await axios.get(
              `http://localhost:5000/api/products/${productId}`
            );
            return { ...productRes.data, addedAt: item.addedAt };
          })
        );

        setWishlist(productsWithDetails);
      } catch (error) {
        console.error("Errore nel recupero della wishlist:", error);
        setError("Errore nel recupero della wishlist.");
      } finally {
        setLoading(false);
      }
    };

    fetchWishlist();
  }, []);

  const removeFromWishlist = async (productId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:5000/api/wishlist/${productId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setWishlist((prev) => prev.filter((item) => item._id !== productId));
      setShowModal(false);

      toast.success("Prodotto rimosso dalla wishlist!", {
        position: "top-right",
        autoClose: 3000,
        theme: "colored",
      });
    } catch (err) {
      console.error("Errore nella rimozione del prodotto", err);
      setError("Errore nella rimozione del prodotto.");
    }
  };

  const clearWishlist = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete("http://localhost:5000/api/wishlist", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setWishlist([]); // Pulisce lo stato
    } catch {
      setError("Errore nello svuotamento della wishlist.");
    }
  };

  const handleShowModal = (item) => {
    setItemToDelete(item._id);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setItemToDelete(null);
  };

  const addToCart = async (productId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Devi essere loggato per aggiungere prodotti al carrello.");
        return;
      }

      await axios.post(
        "http://localhost:5000/api/cart",
        { productId, quantity: 1 },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Prodotto aggiunto al carrello!", {
        position: "top-right",
        autoClose: 3000,
        theme: "colored",
      });
    } catch (err) {
      console.error("Errore nell'aggiunta al carrello:", err);
      setError("Errore nell'aggiunta al carrello.");
    }
  };

  const addAllToCart = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Devi essere loggato per aggiungere prodotti al carrello.");
        return;
      }

      await Promise.all(
        wishlist.map((item) =>
          axios.post(
            "http://localhost:5000/api/cart",
            { productId: item._id, quantity: 1 },
            { headers: { Authorization: `Bearer ${token}` } }
          )
        )
      );

      toast.success("Tutti i prodotti sono stati aggiunti al carrello!", {
        position: "top-right",
        autoClose: 3000,
        theme: "colored",
      });

      navigate("/cart");
    } catch (err) {
      console.error("Errore nell'aggiunta dei prodotti al carrello:", err);
      setError("Errore nell'aggiunta dei prodotti al carrello.");
    }
  };

  return (
    <div className="container mt-5">
      <br></br>
      <br></br>
      <h1 className="text-center mb-4">💖 La tua Wishlist</h1>
      {error && <Alert variant="danger">{error}</Alert>}
      <Card className="p-4 shadow-lg border-0">
        {loading ? (
          <div className="text-center py-5">
            <LoadingSpinner />
          </div>
        ) : wishlist.length === 0 ? (
          <div className="text-center py-5">
            <h5 className={isDarkMode ? "text-light" : "text-muted"}>
              Nessun prodotto nella wishlist
            </h5>
          </div>
        ) : (
          <ListGroup variant="flush">
            {wishlist.map((item) => (
              <ListGroup.Item
                key={item._id}
                className="d-flex justify-content-between align-items-center py-3 border-bottom"
              >
                <div className="d-flex align-items-center">
                  <img
                    src={item.images}
                    alt={item.name}
                    className="rounded"
                    style={{
                      width: "60px",
                      height: "60px",
                      marginRight: "20px",
                    }}
                  />
                  <div>
                    <h5 className="fw-bold">{item.name}</h5>
                    <h6 className="fw-bold text-primary">
                      Prezzo: €{item.price.toFixed(2)}
                    </h6>
                    <p className="text-muted">
                      Aggiunto il:{" "}
                      {new Date(item.addedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="d-flex align-items-center">
                  <Button
                    variant="outline-success"
                    onClick={() => addToCart(item._id)}
                    className="me-2"
                    title="Aggiungi al carrello"
                  >
                    🛒
                  </Button>
                  <Button
                    variant="outline-danger"
                    onClick={() => handleShowModal(item)}
                    title="Rimuovi dalla wishlist"
                  >
                    <Trash size={16} />
                  </Button>
                </div>
              </ListGroup.Item>
            ))}
          </ListGroup>
        )}
      </Card>
      <div className="mt-4 text-end">
        <Button
          variant="danger"
          size="lg"
          className="shadow-sm me-2"
          onClick={clearWishlist}
          disabled={wishlist.length === 0}
        >
          🗑 Svuota Wishlist
        </Button>
        <Button
          variant="primary"
          size="lg"
          className="shadow-sm me-2"
          onClick={addAllToCart}
          disabled={wishlist.length === 0}
        >
          🛒 Aggiungi Tutto al Carrello
        </Button>
        <Button
          variant="success"
          size="lg"
          className="shadow-sm"
          onClick={() => navigate("/products")}
        >
          🛒 Vai ai Prodotti
        </Button>
      </div>

      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>Conferma Eliminazione</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Sei sicuro di voler eliminare questo prodotto dalla wishlist?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Annulla
          </Button>
          <Button
            variant="danger"
            onClick={() => removeFromWishlist(itemToDelete)}
          >
            Elimina
          </Button>
        </Modal.Footer>
      </Modal>
      <ToastContainer />
    </div>
  );
};

export default WishlistPage;