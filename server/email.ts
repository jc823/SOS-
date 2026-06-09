import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM_EMAIL ?? "Scale Detailing System <system@scaledetailingsystem.com>";
const APP_URL = process.env.APP_URL ?? "https://sos-production-ab11.up.railway.app";
const BOOK_URL = "https://link.omniscalesystems.com/widget/bookings/scaleroadmapcallhmt7g2";

// Palette — used across all templates
const C = {
  outer:   "#e8e6df",   // warm cream outer background
  card:    "#111111",   // near-black card
  card2:   "#1a1a1a",   // slightly lighter card for inset boxes
  border:  "#2a2a2a",   // card border / divider
  gold:    "#c9a84c",   // primary gold
  goldDim: "#8a6f2e",   // muted gold for borders
  white:   "#ffffff",
  body:    "#9a9a9a",   // body copy
  muted:   "#555555",   // de-emphasized text
  dim:     "#333333",   // footer text
  scoreStrong:    "#4ade80",
  scoreGrowing:   "#c9a84c",
  scoreDeveloping:"#fb923c",
  scoreEarly:     "#f87171",
};

function scoreInfo(score: number) {
  if (score >= 80) return { label: "Strong",      color: C.scoreStrong };
  if (score >= 60) return { label: "Growing",     color: C.scoreGrowing };
  if (score >= 40) return { label: "Developing",  color: C.scoreDeveloping };
  return             { label: "Early Stage",  color: C.scoreEarly };
}

