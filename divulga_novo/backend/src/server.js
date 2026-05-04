import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { initDb } from './db.js';
import { authRequired, createToken } from './auth.js';
import { sendWelcomeEmail } from './emailService.js';
import { createPaymentPreference } from './paymentService.js';

dotenv.config();

const PORT        = Number(process.env.PORT || 3001);
const DB_PATH     = process.env.DB_PATH || './data/app.db';
const JWT_SECRET  = process.env.JWT_SECRET || 'dev-secret-change-me';
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';
if (CORS_ORIGIN === '*' && process.env.NODE_ENV === 'production') {
  console.warn('[SECURITY] CORS aberto para todas as origens em produção! Defina CORS_ORIGIN no ambiente.');
}

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
app.use(helmet());
app.use(express.json({ limit: '4mb' }));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas tentativas. Tente novamente em 15 minutos.' }
});

const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', generalLimiter);

const analyticsLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas requisições de analytics. Tente novamente em 1 minuto.' }
});

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
app.post('/api/auth/register', authLimiter, async (req, res) => {
  try {
    const email    = safeEmail(req.body?.email);
    const password = req.body?.password;
    const slug     = toSlug(req.body?.slug || '');
    const plan     = ['basico','pro','business'].includes(req.body?.plan) ? req.body.plan : 'basico';

    if (!email || !validPwd(password))
      return res.status(400).json({ error: 'Email válido e senha com mínimo 6 caracteres.' });
    if (await db.get('SELECT id FROM users WHERE email=?', email))
      return res.status(409).json({ error: 'Email já cadastrado.' });

    const hash   = await bcrypt.hash(password, 10);
    const result = await db.run('INSERT INTO users (email,password_hash,plan) VALUES (?,?,?)', email, hash, plan);
    const token  = createToken(result.lastID, plan, JWT_SECRET);

    if (slug) {
      sendWelcomeEmail(email, slug).catch(err => console.error('[DEBUG] Falha ao disparar e-mail:', err));
    }

    return res.status(201).json({ token, user: { id: result.lastID, email, plan } });
  } catch (err) {
    console.error('[REGISTER] Erro:', err.message);
    return res.status(500).json({ error: 'Erro interno. Tente novamente.' });
  }
});

// ── login ────────────────────────────────────────────────────
app.post('/api/auth/login', authLimiter, async (req, res) => {
  try {
    const email    = safeEmail(req.body?.email);
    const password = req.body?.password;
    const user     = await db.get('SELECT id,email,password_hash,plan FROM users WHERE email=?', email);

    if (!user) return res.status(401).json({ error: 'Credenciais inválidas.' });
    const ok = await bcrypt.compare(String(password || ''), user.password_hash);
    if (!ok)  return res.status(401).json({ error: 'Credenciais inválidas.' });

    const token = createToken(user.id, user.plan, JWT_SECRET);
    return res.json({ token, user: { id: user.id, email: user.email, plan: user.plan } });
  } catch (err) {
    console.error('[LOGIN] Erro:', err.message);
    return res.status(500).json({ error: 'Erro interno. Tente novamente.' });
  }
});

// ── leads ────────────────────────────────────────────────────
app.post('/api/leads', async (req, res) => {
  const nome        = String(req.body?.nome || '').trim().slice(0, 100);
  const whatsapp    = String(req.body?.whatsapp || '').replace(/\D/g, '').slice(0, 15);
  const negocio     = String(req.body?.negocio || '').trim().slice(0, 100);
  const tipo        = String(req.body?.tipo || '').trim().slice(0, 50);
  const faturamento = String(req.body?.faturamento || '').trim().slice(0, 50);
  const mensagem    = String(req.body?.mensagem || '').trim().slice(0, 1000);

  if (!nome || !whatsapp)
    return res.status(400).json({ error: 'Nome e WhatsApp são obrigatórios.' });

  try {
    await db.run(
      'INSERT INTO leads (nome,whatsapp,negocio,tipo,faturamento,mensagem) VALUES (?,?,?,?,?,?)',
      nome, whatsapp, negocio, tipo, faturamento, mensagem
    );
    return res.status(201).json({ ok: true });
  } catch (err) {
    console.error('[LEAD] Erro ao salvar:', err.message);
    return res.status(500).json({ error: 'Erro interno.' });
  }
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
  try {
    const s    = toSlug(req.params.slug);
    const menu = await db.get('SELECT slug,title,data_json,updated_at FROM menus WHERE slug=?', s);
    if (!menu) return res.status(404).json({ error: 'Cardápio não encontrado.' });
    let data = {};
    try { data = JSON.parse(menu.data_json); } catch {}
    delete data._ownerKey;
    return res.json({ slug: menu.slug, title: menu.title, data, updatedAt: menu.updated_at });
  } catch (err) {
    console.error('[GET MENU] Erro:', err.message);
    return res.status(500).json({ error: 'Erro interno.' });
  }
});

