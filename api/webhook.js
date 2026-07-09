import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://lheniesboruihwmmkans.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const RESEARCH_PRICE_ID = process.env.STRIPE_RESEARCH_PRICE_ID || 'price_1TrDBp1gOtfSeAhJidfiM2t5';

function subIsResearch(sub) {
  if (sub?.metadata?.plan === 'research') return true;
  return (sub?.items?.data || []).some(i => i.price?.id === RESEARCH_PRICE_ID);
}

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

// Patch only the fields provided, e.g. { stripe_elite: true, stripe_research: true }
async function updateUserTier(userId, fields) {
  if (!userId) return;
  try {
    const updateData = { ...fields, updated_at: new Date().toISOString() };
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
    console.log(`Updated tier for ${userId}:`, JSON.stringify(fields));
  } catch (error) {
    console.error('Error updating tier status:', error);
  }
}

// When a Research sub activates, stop future billing on any other active subs
// (i.e. the old Elite sub) so upgraders never get double-billed.
async function dedupeOtherSubs(customerId, keepSubId) {
  if (!customerId) return;
  try {
    const subs = await stripe.subscriptions.list({ customer: customerId, status: 'active', limit: 10 });
    for (const s of subs.data) {
      if (s.id !== keepSubId && !subIsResearch(s) && !s.cancel_at_period_end) {
        await stripe.subscriptions.update(s.id, { cancel_at_period_end: true });
        console.log(`Set cancel_at_period_end on old sub ${s.id} after research upgrade`);
      }
    }
  } catch (e) {
    console.error('dedupeOtherSubs error:', e);
  }
}

// Does the customer still have another active sub (used when one sub dies)?
async function otherActiveSubs(customerId, exceptSubId) {
  try {
    const subs = await stripe.subscriptions.list({ customer: customerId, status: 'active', limit: 10 });
    const others = subs.data.filter(s => s.id !== exceptSubId);
    return {
      anyElite: others.length > 0,
      anyResearch: others.some(subIsResearch),
    };
  } catch (e) {
    return { anyElite: false, anyResearch: false };
  }
}

// Apply the correct flags for an ACTIVE subscription
async function activateSub(userId, sub) {
  if (subIsResearch(sub)) {
    await updateUserTier(userId, { stripe_elite: true, stripe_research: true });
    await dedupeOtherSubs(sub.customer, sub.id);
  } else {
    await updateUserTier(userId, { stripe_elite: true });
  }
}

// Apply the correct flags when a subscription DIES (deleted/failed/inactive)
async function deactivateSub(userId, sub) {
  const others = await otherActiveSubs(sub.customer, sub.id);
  if (subIsResearch(sub)) {
    await updateUserTier(userId, {
      stripe_research: others.anyResearch,
      stripe_elite: others.anyElite,
    });
  } else {
    // An elite sub died — keep elite if research (or another sub) still active
    await updateUserTier(userId, { stripe_elite: others.anyElite || others.anyResearch });
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
      if (userId) {
        if (obj.subscription) {
          const sub = await stripe.subscriptions.retrieve(obj.subscription);
          await activateSub(userId, sub);
        } else if (obj.metadata?.plan === 'research') {
          await updateUserTier(userId, { stripe_elite: true, stripe_research: true });
        } else {
          await updateUserTier(userId, { stripe_elite: true });
        }
      }
    } else if (type === 'invoice.paid' && obj.subscription) {
      const sub = await stripe.subscriptions.retrieve(obj.subscription);
      const userId = await resolveUserId(sub);
      if (userId) await activateSub(userId, sub);
    } else if (type === 'invoice.payment_failed' && obj.subscription) {
      const sub = await stripe.subscriptions.retrieve(obj.subscription);
      const userId = await resolveUserId(sub);
      if (userId) await deactivateSub(userId, sub);
    } else if (type === 'customer.subscription.deleted') {
      const userId = await resolveUserId(obj);
      if (userId) await deactivateSub(userId, obj);
    } else if (type === 'customer.subscription.updated' || type === 'customer.subscription.created') {
      const userId = await resolveUserId(obj);
      if (userId) {
        const active = obj.status === 'active' || obj.status === 'trialing';
        if (active) await activateSub(userId, obj);
        else await deactivateSub(userId, obj);
      }
    }
  } catch (error) {
    console.error('Webhook handler error:', error);
    return res.status(500).send('Webhook error');
  }

  return res.status(200).json({ received: true });
}
