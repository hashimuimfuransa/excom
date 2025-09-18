import { Router } from 'express';
import { createSplitPaymentSession, VendorCharge } from '../services/payments';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

router.post('/create-session', requireAuth, async (req: AuthRequest, res) => {
  const { charges } = req.body as { charges: VendorCharge[] };
  if (!Array.isArray(charges) || charges.length === 0) {
    return res.status(400).json({ message: 'charges array required' });
  }
  const session = await createSplitPaymentSession(charges);
  res.json(session);
});

export default router;