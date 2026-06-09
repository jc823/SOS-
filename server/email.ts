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
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="dark only">
  <meta name="supported-color-schemes" content="dark">
</head>
<body style="margin:0;padding:0;background-color:#000000;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<!-- Outer wrapper -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#000000" style="background-color:#000000;">
<tr><td bgcolor="#000000" style="background-color:#000000;" align="center">
<!-- Inner container -->
<table role="presentation" width="580" cellpadding="0" cellspacing="0" bgcolor="#000000" style="background-color:#000000;max-width:580px;width:100%;">

<!-- HEADER -->
<tr><td bgcolor="#000000" style="background-color:#000000;padding:40px 24px 24px;text-align:center;">
  <p style="margin:0 0 8px;font-size:10px;letter-spacing:6px;text-transform:uppercase;color:#b8953a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">SCALE DETAILING SYSTEM</p>
  <h1 style="margin:0 0 12px;font-size:28px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">SOS Scorecard</h1>
  <table role="presentation" cellpadding="0" cellspacing="0" align="center"><tr><td bgcolor="#b8953a" width="40" height="2" style="background-color:#b8953a;font-size:0;line-height:0;">&nbsp;</td></tr></table>
</td></tr>

<!-- OPENER -->
<tr><td bgcolor="#000000" style="background-color:#000000;padding:8px 24px 24px;">
  <p style="margin:0 0 16px;font-size:17px;line-height:1.7;color:#ffffff;font-weight:600;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Hey ${firstName},</p>
  <p style="margin:0 0 14px;font-size:15px;line-height:1.8;color:#aaaaaa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">You just completed the SOS Assessment — and I want to be real with you: most shop owners who take this quiz are surprised by what they find.</p>
  <p style="margin:0;font-size:15px;line-height:1.8;color:#aaaaaa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Your results are live inside your account right now. Log in, take a look, and don't ignore what it's telling you.</p>
</td></tr>

${score != null ? `
<!-- SCORE BADGE -->
<tr><td bgcolor="#000000" style="background-color:#000000;padding:0 24px 24px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #b8953a;border-radius:12px;">
  <tr><td bgcolor="#000000" style="background-color:#000000;padding:28px 24px;text-align:center;border-radius:12px;">
    <p style="margin:0 0 10px;font-size:10px;letter-spacing:5px;text-transform:uppercase;color:#b8953a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">YOUR SOS SCORE</p>
    <p style="margin:0 0 6px;font-size:72px;font-weight:900;color:#ffffff;line-height:1;letter-spacing:-2px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">${score}<span style="font-size:32px;color:#b8953a;">/100</span></p>
    <p style="margin:0 0 20px;font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:4px;color:${scoreColor};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">${scoreLabel}</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
      <td bgcolor="#111111" style="background-color:#111111;border-radius:6px;height:6px;font-size:0;line-height:0;">
        <table role="presentation" cellpadding="0" cellspacing="0"><tr><td bgcolor="${scoreColor}" width="${Math.round(score * 5.3)}" height="6" style="background-color:${scoreColor};border-radius:6px;font-size:0;line-height:0;">&nbsp;</td></tr></table>
      </td>
    </tr></table>
    <p style="margin:14px 0 0;font-size:13px;color:#666666;line-height:1.6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">This reflects where your business stands across the 6 pillars of a scalable detailing operation.</p>
  </td></tr>
  </table>
</td></tr>
` : ""}

<!-- LOGIN CREDENTIALS -->
<tr><td bgcolor="#000000" style="background-color:#000000;padding:0 24px 24px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #222222;border-radius:12px;">
  <tr><td bgcolor="#0a0a0a" style="background-color:#0a0a0a;padding:24px;border-radius:12px;">
    <p style="margin:0 0 16px;font-size:10px;letter-spacing:4px;text-transform:uppercase;color:#b8953a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">YOUR LOGIN — SAVE THIS</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td width="90" style="padding:10px 0;font-size:12px;color:#555555;border-bottom:1px solid #1a1a1a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Username</td>
        <td style="padding:10px 0;font-size:14px;font-weight:700;color:#ffffff;font-family:'Courier New',Courier,monospace;border-bottom:1px solid #1a1a1a;">${username}</td>
      </tr>
      <tr>
        <td width="90" style="padding:10px 0;font-size:12px;color:#555555;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Password</td>
        <td style="padding:10px 0;font-size:14px;font-weight:700;color:#ffffff;font-family:'Courier New',Courier,monospace;">${password}</td>
      </tr>
    </table>
  </td></tr>
  </table>
</td></tr>

<!-- PRIMARY CTA -->
<tr><td bgcolor="#000000" style="background-color:#000000;padding:0 24px 32px;text-align:center;">
  <a href="${loginUrl}" style="display:inline-block;background-color:#b8953a;color:#000000;text-decoration:none;font-weight:900;font-size:14px;letter-spacing:2px;padding:16px 44px;border-radius:10px;text-transform:uppercase;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">See My Full Breakdown →</a>
</td></tr>

<!-- DIVIDER -->
<tr><td bgcolor="#000000" style="background-color:#000000;padding:0 24px 28px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td bgcolor="#1a1a1a" height="1" style="background-color:#1a1a1a;font-size:0;line-height:0;">&nbsp;</td></tr></table>
</td></tr>

