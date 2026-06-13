import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { userId, userEmail } = req.body;
    if (!userId || !userEmail) return res.status(400).json({ error: 'Missing userId or userEmail' });

    const priceId = process.env.STRIPE_PRICE_ID;

    const existingCustomers = await stripe.customers.list({ email: userEmail, limit: 1 });
    let customer;
    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];
    } else {
      customer = await stripe.customers.create({ email: userEmail, metadata: { supabase_user_id: userId } });
    }

    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: (process.env.NEXT_PUBLIC_URL || 'https://muzz.onl') + '?payment=success',
      cancel_url: (process.env.NEXT_PUBLIC_URL || 'https://muzz.onl') + '?payment=cancelled',
      metadata: { supabase_user_id: userId, plan: 'elite' },
      subscription_data: { metadata: { supabase_user_id: userId, plan: 'elite' } },
    });

    return res.status(200).json({ url: session.url });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
