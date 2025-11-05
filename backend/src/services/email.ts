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
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 40px 20px;
            color: #333;
          }
          .wrapper {
            max-width: 600px;
            margin: 0 auto;
          }
          .container {
            background: #ffffff;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 40px 20px;
            text-align: center;
            color: #ffffff;
          }
          .logo {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 10px;
            letter-spacing: -0.5px;
          }
          .logo-subtitle {
            font-size: 13px;
            opacity: 0.9;
            font-weight: 400;
            letter-spacing: 1px;
          }
          .icon-container {
            font-size: 48px;
            margin: 20px 0;
            animation: pulse 2s ease-in-out infinite;
          }
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
          }
          .content {
            padding: 40px;
          }
          .greeting {
            font-size: 18px;
            font-weight: 600;
            color: #333;
            margin-bottom: 20px;
          }
          .message {
            font-size: 14px;
            line-height: 1.6;
            color: #666;
            margin-bottom: 16px;
          }
          .cta-section {
            text-align: center;
            margin: 40px 0;
          }
          .button {
            display: inline-block;
            padding: 14px 36px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            font-size: 15px;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
            transition: all 0.3s ease;
            letter-spacing: 0.5px;
          }
          .button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
          }
          .link-section {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin: 30px 0;
            border-left: 4px solid #667eea;
          }
          .link-label {
            font-size: 12px;
            font-weight: 600;
            color: #999;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 8px;
          }
          .reset-link {
            word-break: break-all;
            color: #667eea;
            font-size: 12px;
            font-family: 'Courier New', monospace;
            line-height: 1.5;
          }
          .security-notice {
            background: #fff3cd;
            border: 1px solid #ffc107;
            border-radius: 6px;
            padding: 12px 16px;
            font-size: 13px;
            color: #856404;
            margin: 20px 0;
            display: flex;
            align-items: flex-start;
          }
          .security-icon {
            margin-right: 10px;
            font-size: 16px;
            flex-shrink: 0;
          }
          .footer {
            background: #f8f9fa;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e9ecef;
          }
          .footer-text {
            font-size: 12px;
            color: #999;
            line-height: 1.8;
          }
          .footer-link {
            color: #667eea;
            text-decoration: none;
          }
          .footer-link:hover {
            text-decoration: underline;
          }
          @media (max-width: 600px) {
            body { padding: 20px 10px; }
            .content { padding: 30px 20px; }
            .button { padding: 12px 28px; font-size: 14px; }
            .header { padding: 30px 20px; }
            .logo { font-size: 24px; }
          }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="container">
            <div class="header">
              <div class="logo">Excom</div>
              <div class="logo-subtitle">Marketplace</div>
              <div class="icon-container">🔐</div>
            </div>
            
            <div class="content">
              <h2 class="greeting">Reset Your Password</h2>
              
              <p class="message">
                Hi there! We received a request to reset the password for your Excom account. If you didn't make this request, you can safely ignore this email.
              </p>
              
              <p class="message">
                Click the button below to securely reset your password:
              </p>
              
              <div class="cta-section">
                <a href="${resetLink}" class="button">Reset Password Securely</a>
              </div>
              
              <div class="link-section">
                <div class="link-label">Or copy this link:</div>
                <div class="reset-link">${resetLink}</div>
              </div>
              
              <div class="security-notice">
                <span class="security-icon">⏱️</span>
                <span><strong>Expires in 24 hours:</strong> This password reset link will automatically expire after 24 hours for your security. After that, you'll need to request a new reset link.</span>
              </div>
              
              <p class="message" style="margin-top: 30px; border-top: 1px solid #e9ecef; padding-top: 20px;">
                <strong>Didn't request this?</strong> Your account may be compromised. If you didn't initiate this password reset, please <a href="${process.env.FRONTEND_URL || 'https://excom.app'}/support" style="color: #667eea; text-decoration: none;">contact our support team</a> immediately.
              </p>
            </div>
            
            <div class="footer">
              <p class="footer-text">
                <strong style="color: #333;">Keep Your Account Secure:</strong>
                <br>Never share your password reset link with anyone. Our team will never ask for your password or sensitive information via email.
              </p>
              <p class="footer-text" style="margin-top: 20px;">
                © 2024 Excom. All rights reserved. | <a href="${process.env.FRONTEND_URL || 'https://excom.app'}/privacy" class="footer-link">Privacy Policy</a> | <a href="${process.env.FRONTEND_URL || 'https://excom.app'}/terms" class="footer-link">Terms of Service</a>
              </p>
              <p class="footer-text" style="margin-top: 15px; color: #bbb;">
                Excom Marketplace | support@excom.app
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  const textContent = `
RESET YOUR PASSWORD

Hi there!

We received a request to reset the password for your Excom account. If you didn't make this request, you can safely ignore this email.

To reset your password, visit this link:
${resetLink}

SECURITY NOTICE:
This password reset link will automatically expire after 24 hours for your security.

DIDN'T REQUEST THIS?
Your account may be compromised. If you didn't initiate this password reset, please contact our support team immediately.

KEEP YOUR ACCOUNT SECURE:
Never share your password reset link with anyone. Our team will never ask for your password or sensitive information via email.

---
© 2024 Excom. All rights reserved.
For questions: support@excom.app
  `;

  await sendEmail({
    to: email,
    subject: '🔐 Reset Your Excom Password',
    htmlContent,
    textContent,
  });
};

