import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not defined");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-11-20.acacia",
  typescript: true,
});

// Price IDs
export const PRICE_IDS = {
  INDIVIDUAL_MONTHLY: process.env.STRIPE_PRICE_ID_INDIVIDUAL!,
  TEAM_MONTHLY: process.env.STRIPE_PRICE_ID_TEAM!,
} as const;

// Product features
export const PRODUCT_FEATURES = {
  INDIVIDUAL: [
    "Unlimited focus sessions",
    "Smart matching algorithm",
    "Streak tracking",
    "Progress analytics",
    "Session recaps",
    "Priority support",
  ],
  TEAM: [
    "Everything in Individual",
    "Team workspaces",
    "OKR integration",
    "Team analytics",
    "Admin dashboard",
    "Dedicated support",
  ],
} as const;
