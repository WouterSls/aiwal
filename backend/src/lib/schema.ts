import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  dynamic_id: text("dynamic_id").notNull().unique(),
  wallet_address: text("wallet_address").notNull(),
  preset: text("preset").notNull(),
  dynamic_wallet_id: text("dynamic_wallet_id"),
  delegated_share: text("delegated_share"),
  wallet_api_key: text("wallet_api_key"),
  delegation_active: integer("delegation_active", { mode: "boolean" }).default(false),
  created_at: text("created_at"),
});

export const proposals = sqliteTable("proposals", {
  id: text("id").primaryKey(),
  user_id: text("user_id")
    .notNull()
    .references(() => users.id),
  type: text("type").notNull(),
  action: text("action").notNull(),
  token_in: text("token_in").notNull(),
  token_out: text("token_out").notNull(),
  amount_in: text("amount_in").notNull(),
  expected_out: text("expected_out"),
  slippage: text("slippage"),
  condition: text("condition"),
  status: text("status").default("confirmed"),
  created_at: text("created_at"),
  updated_at: text("updated_at"),
});

export const orders = sqliteTable("orders", {
  id: text("id").primaryKey(),
  proposal_id: text("proposal_id")
    .notNull()
    .references(() => proposals.id),
  tx_hash: text("tx_hash"),
  status: text("status").default("pending"),
  created_at: text("created_at"),
  updated_at: text("updated_at"),
});
