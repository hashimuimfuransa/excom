import { Router } from 'express';
import { fetchAmazonProducts, fetchEbayProducts, fetchAlibabaProducts, fetchShopifyProducts } from '../integrations/marketplaces';
import { searchStays } from '../integrations/travel';

const router = Router();

// Unified search stub: type = products | stays
router.get('/', async (req, res) => {
  const q = String(req.query.q || '');
  const type = String(req.query.type || 'products');

  if (type === 'stays') {
    const location = String(req.query.location || 'Kigali');
    const priceMax = req.query.priceMax ? Number(req.query.priceMax) : undefined;
    const stars = req.query.stars ? Number(req.query.stars) : undefined;
    const stays = await searchStays({ location, priceMax, stars });
    return res.json({ stays });
  }

  const [amz, ebay, ali, shop] = await Promise.all([
    fetchAmazonProducts(q),
    fetchEbayProducts(q),
    fetchAlibabaProducts(q),
    fetchShopifyProducts(q)
  ]);

  return res.json({ products: [...amz, ...ebay, ...ali, ...shop] });
});

export default router;