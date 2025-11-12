import nodemailer from 'nodemailer';
import type { TransportOptions } from 'nodemailer';

// Email configuration - only if credentials are provided
const emailConfig = {
  host: process.env.EMAIL_SERVER_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_SERVER_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
};

// Create reusable transporter only if credentials exist
const transporter = (process.env.EMAIL_SERVER_USER && process.env.EMAIL_SERVER_PASSWORD)
  ? nodemailer.createTransport(emailConfig as TransportOptions)
  : null;

// Verify transporter configuration only if it exists and email is not skipped
if (
  transporter &&
  process.env.SKIP_EMAIL_VERIFICATION !== 'true' &&
  process.env.NODE_ENV !== 'production'
) {
  transporter.verify((error) => {
    if (error) {
      console.error('Email transporter verification failed:', error);
    } else {
      console.log('✅ Email server is ready to send messages');
    }
  });
}

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send an email
 */
export async function sendEmail({ to, subject, html, text }: SendEmailOptions) {
  // Skip if email verification is disabled or no transporter
  if (process.env.SKIP_EMAIL_VERIFICATION === 'true' || !transporter) {
    console.log('📧 [SKIPPED] Email sending disabled or not configured');
    console.log(`Would have sent: ${subject} to ${to}`);
    return { success: true, messageId: 'skipped' };
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_SERVER_USER,
      to,
      subject,
      html,
      text: text || stripHtml(html), // Fallback to stripped HTML if no text provided
    });

    console.log('✅ Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending email:', error);
    throw new Error('Failed to send email');
  }
}

/**
 * Send verification email
 */
export async function sendVerificationEmail(email: string, token: string) {
  const verificationUrl = `${process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}`;

  // Log in development
  if (process.env.NODE_ENV === 'development') {
    console.log('📧 Verification URL:', verificationUrl);
  }

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td align="center" style="padding: 40px 0;">
              <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <!-- Header -->
                <tr>
                  <td style="padding: 40px 40px 20px 40px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">Welcome to Zlavox AI! 🎉</h1>
                  </td>
                </tr>
                
                <!-- Body -->
                <tr>
                  <td style="padding: 40px;">
                    <h2 style="margin: 0 0 20px 0; color: #333333; font-size: 24px;">Verify Your Email Address</h2>
                    <p style="margin: 0 0 20px 0; color: #666666; font-size: 16px; line-height: 1.6;">
                      Thank you for signing up! We're excited to have you on board. To complete your registration and start using your account, please verify your email address by clicking the button below.
                    </p>
                    
                    <table role="presentation" style="margin: 30px 0;">
                      <tr>
                        <td align="center" style="border-radius: 4px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                          <a href="${verificationUrl}" target="_blank" style="display: inline-block; padding: 16px 36px; font-size: 16px; color: #ffffff; text-decoration: none; font-weight: bold;">
                            Verify Email Address
                          </a>
                        </td>
                      </tr>
                    </table>
                    
                    <p style="margin: 20px 0; color: #666666; font-size: 14px; line-height: 1.6;">
                      If the button doesn't work, you can copy and paste this link into your browser:
                    </p>
                    <p style="margin: 0 0 20px 0; padding: 12px; background-color: #f5f5f5; border-radius: 4px; word-break: break-all; font-size: 12px; color: #666666;">
                      ${verificationUrl}
                    </p>
                    
                    <p style="margin: 20px 0 0 0; color: #999999; font-size: 14px; line-height: 1.6;">
                      ⏱️ This link will expire in 1 hour for security reasons.
                    </p>
                    
                    <hr style="margin: 30px 0; border: none; border-top: 1px solid #eeeeee;">
                    
                    <p style="margin: 0; color: #999999; font-size: 12px; line-height: 1.6;">
                      If you didn't create an account, you can safely ignore this email.
                    </p>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="padding: 20px 40px; text-align: center; background-color: #f9f9f9; border-radius: 0 0 8px 8px;">
                    <p style="margin: 0; color: #999999; font-size: 12px;">
                      © ${new Date().getFullYear()} Zlavox AI. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: '✉️ Verify Your Email Address - Zlavox AI',
    html,
  });
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;

  // Log in development
  if (process.env.NODE_ENV === 'development') {
    console.log('📧 Password reset URL:', resetUrl);
  }

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td align="center" style="padding: 40px 0;">
              <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <!-- Header -->
                <tr>
                  <td style="padding: 40px 40px 20px 40px; text-align: center; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); border-radius: 8px 8px 0 0;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">🔐 Password Reset Request</h1>
                  </td>
                </tr>
                
                <!-- Body -->
                <tr>
                  <td style="padding: 40px;">
                    <h2 style="margin: 0 0 20px 0; color: #333333; font-size: 24px;">Reset Your Password</h2>
                    <p style="margin: 0 0 20px 0; color: #666666; font-size: 16px; line-height: 1.6;">
                      We received a request to reset your password. Click the button below to choose a new password. If you didn't make this request, you can safely ignore this email.
                    </p>
                    
                    <table role="presentation" style="margin: 30px 0;">
                      <tr>
                        <td align="center" style="border-radius: 4px; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
                          <a href="${resetUrl}" target="_blank" style="display: inline-block; padding: 16px 36px; font-size: 16px; color: #ffffff; text-decoration: none; font-weight: bold;">
                            Reset Password
                          </a>
                        </td>
                      </tr>
                    </table>
                    
                    <p style="margin: 20px 0; color: #666666; font-size: 14px; line-height: 1.6;">
                      If the button doesn't work, you can copy and paste this link into your browser:
                    </p>
                    <p style="margin: 0 0 20px 0; padding: 12px; background-color: #f5f5f5; border-radius: 4px; word-break: break-all; font-size: 12px; color: #666666;">
                      ${resetUrl}
                    </p>
                    
                    <div style="margin: 30px 0; padding: 16px; background-color: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">
                      <p style="margin: 0; color: #856404; font-size: 14px; line-height: 1.6;">
                        <strong>⚠️ Security Notice:</strong><br>
                        This link will expire in 1 hour. For your security, never share this link with anyone.
                      </p>
                    </div>
                    
                    <hr style="margin: 30px 0; border: none; border-top: 1px solid #eeeeee;">
                    
                    <p style="margin: 0; color: #999999; font-size: 12px; line-height: 1.6;">
                      If you didn't request a password reset, please ignore this email or contact support if you have concerns.
                    </p>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="padding: 20px 40px; text-align: center; background-color: #f9f9f9; border-radius: 0 0 8px 8px;">
                    <p style="margin: 0; color: #999999; font-size: 12px;">
                      © ${new Date().getFullYear()} Zlavox AI. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: '🔒 Password Reset Request - Zlavox AI',
    html,
  });
}

/**
 * Strip HTML tags from string (for plain text email fallback)
 */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

export default transporter;