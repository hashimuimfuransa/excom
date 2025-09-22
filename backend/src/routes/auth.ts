import { Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import { requireAuth, AuthRequest } from '../middleware/auth';

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

export default router;