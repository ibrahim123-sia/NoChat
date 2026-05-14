import express from "express";
import "dotenv/config";
import cors from "cors";
import connectDB from "./configs/db.js";
import userRouter from "./routes/userRoutes.js";
import chatRouter from "./routes/chatRoutes.js";
import messageRouter from "./routes/messageRoutes.js";
import creditRouter from "./routes/creditRoutes.js";
import { stripeWebhooks } from "./controllers/webhooks.js";

const app = express();
await connectDB();

// CORS must be enabled before the Stripe webhook so Stripe servers (and any
// preflight) are not blocked. Stripe itself doesn't need CORS but it doesn't hurt.
app.use(cors());

// =============================================================================
// STRIPE WEBHOOK ENDPOINT
// =============================================================================
// IMPORTANT: this route MUST be registered BEFORE express.json() and MUST use
// express.raw() so that Stripe's signature verification (which hashes the exact
// raw bytes of the request body) works correctly. If you let express.json()
// parse this body first, the signature will never match.
// =============================================================================
app.post(
  "/api/stripe",
  express.raw({ type: "application/json" }),
  stripeWebhooks
);

// JSON body parser for everything else
app.use(express.json());

app.get("/", (req, res) => res.send("Server is Live"));
app.use("/api/user", userRouter);
app.use("/api/chat", chatRouter);
app.use("/api/message", messageRouter);
app.use("/api/credit", creditRouter);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on ${PORT}`);
});
