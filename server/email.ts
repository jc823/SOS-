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
<html bgcolor="#000000" style="background:#000000;">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
  <style>
    body, html { background-color: #000000 !important; }
    * { box-sizing: border-box; }
  </style>
</head>
<body style="margin:0;padding:0;background:#000000 !important;background-color:#000000 !important;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#000000" style="background:#000000;background-color:#000000;">
<tr><td align="center" bgcolor="#000000" style="background:#000000;padding:0;">
  <div style="max-width:580px;width:100%;margin:0 auto;padding:40px 20px;background:#000000;background-color:#000000;">

    <!-- Header -->
    <div style="text-align:center;margin-bottom:36px;">
      <p style="margin:0 0 8px;font-size:10px;letter-spacing:6px;text-transform:uppercase;color:#b8953a;">SCALE DETAILING SYSTEM</p>
      <h1 style="margin:0;font-size:28px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">SOS Scorecard</h1>
      <div style="width:40px;height:2px;background:#b8953a;margin:12px auto 0;"></div>
    </div>

    <!-- Personal opener -->
    <div style="margin-bottom:28px;">
      <p style="margin:0 0 16px;font-size:17px;line-height:1.7;color:#ffffff;font-weight:600;">
        Hey ${firstName},
      </p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.8;color:#aaaaaa;">
        You just completed the SOS Assessment — and I want to be real with you: most shop owners who take this quiz are surprised by what they find.
      </p>
      <p style="margin:0;font-size:15px;line-height:1.8;color:#aaaaaa;">
        Your results are live inside your account right now. Log in, take a look, and don't ignore what it's telling you.
      </p>
    </div>

    ${score != null ? `
    <!-- Score badge -->
    <div style="background:#000000;border:1px solid #b8953a;border-radius:16px;padding:32px 24px;margin-bottom:24px;text-align:center;">
      <p style="margin:0 0 10px;font-size:10px;letter-spacing:5px;text-transform:uppercase;color:#b8953a;">YOUR SOS SCORE</p>
      <p style="margin:0 0 6px;font-size:72px;font-weight:900;color:#ffffff;line-height:1;letter-spacing:-2px;">${score}<span style="font-size:32px;color:#b8953a;">/100</span></p>
      <p style="margin:0 0 20px;font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:4px;color:${scoreColor};">${scoreLabel}</p>
      <div style="width:100%;background:#111111;border-radius:100px;height:6px;overflow:hidden;">
        <div style="width:${score}%;height:6px;background:linear-gradient(90deg,#b8953a,${scoreColor});border-radius:100px;"></div>
      </div>
      <p style="margin:16px 0 0;font-size:13px;color:#666;line-height:1.6;">
        This reflects where your business stands across the 6 pillars of a scalable detailing operation.
      </p>
    </div>` : ""}

    <!-- Login credentials -->
    <div style="background:#0a0a0a;border:1px solid #222222;border-radius:16px;padding:24px;margin-bottom:24px;">
      <p style="margin:0 0 16px;font-size:10px;letter-spacing:4px;text-transform:uppercase;color:#b8953a;">YOUR LOGIN — SAVE THIS</p>
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="padding:11px 0;font-size:12px;color:#555;width:90px;border-bottom:1px solid #1a1a1a;">Username</td>
          <td style="padding:11px 0;font-size:14px;font-weight:700;color:#ffffff;font-family:'Courier New',monospace;border-bottom:1px solid #1a1a1a;">${username}</td>
        </tr>
        <tr>
          <td style="padding:11px 0;font-size:12px;color:#555;">Password</td>
          <td style="padding:11px 0;font-size:14px;font-weight:700;color:#ffffff;font-family:'Courier New',monospace;">${password}</td>
        </tr>
      </table>
    </div>

    <!-- Primary CTA -->
    <div style="text-align:center;margin-bottom:32px;">
      <a href="${loginUrl}" style="display:inline-block;background:#b8953a;color:#000000;text-decoration:none;font-weight:900;font-size:14px;letter-spacing:2px;padding:16px 44px;border-radius:10px;text-transform:uppercase;">
        See My Full Breakdown →
      </a>
    </div>

    <!-- Divider -->
    <div style="border-top:1px solid #1a1a1a;margin-bottom:28px;"></div>

    <!-- Book a call section -->
    <div style="margin-bottom:32px;">
      <p style="margin:0 0 6px;font-size:10px;letter-spacing:4px;text-transform:uppercase;color:#b8953a;">READY TO ACT ON IT?</p>
      <p style="margin:0 0 14px;font-size:18px;font-weight:800;color:#ffffff;line-height:1.4;">
        Let's turn your score into a real plan.
      </p>
      <p style="margin:0 0 20px;font-size:15px;line-height:1.8;color:#aaaaaa;">
        Book a free strategy call and I'll walk through your results with you — where you're leaving money on the table, what to fix first, and exactly how to scale from where you are right now.
      </p>
      <div style="text-align:center;">
        <a href="${bookUrl}" style="display:inline-block;background:#000000;color:#b8953a;text-decoration:none;font-weight:800;font-size:13px;letter-spacing:2px;padding:15px 40px;border-radius:10px;border:2px solid #b8953a;text-transform:uppercase;">
          Book Your Free Strategy Call →
        </a>
      </div>
    </div>

    <!-- PS -->
    <p style="margin:0 0 32px;font-size:13px;line-height:1.8;color:#555;">
      <strong style="color:#777;">P.S.</strong> — The shop owners who act on their score within 48 hours are the ones who actually move the needle. Don't let this sit in your inbox.
    </p>

    <!-- Footer -->
    <div style="border-top:1px solid #111111;padding-top:24px;text-align:center;">
      <p style="margin:0 0 4px;font-size:11px;color:#333;">Scale Detailing System · SOS Scorecard</p>
      <p style="margin:0;font-size:11px;color:#333;">
        Reply to this email anytime or <a href="${bookUrl}" style="color:#b8953a;text-decoration:none;">book a call</a>.
      </p>
    </div>

  </div>
</td></tr>
</table>
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
