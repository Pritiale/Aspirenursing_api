import sgMail from "@sendgrid/mail";
import { env } from "./env";

let configured = false;

function ensureConfigured() {
  if (!configured) {
    sgMail.setApiKey(env.sendgridApiKey());
    configured = true;
  }
}

/** Pull SendGrid's human-readable reason from a failed send. */
function sendGridErrorMessage(err: unknown): string {
  const e = err as { response?: { body?: { errors?: { message?: string }[] } } };
  const messages = e.response?.body?.errors?.map((x) => x.message).filter(Boolean);
  return messages?.length ? messages.join("; ") : "Unknown SendGrid error";
}

const brandBlue = "#0c2461";
const brandRed = "#e23a4e";

function wrap(title: string, bodyHtml: string): string {
  return `
  <div style="margin:0;padding:24px;background:#f3f5f9;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e6e9f0;">
      <div style="background:${brandBlue};padding:22px 28px;">
        <span style="color:#fff;font-size:20px;font-weight:800;letter-spacing:-0.01em;">ASPIRE</span>
        <span style="color:#8fb4e0;font-size:11px;font-weight:700;letter-spacing:0.14em;display:block;margin-top:2px;">NURSING AGENCY</span>
      </div>
      <div style="height:3px;background:${brandRed};"></div>
      <div style="padding:28px;color:#20334a;font-size:15px;line-height:1.6;">
        <h1 style="margin:0 0 14px;font-size:19px;color:${brandBlue};">${title}</h1>
        ${bodyHtml}
      </div>
      <div style="padding:16px 28px;background:#f7f9fc;color:#7a869a;font-size:12px;">
        Aspire Nursing Agency · Melbourne, VIC · aspirenursingagency@gmail.com
      </div>
    </div>
  </div>`;
}

/** Confirmation email to the person who subscribed. */
export async function sendSubscriberWelcome(toEmail: string): Promise<void> {
  ensureConfigured();
  const from = { email: env.sendgridFromEmail(), name: env.sendgridFromName() };
  const templateId = env.sendgridWelcomeTemplateId();

  try {
    if (templateId) {
      await sgMail.send({
        to: toEmail,
        from,
        templateId,
        dynamicTemplateData: {
          subscriber_email: toEmail,
        },
      });
    } else {
      await sgMail.send({
        to: toEmail,
        from,
        subject: "You're subscribed — Aspire Nursing Agency",
        html: wrap(
          "Thanks for subscribing!",
          `<p>Hi there,</p>
           <p>Thanks for subscribing to <strong>Aspire Nursing Agency</strong> updates.
           You'll now receive occasional news, aged care insights, and service updates.</p>
           <p>If this wasn't you, you can safely ignore this email.</p>
           <p style="margin-top:22px;">Warm regards,<br/>The Aspire Nursing Team</p>`,
        ),
      });
    }
    console.log(`[email] sent TO: ${toEmail}`);
  } catch (err) {
    console.error(`[email] failed TO: ${toEmail} — ${sendGridErrorMessage(err)}`);
    throw err;
  }
}

/** Internal notification to the admin inbox. */
export async function sendAdminNotification(subscriberEmail: string): Promise<void> {
  ensureConfigured();
  const from = { email: env.sendgridFromEmail(), name: env.sendgridFromName() };
  const to = env.adminNotifyEmail();
  const subscribedAt = new Date().toLocaleString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Australia/Melbourne",
  });
  const templateId = env.sendgridAdminTemplateId();

  try {
    if (templateId) {
      await sgMail.send({
        to,
        from,
        templateId,
        dynamicTemplateData: {
          subscriber_email: subscriberEmail,
          subscribed_at: subscribedAt,
        },
      });
    } else {
      await sgMail.send({
        to,
        from,
        subject: `New subscriber: ${subscriberEmail}`,
        html: wrap(
          "New newsletter subscriber",
          `<p style="margin:0 0 16px;">A new person just subscribed on the website:</p>
           <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f9fc;border:1px solid #e6e9f0;border-radius:10px;margin:0 0 18px;">
             <tr><td style="padding:16px 18px;">
               <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#6b7688;">Email</div>
               <div style="font-size:17px;font-weight:700;color:${brandBlue};margin-top:4px;">${subscriberEmail}</div>
               <div style="font-size:13px;color:#6b7688;margin-top:10px;">Subscribed: ${subscribedAt}</div>
             </td></tr>
           </table>
           <p style="margin:0;color:#6b7688;font-size:14px;">They've been added to the subscriptions table. View everyone in the admin dashboard.</p>`,
        ),
      });
    }
    console.log(`[email] sent TO: ${to}`);
  } catch (err) {
    console.error(`[email] failed TO: ${to} — ${sendGridErrorMessage(err)}`);
    throw err;
  }
}
