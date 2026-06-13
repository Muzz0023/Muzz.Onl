import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { userEmail } = req.body;
    if (!userEmail) return res.status(400).json({ error: 'Missing userEmail' });

    const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
    if (customers.data.length === 0) return res.status(200).json({ isElite: false, subscription: null });

    const subscriptions = await stripe.subscriptions.list({ customer: customers.data[0].id, status: 'active', limit: 5 });
    if (subscriptions.data.length > 0) {
      const sub = subscriptions.data[0];
      return res.status(200).json({
        isElite: true,
        subscription: { id: sub.id, status: sub.status, currentPeriodEnd: sub.current_period_end, cancelAtPeriodEnd: sub.cancel_at_period_end },
      });
    }
    return res.status(200).json({ isElite: false, subscription: null });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
