// POST /api/waitlist-request  { email, name, note, website }
// Saves a request and emails Muzz an Approve / Decline link.
import crypto from 'crypto';

const SB_URL = process.env.SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SECRET = process.env.WAITLIST_SECRET;
const RESEND = process.env.RESEND_API_KEY;
const ADMIN = process.env.ADMIN_EMAIL;
const FROM = process.env.MAIL_FROM || 'Muzz <onboarding@resend.dev>';
const SITE = process.env.SITE_URL || 'https://muzz.onl';
const ALLOWED = ['https://muzz.onl', 'https://www.muzz.onl', 'capacitor://localhost', 'http://localhost', 'https://localhost', 'ionic://localhost'];

const sb = (path, opts = {}) => fetch(`${SB_URL}/rest/v1/${path}`, {
  ...opts,
  headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, 'Content-Type': 'application/json', ...(opts.headers || {}) },
});
const sign = (id, action, exp) => crypto.createHmac('sha256', SECRET).update(`${id}.${action}.${exp}`).digest('hex');
const esc = (t) => String(t || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export default async function handler(req, res) {
  const origin = req.headers.origin || '';
  if (ALLOWED.includes(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!SB_URL || !SB_KEY || !SECRET || !RESEND || !ADMIN) return res.status(500).json({ error: 'Requests are not set up yet. Please try again later.' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  body = body || {};
  const email = String(body.email || '').trim().toLowerCase().slice(0, 120);
  const name = String(body.name || '').trim().slice(0, 60);
  const note = String(body.note || '').trim().slice(0, 300);
  if (body.website) return res.status(200).json({ status: 'pending' }); // bot filled the hidden field
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return res.status(400).json({ error: 'Please enter a valid email address' });
  if (!name || !note) return res.status(400).json({ error: 'Please fill in your name and how you know about Muzz' });

  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim().slice(0, 64);
  const hourAgo = new Date(Date.now() - 3600e3).toISOString();

  try {
    // Already asked or already approved?
    const ex = await (await sb(`waitlist?select=id,status&email=eq.${encodeURIComponent(email)}`)).json();
    if (Array.isArray(ex) && ex.length) return res.status(200).json({ status: ex[0].status === 'approved' ? 'approved' : 'pending' });

    // Limits: 3 requests an hour per connection, 30 an hour in total
    if (ip) {
      const mine = await (await sb(`waitlist?select=id&ip=eq.${encodeURIComponent(ip)}&created_at=gte.${hourAgo}`)).json();
      if (Array.isArray(mine) && mine.length >= 3) return res.status(429).json({ error: 'Too many requests. Please try again later.' });
    }
    const all = await (await sb(`waitlist?select=id&created_at=gte.${hourAgo}&status=eq.pending`)).json();
    if (Array.isArray(all) && all.length >= 30) return res.status(429).json({ error: 'Lots of requests right now. Please try again later.' });

    const ins = await sb('waitlist', { method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify({ email, name, note, ip }) });
    const row = (await ins.json())[0];
    if (!row || !row.id) return res.status(500).json({ error: 'Could not save your request. Please try again.' });

    const exp = Math.floor(Date.now() / 1000) + 7 * 86400;
    const link = (a) => `${SITE}/api/waitlist-decide?id=${row.id}&a=${a}&exp=${exp}&sig=${sign(row.id, a, exp)}`;
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: FROM, to: [ADMIN], subject: `New Muzz request: ${name}`,
        html: `<div style="font-family:-apple-system,Segoe UI,sans-serif;font-size:16px;color:#111">
          <h2 style="margin:0 0 12px">New request to join Muzz</h2>
          <p style="margin:0 0 4px"><b>${esc(name)}</b> · ${esc(email)}</p>
          <p style="margin:0 0 20px;color:#444">“${esc(note)}”</p>
          <a href="${link('approve')}" style="display:inline-block;background:#0A84FF;color:#fff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:600;margin-right:10px">Approve</a>
          <a href="${link('decline')}" style="display:inline-block;background:#eee;color:#111;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:600">Decline</a>
          <p style="margin:20px 0 0;color:#888;font-size:13px">Links work once and expire in 7 days.</p></div>`,
      }),
    });
    return res.status(200).json({ status: 'pending' });
  } catch (e) {
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}
