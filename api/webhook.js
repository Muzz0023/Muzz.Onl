import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://lheniesboruihwmmkans.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const DONNY_PRICE_ID = process.env.DONNY_PRICE_ID;

// ============================================
// Look up a Supabase user_id from an email address.
// Used as a fallback when the Stripe subscription has no `supabase_user_id` metadata
// (e.g. when the subscription was created manually in the Stripe dashboard).
// ============================================
async function getUserIdByEmail(email) {
  if (!email) return null;
  try {
    // Supabase admin API: list users filtered by email.
    const r = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?email=${encodeURIComponent(email)}`, {
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      }
    });
    if (!r.ok) {
      console.error('getUserIdByEmail: admin lookup failed', r.status);
      return null;
    }
    const data = await r.json();
    const users = data.users || data; // shape can vary
    if (Array.isArray(users) && users.length > 0) {
      // Exact email match (case-insensitive) to be safe
      const hit = users.find(u => (u.email || '').toLowerCase() === email.toLowerCase());
      return hit?.id || users[0]?.id || null;
    }
    return null;
  } catch (e) {
    console.error('getUserIdByEmail error:', e);
    return null;
  }
}

// ============================================
// Resolve the supabase_user_id for any Stripe event.
// 1) Use metadata.supabase_user_id if present (the normal path via checkout).
// 2) Otherwise, fall back to looking up the customer's email in Supabase Auth.
// ============================================
async function resolveUserId(obj) {
  // Direct metadata on the object (checkout session or subscription)
  if (obj.metadata?.supabase_user_id) return obj.metadata.supabase_user_id;

  // Try the customer's email
  let email = obj.customer_email || obj.customer_details?.email || null;
  if (!email && obj.customer) {
    try {
      const customer = await stripe.customers.retrieve(obj.customer);
      email = customer?.email || null;
    } catch (e) {
      console.error('Failed to retrieve customer for email fallback:', e);
    }
  }
  if (email) {
    const uid = await getUserIdByEmail(email);
    if (uid) console.log(`Resolved user via email fallback: ${email} -> ${uid}`);
    return uid;
  }
  return null;
}

// ============================================
// Detect whether a subscription is the Donny tier by checking its price IDs
// (more reliable than relying on metadata.plan which can be missing).
// ============================================
function subscriptionIsDonny(sub) {
  if (sub.metadata?.plan === 'donny') return true;
  if (!DONNY_PRICE_ID) return false;
  const priceIds = (sub.items?.data || []).map(i => i.price?.id);
  return priceIds.includes(DONNY_PRICE_ID);
}

async function updateUserEliteStatus(userId, isElite, isDonnyElite) {
  if (!userId) {
    console.error('updateUserEliteStatus: no userId, skipping');
    return;
  }
  try {
    const updateData = {};
    if (isElite !== null) updateData.stripe_elite = isElite;
    if (isDonnyElite !== null) updateData.stripe_donny_elite = isDonnyElite;
    if (isDonnyElite === true) updateData.stripe_elite = true;
    if (isElite === false && isDonnyElite === false) {
      updateData.stripe_elite = false;
      updateData.stripe_donny_elite = false;
    }

    await fetch(`${SUPABASE_URL}/rest/v1/user_data?user_id=eq.${userId}`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ ...updateData, updated_at: new Date().toISOString() }),
    });
    console.log(`Updated elite status for ${userId}:`, updateData);
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
      const isDonny = obj.metadata?.plan === 'donny';
      if (userId) await updateUserEliteStatus(userId, true, isDonny ? true : null);

    } else if (type === 'invoice.paid' && obj.subscription) {
      const sub = await stripe.subscriptions.retrieve(obj.subscription);
      // resolveUserId checks metadata first, then falls back to invoice's customer_email
      const userId = sub.metadata?.supabase_user_id || await resolveUserId(obj);
      const isDonny = subscriptionIsDonny(sub);
      if (userId) await updateUserEliteStatus(userId, true, isDonny ? true : null);

    } else if (type === 'invoice.payment_failed' && obj.subscription) {
      const sub = await stripe.subscriptions.retrieve(obj.subscription);
      const userId = sub.metadata?.supabase_user_id || await resolveUserId(obj);
      if (userId) await updateUserEliteStatus(userId, false, false);

    } else if (type === 'customer.subscription.deleted') {
      const userId = await resolveUserId(obj);
      if (userId) await updateUserEliteStatus(userId, false, false);

    } else if (type === 'customer.subscription.updated' || type === 'customer.subscription.created') {
      const userId = await resolveUserId(obj);
      const active = obj.status === 'active' || obj.status === 'trialing';
      const isDonny = subscriptionIsDonny(obj);
      if (userId) await updateUserEliteStatus(userId, active, isDonny ? active : null);
    }
  } catch (error) {
    console.error('Webhook handler error:', error);
    return res.status(500).send('Webhook error');
  }

  return res.status(200).json({ received: true });
}
