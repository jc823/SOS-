import { sendWelcomeEmail, sendReturningUserEmail, sendMagicLinkEmail } from "./email";

const TO = "jacosta0284@gmail.com";
const APP_URL = process.env.APP_URL ?? "https://sos-production-ab11.up.railway.app";

async function main() {
  console.log("FROM:", process.env.RESEND_FROM_EMAIL);
  console.log("KEY:", process.env.RESEND_API_KEY?.slice(0, 12) + "...");

  await sendWelcomeEmail({
    to: TO, name: "JC Acosta", username: "jacosta0284",
    password: "Blue-River-4927", score: 62,
  });
  console.log("✓ Welcome email sent");

  await sendReturningUserEmail({
    to: TO, name: "JC Acosta", username: "jacosta0284",
    score: 74, magicLink: `${APP_URL}/login`,
  });
  console.log("✓ Returning user email sent");

  await sendMagicLinkEmail({
    to: TO, name: "JC Acosta",
    link: `${APP_URL}/login?magic=preview-token-123`,
  });
  console.log("✓ Magic link email sent");
}

main().catch(console.error);
