const SUPABASE_URL = process.env.SUPABASE_URL || 'https://lheniesboruihwmmkans.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const REVENUECAT_WEBHOOK_SECRET = process.env.REVENUECAT_WEBHOOK_SECRET;

const DONNY_PRODUCT_ID = process.env.DONNY_PRODUCT_ID || 'muzz_donny_monthly';

async function updateUserEliteStatus(userId, isElite, isDonnyElite) {
  try {
    const loadRes = await fetch(`${SUPABASE_URL}/rest/v1/user_data?user_id=eq.${userId}&select=*`, {
      headers: { 'apikey': SUPABASE_SERVICE_KEY, 'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}` },
    });
    const data = await loadRes.json();
    const existing = data[0]?.data_json || {};

    // Update flags
    if (isElite !== null) existing.stripeElite = isElite;
    if (isDonnyElite !== null) existing.stripeDonnyElite = isDonnyElite;

    // If Donny elite, also set stripeElite true (includes everything)
    if (isDonnyElite === true) existing.stripeElite = true;

    // If both are false, clear everything
    if (isElite === false && isDonnyElite === false) {
      existing.stripeElite = false;
      existing.stripeDonnyElite = false;
    }

    await fetch(`${SUPABASE_URL}/rest/v1/user_data`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify({ user_id: userId, data_json: existing, updated_at: new Date().toISOString() }),
    });
    console.log(`Updated elite status for ${userId}: stripeElite=${existing.stripeElite}, stripeDonnyElite=${existing.stripeDonnyElite}`);
  } catch (error) {
    console.error('Error updating elite status:', error);
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Verify webhook secret if set
  if (REVENUECAT_WEBHOOK_SECRET) {
    const authHeader = req.headers['authorization'];
    if (authHeader !== REVENUECAT_WEBHOOK_SECRET) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  try {
    const event = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { type, app_user_id, product_id } = event.event || {};

    if (!app_user_id) return res.status(400).json({ error: 'Missing app_user_id' });

    // Determine if this is a Donny purchase
    const isDonnyProduct = product_id === DONNY_PRODUCT_ID;

    console.log(`RevenueCat webhook: type=${type}, user=${app_user_id}, product=${product_id}, isDonny=${isDonnyProduct}`);

    switch (type) {
      case 'INITIAL_PURCHASE':
      case 'RENEWAL':
      case 'REACTIVATION':
        if (isDonnyProduct) {
          await updateUserEliteStatus(app_user_id, true, true);
        } else {
          await updateUserEliteStatus(app_user_id, true, null);
        }
        break;

      case 'CANCELLATION':
      case 'EXPIRATION':
      case 'BILLING_ISSUE':
        if (isDonnyProduct) {
          await updateUserEliteStatus(app_user_id, null, false);
        } else {
          await updateUserEliteStatus(app_user_id, false, null);
        }
        break;

      default:
        console.log(`Unhandled RevenueCat event type: ${type}`);
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('RevenueCat webhook error:', error);
    return res.status(500).json({ error: error.message });
  }
}
