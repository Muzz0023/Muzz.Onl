import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://lheniesboruihwmmkans.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { userEmail, userId } = req.body;
    if (!userEmail) return res.status(400).json({ error: 'Missing userEmail' });

    // Check Stripe first
    const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
    if (customers.data.length > 0) {
      const subscriptions = await stripe.subscriptions.list({ customer: customers.data[0].id, status: 'active', limit: 5 });
      if (subscriptions.data.length > 0) {
        let isDonnyElite = false;
        const sub = subscriptions.data[0];
        for (const s of subscriptions.data) {
          const priceIds = s.items.data.map(i => i.price.id);
          if (priceIds.includes(process.env.DONNY_PRICE_ID)) {
            isDonnyElite = true;
            break;
          }
        }
        return res.status(200).json({
          isElite: true,
          isDonnyElite,
          subscription: { id: sub.id, status: sub.status, currentPeriodEnd: sub.current_period_end, cancelAtPeriodEnd: sub.cancel_at_period_end },
        });
      }
    }

    // No Stripe sub — check Supabase for Apple IAP status set by RevenueCat webhook
    if (userId && SUPABASE_SERVICE_KEY) {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/user_data?user_id=eq.${userId}&select=data_json`, {
        headers: { 'apikey': SUPABASE_SERVICE_KEY, 'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}` }
      });
      const rows = await r.json();
      const data = rows?.[0]?.data_json;
      if (data?.stripeElite || data?.stripeDonnyElite) {
        return res.status(200).json({
          isElite: data.stripeElite || data.stripeDonnyElite,
          isDonnyElite: data.stripeDonnyElite || false,
          subscription: null,
        });
      }
    }

    return res.status(200).json({ isElite: false, isDonnyElite: false, subscription: null });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
