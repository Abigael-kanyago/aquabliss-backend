const express = require('express');
const router = express.Router();
const pool = require('../db');
const PDFDocument = require('pdfkit');

//  Create a new order
router.post('/', async (req, res) => {
  const { customer_name, customer_phone, items, paymentMethod, transactionCode } = req.body;

  try {
    // Calculate total
    let total = 0;
    for (let item of items) {
      const productResult = await pool.query(
        'SELECT unit_price FROM products WHERE product_id = $1',
        [item.product_id]
      );

      if (productResult.rows.length === 0) {
        return res.status(400).json({ error: `Product ID ${item.product_id} not found` });
      }

      const unitPrice = Number(productResult.rows[0].unit_price);
      item.unit_price = unitPrice;
      item.subtotal = unitPrice * item.quantity;
      total += item.subtotal;
    }

    // Insert order
    const orderResult = await pool.query(
      `INSERT INTO orders (customer_name, customer_phone, total_amount, status, payment_method, transaction_code)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING order_id`,
      [customer_name || null, customer_phone || null, total, 'Paid', paymentMethod, transactionCode]
    );

    const orderId = orderResult.rows[0].order_id;

    // Insert items
    for (let item of items) {
      await pool.query(
        `INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal) 
         VALUES ($1, $2, $3, $4, $5)`,
        [orderId, item.product_id, item.quantity, item.unit_price, item.subtotal]
      );
    }

    res.json({ message: '✅ Order created successfully', orderId, total });
  } catch (err) {
    console.error("❌ Order creation failed:", err.message);
    res.status(500).json({ error: err.message });
  }
});

//  Get receipt JSON
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const order = await pool.query('SELECT * FROM orders WHERE order_id = $1', [id]);
    if (order.rows.length === 0) return res.status(404).json({ error: 'Order not found' });

    const items = await pool.query(
      `SELECT oi.product_id, p.name AS product_name, oi.quantity, oi.unit_price, oi.subtotal
       FROM order_items oi
       JOIN products p ON oi.product_id = p.product_id
       WHERE oi.order_id = $1`,
      [id]
    );

    res.json({ order: order.rows[0], items: items.rows });
  } catch (err) {
    console.error("❌ Receipt fetch failed:", err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// ✅ Generate POS-style small PDF receipt
router.get('/:id/receipt', async (req, res) => {
  const { id } = req.params;

  try {
    const orderResult = await pool.query('SELECT * FROM orders WHERE order_id = $1', [id]);
    if (orderResult.rows.length === 0) return res.status(404).json({ error: 'Order not found' });
    const order = orderResult.rows[0];

    const itemsResult = await pool.query(
      `SELECT oi.product_id, p.name AS product_name, oi.quantity, oi.unit_price, oi.subtotal
       FROM order_items oi
       JOIN products p ON oi.product_id = p.product_id
       WHERE oi.order_id = $1`,
      [id]
    );
    const items = itemsResult.rows;

    // ✅ Small POS-style receipt (80mm width ~ 226px)
    const doc = new PDFDocument({
      size: [226, 600],
      margins: { top: 10, bottom: 10, left: 10, right: 10 }
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=receipt-${id}.pdf`);
    doc.pipe(res);

    // --- HEADER ---
    doc.fontSize(14).text("AQUABLISS", { align: "center" });
    doc.fontSize(10).text("Water POS Receipt", { align: "center" });
    doc.moveDown();

    // --- CUSTOMER INFO ---
    doc.fontSize(9).text(`Order ID: ${order.order_id}`);
    doc.text(`Customer: ${order.customer_name || "Walk-in"}`);
    doc.text(`Phone: ${order.customer_phone || "N/A"}`);
    doc.text(`Payment: ${order.payment_method}`);
    if (order.payment_method === "Mpesa") {
      doc.text(`Code: ${order.transaction_code || "---"}`);
    }
    doc.text(`Date: ${order.created_at ? new Date(order.created_at).toLocaleString() : new Date().toLocaleString()}`);
    doc.moveDown();

    // --- ITEMS HEADER ---
    doc.fontSize(9).text("Item       Qty   Price   Subtotal");
    doc.moveTo(10, doc.y).lineTo(210, doc.y).stroke();
    doc.moveDown(0.3);

    // --- ITEMS ---
    items.forEach(item => {
      const unitPrice = Number(item.unit_price).toFixed(2);
      const subtotal = Number(item.subtotal).toFixed(2);

      doc.fontSize(9).text(
        `${item.product_name.substring(0, 12).padEnd(12)}  ${item.quantity}   ${unitPrice}   ${subtotal}`
      );
    });

    doc.moveDown();
    doc.moveTo(10, doc.y).lineTo(210, doc.y).stroke();

    // --- TOTAL ---
    doc.fontSize(10).text(`TOTAL: KES ${Number(order.total_amount).toFixed(2)}`, {
      align: "right"
    });

    doc.moveDown(1);

    // --- FOOTER ---
    doc.fontSize(8).text(" Thank you for choosing  AquaBliss!", { align: "center" });
    doc.text("For enquiries: 0743970594 / 0708045934", { align: "center" });
    doc.text("Email: aquabliss217@gmail.com", { align: "center" });

    doc.end();
  } catch (err) {
    console.error("❌ PDF receipt generation failed:", err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all orders
router.get('/', async (req, res) => {
  try {
    const orders = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
    res.json(orders.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;





