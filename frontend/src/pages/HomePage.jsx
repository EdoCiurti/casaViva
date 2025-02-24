import { Container, Button } from "react-bootstrap";

const HomePage = () => {
  
  return (
    <Container 
      fluid 
      className="vh-100 w-100 d-flex flex-column justify-content-center align-items-center bg-light text-center"
      style={{ overflowX: 'hidden' }}
    >
      <h1 className="display-3 text-primary font-weight-bold">Benvenuto nel nostro E-commerce</h1>
      <p className="lead text-secondary">Sfoglia i nostri prodotti e aggiungili al carrello!</p>
      <Button variant="outline-primary" size="lg" href="/products" className="mt-3" style={{ width: '50%' }}>
        Esplora i Prodotti
      </Button>
    </Container>
  );
};

export default HomePage;
