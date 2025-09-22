// src/services/orderService.js

export const createOrder = async (cartItems, paymentMethod, customerName, customerPhone, transactionCode = null) => {
  try {
    const response = await fetch("http://localhost:5000/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer_name: customerName,
        customer_phone: customerPhone,
        items: cartItems,
        paymentMethod,
        transactionCode: paymentMethod === "Mpesa" ? transactionCode : null,
      }),
    });

    const data = await response.json();
    console.log("✅ Order created:", data);
    alert(`Order created successfully. Order ID: ${data.orderId}`);
    return data;
  } catch (error) {
    console.error("❌ Failed to create order:", error);
    throw error;
  }
};
