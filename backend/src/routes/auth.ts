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
  const safeRole = role === 'seller' ? 'seller' : 'buyer';
  const user = await User.create({ name, email, passwordHash, role: safeRole });
  res.json({ id: user.id });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !user.passwordHash) return res.status(400).json({ message: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(400).json({ message: 'Invalid credentials' });
  const token = jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET || 'dev', { expiresIn: '7d' });
  res.json({ token });
});

// Get current user info from token
router.get('/me', requireAuth, async (req: AuthRequest, res) => {
  const user = await User.findById(req.user!.sub).select('name firstName lastName email role phone avatar');
  if (!user) return res.status(404).json({ message: 'User not found' });
  
  // Split name into firstName and lastName if they don't exist
  if (!user.firstName && !user.lastName && user.name) {
    const nameParts = user.name.split(' ');
    user.firstName = nameParts[0] || '';
    user.lastName = nameParts.slice(1).join(' ') || '';
  }
  
  res.json(user);
});

export default router;