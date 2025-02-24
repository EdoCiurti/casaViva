import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Card, Button } from "react-bootstrap";

const ProductsPage = () => {
    const [products, setProducts] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const navigate = useNavigate();
    const productsPerPage = 9;

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await axios.get("http://localhost:5000/api/products");
                setProducts(response.data);
            } catch (error) {
                console.error("Errore nel recupero dei prodotti", error);
            }
        };

        fetchProducts();
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
        } catch (error) {
            console.error("Errore nell'aggiunta al carrello", error);
        }
    };

    const indexOfLastProduct = currentPage * productsPerPage;
    const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
    const currentProducts = products.slice(indexOfFirstProduct, indexOfLastProduct);

    const handleNextPage = () => {
        setCurrentPage(currentPage + 1);
    };

    const handlePreviousPage = () => {
        setCurrentPage(currentPage - 1);
    };

    return (
        <div className="container mt-5" style={{ paddingBottom: "10px", overflowY: "auto", minHeight: "200px" }}>
            <br /><br />
            <h1 className="text-center mb-4" style={{ color: '#007bff', fontWeight: 'bold' }}>Ecco i nostri prodotti.</h1>

            <div className="row">
                <br /><br />
                {currentProducts.map((product) => (
                    <div className="col-md-4 mb-4" key={product._id}>
                        <Card className="h-100 shadow-lg" style={{ borderRadius: '15px', overflow: 'hidden', transition: 'transform 0.3s', height: '400px' }}>
                            <Card.Img variant="top" src={product.images} alt={product.name} style={{ height: '300px', objectFit: 'cover' }} />
                            <Card.Body className="d-flex flex-column" style={{ backgroundColor: '#f8f9fa' }}>
                                <Card.Title style={{ color: '#343a40', fontWeight: 'bold' }}>{product.name}</Card.Title>
                                <Card.Text><strong style={{ color: '#28a745' }}>€{product.price}</strong></Card.Text>
                                <Button
                                    variant="primary"
                                    className="mt-auto"
                                    style={{ backgroundColor: '#007bff', borderColor: '#007bff', transition: 'background-color 0.3s, transform 0.3s' }}
                                    onMouseEnter={(e) => {
                                        e.target.style.backgroundColor = '#0056b3';
                                        e.target.style.transform = 'scale(1.05)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.backgroundColor = '#007bff';
                                        e.target.style.transform = 'scale(1)';
                                    }}
                                    onClick={() => addToCart(product._id)}
                                >
                                    Aggiungi al carrello
                                </Button>
                            </Card.Body>
                        </Card>
                    </div>
                ))}
            </div>

            <div className="d-flex justify-content-between mt-4">
                {currentPage > 1 && (
                    <Button variant="secondary" onClick={handlePreviousPage}>
                        Previous
                    </Button>
                )}
                {indexOfLastProduct < products.length && (
                    <Button variant="secondary" onClick={handleNextPage}>
                        Next
                    </Button>
                )}
            </div>
        </div>
    );
};

export default ProductsPage;
