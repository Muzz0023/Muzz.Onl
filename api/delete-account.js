import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://lheniesboruihwmmkans.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxoZW5pZXNib3J1aWh3bW1rYW5zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTgwMDc2NywiZXhwIjoyMDg1Mzc2NzY3fQ.g-gcJ5QyiRIAvfjeTyPBvEGlCohRk2JFiQ2B9PfHwi0'
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ error: 'Missing userId' });
  }

  try {
    // Delete user data from the database
    await supabase.from('user_data').delete().eq('user_id', userId);

    // Delete the auth user account
    const { error } = await supabase.auth.admin.deleteUser(userId);
    if (error) {
      console.error('Error deleting auth user:', error);
      return res.status(500).json({ error: 'Failed to delete auth account' });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Delete account error:', err);
    return res.status(500).json({ error: 'Failed to delete account' });
  }
}
