/** biome-ignore-all lint/style/useNamingConvention: API has this exact format */
/** biome-ignore-all lint/suspicious/noConsole: we want the link to */
import type { EmailConfig } from "next-auth/providers";

interface MailpitEmailConfig {
  /**
   * The base URL for the Mailpit API.
   * @default 'http://localhost:8025'
   */
  baseUrl?: string;
  /**
   * The email address the email is sent from.
   * @default 'no-reply@example.com'
   */
  from?: string;
  /**
   * Custom function for sending emails.
   * @default undefined
   */
  sendEmail?: (params: { identifier: string; url: string; provider: EmailConfig }) => Promise<void>;
}

/**
 * Edge-compatible email provider for Mailpit
 */
export default function MailpitProvider(options: MailpitEmailConfig = {}): EmailConfig {
  const { baseUrl = "http://localhost:8025", from = "dev@bignight.party", sendEmail } = options;

  if (sendEmail) {
    return {
      from,
      id: "mailpit",
      name: "Mailpit",
      sendVerificationRequest: sendEmail,
      type: "email",
    };
  }

  // IMPORTANT: This exact format is needed for Auth.js to recognize it as an email provider
  const provider: EmailConfig = {
    from: from,
    id: "email",
    maxAge: 24 * 60 * 60, // 24 hours
    name: "Email",
    sendVerificationRequest: async ({ identifier, url, provider }) => {
      const { from } = provider;
      const { host } = new URL(url);

      console.log(`🚨 [Mailpit] sendVerificationRequest called with identifier: ${identifier}`);
      console.log(`[Mailpit] Magic link URL: ${url}`);

      try {
        // Create payload according to Mailpit API docs
        const payload = {
          From: { Email: from, Name: "BigNight.Party" },
          HTML: `
            <body>
              <h1>Sign in to ${host}</h1>
              <p><a href="${url}">Click here to sign in</a></p>
              <p>Or copy and paste this URL into your browser:</p>
              <p>${url}</p>
            </body>
          `,
          Subject: `Sign in to ${host}`,
          Text: `Sign in to ${host}\n\n${url}\n\n`,
          To: [{ Email: identifier, Name: identifier }],
        };

        const response = await fetch(`${baseUrl}/api/v1/send`, {
          body: JSON.stringify(payload),
          headers: {
            "Content-Type": "application/json",
          },
          method: "POST",
        });

        console.log(`[Mailpit] API response status: ${response.status}`);

        if (!response.ok) {
          const data = await response.text();
          console.error(`[Mailpit] API error:`, data);
          throw new Error(`Mailpit API error: ${data}`);
        } else {
          console.log("[Mailpit] Email sent successfully");
        }
      } catch (error) {
        console.error("[Mailpit] SEND_VERIFICATION_EMAIL_ERROR", error);
        throw new Error(`Failed to send verification email: ${String(error)}`);
      }
    },
    type: "email",
  };

  return provider;
}