// ─── Shared layout wrapper ────────────────────────────────────────────────────
// Outer = warm cream (renders in every client). Card = near-black with gold bar.
function wrap(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="margin:0;padding:0;background-color:${C.outer};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="${C.outer}" style="background-color:${C.outer};">
<tr><td align="center" bgcolor="${C.outer}" style="background-color:${C.outer};padding:32px 16px 40px;">

  <!-- Card -->
  <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

    <!-- Gold top bar -->
    <tr><td bgcolor="${C.gold}" height="4" style="background-color:${C.gold};font-size:0;line-height:0;border-radius:6px 6px 0 0;">&nbsp;</td></tr>

    <!-- Card body -->
    <tr><td bgcolor="${C.card}" style="background-color:${C.card};border-radius:0 0 8px 8px;padding:0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">

        <!-- Brand header -->
        <tr><td bgcolor="${C.card}" style="background-color:${C.card};padding:32px 36px 24px;text-align:center;">
          <p style="margin:0 0 4px;font-size:10px;letter-spacing:6px;text-transform:uppercase;color:${C.gold};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">SCALE DETAILING SYSTEM</p>
          <p style="margin:0;font-size:22px;font-weight:900;color:${C.white};letter-spacing:-0.3px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">SOS Scorecard</p>
        </td></tr>

        <!-- Hairline under brand -->
        <tr><td bgcolor="${C.card}" style="background-color:${C.card};padding:0 36px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr><td bgcolor="${C.border}" height="1" style="background-color:${C.border};font-size:0;line-height:0;">&nbsp;</td></tr>
          </table>
        </td></tr>

        <!-- Content slot -->
        ${content}

        <!-- Footer -->
        <tr><td bgcolor="${C.card}" style="background-color:${C.card};padding:24px 36px 32px;text-align:center;border-top:1px solid ${C.border};">
          <p style="margin:0 0 4px;font-size:11px;color:${C.dim};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">Scale Detailing System &middot; SOS Scorecard</p>
          <p style="margin:0;font-size:11px;color:${C.dim};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
            Reply anytime &nbsp;&bull;&nbsp; <a href="${BOOK_URL}" style="color:${C.gold};text-decoration:none;">Book a strategy call</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>

</td></tr>
</table>
</body>
</html>`;
}

// ─── Reusable block: score badge ──────────────────────────────────────────────
function scoreBadge(score: number): string {
  const { label, color } = scoreInfo(score);
  const barWidth = Math.round(score * 4.9); // px out of ~490
  return `
<tr><td bgcolor="${C.card}" style="background-color:${C.card};padding:24px 36px 0;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${C.goldDim};border-radius:8px;">
  <tr><td bgcolor="${C.card2}" style="background-color:${C.card2};padding:28px 24px;text-align:center;border-radius:8px;">
    <p style="margin:0 0 8px;font-size:10px;letter-spacing:5px;text-transform:uppercase;color:${C.gold};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">YOUR SOS SCORE</p>
    <p style="margin:0 0 4px;font-size:68px;font-weight:900;color:${C.white};line-height:1;letter-spacing:-2px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">${score}<span style="font-size:28px;color:${C.gold};font-weight:700;">/100</span></p>
    <p style="margin:0 0 20px;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:4px;color:${color};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">${label}</p>
    <!-- Progress bar -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    <tr><td bgcolor="#2a2a2a" style="background-color:#2a2a2a;border-radius:4px;height:6px;font-size:0;line-height:0;">
      <table role="presentation" cellpadding="0" cellspacing="0">
      <tr><td bgcolor="${color}" width="${barWidth}" height="6" style="background-color:${color};border-radius:4px;font-size:0;line-height:0;max-width:${barWidth}px;">&nbsp;</td></tr>
      </table>
    </td></tr>
    </table>
  </td></tr>
  </table>
</td></tr>`;
}

// ─── Reusable block: gold CTA button ─────────────────────────────────────────
function ctaButton(href: string, label: string): string {
  return `
<tr><td bgcolor="${C.card}" style="background-color:${C.card};padding:28px 36px 0;text-align:center;">
  <a href="${href}" style="display:inline-block;background-color:${C.gold};color:#000000;text-decoration:none;font-weight:800;font-size:13px;letter-spacing:2px;padding:15px 44px;border-radius:8px;text-transform:uppercase;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">${label}</a>
</td></tr>`;
}

// ─── Reusable block: outline CTA button ──────────────────────────────────────
function ctaOutline(href: string, label: string): string {
  return `
<tr><td bgcolor="${C.card}" style="background-color:${C.card};padding:20px 36px 0;text-align:center;">
  <a href="${href}" style="display:inline-block;background-color:${C.card};color:${C.gold};text-decoration:none;font-weight:700;font-size:12px;letter-spacing:2px;padding:13px 36px;border-radius:8px;border:1.5px solid ${C.goldDim};text-transform:uppercase;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">${label}</a>
</td></tr>`;
}

// ─── Core send helper ─────────────────────────────────────────────────────────
async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  if (!process.env.RESEND_API_KEY) {
    console.log(`[Email] No RESEND_API_KEY — would have sent "${subject}" to ${to}`);
    return;
  }
  try {
    const { error } = await resend.emails.send({ from: FROM, to, subject, html });
    if (error) console.error("[Email] Send error:", error);
    else console.log(`[Email] Sent "${subject}" to ${to}`);
  } catch (err) {
    console.error("[Email] Unexpected error:", err);
  }
}

// ─── Welcome email (new quiz registration) ───────────────────────────────────
export async function sendWelcomeEmail({
  to, name, username, password, score,
}: {
  to: string; name: string; username: string; password: string; score?: number;
}) {
  const firstName = name.split(" ")[0];
  const loginUrl = `${APP_URL}/login`;

  const content = `
<tr><td bgcolor="${C.card}" style="background-color:${C.card};padding:32px 36px 0;">
  <p style="margin:0 0 6px;font-size:10px;letter-spacing:4px;text-transform:uppercase;color:${C.gold};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">YOUR RESULTS ARE IN</p>
  <p style="margin:0 0 16px;font-size:21px;font-weight:800;color:${C.white};line-height:1.3;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">Hey ${firstName}, here's what your score means.</p>
  <p style="margin:0 0 12px;font-size:15px;line-height:1.8;color:${C.body};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">You just completed the SOS Assessment. Most shop owners who take this are surprised by what it surfaces — the gaps they couldn't see from inside the business.</p>
  <p style="margin:0;font-size:15px;line-height:1.8;color:${C.body};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">Your full breakdown is live in your account right now.</p>
</td></tr>

${score != null ? scoreBadge(score) : ""}

${ctaButton(loginUrl, "See My Full Breakdown →")}

<!-- Credentials box -->
<tr><td bgcolor="${C.card}" style="background-color:${C.card};padding:24px 36px 0;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${C.border};border-radius:8px;">
  <tr><td bgcolor="${C.card2}" style="background-color:${C.card2};padding:20px 24px;border-radius:8px;">
    <p style="margin:0 0 14px;font-size:10px;letter-spacing:4px;text-transform:uppercase;color:${C.gold};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">YOUR LOGIN — SAVE THIS</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td width="100" style="padding:9px 0;font-size:12px;color:${C.muted};border-bottom:1px solid ${C.border};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">Username</td>
        <td style="padding:9px 0;font-size:14px;font-weight:700;color:${C.white};font-family:'Courier New',Courier,monospace;border-bottom:1px solid ${C.border};">${username}</td>
      </tr>
      <tr>
        <td width="100" style="padding:9px 0;font-size:12px;color:${C.muted};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">Password</td>
        <td style="padding:9px 0;font-size:14px;font-weight:700;color:${C.white};font-family:'Courier New',Courier,monospace;">${password}</td>
      </tr>
    </table>
  </td></tr>
  </table>
</td></tr>

<!-- Divider -->
<tr><td bgcolor="${C.card}" style="background-color:${C.card};padding:32px 36px 0;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
  <tr><td bgcolor="${C.border}" height="1" style="background-color:${C.border};font-size:0;line-height:0;">&nbsp;</td></tr>
  </table>
</td></tr>

<!-- Book a call -->
<tr><td bgcolor="${C.card}" style="background-color:${C.card};padding:28px 36px 0;">
  <p style="margin:0 0 6px;font-size:10px;letter-spacing:4px;text-transform:uppercase;color:${C.gold};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">READY TO ACT ON IT?</p>
  <p style="margin:0 0 10px;font-size:18px;font-weight:800;color:${C.white};line-height:1.3;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">Let's turn your score into a real plan.</p>
  <p style="margin:0;font-size:14px;line-height:1.8;color:${C.body};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">Book a free strategy call and I'll walk through your results with you — where you're leaving money on the table, what to fix first, and exactly how to scale from where you are right now.</p>
</td></tr>

${ctaOutline(BOOK_URL, "Book Your Free Strategy Call →")}

<!-- PS -->
<tr><td bgcolor="${C.card}" style="background-color:${C.card};padding:28px 36px 32px;">
  <p style="margin:0;font-size:13px;line-height:1.8;color:${C.muted};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;"><strong style="color:#888;">P.S.</strong> &mdash; The shop owners who act on their score within 48 hours are the ones who actually move the needle. Don't let this sit in your inbox.</p>
</td></tr>`;

  await sendEmail({
    to,
    subject: `${firstName}, your SOS results are ready — here's what they mean`,
    html: wrap(content),
  });
}

