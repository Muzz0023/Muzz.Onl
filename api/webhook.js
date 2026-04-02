import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://lheniesboruihwmmkans.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

async function updateUserEliteStatus(userId, isElite, isDonnyElite) {
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
      if (obj.metadata?.supabase_user_id) {
        const isDonny = obj.metadata?.plan === 'donny';
        await updateUserEliteStatus(obj.metadata.supabase_user_id, true, isDonny ? true : null);
      }
    } else if (type === 'invoice.paid' && obj.subscription) {
      const sub = await stripe.subscriptions.retrieve(obj.subscription);
      if (sub.metadata?.supabase_user_id) {
        const isDonny = sub.metadata?.plan === 'donny';
        await updateUserEliteStatus(sub.metadata.supabase_user_id, true, isDonny ? true : null);
      }
    } else if (type === 'invoice.payment_failed' && obj.subscription) {
      const sub = await stripe.subscriptions.retrieve(obj.subscription);
      if (sub.metadata?.supabase_user_id) {
        await updateUserEliteStatus(sub.metadata.supabase_user_id, false, false);
      }
    } else if (type === 'customer.subscription.deleted') {
      if (obj.metadata?.supabase_user_id) {
        await updateUserEliteStatus(obj.metadata.supabase_user_id, false, false);
      }
    } else if (type === 'customer.subscription.updated') {
      if (obj.metadata?.supabase_user_id) {
        const active = obj.status === 'active' || obj.status === 'trialing';
        const isDonny = obj.metadata?.plan === 'donny';
        await updateUserEliteStatus(obj.metadata.supabase_user_id, active, isDonny ? active : null);
      }
    }
  } catch (error) {
    return res.status(500).send('Webhook error');
  }

  return res.status(200).json({ received: true });
}
