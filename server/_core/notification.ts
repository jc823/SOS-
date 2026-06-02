// Notification stub — extend to send email/SMS/webhook alerts
export async function notifyOwner(message: string | { title: string; content: string }): Promise<void> {
  const text = typeof message === "string" ? message : `${message.title}\n${message.content}`;
  console.log(`[Notification → Owner] ${text}`);
  // TODO: wire to email (Resend/SendGrid) or SMS (Twilio) if needed
}
