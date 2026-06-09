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
}: {
  to: string;
  name: string;
  username: string;
  password: string;
}) {
  const loginUrl = `${APP_URL}/login`;
  const firstName = name.split(" ")[0];

  await sendEmail({
    to,
    subject: "Your SOS Scorecard Account — Login Details",
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 24px;">

    <!-- Header -->
    <div style="text-align:center;margin-bottom:32px;">
      <p style="margin:0 0 8px;font-size:11px;letter-spacing:4px;text-transform:uppercase;color:#b8953a;">SCALE DETAILING SYSTEM</p>
      <h1 style="margin:0;font-size:28px;font-weight:900;color:#ffffff;">SOS Scorecard</h1>
    </div>

    <!-- Card -->
    <div style="background:#111111;border:1px solid #1f1f1f;border-radius:16px;padding:32px;">
      <p style="margin:0 0 8px;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#b8953a;">WELCOME</p>
      <h2 style="margin:0 0 16px;font-size:22px;font-weight:800;color:#ffffff;">Hey ${firstName}, you're in! 🚀</h2>
      <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#a0a0a0;">
        Your SOS Scorecard account has been created. Here are your login credentials — save these somewhere safe.
      </p>

      <!-- Credentials box -->
      <div style="background:#0a0a0a;border:1px solid #2a2a2a;border-radius:12px;padding:20px;margin-bottom:24px;">
        <p style="margin:0 0 12px;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#666;">YOUR LOGIN</p>
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:8px 0;font-size:12px;color:#666;width:100px;">Username</td>
            <td style="padding:8px 0;font-size:14px;font-weight:700;color:#ffffff;font-family:monospace;">${username}</td>
          </tr>
          <tr style="border-top:1px solid #1f1f1f;">
            <td style="padding:8px 0;font-size:12px;color:#666;">Password</td>
            <td style="padding:8px 0;font-size:14px;font-weight:700;color:#ffffff;font-family:monospace;">${password}</td>
          </tr>
        </table>
      </div>

      <!-- CTA -->
      <div style="text-align:center;margin-bottom:24px;">
        <a href="${loginUrl}" style="display:inline-block;background:#b8953a;color:#000000;text-decoration:none;font-weight:800;font-size:14px;letter-spacing:1px;padding:14px 32px;border-radius:10px;">
          VIEW MY RESULTS →
        </a>
      </div>

      <p style="margin:0;font-size:12px;line-height:1.6;color:#555;">
        Your scorecard results are waiting inside. You can also log in anytime at:<br>
        <a href="${loginUrl}" style="color:#b8953a;">${loginUrl}</a>
      </p>
    </div>

    <!-- Footer -->
    <div style="text-align:center;margin-top:32px;">
      <p style="margin:0 0 4px;font-size:11px;color:#333;">Powered by Scale Detailing System</p>
      <p style="margin:0;font-size:11px;color:#333;">
        Questions? Reply to this email or visit
        <a href="https://link.omniscalesystems.com/widget/bookings/scaleroadmapcallhmt7g2" style="color:#b8953a;">book a call</a>.
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