// ─── Returning user results email ────────────────────────────────────────────
export async function sendReturningUserEmail({
  to, name, username, score, magicLink,
}: {
  to: string; name: string; username: string; score?: number; magicLink: string;
}) {
  const firstName = name?.split(" ")[0] ?? "there";

  const content = `
<tr><td bgcolor="${C.card}" style="background-color:${C.card};padding:32px 36px 0;">
  <p style="margin:0 0 6px;font-size:10px;letter-spacing:4px;text-transform:uppercase;color:${C.gold};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">WELCOME BACK</p>
  <p style="margin:0 0 16px;font-size:21px;font-weight:800;color:${C.white};line-height:1.3;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">Hey ${firstName}, your updated results are ready.</p>
  <p style="margin:0;font-size:15px;line-height:1.8;color:${C.body};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">You just retook the SOS Assessment. Your updated score is below — click the button to see your full breakdown. We've already signed you in.</p>
</td></tr>

${score != null ? scoreBadge(score) : ""}

${ctaButton(magicLink, "See My Full Breakdown →")}

<tr><td bgcolor="${C.card}" style="background-color:${C.card};padding:8px 36px 0;text-align:center;">
  <p style="margin:0;font-size:11px;color:${C.muted};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">One-click sign-in &mdash; valid for 24 hours.</p>
</td></tr>

<!-- Saved login -->
<tr><td bgcolor="${C.card}" style="background-color:${C.card};padding:24px 36px 0;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${C.border};border-radius:8px;">
  <tr><td bgcolor="${C.card2}" style="background-color:${C.card2};padding:20px 24px;border-radius:8px;">
    <p style="margin:0 0 14px;font-size:10px;letter-spacing:4px;text-transform:uppercase;color:${C.gold};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">YOUR SAVED LOGIN</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td width="100" style="padding:9px 0;font-size:12px;color:${C.muted};border-bottom:1px solid ${C.border};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">Username</td>
        <td style="padding:9px 0;font-size:14px;font-weight:700;color:${C.white};font-family:'Courier New',Courier,monospace;border-bottom:1px solid ${C.border};">${username}</td>
      </tr>
      <tr>
        <td width="100" style="padding:9px 0;font-size:12px;color:${C.muted};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">Password</td>
        <td style="padding:9px 0;font-size:13px;color:${C.muted};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">Use the link above, or request a new magic link on the login page</td>
      </tr>
    </table>
  </td></tr>
  </table>
</td></tr>

<!-- Divider -->
<tr><td bgcolor="${C.card}" style="background-color:${C.card};padding:32px 36px 0;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
  <tr><td bgcolor="${C.border}" height="1" style="background-color:${C.border};font-size:0;line-height:0;">&nbsp;</td></tr>
  </table>
</td></tr>

<!-- Book a call -->
<tr><td bgcolor="${C.card}" style="background-color:${C.card};padding:28px 36px 0;">
  <p style="margin:0 0 6px;font-size:10px;letter-spacing:4px;text-transform:uppercase;color:${C.gold};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">READY TO ACT ON IT?</p>
  <p style="margin:0 0 10px;font-size:18px;font-weight:800;color:${C.white};line-height:1.3;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">Let's turn your score into a real plan.</p>
  <p style="margin:0;font-size:14px;line-height:1.8;color:${C.body};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">Book a free strategy call and I'll walk through your updated results — what's changed, what to fix first, and how to scale from where you are right now.</p>
</td></tr>

${ctaOutline(BOOK_URL, "Book Your Free Strategy Call →")}

<tr><td bgcolor="${C.card}" style="background-color:${C.card};padding:0 0 32px;">&nbsp;</td></tr>`;

  await sendEmail({
    to,
    subject: `${firstName}, your updated SOS results are ready`,
    html: wrap(content),
  });
}

