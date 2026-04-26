import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import { initDb } from './db.js';
import { authRequired, createToken } from './auth.js';
import { sendWelcomeEmail } from './emailService.js';
import { createPaymentPreference } from './paymentService.js';

dotenv.config();

const PORT        = Number(process.env.PORT || 3001);
const DB_PATH     = process.env.DB_PATH || './data/app.db';
const JWT_SECRET  = process.env.JWT_SECRET || 'dev-secret-change-me';
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

const app = express();

// CORS: aceita múltiplas origens (separadas por vírgula na env var)
// Sempre inclui localhost para desenvolvimento
const allowedOrigins = CORS_ORIGIN === '*'
  ? null // null = aceitar qualquer origem
  : [
      ...CORS_ORIGIN.split(',').map(s => s.trim()),
      'http://localhost:5500',
      'http://localhost:5501',
      'http://localhost:5502',
      'http://127.0.0.1:5500',
      'http://127.0.0.1:5501',
      'http://127.0.0.1:5502',
      'http://localhost:3000',
      'http://127.0.0.1:3000',
    ];

app.use(cors({
  origin: allowedOrigins === null
    ? true
    : function (origin, callback) {
        // Permitir requests sem origin (ex: Postman, curl, server-to-server)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        callback(new Error('Bloqueado pelo CORS: ' + origin));
      }
}));
app.use(express.json({ limit: '4mb' }));

function toSlug(v) {
  return String(v || '').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-').replace(/^-|-$/g, '');
}
const safeEmail = v => String(v || '').trim().toLowerCase();
const validPwd  = v => typeof v === 'string' && v.length >= 6;

const db = await initDb(DB_PATH);

// ── health ──────────────────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// ── register ────────────────────────────────────────────────
app.post('/api/auth/register', async (req, res) => {
  const email    = safeEmail(req.body?.email);
  const password = req.body?.password;
  const slug     = toSlug(req.body?.slug || ''); // Pegamos o slug do corpo da requisição
  const plan     = ['basico','pro','business'].includes(req.body?.plan) ? req.body.plan : 'basico';

  if (!email || !validPwd(password))
    return res.status(400).json({ error: 'Email válido e senha com mínimo 6 caracteres.' });
  if (await db.get('SELECT id FROM users WHERE email=?', email))
    return res.status(409).json({ error: 'Email já cadastrado.' });

  const hash   = await bcrypt.hash(password, 10);
  const result = await db.run('INSERT INTO users (email,password_hash,plan) VALUES (?,?,?)', email, hash, plan);
  const token  = createToken(result.lastID, plan, JWT_SECRET);

  // Enviar e-mail de boas-vindas (assíncrono para não travar a resposta)
  if (slug) {
    sendWelcomeEmail(email, slug).catch(err => console.error('[DEBUG] Falha ao disparar e-mail:', err));
  }

  return res.status(201).json({ token, user: { id: result.lastID, email, plan } });
});

// ── login ────────────────────────────────────────────────────
app.post('/api/auth/login', async (req, res) => {
  const email    = safeEmail(req.body?.email);
  const password = req.body?.password;
  const user     = await db.get('SELECT id,email,password_hash,plan FROM users WHERE email=?', email);

  if (!user) return res.status(401).json({ error: 'Credenciais inválidas.' });
  const ok = await bcrypt.compare(String(password || ''), user.password_hash);
  if (!ok)  return res.status(401).json({ error: 'Credenciais inválidas.' });

  const token = createToken(user.id, user.plan, JWT_SECRET);
  return res.json({ token, user: { id: user.id, email: user.email, plan: user.plan } });
});

// ── list my menus ────────────────────────────────────────────
app.get('/api/me/menus', authRequired(JWT_SECRET), async (req, res) => {
  const menus = await db.all(
    'SELECT slug,title,updated_at FROM menus WHERE owner_id=? ORDER BY updated_at DESC',
    req.userId
  );
  return res.json({ menus });
});

// ── PUBLIC read menu (cliente vê o cardápio) ─────────────────
app.get('/api/menu/:slug', async (req, res) => {
  const s    = toSlug(req.params.slug);
  const menu = await db.get('SELECT slug,title,data_json,updated_at FROM menus WHERE slug=?', s);
  if (!menu) return res.status(404).json({ error: 'Cardápio não encontrado.' });
  let data = {};
  try { data = JSON.parse(menu.data_json); } catch {}
  delete data._ownerKey;
  return res.json({ slug: menu.slug, title: menu.title, data, updatedAt: menu.updated_at });
});

// ── AUTHENTICATED save/update (dono com JWT) ─────────────────
app.put('/api/menu/:slug', authRequired(JWT_SECRET), async (req, res) => {
  const s     = toSlug(req.params.slug);
  const title = String(req.body?.title || '').trim();
  const data  = req.body?.data;

  if (!s || !title || !data || typeof data !== 'object')
    return res.status(400).json({ error: 'Envie title e data.' });

  const existing = await db.get('SELECT slug,owner_id FROM menus WHERE slug=?', s);

  if (!existing) {
    await db.run(
      "INSERT INTO menus (slug,title,data_json,owner_id,updated_at) VALUES (?,?,?,?,datetime('now'))",
      s, title, JSON.stringify(data), req.userId
    );
    return res.status(201).json({ slug: s, title, created: true });
  }
  if (existing.owner_id !== req.userId)
    return res.status(403).json({ error: 'Sem permissão.' });

  await db.run(
    "UPDATE menus SET title=?,data_json=?,updated_at=datetime('now') WHERE slug=?",
    title, JSON.stringify(data), s
  );
  return res.json({ slug: s, title, created: false });
});

// ── PUBLIC ownerKey fallback ─────────────────────────────────
app.put('/api/public/menu/:slug', async (req, res) => {
  const s        = toSlug(req.params.slug);
  const title    = String(req.body?.title || '').trim();
  const data     = req.body?.data;
  const ownerKey = String(req.body?.ownerKey || '').trim();

  if (!s || !title || !data || typeof data !== 'object' || ownerKey.length < 8)
    return res.status(400).json({ error: 'Envie title, data e ownerKey (min 8 chars).' });

  const existing = await db.get('SELECT slug,data_json FROM menus WHERE slug=?', s);

  if (!existing) {
    await db.run(
      "INSERT INTO menus (slug,title,data_json,owner_id,updated_at) VALUES (?,?,?,0,datetime('now'))",
      s, title, JSON.stringify({ ...data, _ownerKey: ownerKey })
    );
    return res.status(201).json({ slug: s, title, created: true });
  }

  let stored = {};
  try { stored = JSON.parse(existing.data_json); } catch {}
  if (stored._ownerKey && stored._ownerKey !== ownerKey)
    return res.status(403).json({ error: 'ownerKey inválido.' });

  await db.run(
    "UPDATE menus SET title=?,data_json=?,updated_at=datetime('now') WHERE slug=?",
    title, JSON.stringify({ ...data, _ownerKey: ownerKey }), s
  );
  return res.json({ slug: s, title, created: false });
});


// ── PAYMENTS (Mercado Pago) ──────────────────────────────────
app.post('/api/payments/create-preference', async (req, res) => {
  const { items, orderId } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Itens do pedido não fornecidos.' });
  }

  try {
    const preference = await createPaymentPreference(items, orderId || `order_${Date.now()}`);
    return res.json(preference);
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao gerar link de pagamento.' });
  }
});

app.listen(PORT, () =>
  console.log(`[webcardapio] http://localhost:${PORT}  db=${DB_PATH}`)
);
