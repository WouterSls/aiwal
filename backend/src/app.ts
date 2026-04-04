import express from "express";
import cors from "cors";
import { apiKeyMiddleware } from "./lib/api-key.middleware";
import usersRouter from "./app/users/users.router";
import authRouter from "./app/auth/auth.router";
import portfolioRouter from "./app/portfolio/portfolio.router";
import pricesRouter from "./app/prices/prices.router";
import ordersRouter from "./app/orders/orders.router";
import proposalsRouter from "./app/proposals/proposals.router";
import webhooksRouter from "./app/webhooks/webhooks.router";

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(express.json());

app.use("/api/webhooks", webhooksRouter);
app.use(apiKeyMiddleware);

app.use("/api/users", usersRouter);
app.use("/api/auth", authRouter);
app.use("/api/portfolio", portfolioRouter);
app.use("/api/prices", pricesRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/proposals", proposalsRouter);

export default app;
