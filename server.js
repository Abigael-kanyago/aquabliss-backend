const express = require('express');
const cors = require('cors');
const pool = require('./db'); // database connection from db.js

const app = express();

// ✅ CORS setup: allow your deployed frontend + localhost for dev
const allowedOrigins = [
  "https://aquabliss-frontend.vercel.app", // Vercel frontend
  "http://localhost:5173",                 // Vite dev
  "http://localhost:3000"                  // CRA dev
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type"]
}));

app.use(express.json());

// ================== ROUTES ==================
const orderRoutes = require('./routes/orders');
app.use('/orders', orderRoutes);

// ✅ ROOT ROUTE (fixes "Cannot GET /")
app.get('/', (req, res) => {
  res.send('🚀 AquaBliss API is running... Use /products or /orders');
});

// ================== TEST ROUTE ==================
app.get('/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ time: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).send("Database error");
  }
});

// ================== PRODUCTS ==================

// Get all products
app.get('/products', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products ORDER BY product_id');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching products");
  }
});

// Add a new product
app.post('/products', async (req, res) => {
  const { name, description, unit_price, stock_quantity } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO products (name, description, unit_price, stock_quantity) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, description, unit_price, stock_quantity]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error adding product");
  }
});

// ================== START SERVER ==================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));







