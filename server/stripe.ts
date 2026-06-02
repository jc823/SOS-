// ─── Stripe Service ───────────────────────────────────────────────────────────
import Stripe from "stripe";
import { ENV } from "./_core/env";

export const stripe = ENV.stripeSecretKey
  ? new Stripe(ENV.stripeSecretKey, { apiVersion: "2025-04-30.basil" })
  : null;

// ─── Plans ────────────────────────────────────────────────────────────────────
// Price IDs are created in your Stripe dashboard.
// Set these env vars after creating products in Stripe:
//   STRIPE_PRICE_PRO_MONTHLY
//   STRIPE_PRICE_AGENT_MONTHLY
export const PRICES = {
  pro:   process.env.STRIPE_PRICE_PRO_MONTHLY   ?? "",
  agent: process.env.STRIPE_PRICE_AGENT_MONTHLY ?? "",
};

export const PLAN_DETAILS = {
  free: {
    name: "Free",
    price: 0,
    description: "Public SOS Quiz only",
    features: ["SOS Quiz (lead magnet)", "See your score instantly", "Revenue gap estimate"],
  },
  pro: {
    name: "Pro",
    price: 159,
    description: "Full Scale Toolkit access",
    features: [
      "Full SOS Assessment tool",
      "Assessment history & dashboard",
      "Customer portal for your clients",
      "AI business coach (per client)",
      "Invite codes for clients",
      "Prediction engine insights",
      "Admin control panel",
    ],
  },
  agent: {
    name: "Agents",
    price: null, // TBD
    description: "Pro + AI agent suite",
    features: [
      "Everything in Pro",
      "AI agents (coming soon)",
      "Automated outreach",
      "Revenue growth automation",
    ],
    comingSoon: true,
  },
};

export type SubscriptionStatus = "free" | "pro" | "agent";

export function canAccessPro(status: SubscriptionStatus | null): boolean {
  return status === "pro" || status === "agent";
}
