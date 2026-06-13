import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://lheniesboruihwmmkans.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

// Try to find a user_id by email if metadata is missing (handles subs created
// directly in the Stripe dashboard without supabase_user_id metadata).
async function getUserIdByEmail(email) {
  if (!email) return null;
  try {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?email=${encodeURIComponent(email)}`, {
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
    });
    const data = await r.json();
    return data?.users?.[0]?.id || null;
  } catch (e) {
    console.error('getUserIdByEmail error:', e);
    return null;
  }
}

// Resolve a Stripe object (subscription/checkout session) to a Supabase user_id.
// Prefer metadata; fall back to customer email.
async function resolveUserId(obj) {
  if (obj.metadata?.supabase_user_id) return obj.metadata.supabase_user_id;
  let email = obj.customer_email || obj.customer_details?.email;
  if (!email && obj.customer) {
    try {
      const customer = await stripe.customers.retrieve(obj.customer);
      email = customer.email;
    } catch (e) {}
  }
  return await getUserIdByEmail(email);
}

async function updateUserEliteStatus(userId, isElite) {
  if (!userId) return;
  try {
    const updateData = { stripe_elite: isElite, updated_at: new Date().toISOString() };
    await fetch(`${SUPABASE_URL}/rest/v1/user_data?user_id=eq.${userId}`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify(updateData),
    });
    console.log(`Updated elite for ${userId}: ${isElite}`);
  } catch (error) {
    console.error('Error updating elite status:', error);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method not allowed');

  let stripeEvent;
  try {
    if (process.env.STRIPE_WEBHOOK_SECRET) {
      stripeEvent = stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'], process.env.STRIPE_WEBHOOK_SECRET);
    } else {
      stripeEvent = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    }
  } catch (err) {
    return res.status(400).send('Webhook Error: ' + err.message);
  }

  const type = stripeEvent.type;
  const obj = stripeEvent.data.object;

  try {
    if (type === 'checkout.session.completed') {
      const userId = await resolveUserId(obj);
      if (userId) await updateUserEliteStatus(userId, true);
    } else if (type === 'invoice.paid' && obj.subscription) {
      const sub = await stripe.subscriptions.retrieve(obj.subscription);
      const userId = await resolveUserId(sub);
      if (userId) await updateUserEliteStatus(userId, true);
    } else if (type === 'invoice.payment_failed' && obj.subscription) {
      const sub = await stripe.subscriptions.retrieve(obj.subscription);
      const userId = await resolveUserId(sub);
      if (userId) await updateUserEliteStatus(userId, false);
    } else if (type === 'customer.subscription.deleted') {
      const userId = await resolveUserId(obj);
      if (userId) await updateUserEliteStatus(userId, false);
    } else if (type === 'customer.subscription.updated') {
      const userId = await resolveUserId(obj);
      if (userId) {
        const active = obj.status === 'active' || obj.status === 'trialing';
        await updateUserEliteStatus(userId, active);
      }
    } else if (type === 'customer.subscription.created') {
      const userId = await resolveUserId(obj);
      if (userId) {
        const active = obj.status === 'active' || obj.status === 'trialing';
        await updateUserEliteStatus(userId, active);
      }
    }
  } catch (error) {
    console.error('Webhook handler error:', error);
    return res.status(500).send('Webhook error');
  }

  return res.status(200).json({ received: true });
}
