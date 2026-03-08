export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ error: 'Missing userId' });
  }

  const SUPABASE_URL = 'https://lheniesboruihwmmkans.supabase.co';
  const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxoZW5pZXNib3J1aWh3bW1rYW5zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTgwMDc2NywiZXhwIjoyMDg1Mzc2NzY3fQ.g-gcJ5QyiRIAvfjeTyPBvEGlCohRk2JFiQ2B9PfHwi0';

  const headers = {
    'Content-Type': 'application/json',
    'apikey': SERVICE_ROLE_KEY,
    'Authorization': 'Bearer ' + SERVICE_ROLE_KEY
  };

  try {
    // 1. Delete user data from database
    await fetch(SUPABASE_URL + '/rest/v1/user_data?user_id=eq.' + userId, {
      method: 'DELETE',
      headers: headers
    });

    // 2. Delete the auth user account using admin API
    const authRes = await fetch(SUPABASE_URL + '/auth/v1/admin/users/' + userId, {
      method: 'DELETE',
      headers: headers
    });

    if (!authRes.ok) {
      const errText = await authRes.text();
      return res.status(500).json({ error: 'Failed to delete auth account', details: errText });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Server error: ' + err.message });
  }
}
