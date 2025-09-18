import { Router } from 'express';
import Order from '../models/Order';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.sub;
  const list = await Order.find({ buyer: userId }).sort({ createdAt: -1 });
  res.json(list);
});

router.post('/', requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.sub;
  const { items, currency } = req.body;
  const total = items.reduce((sum: number, it: any) => sum + it.price * (it.quantity || 1), 0);
  const order = await Order.create({ buyer: userId, items, total, currency: currency || 'USD' });
  res.status(201).json(order);
});

export default router;