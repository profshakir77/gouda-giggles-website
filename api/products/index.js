import { getDb, productsTable } from "../_db.js";
import { eq } from "drizzle-orm";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    const db = getDb();
    const category = req.query.category;
    const rows = category
      ? await db.select().from(productsTable).where(eq(productsTable.category, category))
      : await db.select().from(productsTable);
    res.json(rows.map((p) => ({ ...p, price: parseFloat(p.price) })));
  } catch (err) {
    res.status(500).json({ error: "Failed to list products" });
  }
}
