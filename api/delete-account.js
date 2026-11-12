// /api/delete-account
// Deletes the signed-in user's data and account.
// The caller must send their own session token (Authorization: Bearer <token>);
// the account deleted is always the one that token belongs to.
const SB_URL = process.env.SUPABASE_URL || 'https://lheniesboruihwmmkans.supabase.co';
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
const ALLOWED = ['https://muzz.onl', 'https://www.muzz.onl', 'capacitor://localhost', 'http://localhost', 'https://localhost', 'ionic://localhost'];

export default async function handler(req, res) {
  const origin = req.headers.origin || '';
  if (ALLOWED.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!SB_KEY) return res.status(500).json({ error: 'Server not configured' });

  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  if (!token) return res.status(401).json({ error: 'Please sign in again' });

  try {
    // Who is asking? Supabase checks the session token and tells us.
    const who = await fetch(`${SB_URL}/auth/v1/user`, {
      headers: { apikey: SB_KEY, Authorization: `Bearer ${token}` },
    });
    if (!who.ok) return res.status(401).json({ error: 'Please sign in again' });
    const user = await who.json();
    const userId = user && user.id;
    if (!userId || !/^[0-9a-f-]{36}$/i.test(userId)) return res.status(401).json({ error: 'Please sign in again' });

    const admin = { 'Content-Type': 'application/json', apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` };

    // 1. Delete their data
    await fetch(`${SB_URL}/rest/v1/user_data?user_id=eq.${userId}`, { method: 'DELETE', headers: admin });

    // 2. Delete their sign-in account
    const del = await fetch(`${SB_URL}/auth/v1/admin/users/${userId}`, { method: 'DELETE', headers: admin });
    if (!del.ok) return res.status(500).json({ error: 'Failed to delete account' });

    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
}
