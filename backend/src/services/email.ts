import sgMail from '@sendgrid/mail';

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

export interface EmailOptions {
  to: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
}

export const sendEmail = async (options: EmailOptions): Promise<void> => {
  if (!process.env.SENDGRID_API_KEY) {
    console.error('SENDGRID_API_KEY is not set. Email sending disabled.');
    return;
  }

  try {
    const msg = {
      to: options.to,
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@excom.app',
      subject: options.subject,
      html: options.htmlContent,
      text: options.textContent || 'Please view this email in HTML format.',
    };

    await sgMail.send(msg);
    console.log(`Email sent successfully to ${options.to}`);
  } catch (error: any) {
    console.error('Error sending email:', error.response?.body || error.message);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

export const sendPasswordResetEmail = async (email: string, resetToken: string, resetLink: string): Promise<void> => {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { font-size: 24px; font-weight: bold; color: #333; margin-bottom: 10px; }
          .content { background: #f9f9f9; padding: 20px; border-radius: 8px; }
          .button { display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 4px; margin-top: 20px; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
          .warning { color: #d9534f; font-size: 12px; margin-top: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">Excom</div>
            <h2 style="margin: 0; color: #333;">Reset Your Password</h2>
          </div>
          
          <div class="content">
            <p>Hi,</p>
            <p>We received a request to reset your password. If you didn't make this request, you can ignore this email.</p>
            <p>To reset your password, click the button below:</p>
            
            <a href="${resetLink}" class="button">Reset Password</a>
            
            <p style="margin-top: 20px; color: #666; font-size: 14px;">
              Or copy and paste this link in your browser:
              <br/>
              <span style="word-break: break-all; color: #007bff;">${resetLink}</span>
            </p>
            
            <p class="warning">
              This link will expire in 24 hours for security reasons.
            </p>
          </div>
          
          <div class="footer">
            <p>© 2024 Excom. All rights reserved.</p>
            <p>If you have any questions, please contact us at support@excom.app</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const textContent = `
Reset Your Password

Hi,

We received a request to reset your password. If you didn't make this request, you can ignore this email.

To reset your password, visit this link:
${resetLink}

This link will expire in 24 hours for security reasons.

© 2024 Excom. All rights reserved.
  `;

  await sendEmail({
    to: email,
    subject: 'Reset Your Excom Password',
    htmlContent,
    textContent,
  });
};

export const sendPasswordResetSuccessEmail = async (email: string): Promise<void> => {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { font-size: 24px; font-weight: bold; color: #333; margin-bottom: 10px; }
          .content { background: #f0f9f0; padding: 20px; border-radius: 8px; border: 1px solid #d4edda; }
          .success-icon { font-size: 48px; margin: 10px 0; }
          .button { display: inline-block; padding: 12px 24px; background: #28a745; color: white; text-decoration: none; border-radius: 4px; margin-top: 20px; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">Excom</div>
            <h2 style="margin: 0; color: #333;">Password Reset Successful</h2>
          </div>
          
          <div class="content">
            <div class="success-icon">✅</div>
            <p>Your password has been successfully reset!</p>
            <p>You can now log in with your new password.</p>
            
            <a href="${process.env.FRONTEND_URL || 'https://excom.app'}/auth/login" class="button">Go to Login</a>
            
            <p style="color: #666; font-size: 12px; margin-top: 20px;">
              If you did not request this password reset, please contact support immediately.
            </p>
          </div>
          
          <div class="footer">
            <p>© 2024 Excom. All rights reserved.</p>
            <p>If you have any questions, please contact us at support@excom.app</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const textContent = `
Password Reset Successful

Your password has been successfully reset!
You can now log in with your new password.

© 2024 Excom. All rights reserved.
  `;

  await sendEmail({
    to: email,
    subject: 'Your Excom Password Has Been Reset',
    htmlContent,
    textContent,
  });
};