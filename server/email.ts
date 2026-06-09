import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM_EMAIL ?? "Scale Detailing System <system@scaledetailing.com>";
const APP_URL = process.env.APP_URL ?? "https://sos-production-ab11.up.railway.app";

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

// ─── Welcome email (quiz registration) ───────────────────────────────────────
export async function sendWelcomeEmail({
  to,
  name,
  username,
  password,
  score,
}: {
  to: string;
  name: string;
  username: string;
  password: string;
  score?: number;
}) {
  const loginUrl = `${APP_URL}/login`;
  const bookUrl = "https://link.omniscalesystems.com/widget/bookings/scaleroadmapcallhmt7g2";
  const firstName = name.split(" ")[0];

  const scoreLabel = score != null
    ? score >= 80 ? "Strong" : score >= 60 ? "Growing" : score >= 40 ? "Developing" : "Early Stage"
    : null;

  const scoreColor = score != null
    ? score >= 80 ? "#4ade80" : score >= 60 ? "#b8953a" : score >= 40 ? "#fb923c" : "#f87171"
    : "#b8953a";

  await sendEmail({
    to,
    subject: `${firstName}, your SOS results are ready — here's what they mean`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:580px;margin:0 auto;padding:40px 20px;">

    <!-- Header -->
    <div style="text-align:center;margin-bottom:36px;">
      <p style="margin:0 0 6px;font-size:10px;letter-spacing:5px;text-transform:uppercase;color:#b8953a;">SCALE DETAILING SYSTEM</p>
      <h1 style="margin:0;font-size:26px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">SOS Scorecard</h1>
    </div>

    <!-- Personal opener -->
    <div style="margin-bottom:28px;">
      <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#e0e0e0;">
        Hey ${firstName},
      </p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#c0c0c0;">
        You just completed the SOS Assessment — and I want to be real with you: most shop owners who take this quiz are surprised by what they find.
      </p>
      <p style="margin:0;font-size:15px;line-height:1.7;color:#c0c0c0;">
        Your results are live inside your account right now. Log in, take a look, and don't ignore what it's telling you.
      </p>
    </div>

    ${score != null ? `
    <!-- Score teaser -->
    <div style="background:#111111;border:1px solid #2a2a2a;border-radius:16px;padding:28px;margin-bottom:24px;text-align:center;">
      <p style="margin:0 0 8px;font-size:10px;letter-spacing:4px;text-transform:uppercase;color:#666;">YOUR SOS SCORE</p>
      <p style="margin:0 0 4px;font-size:56px;font-weight:900;color:${scoreColor};line-height:1;">${score}</p>
      <p style="margin:0 0 16px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:${scoreColor};">${scoreLabel}</p>
      <p style="margin:0;font-size:13px;color:#888;line-height:1.6;">
        This score reflects where your business stands across the 6 pillars of a scalable detailing operation. Log in to see your full breakdown.
      </p>
    </div>` : ""}

    <!-- Login credentials -->
    <div style="background:#111111;border:1px solid #1f1f1f;border-radius:16px;padding:24px;margin-bottom:24px;">
      <p style="margin:0 0 16px;font-size:10px;letter-spacing:4px;text-transform:uppercase;color:#666;">YOUR LOGIN — SAVE THIS</p>
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="padding:10px 0;font-size:12px;color:#666;width:90px;border-bottom:1px solid #1f1f1f;">Username</td>
          <td style="padding:10px 0;font-size:14px;font-weight:700;color:#ffffff;font-family:'Courier New',monospace;border-bottom:1px solid #1f1f1f;">${username}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;font-size:12px;color:#666;">Password</td>
          <td style="padding:10px 0;font-size:14px;font-weight:700;color:#ffffff;font-family:'Courier New',monospace;">${password}</td>
        </tr>
      </table>
    </div>

    <!-- Primary CTA -->
    <div style="text-align:center;margin-bottom:32px;">
      <a href="${loginUrl}" style="display:inline-block;background:#b8953a;color:#000000;text-decoration:none;font-weight:900;font-size:15px;letter-spacing:1.5px;padding:16px 40px;border-radius:12px;text-transform:uppercase;">
        View My Full Results →
      </a>
    </div>

    <!-- Divider -->
    <div style="border-top:1px solid #1f1f1f;margin-bottom:28px;"></div>

    <!-- Book a call section -->
    <div style="margin-bottom:32px;">
      <p style="margin:0 0 12px;font-size:15px;line-height:1.7;color:#c0c0c0;">
        If you're serious about changing your business — not just reading about it, but actually doing it — let's get on a call.
      </p>
      <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#c0c0c0;">
        I'll walk through your score with you, show you exactly where your biggest gaps are, and give you a clear plan to fix them. No pressure, no pitch — just real talk about your business.
      </p>
      <div style="text-align:center;">
        <a href="${bookUrl}" style="display:inline-block;background:transparent;color:#b8953a;text-decoration:none;font-weight:800;font-size:14px;letter-spacing:1px;padding:14px 36px;border-radius:12px;border:2px solid #b8953a;text-transform:uppercase;">
          Change Your Business Now →
        </a>
      </div>
    </div>

    <!-- PS -->
    <p style="margin:0 0 32px;font-size:13px;line-height:1.7;color:#666;">
      <strong style="color:#888;">P.S.</strong> — Most shop owners wait. The ones who win don't. Your score is already telling you something — the question is what you do with it.
    </p>

    <!-- Footer -->
    <div style="border-top:1px solid #1a1a1a;padding-top:24px;text-align:center;">
      <p style="margin:0 0 4px;font-size:11px;color:#333;">Scale Detailing System · Powered by SOS Scorecard</p>
      <p style="margin:0;font-size:11px;color:#333;">
        Reply to this email anytime or <a href="${bookUrl}" style="color:#b8953a;text-decoration:none;">book a call</a>.
      </p>
    </div>

  </div>
</body>
</html>`,
  });
}

// ─── Already have account email ──────────────────────────────────────────────
export async function sendAlreadyHaveAccountEmail({
  to,
  name,
  loginUrl,
}: {
  to: string;
  name: string;
  loginUrl?: string;
}) {
  const firstName = name?.split(" ")[0] ?? "there";
  const url = loginUrl ?? `${APP_URL}/login`;

  await sendEmail({
    to,
    subject: "You already have an SOS Scorecard account",
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 24px;">

    <div style="text-align:center;margin-bottom:32px;">
      <p style="margin:0 0 8px;font-size:11px;letter-spacing:4px;text-transform:uppercase;color:#b8953a;">SCALE DETAILING SYSTEM</p>
      <h1 style="margin:0;font-size:28px;font-weight:900;color:#ffffff;">SOS Scorecard</h1>
    </div>

    <div style="background:#111111;border:1px solid #1f1f1f;border-radius:16px;padding:32px;">
      <p style="margin:0 0 8px;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#b8953a;">WELCOME BACK</p>
      <h2 style="margin:0 0 16px;font-size:22px;font-weight:800;color:#ffffff;">Hey ${firstName}, you're already in! 👋</h2>
      <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#a0a0a0;">
        Looks like you already have an SOS Scorecard account tied to this email.
        No need to sign up again — just log in to pick up where you left off.
      </p>

      <div style="text-align:center;margin-bottom:24px;">
        <a href="${url}" style="display:inline-block;background:#b8953a;color:#000000;text-decoration:none;font-weight:800;font-size:14px;letter-spacing:1px;padding:14px 32px;border-radius:10px;">
          LOG IN TO MY ACCOUNT →
        </a>
      </div>

      <div style="background:#0a0a0a;border:1px solid #2a2a2a;border-radius:12px;padding:16px;margin-bottom:24px;">
        <p style="margin:0 0 8px;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#666;">FORGOT YOUR PASSWORD?</p>
        <p style="margin:0;font-size:13px;color:#888;line-height:1.6;">
          On the login page, click <strong style="color:#b8953a;">"Magic Link"</strong> and we'll email you a one-click login — no password needed.
        </p>
      </div>

      <p style="margin:0;font-size:12px;color:#555;">
        Need help? Reply to this email or
        <a href="https://link.omniscalesystems.com/widget/bookings/scaleroadmapcallhmt7g2" style="color:#b8953a;">book a call</a>.
      </p>
    </div>

    <div style="text-align:center;margin-top:32px;">
      <p style="margin:0;font-size:11px;color:#333;">Powered by Scale Detailing System</p>
    </div>

  </div>
</body>
</html>`,
  });
}