// ─── Magic link email ─────────────────────────────────────────────────────────
export async function sendMagicLinkEmail({
  to, name, link,
}: {
  to: string; name: string; link: string;
}) {
  const firstName = name?.split(" ")[0] ?? "there";

  const content = `
<tr><td bgcolor="${C.card}" style="background-color:${C.card};padding:36px 36px 0;">
  <p style="margin:0 0 6px;font-size:10px;letter-spacing:4px;text-transform:uppercase;color:${C.gold};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">ONE-CLICK SIGN IN</p>
  <p style="margin:0 0 16px;font-size:21px;font-weight:800;color:${C.white};line-height:1.3;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">Hey ${firstName}, here's your login link.</p>
  <p style="margin:0;font-size:15px;line-height:1.8;color:${C.body};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">Click the button below to sign straight into your SOS Scorecard account — no password needed. This link expires in <strong style="color:${C.white};">30 minutes</strong> and works only once.</p>
</td></tr>

${ctaButton(link, "Log In Now →")}

<!-- Fallback URL -->
<tr><td bgcolor="${C.card}" style="background-color:${C.card};padding:24px 36px 0;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${C.border};border-radius:8px;">
  <tr><td bgcolor="${C.card2}" style="background-color:${C.card2};padding:16px 20px;border-radius:8px;">
    <p style="margin:0 0 6px;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:${C.muted};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">BUTTON NOT WORKING?</p>
    <p style="margin:0 0 8px;font-size:12px;color:#777;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">Copy and paste this URL into your browser:</p>
    <p style="margin:0;font-size:11px;color:${C.gold};word-break:break-all;font-family:'Courier New',Courier,monospace;">${link}</p>
  </td></tr>
  </table>
</td></tr>

<!-- Security note -->
<tr><td bgcolor="${C.card}" style="background-color:${C.card};padding:20px 36px 32px;">
  <p style="margin:0;font-size:12px;line-height:1.7;color:${C.muted};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">Didn't request this? You can safely ignore this email — your account is unchanged.</p>
</td></tr>`;

  await sendEmail({
    to,
    subject: `${firstName}, here's your one-click login link`,
    html: wrap(content),
  });
}
