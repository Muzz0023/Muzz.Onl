const SUPABASE_URL = process.env.SUPABASE_URL || 'https://lheniesboruihwmmkans.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const REVENUECAT_WEBHOOK_SECRET = process.env.REVENUECAT_WEBHOOK_SECRET;

// Research product IDs across stores: Apple IAP + RevenueCat's Stripe product identifier
const RESEARCH_PRODUCT_IDS = ['muzz_research_1m', 'prod_Uqv1CpL8npsrGF'];

// Patch only the fields provided, e.g. { stripe_elite: true, stripe_research: true }
async function updateUserTier(userId, fields) {
  try {
    const updateData = { ...fields, updated_at: new Date().toISOString() };
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
    console.log(`Updated tier for ${userId}:`, JSON.stringify(fields));
  } catch (error) {
    console.error('Error updating tier status:', error);
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
    const { type, app_user_id, product_id, new_product_id, store } = event.event || {};

    if (!app_user_id) return res.status(400).json({ error: 'Missing app_user_id' });

    console.log(`RevenueCat webhook: type=${type}, user=${app_user_id}, product=${product_id}`);

    const effectiveProduct = new_product_id || product_id;
    const isResearchProduct = RESEARCH_PRODUCT_IDS.includes(effectiveProduct);
    const isAppleStore = store === 'APP_STORE';

    switch (type) {
      case 'INITIAL_PURCHASE':
      case 'RENEWAL':
      case 'REACTIVATION':
      case 'PRODUCT_CHANGE': // Apple subscription-group upgrade/downgrade
        if (isResearchProduct) {
          await updateUserTier(app_user_id, { stripe_elite: true, stripe_research: true });
        } else if (isAppleStore) {
          // Apple elite purchase/downgrade — clears research, since Apple only
          // allows one active sub per group (a downgrade replaces Research).
          await updateUserTier(app_user_id, { stripe_elite: true, stripe_research: false });
        } else {
          // Stripe-sourced elite event — never clear research here; the Stripe
          // webhook owns web-tier truth and handles multi-sub logic properly.
          await updateUserTier(app_user_id, { stripe_elite: true });
        }
        break;
      case 'CANCELLATION':
      case 'EXPIRATION':
      case 'BILLING_ISSUE':
        if (isResearchProduct) {
          await updateUserTier(app_user_id, { stripe_elite: false, stripe_research: false });
        } else {
          await updateUserTier(app_user_id, { stripe_elite: false });
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
