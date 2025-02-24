import { useEffect, useState } from "react";
import axios from "axios";
import { Button, Alert, ListGroup, Card, Modal } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { Plus, Minus, Trash } from "lucide-react";

const CartPage = () => {
  const [cart, setCart] = useState([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCart = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get("http://localhost:5000/api/cart", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const cartData = response.data;
        const productsWithDetails = await Promise.all(
          cartData.products.map(async (item) => {
            const productId = item.product._id;
            const productRes = await axios.get(
              `http://localhost:5000/api/products/${productId}`
            );
            return { ...productRes.data, quantity: item.quantity, cartItemId: item._id };
          })
        );

        setCart(productsWithDetails);
        const totalPrice = productsWithDetails.reduce((sum, item) => sum + item.price * item.quantity, 0);
        setTotal(totalPrice);
      } catch {
        setError("Errore nel recupero del carrello.");
      }
    };

    fetchCart();
  }, []);

  const updateQuantity = async (productId, newQuantity) => {
    if (newQuantity < 1) return; // Evita quantità negative o zero

    try {
      const token = localStorage.getItem("token");
      await axios.put(
        "http://localhost:5000/api/cart",
        { productId, quantity: newQuantity },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const updatedCart = cart.map(item =>
        item._id === productId ? { ...item, quantity: newQuantity } : item
      );
      setCart(updatedCart);

      // Ricalcola il totale
      const totalPrice = updatedCart.reduce((sum, item) => sum + item.price * item.quantity, 0);
      setTotal(totalPrice);
    } catch (error) {
      console.error("Errore aggiornamento quantità", error);
    }
  };

  const removeFromCart = async (cartItemId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:5000/api/cart/${cartItemId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const updatedCart = cart.filter(item => item.cartItemId !== cartItemId);
      setCart(updatedCart);
      const totalPrice = updatedCart.reduce((sum, item) => sum + item.price * item.quantity, 0);
      setTotal(totalPrice);
      setShowModal(false);
    } catch {
      setError("Errore nella rimozione del prodotto.");
    }
  };

  const handleShowModal = (item) => {
    setItemToDelete(item);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setItemToDelete(null);
  };

  return (
    <div className="container mt-5">
      <br></br><br></br>
      <h1 className="text-center mb-4">🛒 Il tuo Carrello</h1>
      {error && <Alert variant="danger">{error}</Alert>}
      <Card className="p-4 shadow-lg border-0">
        <ListGroup variant="flush">
          {cart.map((item) => (
            <ListGroup.Item key={item.cartItemId} className="d-flex justify-content-between align-items-center py-3 border-bottom">
              <div className="d-flex align-items-center">
                <img src={item.images} alt={item.name} className="rounded" style={{ width: "60px", height: "60px", marginRight: "20px" }} />
                <div>
                  <h5 className="fw-bold">{item.name}</h5>
                  <h6 className="fw-bold text-primary">Prezzo Totale: €{(item.price * item.quantity).toFixed(2)}</h6>
                </div>
              </div>
              <div className="d-flex align-items-center">
                {item.quantity > 1 ? (
                  <>
                    <Button
                      variant="outline-secondary"
                      onClick={() => updateQuantity(item._id, item.quantity - 1)}
                      className="me-2"
                    >
                      <Minus size={16} />
                    </Button>
                    <span className="mx-2">{item.quantity}</span>
                    <Button
                      variant="outline-primary"
                      onClick={() => updateQuantity(item._id, item.quantity + 1)}
                      className="me-2"
                    >
                      <Plus size={16} />
                    </Button>
                    <Button
                      variant="outline-danger"
                      onClick={() => handleShowModal(item)}
                      className="me-2"
                    >
                      <Trash size={16} />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline-danger"
                      onClick={() => handleShowModal(item)}
                      className="me-2"
                    >
                      <Trash size={16} />
                    </Button>
                    <span className="mx-2">{item.quantity}</span>
                    <Button
                      variant="outline-primary"
                      onClick={() => updateQuantity(item._id, item.quantity + 1)}
                      className="me-2"
                    >
                      <Plus size={16} />
                    </Button>
                  </>
                )}
              </div>
            </ListGroup.Item>
          ))}
        </ListGroup>
      </Card>
      <div className="mt-4 text-end">
        <h3 className="fw-bold">Totale: €{total.toFixed(2)}</h3>
        <Button variant="success" size="lg" className="shadow-sm" onClick={() => navigate("/checkout")} disabled={cart.length === 0}>
          🛒 Procedi al Checkout
        </Button>
      </div>

      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>Conferma Eliminazione</Modal.Title>
        </Modal.Header>
        <Modal.Body>Sei sicuro di voler eliminare questo prodotto dal carrello?</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Annulla
          </Button>
          <Button variant="danger" onClick={() => removeFromCart(itemToDelete.cartItemId)}>
            Elimina
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default CartPage;