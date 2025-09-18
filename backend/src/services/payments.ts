// Payment orchestration stubs for Stripe, Flutterwave, PayPal, Mobile Money
// This demonstrates split payments intent for multi-vendor carts

export type VendorCharge = { vendorId: string; amount: number; currency: string };

export async function createSplitPaymentSession(vendorCharges: VendorCharge[]) {
  // TODO: create sessions/intents per provider and vendor
  return {
    provider: 'stripe',
    sessionId: 'sess_123',
    charges: vendorCharges
  };
}