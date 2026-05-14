// =============================================================================
// STRIPE PAYMENT GATEWAY - WEBHOOK HANDLER
// =============================================================================
// This file receives notifications (webhooks) FROM Stripe AFTER a customer
// pays on the Stripe Checkout page. Stripe sends an HTTP POST to our server
// telling us the payment succeeded/failed. We MUST verify the signature so
// only real Stripe events are trusted, then we credit the user's account.
//
// Flow:
//   1. User clicks "Buy Now"          -> creditController.purchasePlans()
//   2. We create a Stripe Checkout session and redirect the user to Stripe
//   3. User pays on Stripe's hosted page
//   4. Stripe calls THIS webhook (POST /api/stripe) with the event
//   5. We verify the signature, find the matching transaction, add credits.
// =============================================================================

import Stripe from "stripe";
import Transaction from "../models/Transaction.js";
import User from "../models/User.js";

export const stripeWebhooks = async (req, res) => {
  // Initialize Stripe SDK with your secret key (from Stripe dashboard -> Developers -> API keys)
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  // Stripe sends a signature header so we can prove this request really came from Stripe
  // (not from an attacker who guessed our endpoint URL).
  const sig = req.headers["stripe-signature"];

  let event;

  try {
    // constructEvent() verifies the signature using STRIPE_WEBHOOK_SECRET
    // (from Stripe dashboard -> Developers -> Webhooks -> your endpoint).
    // IMPORTANT: req.body MUST be the raw bytes here, not parsed JSON. That's why
    // server.js registers express.raw() on this route BEFORE express.json().
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    // Signature did not verify -> reject the request.
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }

  try {
    // Stripe sends many event types. We only care about successful payments.
    switch (event.type) {
      case "payment_intent.succeeded": {
        // The payment intent contains the ID of the actual charge.
        const paymentIntent = event.data.object;

        // We attached metadata (transactionId, appId) to the Checkout Session
        // when we created it, but the webhook gives us the PaymentIntent — not
        // the session — so we look up the session via the paymentIntent ID.
        const sessionList = await stripe.checkout.sessions.list({
          payment_intent: paymentIntent.id,
        });
        const session = sessionList.data[0];

        // Skip if metadata is missing (e.g. session expired or unrelated event)
        if (!session || !session.metadata) {
          return res.json({ received: true, message: "No session metadata" });
        }

        const { transactionId, appId } = session.metadata;

        // appId guards against accidentally crediting users when this Stripe
        // account is shared across multiple apps that share the same webhook.
        if (appId !== "nochat") {
          return res.json({
            received: true,
            message: "Ignored event: not for this app",
          });
        }

        // Look up the pending transaction we created before redirecting the user.
        // isPaid: false guards against double-crediting if Stripe retries the webhook.
        const transaction = await Transaction.findOne({
          _id: transactionId,
          isPaid: false,
        });

        if (!transaction) {
          // Already processed (or invalid). Acknowledge so Stripe stops retrying.
          return res.json({ received: true, message: "Transaction already processed" });
        }

        // Atomically add the purchased credits to the user's balance.
        await User.updateOne(
          { _id: transaction.userId },
          { $inc: { credits: transaction.credits } }
        );

        // Mark the transaction paid so the same webhook can't credit twice.
        transaction.isPaid = true;
        await transaction.save();

        break;
      }

      default:
        // Log other events for debugging but don't fail — Stripe expects 2xx.
        console.log("Unhandled event type:", event.type);
        break;
    }

    // ALWAYS return 2xx quickly. If we don't, Stripe will keep retrying.
    res.json({ received: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    res.status(500).send("Internal server error");
  }
};
