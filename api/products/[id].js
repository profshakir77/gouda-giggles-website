import { getDb, productsTable } from "../_db.js";
import { eq } from "drizzle-orm";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    const db = getDb();
    const id = parseInt(req.query.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid product id" });
    const rows = await db.select().from(productsTable).where(eq(productsTable.id, id));
    if (rows.length === 0) return res.status(404).json({ error: "Product not found" });
    const p = rows[0];
    res.json({ ...p, price: parseFloat(p.price) });
  } catch (err) {
    res.status(500).json({ error: "Failed to get product" });
  }
}