// ─── Magic link email ─────────────────────────────────────────────────────────
export async function sendMagicLinkEmail({
  to,
  name,
  link,
}: {
  to: string;
  name: string;
  link: string;
}) {
  const firstName = name?.split(" ")[0] ?? "there";

  await sendEmail({
    to,
    subject: "Your SOS Scorecard login link",
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 24px;">

    <div style="text-align:center;margin-bottom:32px;">
      <p style="margin:0 0 8px;font-size:11px;letter-spacing:4px;text-transform:uppercase;color:#b8953a;">SCALE DETAILING SYSTEM</p>
      <h1 style="margin:0;font-size:28px;font-weight:900;color:#ffffff;">SOS Scorecard</h1>
    </div>

    <div style="background:#111111;border:1px solid #1f1f1f;border-radius:16px;padding:32px;">
      <p style="margin:0 0 8px;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#b8953a;">SIGN IN</p>
      <h2 style="margin:0 0 16px;font-size:22px;font-weight:800;color:#ffffff;">Hey ${firstName} 👋</h2>
      <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#a0a0a0;">
        Here's your one-click login link. It expires in 15 minutes.
      </p>

      <div style="text-align:center;margin-bottom:24px;">
        <a href="${link}" style="display:inline-block;background:#b8953a;color:#000000;text-decoration:none;font-weight:800;font-size:14px;letter-spacing:1px;padding:14px 32px;border-radius:10px;">
          LOG IN NOW →
        </a>
      </div>

      <p style="margin:0;font-size:12px;color:#555;">
        If you didn't request this, you can safely ignore it. The link only works once.
      </p>
    </div>

    <div style="text-align:center;margin-top:32px;">
      <p style="margin:0;font-size:11px;color:#333;">Powered by Scale Detailing System</p>
    </div>

  </div>
</body>
</html>`,
  });
}
