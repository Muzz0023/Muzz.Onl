// /api/sync-apple-purchase.js
// Syncs Apple IAP purchases (via RevenueCat) to Supabase Elite status

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

  const { userId, userEmail } = req.body;

  if (!userId || !userEmail) {
    return res.status(400).json({ error: 'Missing userId or userEmail' });
  }

  try {
    // Update user's elite status in Supabase
    // First check if user exists in elite_users table
    const checkRes = await fetch(`${SUPABASE_URL}/rest/v1/elite_users?user_id=eq.${userId}`, {
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      }
    });
    
    const existing = await checkRes.json();
    
    if (existing.length > 0) {
      // Update existing record
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
          subscription_source: 'apple',
          updated_at: new Date().toISOString()
        })
      });
    } else {
      // Insert new record
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
          subscription_source: 'apple',
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
