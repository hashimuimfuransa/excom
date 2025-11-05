import { Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { sendPasswordResetLink, resetPassword } from '../services/passwordReset';

const router = Router();

router.post('/register', async (req, res) => {
  const { name, email, password, role } = req.body as { name: string; email: string; password: string; role?: string };
  const exists = await User.findOne({ email });
  if (exists) return res.status(400).json({ message: 'Email already in use' });
  const passwordHash = password ? await bcrypt.hash(password, 10) : undefined;
  const safeRole = ['buyer', 'seller', 'affiliate'].includes(role || '') ? role : 'buyer';
  console.log('User registration:', { email, role: safeRole });
  const user = await User.create({ name, email, passwordHash, role: safeRole });
  res.json({ id: user.id });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !user.passwordHash) return res.status(400).json({ message: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(400).json({ message: 'Invalid credentials' });
  
  console.log('User login:', { id: user.id, email: user.email, role: user.role });
  const token = jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET || 'dev', { expiresIn: '7d' });
  console.log('Token created with payload:', { sub: user.id, role: user.role });
  res.json({ token });
});

// Get current user info from token
router.get('/me', requireAuth, async (req: AuthRequest, res) => {
  const user = await User.findById(req.user!.sub).select('name firstName lastName email role phone avatar affiliateOnboardingCompleted');
  if (!user) return res.status(404).json({ message: 'User not found' });
  
  // Split name into firstName and lastName if they don't exist
  if (!user.firstName && !user.lastName && user.name) {
    const nameParts = user.name.split(' ');
    user.firstName = nameParts[0] || '';
    user.lastName = nameParts.slice(1).join(' ') || '';
  }
  
  res.json(user);
});

// Check affiliate onboarding status
router.get('/affiliate-status', requireAuth, async (req: AuthRequest, res) => {
  const user = await User.findById(req.user!.sub).select('role affiliateOnboardingCompleted');
  if (!user) return res.status(404).json({ message: 'User not found' });
  
  if (user.role !== 'affiliate') {
    return res.status(400).json({ message: 'User is not an affiliate' });
  }
  
  res.json({ 
    affiliateOnboardingCompleted: user.affiliateOnboardingCompleted || false 
  });
});

// Forgot Password - Send reset link to email
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body as { email: string };

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  try {
    await sendPasswordResetLink(email);
    // Always return success for security (don't reveal if email exists)
    res.json({ 
      message: 'If an account exists with this email, a password reset link has been sent.' 
    });
  } catch (error: any) {
    console.error('Error sending password reset email:', error);
    res.status(500).json({ message: 'Error processing password reset request' });
  }
});

// Validate Reset Token
router.post('/validate-reset-token', async (req, res) => {
  const { email, token } = req.body as { email: string; token: string };

  if (!email || !token) {
    return res.status(400).json({ message: 'Email and token are required' });
  }

  try {
    const isValid = await require('../services/passwordReset').validatePasswordResetToken(email, token);
    
    if (!isValid) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    res.json({ message: 'Token is valid', valid: true });
  } catch (error: any) {
    console.error('Error validating reset token:', error);
    res.status(400).json({ message: 'Invalid or expired reset token' });
  }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
  const { email, token, newPassword } = req.body as { email: string; token: string; newPassword: string };

  if (!email || !token || !newPassword) {
    return res.status(400).json({ message: 'Email, token, and new password are required' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }

  try {
    await resetPassword(email, token, newPassword);
    res.json({ message: 'Password has been reset successfully' });
  } catch (error: any) {
    console.error('Error resetting password:', error);
    res.status(400).json({ message: error.message || 'Error resetting password' });
  }
});

export default router;