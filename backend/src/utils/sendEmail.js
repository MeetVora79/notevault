import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendPasswordResetEmail = async ({ to, name, resetUrl }) => {
  const { data, error } = await resend.emails.send({
    from: "NoteVault <onboarding@resend.dev>", // free tier sender — works without custom domain
    to: `${to}`,
    subject: "Reset your NoteVault password",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
        <h1 style="font-size: 24px; font-weight: 700; color: #0f0f0f; margin-bottom: 8px;">
          Reset your password
        </h1>
        <p style="color: #6b7280; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
          Hi ${name}, we received a request to reset your NoteVault password.
          Click the button below to choose a new password.
        </p>
        <a
          href="${resetUrl}"
          style="display: inline-block; background: #6D5EF8; color: white; font-size: 14px;
                 font-weight: 600; padding: 12px 24px; border-radius: 8px; text-decoration: none;"
        >
          Reset password
        </a>
        <p style="color: #9ca3af; font-size: 13px; margin-top: 24px; line-height: 1.6;">
          This link expires in <strong>1 hour</strong>. If you didn't request a password reset,
          you can safely ignore this email — your password won't be changed.
        </p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="color: #d1d5db; font-size: 12px;">
          NoteVault | AI-Powered Smart Notes
        </p>
      </div>
    `,
  });

  if (error) throw new Error(`Email send failed: ${error.message}`);
};