// ── AUTHENTICATED save/update (dono com JWT) ─────────────────
app.put('/api/menu/:slug', authRequired(JWT_SECRET), async (req, res) => {
  try {
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
  } catch (err) {
    console.error('[PUT MENU] Erro:', err.message);
    return res.status(500).json({ error: 'Erro interno.' });
  }
});

// ── PUBLIC ownerKey fallback ─────────────────────────────────
app.put('/api/public/menu/:slug', async (req, res) => {
  try {
    const s        = toSlug(req.params.slug);
    const title    = String(req.body?.title || '').trim();
    const data     = req.body?.data;
    const ownerKey = String(req.body?.ownerKey || '').trim();

    if (!s || !title || !data || typeof data !== 'object' || ownerKey.length < 8)
      return res.status(400).json({ error: 'Envie title, data e ownerKey (min 8 chars).' });

    const existing = await db.get('SELECT slug,data_json FROM menus WHERE slug=?', s);

    if (!existing) {
      const hashedKey = await bcrypt.hash(ownerKey, 10);
      await db.run(
        "INSERT INTO menus (slug,title,data_json,owner_id,updated_at) VALUES (?,?,?,0,datetime('now'))",
        s, title, JSON.stringify({ ...data, _ownerKey: hashedKey })
      );
      return res.status(201).json({ slug: s, title, created: true });
    }

    let stored = {};
    try { stored = JSON.parse(existing.data_json); } catch {}
    const storedKey = stored._ownerKey || null;

    // Se o menu não tem ownerKey (foi criado pela rota autenticada), a rota
    // pública não pode modificá-lo — exige JWT.
    if (!storedKey) return res.status(403).json({ error: 'Este cardápio só pode ser editado pelo painel autenticado.' });

    const isHashed = storedKey.startsWith('$2');
    const keyMatch = isHashed
      ? await bcrypt.compare(ownerKey, storedKey)
      : storedKey === ownerKey;
    if (!keyMatch) return res.status(403).json({ error: 'ownerKey inválido.' });

    const hashedKey = await bcrypt.hash(ownerKey, 10);
    await db.run(
      "UPDATE menus SET title=?,data_json=?,updated_at=datetime('now') WHERE slug=?",
      title, JSON.stringify({ ...data, _ownerKey: hashedKey }), s
    );
    return res.json({ slug: s, title, created: false });
  } catch (err) {
    console.error('[PUBLIC MENU] Erro:', err.message);
    return res.status(500).json({ error: 'Erro interno.' });
  }
});

// ── PAYMENTS (Mercado Pago) ──────────────────────────────────
app.post('/api/payments/create-preference', async (req, res) => {
  const { items, orderId } = req.body;
  if (!items || !Array.isArray(items) || items.length === 0)
    return res.status(400).json({ error: 'Itens do pedido não fornecidos.' });
  try {
    const preference = await createPaymentPreference(items, orderId || `order_${Date.now()}`);
    return res.json(preference);
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao gerar link de pagamento.' });
  }
});

// ── ANALYTICS ────────────────────────────────────────────────

// Track: registra um acesso ao cardápio (chamado pelo menu-app.js)
app.post('/api/analytics/track', analyticsLimiter, async (req, res) => {
  try {
    const slug = toSlug(req.body?.slug || '');
    if (!slug) return res.status(400).json({ error: 'slug obrigatório.' });
    await db.run("INSERT INTO page_views (slug) VALUES (?)", slug);
    return res.json({ ok: true });
  } catch (err) {
    console.error('[ANALYTICS TRACK] Erro:', err.message);
    return res.status(500).json({ error: 'Erro interno.' });
  }
});

// Stats: retorna acessos dos últimos 7 dias agrupados por dia (requer JWT)
app.get('/api/analytics/stats/:slug', authRequired(JWT_SECRET), async (req, res) => {
  try {
    const slug = toSlug(req.params.slug);
    if (!slug) return res.status(400).json({ error: 'slug obrigatório.' });

    const rows = await db.all(`
      SELECT date(viewed_at) as day, COUNT(*) as views
      FROM page_views
      WHERE slug = ? AND viewed_at >= datetime('now', '-7 days')
      GROUP BY day
      ORDER BY day ASC
    `, slug);

    const total = await db.get(
      "SELECT COUNT(*) as total FROM page_views WHERE slug=?", slug
    );

    return res.json({ slug, days: rows, total: total?.total || 0 });
  } catch (err) {
    console.error('[ANALYTICS STATS] Erro:', err.message);
    return res.status(500).json({ error: 'Erro interno.' });
  }
});

// ── ADMIN ─────────────────────────────────────────────────────
const adminLimiter = rateLimit({ windowMs: 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false });

