// ─── GHL Webhook ─────────────────────────────────────────────────────────────
// Fires when a lead completes the gate form on the quiz page.
// Set VITE_GHL_WEBHOOK_URL in .env to activate.

export async function sendLeadToGHL(data: {
  name: string;
  email: string;
  phone: string;
  partialScore: number;
}) {
  const WEBHOOK_URL = import.meta.env.VITE_GHL_WEBHOOK_URL ?? "";
  if (!WEBHOOK_URL) return; // silently skip if not configured
  try {
    await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  } catch {
    // Non-blocking — don't crash the quiz if GHL is down
  }
}
