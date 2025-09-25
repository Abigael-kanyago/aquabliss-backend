import React, { useState } from "react";
import { Container, Row, Col, Card, Button, Table, Navbar, Nav } from "react-bootstrap";

// Receipt component inside the same file for now
const Receipt = ({ order, onClose }) => {
  React.useEffect(() => {
    window.print();   // Auto print
    onClose();        // Close after printing
  }, []);

  return (
    <div style={{ width: "220px", fontSize: "12px" }}>
      <h3 style={{ textAlign: "center" }}> AquaBliss</h3>
      <p>Customer: {order.customer_name}</p>
      <p>Phone: {order.customer_phone}</p>
      <p>Date: {new Date(order.created_at).toLocaleString()}</p>
      <hr />
      {order.items.map((item, i) => (
        <p key={i}>
          {item.name} x {item.quantity} —{" "}
          <span style={{ color: "green" }}>
            Ksh {item.price * item.quantity}
          </span>
        </p>
      ))}
      <hr />
      <p>
        <b>Total:</b>{" "}
        <span style={{ color: "green" }}>Ksh {order.total}</span>
      </p>
      <hr />
      <p style={{ fontSize: "11px", textAlign: "center" }}>
        For more enquiries call <br />
        0743970594 / 0708045934 <br />
        aquabliss217@gmail.com
      </p>
    </div>
  );
};

function App() {
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [transactionCode, setTransactionCode] = useState("");
  const [lastOrder, setLastOrder] = useState(null); //  store order for receipt

  // Product list
  const products = [
    { id: 1, name: "20L Water", price: 250, image: "/images/20l-water.jpg" },
    { id: 2, name: "10L Water", price: 150, image: "/images/10l-water.jpg" },
    { id: 3, name: "5L Water", price: 80, image: "/images/5l-water.jpg" },
    { id: 4, name: "Pump", price: 1000, image: "/images/pump.jpg" },
    { id: 5, name: "Empty Bottle (10L)", price: 200, image: "/images/empty-bottle.jpg" },
    { id: 6, name: "1 litre small pack (12 pack case)", price: 350, image: "/images/1litre.jpg" },
    { id: 7, name: "500ml small pack (24 pack case)", price: 650, image: "/images/500ml.jpg" },
    { id: 8, name: "Branding-label design", price: 1500, image: "/images/label.jpg" },
  ];

  const addToCart = (product) => {
    const existingItem = cart.find((item) => item.id === product.id);
    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      );
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const decreaseQty = (id) => {
    setCart(
      cart
        .map((item) =>
          item.id === id ? { ...item, quantity: item.quantity - 1 } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const total = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  //  Checkout Handler
const handleCheckout = async () => {
  try {
    const API_BASE = process.env.REACT_APP_API_URL; // 🔑 dynamic base URL

    const response = await fetch(`${API_BASE}/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer_name: customerName || "Walk-in Customer",
        customer_phone: customerPhone || null,
        items: cart.map((item) => ({
          product_id: item.id,
          name: item.name,   // include for receipt
          price: item.price, // include for receipt
          quantity: item.quantity,
        })),
        paymentMethod,
        transactionCode: paymentMethod === "Mpesa" ? transactionCode : null,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      alert("Error: " + data.error);
      return;
    }

    const orderId = data.orderId;

      //  Save for small receipt print
      setLastOrder({
        orderId,
        customer_name: customerName || "Walk-in Customer",
        customer_phone: customerPhone || "N/A",
        created_at: new Date().toISOString(),
        items: cart,
        total,
      });

      //  Open receipt directly from backend
    window.open(`${API_BASE}/orders/${orderId}/receipt`, "_blank");

    // Reset form
    setCart([]);
    setCustomerName("");
    setCustomerPhone("");
    setPaymentMethod("Cash");
    setTransactionCode("");

  } catch (error) {
    console.error(" Checkout failed:", error);
    alert("Something went wrong during checkout.");
  }
};

  return (
    <>
      {/* Header */}
      <Navbar bg="primary" variant="dark" expand="lg" className="mb-4 shadow">
        <Container>
          <Navbar.Brand href="#">
             <b>AquaBliss</b>
          </Navbar.Brand>
          <Nav className="ms-auto">
            <Nav.Link href="#">Home</Nav.Link>
            <Nav.Link href="#">Products</Nav.Link>
            <Nav.Link href="#">About</Nav.Link>
          </Nav>
        </Container>
      </Navbar>

      <Container fluid className="mt-4 bg-light">
        <Row>
          {/* Product List */}
          <Col md={9}>
            <h3 className="text-primary mb-3">Available Products</h3>
            <Row>
              {products.map((product) => (
                <Col md={4} key={product.id} className="mb-4">
                  <Card className="shadow-sm border-0">
                    <Card.Img
                      variant="top"
                      src={product.image}
                      alt={product.name}
                      style={{ height: "150px", objectFit: "contain" }}
                    />
                    <Card.Body className="text-center">
                      <Card.Title className="text-dark">{product.name}</Card.Title>
                      <Card.Text style={{ color: "green", fontWeight: "bold" }}>
                        Ksh {product.price}
                      </Card.Text>
                      <Button
                        variant="primary"
                        onClick={() => addToCart(product)}
                      >
                        Add to Cart
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          </Col>

          {/* Cart Section */}
          <Col md={3} className="bg-white shadow p-3">
            <h4 className="text-primary">🛒 Cart</h4>
            <Table striped bordered hover>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
                {cart.map((item) => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td>
                      <Button
                        size="sm"
                        variant="outline-danger"
                        onClick={() => decreaseQty(item.id)}
                      >
                        -
                      </Button>{" "}
                      {item.quantity}{" "}
                      <Button
                        size="sm"
                        variant="outline-success"
                        onClick={() => addToCart(item)}
                      >
                        +
                      </Button>
                    </td>
                    <td style={{ color: "green", fontWeight: "bold" }}>
                      Ksh {item.price * item.quantity}
                    </td>
                  </tr>
                ))}
                <tr>
                  <td colSpan="2">
                    <b>Total</b>
                  </td>
                  <td style={{ color: "green", fontWeight: "bold" }}>
                    Ksh {total}
                  </td>
                </tr>
              </tbody>
            </Table>

            {/* Customer Info Form */}
            <hr />
            <h5 className="text-dark">Customer Info</h5>
            <input
              type="text"
              className="form-control mb-2"
              placeholder="Customer Name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
            <input
              type="text"
              className="form-control mb-2"
              placeholder="Phone Number"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
            />

            <select
              className="form-control mb-2"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              <option value="Cash">Cash</option>
              <option value="Mpesa">Mpesa</option>
            </select>

            {paymentMethod === "Mpesa" && (
              <input
                type="text"
                className="form-control mb-2"
                placeholder="Mpesa Transaction Code"
                value={transactionCode}
                onChange={(e) => setTransactionCode(e.target.value)}
              />
            )}

            <Button
              variant="success"
              disabled={cart.length === 0}
              onClick={handleCheckout}
            >
              Checkout & Print Receipt
            </Button>
          </Col>
        </Row>
      </Container>

      {/* Auto Print Receipt */}
      {lastOrder && (
        <Receipt order={lastOrder} onClose={() => setLastOrder(null)} />
      )}
    </>
  );
}

export default App;








