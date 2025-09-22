import React, { forwardRef } from "react";

const Receipt = forwardRef(({ order }, ref) => {
  if (!order) return null;

  return (
    <div
      ref={ref}
      style={{
        width: "200px", // ✅ Narrow like a thermal roll
        fontFamily: "monospace",
        fontSize: "12px",
        padding: "5px",
      }}
    >
      <h3 style={{ textAlign: "center", margin: "5px 0" }}> AquaBliss</h3>
      <p style={{ textAlign: "center", margin: "2px 0" }}>Nairobi, Kenya</p>
      <p style={{ textAlign: "center", margin: "2px 0" }}>Tel: 0743 970 594</p>
      <hr />

      <p><b>Customer:</b> {order.customer_name}</p>
      <p><b>Phone:</b> {order.customer_phone}</p>
      <p><b>Date:</b> {new Date(order.created_at).toLocaleString()}</p>
      <hr />

      <table style={{ width: "100%" }}>
        <tbody>
          {order.items.map((item, i) => (
            <tr key={i}>
              <td>{item.name}</td>
              <td style={{ textAlign: "right", color: "green" }}>
                Ksh {item.price}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <hr />
      <p style={{ textAlign: "right", fontWeight: "bold", color: "green" }}>
        Total: Ksh {order.total}
      </p>
      <hr />

      <p style={{ textAlign: "center", margin: "5px 0" }}>
        For enquiries:<br />
        0743 970 594 / 0708 045 934<br />
        aquabliss217@gmail.com
      </p>

      <p style={{ textAlign: "center", margin: "5px 0" }}>
        Thank you for choosing AquaBliss! 
      </p>

      <p style={{ textAlign: "center", fontSize: "10px", marginTop: "10px" }}>
        ******** END OF RECEIPT ********
      </p>
    </div>
  );
});

export default Receipt;
