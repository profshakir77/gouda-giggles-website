import { getDb, ordersTable, productsTable } from "../_db.js";
import { eq } from "drizzle-orm";

export default async function handler(req, res) {
  if (req.method === "POST") {
    try {
      const db = getDb();
      const data = req.body;
      if (!data.customerName || !data.customerEmail || !Array.isArray(data.items)) {
        return res.status(400).json({ error: "Invalid order data" });
      }
      let total = 0;
      for (const item of data.items) {
        const rows = await db.select().from(productsTable).where(eq(productsTable.id, item.productId));
        if (rows.length > 0) total += parseFloat(rows[0].price) * item.quantity;
      }
      const [order] = await db.insert(ordersTable).values({
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone ?? null,
        eventDate: data.eventDate ?? null,
        deliveryAddress: data.deliveryAddress ?? null,
        specialInstructions: data.specialInstructions ?? null,
        status: "pending",
        total: total.toFixed(2),
        items: data.items,
      }).returning();
      return res.status(201).json({ ...order, total: parseFloat(order.total), createdAt: order.createdAt.toISOString() });
    } catch (err) {
      return res.status(500).json({ error: "Failed to create order" });
    }
  }
  res.status(405).json({ error: "Method not allowed" });
}
