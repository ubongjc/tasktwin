import nodemailer from "nodemailer";

// Create reusable transporter
const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: EmailOptions) {
  try {
    const info = await transporter.sendMail({
      from: `"TaskTwin" <${process.env.SMTP_FROM || "noreply@tasktwin.com"}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    console.log("Email sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Failed to send email:", error);
    return { success: false, error };
  }
}

// Email templates
export const emailTemplates = {
  matchFound: (userName: string, partnerName: string, roomUrl: string) => ({
    subject: "Match Found! Your Focus Session is Ready",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Match Found</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Match Found!</h1>
        </div>

        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="font-size: 18px; margin-top: 0;">Hi ${userName},</p>

          <p>Great news! We've found you a focus partner.</p>

          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
            <p style="margin: 0; font-size: 16px;"><strong>Your partner:</strong> ${partnerName}</p>
          </div>

          <p>Your 25-minute focus session is ready to begin!</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${roomUrl}" style="display: inline-block; background: #667eea; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">Join Session Now</a>
          </div>

          <p style="color: #666; font-size: 14px; margin-top: 30px;">Remember: Stay focused, be respectful, and make the most of your session together!</p>
        </div>

        <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
          <p>TaskTwin - Focus Together, Achieve More</p>
        </div>
      </body>
      </html>
    `,
    text: `Hi ${userName},\n\nGreat news! We've found you a focus partner: ${partnerName}.\n\nYour 25-minute focus session is ready to begin!\n\nJoin now: ${roomUrl}\n\nRemember: Stay focused, be respectful, and make the most of your session together!\n\nTaskTwin - Focus Together, Achieve More`,
  }),

  sessionCompleted: (userName: string, sessionCount: number, streakCount: number) => ({
    subject: "Session Complete! 🎯",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🎯 Great Work!</h1>
        </div>

        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="font-size: 18px; margin-top: 0;">Hi ${userName},</p>

          <p>Congratulations on completing another focus session!</p>

          <div style="display: flex; gap: 10px; margin: 25px 0;">
            <div style="flex: 1; background: white; padding: 20px; border-radius: 8px; text-align: center;">
              <div style="font-size: 32px; font-weight: bold; color: #667eea;">${sessionCount}</div>
              <div style="color: #666; font-size: 14px; margin-top: 5px;">Total Sessions</div>
            </div>
            <div style="flex: 1; background: white; padding: 20px; border-radius: 8px; text-align: center;">
              <div style="font-size: 32px; font-weight: bold; color: #f97316;">🔥 ${streakCount}</div>
              <div style="color: #666; font-size: 14px; margin-top: 5px;">Day Streak</div>
            </div>
          </div>

          <p>Keep up the momentum! Ready for your next session?</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="display: inline-block; background: #667eea; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">Start Another Session</a>
          </div>
        </div>

        <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
          <p>TaskTwin - Focus Together, Achieve More</p>
        </div>
      </body>
      </html>
    `,
  }),

  subscriptionConfirmation: (userName: string, plan: string, amount: string) => ({
    subject: "Welcome to TaskTwin Premium! 🎉",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Welcome to Premium!</h1>
        </div>

        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="font-size: 18px; margin-top: 0;">Hi ${userName},</p>

          <p>Thank you for subscribing to TaskTwin Premium!</p>

          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0;"><strong>Plan:</strong> ${plan}</p>
            <p style="margin: 0;"><strong>Amount:</strong> ${amount}/month</p>
          </div>

          <p><strong>Your Premium benefits:</strong></p>
          <ul style="color: #666;">
            <li>Unlimited focus sessions</li>
            <li>Priority matching</li>
            <li>Advanced analytics</li>
            <li>Team workspaces (coming soon)</li>
            <li>Priority support</li>
          </ul>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="display: inline-block; background: #667eea; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">Go to Dashboard</a>
          </div>

          <p style="color: #666; font-size: 14px; margin-top: 30px;">You can manage your subscription anytime from your billing settings.</p>
        </div>

        <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
          <p>TaskTwin - Focus Together, Achieve More</p>
        </div>
      </body>
      </html>
    `,
  }),
};
