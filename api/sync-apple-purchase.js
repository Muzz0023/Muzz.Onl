// /api/sync-apple-purchase.js
// Syncs Apple IAP purchases (via RevenueCat) to Supabase tier status

const SUPABASE_URL = 'https://lheniesboruihwmmkans.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, userEmail, tier } = req.body;

  if (!userId || !userEmail) {
    return res.status(400).json({ error: 'Missing userId or userEmail' });
  }

  const isResearch = tier === 'research';

  try {
    // 1) Flip the flags on user_data — this is what the app and webhooks read
    const tierFields = isResearch
      ? { stripe_elite: true, stripe_research: true, updated_at: new Date().toISOString() }
      : { stripe_elite: true, updated_at: new Date().toISOString() };
    await fetch(`${SUPABASE_URL}/rest/v1/user_data?user_id=eq.${userId}`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(tierFields),
    });

    // 2) Keep the elite_users audit table in sync (existing behaviour)
    const checkRes = await fetch(`${SUPABASE_URL}/rest/v1/elite_users?user_id=eq.${userId}`, {
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      }
    });

    const existing = await checkRes.json();

    if (existing.length > 0) {
      await fetch(`${SUPABASE_URL}/rest/v1/elite_users?user_id=eq.${userId}`, {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          is_elite: true,
          subscription_source: isResearch ? 'apple_research' : 'apple',
          updated_at: new Date().toISOString()
        })
      });
    } else {
      await fetch(`${SUPABASE_URL}/rest/v1/elite_users`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          user_id: userId,
          email: userEmail,
          is_elite: true,
          subscription_source: isResearch ? 'apple_research' : 'apple',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Sync error:', error);
    return res.status(500).json({ error: 'Failed to sync purchase' });
  }
}
