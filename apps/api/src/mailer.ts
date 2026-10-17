import nodemailer from "nodemailer";
import type { Config } from "./config.js";

export type Mailer = { send(to: string, subject: string, text: string): Promise<void> };

/**
 * Sends real email through SMTP when SMTP_URL is set. In development with no SMTP the message is printed to this server's
 * console so the reset flow can be tried on a laptop; in production with no SMTP there is no mailer at all and the reset
 * routes answer 503 instead of pretending an email went out.
 */
export function createMailer(config: Config): Mailer | null {
  if (config.SMTP_URL) {
    const transport = nodemailer.createTransport(config.SMTP_URL);
    return { send: async (to, subject, text) => void (await transport.sendMail({ from: config.MAIL_FROM, to, subject, text })) };
  }
  if (!config.isProduction && config.NODE_ENV !== "test") {
    return {
      send: async (to, subject, text) => {
        console.log(`\n[dev mailer] To: ${to}\n[dev mailer] Subject: ${subject}\n${text}\n`);
      },
    };
  }
  return null;
}
