// ─── Booking ──────────────────────────────────────────────────────────────────
// All "Book a Call" CTAs must point here. Change once, updates everywhere.
export const BOOKING_URL = "https://link.omniscalesystems.com/widget/bookings/scaleroadmapcallhmt7g2";

// ─── Auth helpers ─────────────────────────────────────────────────────────────
export function getLoginUrl(redirect?: string): string {
  if (redirect) {
    return `/login?redirect=${encodeURIComponent(redirect)}`;
  }
  return "/login";
}
