import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { userEmail, action } = req.body;
    if (!userEmail) return res.status(400).json({ error: 'Missing userEmail' });

    const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
    if (customers.data.length === 0) return res.status(404).json({ error: 'No subscription found' });

    const subscriptions = await stripe.subscriptions.list({ customer: customers.data[0].id, status: 'active', limit: 1 });
    if (subscriptions.data.length === 0) return res.status(404).json({ error: 'No active subscription' });

    const sub = subscriptions.data[0];
    if (action === 'cancel') {
      const updated = await stripe.subscriptions.update(sub.id, { cancel_at_period_end: true });
      return res.status(200).json({ success: true, cancelAt: updated.current_period_end });
    }
    if (action === 'reactivate') {
      await stripe.subscriptions.update(sub.id, { cancel_at_period_end: false });
      return res.status(200).json({ success: true });
    }
    return res.status(400).json({ error: 'Invalid action' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
