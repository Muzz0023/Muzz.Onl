// /api/waitlist
//   POST /api/waitlist                      { email, name, note, website } -> saves a request, emails Muzz Approve/Decline links
//   GET  /api/waitlist?id&a&exp&sig          -> confirm page (so email scanners can't approve by "clicking")
//   POST /api/waitlist?step=decide (form)    -> checks the signature, approves/declines, emails the person if approved
import crypto from 'crypto';

const SB_URL = process.env.SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
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
  const q = req.query || {};
  if (req.method === 'GET' || q.step === 'decide') return handleDecide(req, res);
  return handleRequest(req, res);
}

async function handleRequest(req, res) {
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
    const link = (a) => `${SITE}/api/waitlist?id=${row.id}&a=${a}&exp=${exp}&sig=${sign(row.id, a, exp)}`;
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

const goodSig = (id, a, exp, sig) => {
  if (!SECRET || !/^[0-9a-f]{64}$/.test(String(sig || ''))) return false;
  const want = crypto.createHmac('sha256', SECRET).update(`${id}.${a}.${exp}`).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(want), Buffer.from(String(sig)));
};
const page = (title, inner) => `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex"><title>${esc(title)}</title></head>
<body style="margin:0;background:#020817;color:#fff;font-family:-apple-system,Segoe UI,sans-serif;display:flex;min-height:100vh;align-items:center;justify-content:center;padding:24px;box-sizing:border-box">
<div style="max-width:420px;width:100%;background:#0f172a;border:1px solid #1e293b;border-radius:20px;padding:28px;text-align:center">${inner}</div></body></html>`;

async function readForm(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  const raw = typeof req.body === 'string' ? req.body : await new Promise((r) => { let d = ''; req.on('data', (c) => (d += c)); req.on('end', () => r(d)); });
  return Object.fromEntries(new URLSearchParams(raw));
}

async function handleDecide(req, res) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  const q = req.method === 'POST' ? await readForm(req) : req.query || {};
  const id = String(q.id || ''), a = String(q.a || ''), exp = String(q.exp || ''), sig = String(q.sig || '');
  if (!/^[0-9a-f-]{36}$/.test(id) || !['approve', 'decline'].includes(a) || !/^\d+$/.test(exp)) return res.status(400).send(page('Invalid link', '<h2>Invalid link</h2>'));
  if (!goodSig(id, a, exp, sig)) return res.status(403).send(page('Invalid link', '<h2>This link isn’t valid</h2>'));
  if (Number(exp) < Date.now() / 1000) return res.status(410).send(page('Expired', '<h2>This link has expired</h2><p style="color:#94a3b8">You can still approve them in Supabase → Table Editor → waitlist.</p>'));

  const rows = await (await sb(`waitlist?select=id,email,name,note,status&id=eq.${id}`)).json();
  const row = Array.isArray(rows) && rows[0];
  if (!row) return res.status(404).send(page('Not found', '<h2>Request not found</h2>'));
  if (row.status !== 'pending') return res.status(200).send(page('Done', `<h2>Already ${esc(row.status)}</h2><p style="color:#94a3b8">${esc(row.name)} · ${esc(row.email)}</p>`));

  const verb = a === 'approve' ? 'Approve' : 'Decline';
  if (req.method !== 'POST') {
    return res.status(200).send(page(`${verb} ${row.name}?`, `
      <h2 style="margin:0 0 8px">${verb} ${esc(row.name)}?</h2>
      <p style="margin:0 0 6px;color:#cbd5e1">${esc(row.email)}</p>
      <p style="margin:0 0 22px;color:#94a3b8">“${esc(row.note)}”</p>
      <form method="POST" action="/api/waitlist?step=decide"><input type="hidden" name="id" value="${esc(id)}"><input type="hidden" name="a" value="${esc(a)}">
      <input type="hidden" name="exp" value="${esc(exp)}"><input type="hidden" name="sig" value="${esc(sig)}">
      <button type="submit" style="width:100%;padding:14px;border:0;border-radius:12px;font-size:17px;font-weight:600;color:#fff;background:${a === 'approve' ? '#0A84FF' : '#FF453A'};cursor:pointer">${verb}</button></form>`));
  }

  // Only change it if it's still pending (stops double taps)
  const up = await sb(`waitlist?id=eq.${id}&status=eq.pending`, { method: 'PATCH', headers: { Prefer: 'return=representation' },
    body: JSON.stringify({ status: a === 'approve' ? 'approved' : 'declined', decided_at: new Date().toISOString() }) });
  const changed = await up.json();
  if (!Array.isArray(changed) || !changed.length) return res.status(200).send(page('Done', '<h2>Already decided</h2>'));

  if (a === 'approve' && RESEND) {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: FROM, to: [row.email], subject: 'You’re in — welcome to Muzz',
        html: `<div style="font-family:-apple-system,Segoe UI,sans-serif;font-size:16px;color:#111;line-height:1.5">
          <h2 style="margin:0 0 12px">You’re in, ${esc(row.name)}!</h2>
          <p>Your request to join Muzz has been approved.</p>
          <p>Create your account at <a href="${SITE}">muzz.onl</a> or in the Muzz app using <b>${esc(row.email)}</b>:
          tap “New to Muzz? Request access”, then “Already approved? Create your account”.</p>
          <p style="color:#555">Signing up with Apple? Choose <b>Share My Email</b> so it matches this address.</p>
          <p>Welcome aboard,<br>Lauchlan · Muzz</p></div>`,
      }),
    });
  }
  return res.status(200).send(page('Done', a === 'approve'
    ? `<h2>Approved ✓</h2><p style="color:#94a3b8">${esc(row.name)} has been emailed and can now create their account.</p>`
    : `<h2>Declined</h2><p style="color:#94a3b8">${esc(row.name)} won’t be able to sign up.</p>`));
}
