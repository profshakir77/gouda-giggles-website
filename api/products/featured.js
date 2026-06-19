import { getDb, productsTable } from "../_db.js";
import { eq, and } from "drizzle-orm";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(productsTable)
      .where(and(eq(productsTable.featured, true), eq(productsTable.inStock, true)));
    res.json(rows.map((p) => ({ ...p, price: parseFloat(p.price) })));
  } catch (err) {
    res.status(500).json({ error: "Failed to get featured products" });
  }
}