function adminAuth(req, res, next) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return res.status(503).json({ error: 'Admin não configurado. Defina ADMIN_SECRET no ambiente.' });
  const key = (req.headers['x-admin-key'] || '').trim();
  if (!key || key !== secret) return res.status(401).json({ error: 'Chave admin inválida.' });
  next();
}

// GET /api/admin/users — lista todos os usuários
app.get('/api/admin/users', adminLimiter, adminAuth, async (_req, res) => {
  try {
    const users = await db.all(
      'SELECT id, email, plan, created_at FROM users ORDER BY created_at DESC'
    );
    return res.json({ total: users.length, users });
  } catch (err) {
    console.error('[ADMIN USERS] Erro:', err.message);
    return res.status(500).json({ error: 'Erro interno.' });
  }
});

// GET /api/admin/leads — lista todos os leads do formulário
app.get('/api/admin/leads', adminLimiter, adminAuth, async (_req, res) => {
  try {
    const leads = await db.all(
      'SELECT id, nome, whatsapp, negocio, tipo, faturamento, mensagem, created_at FROM leads ORDER BY created_at DESC'
    );
    return res.json({ total: leads.length, leads });
  } catch (err) {
    console.error('[ADMIN LEADS] Erro:', err.message);
    return res.status(500).json({ error: 'Erro interno.' });
  }
});

// ── WEBHOOK MERCADO PAGO ─────────────────────────────────────
function verifyMpSignature(req) {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) return true; // Pula validação se segredo não configurado
  const sig   = req.headers['x-signature'] || '';
  const reqId = req.headers['x-request-id'] || '';
  const tsMatch = sig.match(/ts=(\d+)/);
  const v1Match = sig.match(/v1=([a-f0-9]+)/);
  if (!tsMatch || !v1Match) return false;
  const ts   = tsMatch[1];
  const hash = v1Match[1];
  const dataId   = req.body?.data?.id || '';
  const manifest = `id:${dataId};request-id:${reqId};ts:${ts}`;
  const expected    = crypto.createHmac('sha256', secret).update(manifest).digest('hex');
  const hashBuf     = Buffer.from(hash, 'hex');
  const expectedBuf = Buffer.from(expected, 'hex');
  if (hashBuf.length !== expectedBuf.length) return false;
  return crypto.timingSafeEqual(hashBuf, expectedBuf);
}

app.post('/api/payments/webhook', async (req, res) => {
  if (!verifyMpSignature(req)) {
    console.warn('[WEBHOOK] Assinatura inválida — requisição rejeitada.');
    return res.sendStatus(401);
  }
  const { type, data } = req.body || {};
  console.log('[WEBHOOK] Notificação recebida:', type, data?.id);

  // MP envia type="payment" quando um pagamento é criado/atualizado
  if (type !== 'payment' || !data?.id) {
    return res.sendStatus(200); // Aceita mas ignora outros tipos
  }

  try {
    const MP_TOKEN = process.env.MP_ACCESS_TOKEN;
    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${data.id}`, {
      headers: { 'Authorization': `Bearer ${MP_TOKEN}` }
    });
    const payment = await mpRes.json();

    console.log('[WEBHOOK] Status do pagamento:', payment.status, '| Ref:', payment.external_reference);

    if (payment.status !== 'approved') {
      return res.sendStatus(200); // Pago, mas não aprovado ainda
    }

    // external_reference = "sub_SLUG_timestamp" → extrai o slug
    const ref = String(payment.external_reference || '');
    const slugMatch = ref.match(/^sub_(.+?)_\d+$/);
    if (!slugMatch) {
      console.warn('[WEBHOOK] external_reference fora do padrão:', ref);
      return res.sendStatus(200);
    }
    const slug = slugMatch[1];

    // Descobre o plano pelo valor pago
    const amount = Number(payment.transaction_amount || 0);
    const plan = amount >= 60 ? 'business' : (amount >= 55 ? 'pro' : 'basico');

    // Busca o owner_id pelo slug do menu
    const menu = await db.get('SELECT owner_id FROM menus WHERE slug=?', slug);
    if (menu && menu.owner_id) {
      await db.run('UPDATE users SET plan=? WHERE id=?', plan, menu.owner_id);
      console.log(`[WEBHOOK] Plano atualizado: user ${menu.owner_id} → ${plan}`);
    } else {
      console.warn('[WEBHOOK] Menu/owner não encontrado para slug:', slug);
    }

    return res.sendStatus(200);
  } catch (err) {
    console.error('[WEBHOOK] Erro:', err.message);
    return res.sendStatus(500);
  }
});

// ── Global error handler ────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('[ERROR]', err.message);
  res.status(500).json({ error: 'Erro interno do servidor.' });
});

app.listen(PORT, () =>
  console.log(`[webcardapio] http://localhost:${PORT}  db=${DB_PATH}`)
);
