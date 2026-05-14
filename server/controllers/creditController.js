// =============================================================================
// STRIPE PAYMENT GATEWAY - CHECKOUT SESSION CREATION
// =============================================================================
// This file does TWO things:
//   1. getPlans()       -> returns the credit packages the user can buy
//   2. purchasePlans()  -> creates a Stripe Checkout Session and redirects
//                          the user to Stripe's hosted payment page.
//
// HOW THE PAYMENT FLOW WORKS:
//
//   [Frontend]                [Backend]                  [Stripe]
//      |                         |                          |
//      |--- POST /purchase ----->|                          |
//      |                         |--- create session ------>|
//      |                         |<--- session.url ---------|
//      |<--- { url } ------------|                          |
//      |                                                    |
//      |---------- redirect (window.location.href) -------->|
//      |                                                    |
//      |   user enters card details on Stripe's page        |
//      |                                                    |
//      |<------ redirect back to success_url ---------------|
//      |                                                    |
//      |                         |<-- webhook event -- ----|
//      |                         | (payment_intent.succeeded)|
//      |                         |                          |
//      |              credits added to user in DB           |
//
// WHY WEBHOOKS instead of trusting the success_url?
//   The success_url just means "the browser landed back on our site". It does
//   NOT prove payment succeeded — a user could craft that URL manually. The
//   webhook is the ONLY trustworthy confirmation, and it's signed by Stripe.
// =============================================================================

import Transaction from "../models/Transaction.js";
import Stripe from "stripe";

// Plan catalog. Kept in code (not DB) because it changes rarely.
// To change pricing, edit here AND update any matching products in Stripe dashboard.
const plans = [
  {
    _id: "basic",
    name: "Basic",
    price: 10,
    credits: 100,
    features: [
      "100 text generations",
      "50 image generations",
      "Standard support",
      "Access to basic models",
    ],
  },
  {
    _id: "pro",
    name: "Pro",
    price: 20,
    credits: 500,
    features: [
      "500 text generations",
      "200 image generations",
      "Priority support",
      "Access to pro models",
      "Faster response time",
    ],
  },
  {
    _id: "premium",
    name: "Premium",
    price: 30,
    credits: 1000,
    features: [
      "1000 text generations",
      "500 image generations",
      "24/7 VIP support",
      "Access to premium models",
      "Dedicated account manager",
    ],
  },
];

// GET /api/credit/plan
// Returns the plan catalog so the Credits page can render the pricing cards.
export const getPlans = async (req, res) => {
  try {
    res.json({ success: true, plans });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Initialize Stripe with your SECRET key from Stripe dashboard.
// NEVER expose this key to the frontend — it can charge cards on your account.
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// POST /api/credit/purchase  (requires auth)
// Body: { planId: "basic" | "pro" | "premium" }
// Response: { success: true, url: "https://checkout.stripe.com/..." }
//
// The frontend redirects the browser to `url`; that page is hosted by Stripe
// and handles all the sensitive card input — we never touch card numbers.
export const purchasePlans = async (req, res) => {
  try {
    const { planId } = req.body;
    const userId = req.user._id;

    // Look up the plan locally instead of trusting whatever amount the client sent.
    // If we trusted req.body.price, a malicious user could pay $0.01 for 1000 credits.
    const plan = plans.find((plan) => plan._id === planId);

    if (!plan) {
      return res.json({ success: false, message: "Invalid Plan" });
    }

    // Create a Transaction record in our DB BEFORE redirecting to Stripe.
    // isPaid starts as false; the webhook will flip it to true after payment.
    // We pass this transaction's _id as metadata so the webhook can find it.
    const transaction = await Transaction.create({
      userId: userId,
      planId: plan._id,
      amount: plan.price,
      credits: plan.credits,
      isPaid: false,
    });

    // `origin` is the URL of the site that made the request (e.g. https://nochat.app).
    // We use it to build success/cancel URLs that point back at our frontend.
    const { origin } = req.headers;

    // Create the Stripe Checkout Session. This is what gives us the hosted payment URL.
    const session = await stripe.checkout.sessions.create({
      // What the customer is paying for. price_data lets us define a one-off
      // price inline; alternatively you can pre-create Products in Stripe and
      // reference them by `price: "price_xxx"` instead.
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: plan.price * 100, // amount in cents (Stripe uses smallest currency unit)
            product_data: {
              name: plan.name,
            },
          },
          quantity: 1,
        },
      ],

      // "payment" = one-off charge. Use "subscription" for recurring billing.
      mode: "payment",

      // Where Stripe redirects the browser after a successful payment.
      // /loading shows a spinner while we wait for the webhook to credit the account.
      success_url: `${origin}/loading`,

      // Where Stripe redirects if the user clicks "back" or cancels.
      cancel_url: `${origin}`,

      // Metadata travels with the session and shows up on the webhook event.
      // This is how the webhook knows which Transaction record to mark paid.
      metadata: {
        transactionId: transaction._id.toString(),
        appId: "nochat",
      },

      // Auto-expire the session after 30 minutes to prevent stale checkout links.
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
    });

    // Send the Stripe-hosted URL back; the frontend will redirect to it.
    res.json({ success: true, url: session.url });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