export const sendPasswordResetSuccessEmail = async (email: string): Promise<void> => {
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset Successful</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
            background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
            padding: 40px 20px;
            color: #333;
          }
          .wrapper {
            max-width: 600px;
            margin: 0 auto;
          }
          .container {
            background: #ffffff;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          .header {
            background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
            padding: 40px 20px;
            text-align: center;
            color: #ffffff;
          }
          .logo {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 10px;
            letter-spacing: -0.5px;
          }
          .logo-subtitle {
            font-size: 13px;
            opacity: 0.9;
            font-weight: 400;
            letter-spacing: 1px;
          }
          .icon-container {
            font-size: 64px;
            margin: 20px 0;
            animation: bounce 1s ease-in-out;
          }
          @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
          }
          .content {
            padding: 40px;
          }
          .greeting {
            font-size: 22px;
            font-weight: 700;
            color: #333;
            margin-bottom: 10px;
          }
          .subheading {
            font-size: 14px;
            color: #666;
            margin-bottom: 30px;
          }
          .message {
            font-size: 14px;
            line-height: 1.6;
            color: #666;
            margin-bottom: 16px;
          }
          .success-badge {
            display: inline-block;
            background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            margin-bottom: 20px;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .cta-section {
            text-align: center;
            margin: 35px 0;
          }
          .button {
            display: inline-block;
            padding: 14px 36px;
            background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            font-size: 15px;
            box-shadow: 0 4px 15px rgba(17, 153, 142, 0.3);
            transition: all 0.3s ease;
            letter-spacing: 0.5px;
          }
          .button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(17, 153, 142, 0.4);
          }
          .security-info {
            background: #f0fdf4;
            border: 1px solid #86efac;
            border-radius: 8px;
            padding: 16px;
            margin: 30px 0;
            font-size: 13px;
            color: #166534;
            line-height: 1.6;
          }
          .security-info strong {
            display: block;
            margin-bottom: 8px;
            color: #15803d;
          }
          .tips-section {
            background: #f8fafc;
            border-left: 4px solid #38ef7d;
            padding: 20px;
            border-radius: 6px;
            margin: 25px 0;
          }
          .tips-title {
            font-weight: 600;
            color: #333;
            margin-bottom: 12px;
            font-size: 14px;
          }
          .tips-list {
            font-size: 13px;
            color: #666;
            line-height: 1.8;
          }
          .tips-item {
            margin-bottom: 8px;
          }
          .tips-item::before {
            content: "✓ ";
            color: #38ef7d;
            font-weight: bold;
            margin-right: 6px;
          }
          .footer {
            background: #f8f9fa;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e9ecef;
          }
          .footer-text {
            font-size: 12px;
            color: #999;
            line-height: 1.8;
          }
          .footer-link {
            color: #38ef7d;
            text-decoration: none;
          }
          .footer-link:hover {
            text-decoration: underline;
          }
          @media (max-width: 600px) {
            body { padding: 20px 10px; }
            .content { padding: 30px 20px; }
            .button { padding: 12px 28px; font-size: 14px; }
            .header { padding: 30px 20px; }
            .logo { font-size: 24px; }
            .greeting { font-size: 18px; }
          }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="container">
            <div class="header">
              <div class="logo">Excom</div>
              <div class="logo-subtitle">Marketplace</div>
              <div class="icon-container">✅</div>
            </div>
            
            <div class="content">
              <div class="success-badge">✓ Confirmed</div>
              <h1 class="greeting">Password Reset Complete!</h1>
              <p class="subheading">Your account is secure and ready to go.</p>
              
              <p class="message">
                Excellent news! Your password has been successfully reset. You can now log in to your Excom account with your new password.
              </p>
              
              <div class="cta-section">
                <a href="${process.env.FRONTEND_URL || 'https://excom.app'}/auth/login" class="button">Sign In to Your Account</a>
              </div>
              
              <div class="security-info">
                <strong>🔒 Security Tip</strong>
                Make sure your new password is strong and unique. Never share it with anyone, and consider using a password manager to keep it safe.
              </div>
              
              <div class="tips-section">
                <div class="tips-title">Recommended Next Steps</div>
                <div class="tips-list">
                  <div class="tips-item">Review your recent account activity</div>
                  <div class="tips-item">Update your security settings and recovery options</div>
                  <div class="tips-item">Consider enabling two-factor authentication (2FA) for extra protection</div>
                </div>
              </div>
              
              <p class="message" style="border-top: 1px solid #e9ecef; padding-top: 20px; margin-top: 30px;">
                <strong>Suspicious activity?</strong> If you didn't initiate this password reset, or notice any unusual account activity, please <a href="${process.env.FRONTEND_URL || 'https://excom.app'}/support" style="color: #38ef7d; text-decoration: none;">contact our support team</a> right away.
              </p>
            </div>
            
            <div class="footer">
              <p class="footer-text">
                <strong style="color: #333;">Questions or Need Help?</strong>
                <br>Visit our <a href="${process.env.FRONTEND_URL || 'https://excom.app'}/help" class="footer-link">Help Center</a> or reach out to our support team at support@excom.app
              </p>
              <p class="footer-text" style="margin-top: 20px;">
                © 2024 Excom. All rights reserved. | <a href="${process.env.FRONTEND_URL || 'https://excom.app'}/privacy" class="footer-link">Privacy Policy</a> | <a href="${process.env.FRONTEND_URL || 'https://excom.app'}/terms" class="footer-link">Terms of Service</a>
              </p>
              <p class="footer-text" style="margin-top: 15px; color: #bbb;">
                Excom Marketplace | security@excom.app
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  const textContent = `
PASSWORD RESET SUCCESSFUL!

Your account is secure and ready to go.

Excellent news! Your password has been successfully reset. You can now log in to your Excom account with your new password.

To sign in, visit: ${process.env.FRONTEND_URL || 'https://excom.app'}/auth/login

SECURITY TIP:
Make sure your new password is strong and unique. Never share it with anyone, and consider using a password manager to keep it safe.

RECOMMENDED NEXT STEPS:
✓ Review your recent account activity
✓ Update your security settings and recovery options
✓ Consider enabling two-factor authentication (2FA) for extra protection

SUSPICIOUS ACTIVITY?
If you didn't initiate this password reset, or notice any unusual account activity, please contact our support team right away at support@excom.app

QUESTIONS OR NEED HELP?
Visit our Help Center or reach out to our support team.

---
© 2024 Excom. All rights reserved.
For security concerns: security@excom.app
  `;

  await sendEmail({
    to: email,
    subject: '✅ Your Excom Password Has Been Successfully Reset',
    htmlContent,
    textContent,
  });
};