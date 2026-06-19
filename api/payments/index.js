import { getDb, ordersTable, productsTable } from "../_db.js";
import { eq } from "drizzle-orm";
import { Client, Environment } from "square";
import { randomUUID } from "crypto";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    const db = getDb();
    const data = req.body;
    if (!data.sourceId || !data.customerName || !data.customerEmail || !Array.isArray(data.items)) {
      return res.status(400).json({ error: "Invalid payment data" });
    }

    const locationId = process.env.SQUARE_LOCATION_ID;
    if (!locationId) return res.status(500).json({ error: "Square location not configured" });

    let totalCents = 0;
    for (const item of data.items) {
      const rows = await db.select().from(productsTable).where(eq(productsTable.id, item.productId));
      if (rows.length > 0) totalCents += Math.round(parseFloat(rows[0].price) * 100) * item.quantity;
    }

    const env = process.env.SQUARE_ENVIRONMENT === "production" ? Environment.Production : Environment.Sandbox;
    const client = new Client({ accessToken: process.env.SQUARE_ACCESS_TOKEN, environment: env });

    const paymentResult = await client.paymentsApi.createPayment({
      sourceId: data.sourceId,
      idempotencyKey: randomUUID(),
      amountMoney: { amount: BigInt(totalCents), currency: "USD" },
      locationId,
      note: `Gouda Giggles order for ${data.customerName}`,
      buyerEmailAddress: data.customerEmail,
    });

    if (paymentResult.result.payment?.status !== "COMPLETED") {
      return res.status(402).json({ error: "Payment was not completed" });
    }

    const squarePaymentId = paymentResult.result.payment.id;

    const [order] = await db.insert(ordersTable).values({
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      customerPhone: data.customerPhone ?? null,
      eventDate: data.eventDate ?? null,
      deliveryAddress: data.deliveryAddress ?? null,
      specialInstructions: data.specialInstructions ?? null,
      status: "paid",
      total: (totalCents / 100).toFixed(2),
      items: data.items,
    }).returning();

    res.status(201).json({
      ...order,
      total: parseFloat(order.total),
      createdAt: order.createdAt.toISOString(),
      squarePaymentId,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Payment failed";
    res.status(500).json({ error: message });
  }
}
