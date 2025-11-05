import crypto from 'crypto';
import User from '../models/User';
import bcrypt from 'bcryptjs';
import { sendPasswordResetEmail, sendPasswordResetSuccessEmail } from './email';

export const generatePasswordResetToken = (): { token: string; hashedToken: string } => {
  const token = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  return { token, hashedToken };
};

export const sendPasswordResetLink = async (email: string): Promise<void> => {
  const user = await User.findOne({ email });
  
  if (!user) {
    // Don't reveal if email exists (security best practice)
    console.log(`Password reset requested for non-existent email: ${email}`);
    return;
  }

  // Generate reset token
  const { token, hashedToken } = generatePasswordResetToken();
  
  // Save hashed token and expiry to database
  user.passwordResetToken = hashedToken;
  user.passwordResetExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  await user.save();

  // Generate reset link
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const resetLink = `${frontendUrl}/auth/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

  // Send email
  await sendPasswordResetEmail(email, token, resetLink);
};

export const validatePasswordResetToken = async (email: string, token: string): Promise<boolean> => {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  
  const user = await User.findOne({ email }).select('+passwordResetToken +passwordResetExpiresAt');
  
  if (!user) {
    return false;
  }

  // Check if token matches and hasn't expired
  if (user.passwordResetToken !== hashedToken) {
    return false;
  }

  if (!user.passwordResetExpiresAt || user.passwordResetExpiresAt < new Date()) {
    return false;
  }

  return true;
};

export const resetPassword = async (email: string, token: string, newPassword: string): Promise<void> => {
  // Validate token first
  const isValid = await validatePasswordResetToken(email, token);
  
  if (!isValid) {
    throw new Error('Invalid or expired password reset token');
  }

  const user = await User.findOne({ email });
  
  if (!user) {
    throw new Error('User not found');
  }

  // Hash new password
  const passwordHash = await bcrypt.hash(newPassword, 10);
  
  // Update password and clear reset token
  user.passwordHash = passwordHash;
  user.passwordResetToken = undefined;
  user.passwordResetExpiresAt = undefined;
  await user.save();

  // Send success email
  await sendPasswordResetSuccessEmail(email);
};