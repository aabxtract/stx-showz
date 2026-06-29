/**
 * Email notification utilities.
 * Uses stableemail.dev API (via agentcash) when configured, otherwise logs to console.
 */

const EMAIL_API = process.env.EMAIL_API_URL;
const EMAIL_API_KEY = process.env.EMAIL_API_KEY;

interface SendEmailParams {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

/**
 * Send an email. Falls back to console logging when not configured.
 */
export async function sendEmail(params: SendEmailParams): Promise<boolean> {
  if (!EMAIL_API || !EMAIL_API_KEY) {
    console.log(`[email] (not configured) To: ${params.to} | Subject: ${params.subject}`);
    return false;
  }

  try {
    const res = await fetch(EMAIL_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${EMAIL_API_KEY}`,
      },
      body: JSON.stringify({
        to: params.to,
        subject: params.subject,
        text: params.text,
        html: params.html ?? params.text,
      }),
    });

    if (!res.ok) {
      console.error(`[email] API returned ${res.status}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error(`[email] Failed to send: ${(err as Error).message}`);
    return false;
  }
}

/**
 * Send a ticket purchase confirmation email.
 */
export async function sendTicketConfirmation(params: {
  to: string;
  eventTitle: string;
  eventDate: string;
  eventLocation: string;
  ticketId: string;
  amountPaid: string;
  currency: string;
}): Promise<boolean> {
  const dateStr = new Date(params.eventDate).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const subject = `Ticket confirmed: ${params.eventTitle}`;
  const text = [
    `Your ticket has been confirmed!`,
    ``,
    `Event: ${params.eventTitle}`,
    `Date: ${dateStr}`,
    `Location: ${params.eventLocation}`,
    `Ticket ID: ${params.ticketId}`,
    `Amount paid: ${params.amountPaid} ${params.currency}`,
    ``,
    `Show this ticket ID at the door for entry.`,
    ``,
    `— Veritix`,
  ].join("\n");

  return sendEmail({ to: params.to, subject, text });
}

/**
 * Send a ticket transfer notification.
 */
export async function sendTransferNotification(params: {
  to: string;
  eventTitle: string;
  ticketId: string;
  fromAddress: string;
}): Promise<boolean> {
  const subject = `Ticket transferred to you: ${params.eventTitle}`;
  const text = [
    `A ticket has been transferred to you!`,
    ``,
    `Event: ${params.eventTitle}`,
    `Ticket ID: ${params.ticketId}`,
    `From: ${params.fromAddress}`,
    ``,
    `Show this ticket ID at the door for entry.`,
    ``,
    `— Veritix`,
  ].join("\n");

  return sendEmail({ to: params.to, subject, text });
}
