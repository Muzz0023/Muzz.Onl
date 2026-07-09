import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const RESEARCH_PRICE_ID = process.env.STRIPE_RESEARCH_PRICE_ID || 'price_1TrDBp1gOtfSeAhJidfiM2t5';

function subIsResearch(sub) {
  if (sub.metadata?.plan === 'research') return true;
  return (sub.items?.data || []).some(i => i.price?.id === RESEARCH_PRICE_ID);
}

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
    if (customers.data.length === 0) return res.status(200).json({ isElite: false, isResearch: false, subscription: null });

    const subscriptions = await stripe.subscriptions.list({ customer: customers.data[0].id, status: 'active', limit: 5 });
    if (subscriptions.data.length === 0) return res.status(200).json({ isElite: false, isResearch: false, subscription: null });

    // Research includes Elite. Prefer reporting the research sub if the user has both.
    const researchSub = subscriptions.data.find(subIsResearch);
    const sub = researchSub || subscriptions.data[0];

    return res.status(200).json({
      isElite: true,
      isResearch: !!researchSub,
      subscription: {
        id: sub.id,
        status: sub.status,
        plan: researchSub ? 'research' : 'elite',
        currentPeriodEnd: sub.current_period_end,
        cancelAtPeriodEnd: sub.cancel_at_period_end,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
