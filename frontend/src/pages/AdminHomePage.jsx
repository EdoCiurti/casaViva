import React, { useEffect, useState } from "react";
import axios from "axios";
import { Button, Form, Modal } from "react-bootstrap";
import { ToastContainer, toast } from "react-toastify";
import DataTable from 'react-data-table-component';
import 'react-toastify/dist/ReactToastify.css';

const AdminHomePage = () => {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [showProductModal, setShowProductModal] = useState(false);
  const [productForm, setProductForm] = useState({ name: "", price: "", description: "", category: "", images: "", stock: "" });
  const [editingProduct, setEditingProduct] = useState(null);
  const [view, setView] = useState(""); // Stato per gestire la visualizzazione delle tabelle

  useEffect(() => {
    if (view === "orders") {
      fetchOrders();
    } else if (view === "products") {
      fetchProducts();
    }
  }, [view]);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:5000/api/orders", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.status === 200) {
        setOrders(response.data);
      } else {
        console.error("Errore nel recupero degli ordini: Stato della risposta non OK", response.status);
      }
    } catch (error) {
      console.error("Errore nel recupero degli ordini:", error.response ? error.response.data : error.message);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/products");
      setProducts(response.data);
    } catch (error) {
      console.error("Errore nel recupero dei prodotti:", error);
    }
  };

  const handleOrderStatusChange = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(`http://localhost:5000/api/orders/${orderId}/status`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchOrders();
      
      toast.success("Stato dell' ordine aggiornato con successo!", {
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
      console.error("Errore nell'aggiornamento dello stato dell'ordine:", error);
      
      toast.error("Errore nell'aggiornamento dello stato dell'ordine.");
    }
  };

  const handleProductFormChange = (e) => {
    setProductForm({ ...productForm, [e.target.name]: e.target.value });
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      if (editingProduct) {
        await axios.put(`http://localhost:5000/api/products/${editingProduct._id}`, productForm, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await axios.post("http://localhost:5000/api/products", productForm, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      fetchProducts();
      setShowProductModal(false);
      setProductForm({ name: "", price: "", description: "", category: "", images: "", stock: "" });
      setEditingProduct(null);
      
      toast.success("Prodotto salvato con successo!", {
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
      console.error("Errore nella gestione del prodotto:", error);
      
      toast.error("Errore nella gestione del prodotto.");
    }
  };

  const handleProductEdit = (product) => {
    setEditingProduct(product);
    setProductForm(product);
    setShowProductModal(true);
  };

  const handleProductDelete = async (productId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:5000/api/products/${productId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchProducts();
     toast.success("Prodotto eliminato con successo!", {
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
      console.error("Errore nella rimozione del prodotto:", error);
      
      toast.error("Errore nella rimozione del prodotto.");
    }
  };

  const orderColumns = [
    { name: 'ID Ordine', selector: row => row._id, sortable: true, width: '150px' },
    { name: 'Utente', selector: row => row.user.username, sortable: true, width: '150px' },
    { name: 'Prodotti', cell: row => (
      <ul>
        {row.products.map(item => (
          <li key={item._id}> - Quantità: {item.quantity}</li>
        ))}
      </ul>
    ), width: '300px' },
    { name: 'Totale', selector: row => `€${row.total.toFixed(2)}`, sortable: true, width: '100px' },
    { name: 'Stato', selector: row => row.status, sortable: true, width: '100px' },
    { name: 'Azioni', cell: row => (
      <Button
        variant="warning"
        onClick={() => handleOrderStatusChange(row._id, "Spedito")}
        disabled={row.status !== "In elaborazione"}
      >
        📦
      </Button>
    ), width: '100px' }
  ];

  const productColumns = [
    { name: 'ID Prodotto', selector: row => row._id, sortable: true, width: '150px' },
    { name: 'Nome', selector: row => row.name, sortable: true, width: '200px' },
    { name: 'Prezzo', selector: row => `€${row.price.toFixed(2)}`, sortable: true, width: '100px' },
    { name: 'Descrizione', selector: row => row.description, sortable: true, width: '200px' },
    { name: 'Categoria', selector: row => row.category, sortable: true, width: '150px' },
    { name: 'Immagini', cell: row => (
      row.images.map((image, index) => (
        <img key={index} src={image} alt={row.name} style={{ width: "50px" }} />
      ))
    ), width: '150px' },
    { name: 'Stock', selector: row => row.stock, sortable: true, width: '100px' },
    { name: 'Azioni', cell: row => (
      <>
        <Button variant="warning" onClick={() => handleProductEdit(row)}>✏️</Button>
        <Button variant="danger" onClick={() => handleProductDelete(row._id)}>❌</Button>
      </>
    ), width: '100px' }
  ];

  return (
    <div className="container mt-5">
      <h1 className="text-center mb-4">Pannello di Amministrazione</h1>

      <div className="d-flex justify-content-center mb-4">
        <Button variant="primary" className="me-2" onClick={() => setView("orders")}>Ordini</Button>
        <Button variant="primary" onClick={() => setView("products")}>Prodotti</Button>
      </div>

      {view === "orders" && (
        <>
          <h2>Ordini</h2>
          <DataTable
            columns={orderColumns}
            data={orders}
            pagination
          />
        </>
      )}

      {view === "products" && (
        <>
          <h2>Prodotti</h2>
          <Button variant="primary" onClick={() => { setEditingProduct(null); setProductForm({ name: "", price: "", description: "", category: "", images: "", stock: "" }); setShowProductModal(true); }}>Aggiungi Prodotto</Button>
          <DataTable
            columns={productColumns}
            data={products}
            pagination
          />
        </>
      )}

      <Modal show={showProductModal} onHide={() => setShowProductModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{editingProduct ? "Modifica Prodotto" : "Aggiungi Prodotto"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleProductSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Nome</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={productForm.name}
                onChange={handleProductFormChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Prezzo</Form.Label>
              <Form.Control
                type="number"
                name="price"
                value={productForm.price}
                onChange={handleProductFormChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Descrizione</Form.Label>
              <Form.Control
                type="text"
                name="description"
                value={productForm.description}
                onChange={handleProductFormChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Categoria</Form.Label>
              <Form.Control
                type="text"
                name="category"
                value={productForm.category}
                onChange={handleProductFormChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Immagini (URL separate da virgola)</Form.Label>
              <Form.Control
                type="text"
                name="images"
                value={productForm.images}
                onChange={handleProductFormChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Stock</Form.Label>
              <Form.Control
                type="number"
                name="stock"
                value={productForm.stock}
                onChange={handleProductFormChange}
                required
              />
            </Form.Group>
            <Button variant="primary" type="submit">
              {editingProduct ? "Aggiorna" : "Aggiungi"}
            </Button>
          </Form>
        </Modal.Body>
      </Modal>

      <ToastContainer />
    </div>
  );
};

export default AdminHomePage;