<!-- BOOK A CALL -->
<tr><td bgcolor="#000000" style="background-color:#000000;padding:0 24px 32px;">
  <p style="margin:0 0 6px;font-size:10px;letter-spacing:4px;text-transform:uppercase;color:#b8953a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">READY TO ACT ON IT?</p>
  <p style="margin:0 0 14px;font-size:18px;font-weight:800;color:#ffffff;line-height:1.4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Let's turn your score into a real plan.</p>
  <p style="margin:0 0 20px;font-size:15px;line-height:1.8;color:#aaaaaa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Book a free strategy call and I'll walk through your results with you — where you're leaving money on the table, what to fix first, and exactly how to scale from where you are right now.</p>
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%"><tr><td align="center">
    <a href="${bookUrl}" style="display:inline-block;background-color:#000000;color:#b8953a;text-decoration:none;font-weight:800;font-size:13px;letter-spacing:2px;padding:15px 40px;border-radius:10px;border:2px solid #b8953a;text-transform:uppercase;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Book Your Free Strategy Call →</a>
  </td></tr></table>
</td></tr>

<!-- PS -->
<tr><td bgcolor="#000000" style="background-color:#000000;padding:0 24px 32px;">
  <p style="margin:0;font-size:13px;line-height:1.8;color:#555555;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;"><strong style="color:#777777;">P.S.</strong> — The shop owners who act on their score within 48 hours are the ones who actually move the needle. Don't let this sit in your inbox.</p>
</td></tr>

<!-- FOOTER -->
<tr><td bgcolor="#000000" style="background-color:#000000;padding:0 24px 40px;border-top:1px solid #111111;text-align:center;">
  <p style="margin:16px 0 4px;font-size:11px;color:#333333;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Scale Detailing System · SOS Scorecard</p>
  <p style="margin:0;font-size:11px;color:#333333;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Reply anytime or <a href="${bookUrl}" style="color:#b8953a;text-decoration:none;">book a call</a>.</p>
</td></tr>

</table><!-- /inner -->
</td></tr>
</table><!-- /outer -->
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
<body style="margin:0;padding:0;background-color:#000000;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#000000" style="background-color:#000000;">
<tr><td bgcolor="#000000" style="background-color:#000000;" align="center">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" bgcolor="#000000" style="background-color:#000000;max-width:560px;width:100%;">

<!-- HEADER -->
<tr><td bgcolor="#000000" style="background-color:#000000;padding:40px 24px 24px;text-align:center;">
  <p style="margin:0 0 8px;font-size:10px;letter-spacing:6px;text-transform:uppercase;color:#b8953a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">SCALE DETAILING SYSTEM</p>
  <h1 style="margin:0 0 12px;font-size:26px;font-weight:900;color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">SOS Scorecard</h1>
  <table role="presentation" cellpadding="0" cellspacing="0" align="center"><tr><td bgcolor="#b8953a" width="40" height="2" style="background-color:#b8953a;font-size:0;line-height:0;">&nbsp;</td></tr></table>
</td></tr>

<!-- WELCOME BACK LABEL -->
<tr><td bgcolor="#000000" style="background-color:#000000;padding:8px 24px 6px;">
  <p style="margin:0;font-size:10px;letter-spacing:4px;text-transform:uppercase;color:#b8953a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">WELCOME BACK</p>
</td></tr>

<!-- HEADLINE -->
<tr><td bgcolor="#000000" style="background-color:#000000;padding:0 24px 16px;">
  <h2 style="margin:0;font-size:22px;font-weight:800;color:#ffffff;line-height:1.4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Hey ${firstName}, you're already in.</h2>
</td></tr>

<!-- BODY COPY -->
<tr><td bgcolor="#000000" style="background-color:#000000;padding:0 24px 24px;">
  <p style="margin:0;font-size:15px;line-height:1.8;color:#aaaaaa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Looks like you already have an SOS Scorecard account tied to this email. No need to sign up again — just log in to pick up where you left off.</p>
</td></tr>

<!-- LOGIN CTA -->
<tr><td bgcolor="#000000" style="background-color:#000000;padding:0 24px 28px;text-align:center;">
  <a href="${url}" style="display:inline-block;background-color:#b8953a;color:#000000;text-decoration:none;font-weight:900;font-size:14px;letter-spacing:2px;padding:16px 44px;border-radius:10px;text-transform:uppercase;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Log In To My Account →</a>
</td></tr>

<!-- FORGOT PASSWORD BOX -->
<tr><td bgcolor="#000000" style="background-color:#000000;padding:0 24px 28px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #222222;border-radius:10px;">
  <tr><td bgcolor="#0a0a0a" style="background-color:#0a0a0a;padding:16px 20px;border-radius:10px;">
    <p style="margin:0 0 8px;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#555555;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">FORGOT YOUR PASSWORD?</p>
    <p style="margin:0;font-size:13px;color:#888888;line-height:1.7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">On the login page, click <strong style="color:#b8953a;">Magic Link</strong> and we'll email you a one-click login — no password needed.</p>
  </td></tr>
  </table>
</td></tr>

<!-- HELP LINE -->
<tr><td bgcolor="#000000" style="background-color:#000000;padding:0 24px 16px;">
  <p style="margin:0;font-size:12px;color:#444444;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Need help? Reply to this email or <a href="https://link.omniscalesystems.com/widget/bookings/scaleroadmapcallhmt7g2" style="color:#b8953a;text-decoration:none;">book a call</a>.</p>
</td></tr>

<!-- FOOTER -->
<tr><td bgcolor="#000000" style="background-color:#000000;padding:0 24px 40px;border-top:1px solid #111111;text-align:center;">
  <p style="margin:16px 0 0;font-size:11px;color:#333333;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Powered by Scale Detailing System</p>
</td></tr>

</table>
</td></tr>
</table>
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
