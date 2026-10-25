/**
 * Master switch for every email the CRM sends.
 * false = no emails are sent (in-app notifications still work).
 * Set to true and redeploy to turn emails back on.
 */
export const EMAILS_ENABLED = false;

export function withEmailSwitch<T extends { sendMail: (...args: any[]) => any }>(transporter: T): T {
  if (!EMAILS_ENABLED) {
    (transporter as any).sendMail = async () => {
      console.log('Email not sent: CRM emails are turned off (email-switch.ts).');
      return { messageId: 'emails-disabled', accepted: [], rejected: [] };
    };
  }
  return transporter;
}
