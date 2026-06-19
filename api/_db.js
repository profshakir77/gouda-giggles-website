import { drizzle } from "drizzle-orm/node-postgres";
import { pgTable, serial, text, boolean, numeric, jsonb, timestamp } from "drizzle-orm/pg-core";
import pkg from "pg";
const { Pool } = pkg;

export const productsTable = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  category: text("category").notNull(),
  imageUrl: text("image_url"),
  featured: boolean("featured").default(false),
  inStock: boolean("in_stock").default(true),
  servings: text("servings"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const ordersTable = pgTable("orders", {
  id: serial("id").primaryKey(),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone"),
  eventDate: text("event_date"),
  deliveryAddress: text("delivery_address"),
  specialInstructions: text("special_instructions"),
  status: text("status").default("pending"),
  total: numeric("total", { precision: 10, scale: 2 }).notNull(),
  items: jsonb("items"),
  createdAt: timestamp("created_at").defaultNow(),
});

let _db;
export function getDb() {
  if (!_db) {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    _db = drizzle(pool, { schema: { productsTable, ordersTable } });
  }
  return _db;
}
