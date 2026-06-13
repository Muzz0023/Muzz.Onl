const SUPABASE_URL = process.env.SUPABASE_URL || 'https://lheniesboruihwmmkans.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const REVENUECAT_WEBHOOK_SECRET = process.env.REVENUECAT_WEBHOOK_SECRET;

async function updateUserEliteStatus(userId, isElite) {
  try {
    const updateData = { stripe_elite: isElite, updated_at: new Date().toISOString() };
    await fetch(`${SUPABASE_URL}/rest/v1/user_data?user_id=eq.${userId}`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(updateData),
    });
    console.log(`Updated elite for ${userId}: ${isElite}`);
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

    console.log(`RevenueCat webhook: type=${type}, user=${app_user_id}, product=${product_id}`);

    switch (type) {
      case 'INITIAL_PURCHASE':
      case 'RENEWAL':
      case 'REACTIVATION':
        await updateUserEliteStatus(app_user_id, true);
        break;
      case 'CANCELLATION':
      case 'EXPIRATION':
      case 'BILLING_ISSUE':
        await updateUserEliteStatus(app_user_id, false);
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
