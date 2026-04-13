import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import { authRequired, createToken } from './auth.js';

dotenv.config();

const PORT = Number(process.env.PORT || 3001);
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

const app = express();
app.use(cors({ origin: CORS_ORIGIN === '*' ? true : CORS_ORIGIN }));
app.use(express.json({ limit: '2mb' }));

function normalizeSlug(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function safeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function validatePassword(password) {
  return typeof password === 'string' && password.length >= 6;
}

function validateOwnerKey(ownerKey) {
  return typeof ownerKey === 'string' && ownerKey.trim().length >= 8;
}

let nextUserId = 1;
const usersByEmail = new Map();
const menusBySlug = new Map();

function nowIso() {
  return new Date().toISOString();
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'webcardapio-backend' });
});

app.post('/api/auth/register', async (req, res) => {
  const email = safeEmail(req.body?.email);
  const password = req.body?.password;

  if (!email || !validatePassword(password)) {
    return res.status(400).json({ error: 'Email valido e senha com no minimo 6 caracteres.' });
  }

  const existing = usersByEmail.get(email);
  if (existing) {
    return res.status(409).json({ error: 'Email ja cadastrado.' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const newUser = {
    id: nextUserId++,
    email,
    password_hash: passwordHash,
    created_at: nowIso()
  };
  usersByEmail.set(email, newUser);

  const token = createToken(newUser.id, JWT_SECRET);
  return res.status(201).json({ token, user: { id: newUser.id, email } });
});

app.post('/api/auth/login', async (req, res) => {
  const email = safeEmail(req.body?.email);
  const password = req.body?.password;

  const user = usersByEmail.get(email);
  if (!user) {
    return res.status(401).json({ error: 'Credenciais invalidas.' });
  }

  const valid = await bcrypt.compare(String(password || ''), user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'Credenciais invalidas.' });
  }

  const token = createToken(user.id, JWT_SECRET);
  return res.json({ token, user: { id: user.id, email: user.email } });
});

app.get('/api/me/menus', authRequired(JWT_SECRET), async (req, res) => {
  const menus = Array.from(menusBySlug.values())
    .filter((menu) => menu.owner_id === req.userId)
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
    .map((menu) => ({
      slug: menu.slug,
      title: menu.title,
      updated_at: menu.updated_at
    }));

  res.json({ menus });
});

app.post('/api/me/menus', authRequired(JWT_SECRET), async (req, res) => {
  const slug = normalizeSlug(req.body?.slug);
  const title = String(req.body?.title || '').trim();

  if (!slug || !title) {
    return res.status(400).json({ error: 'Slug e titulo sao obrigatorios.' });
  }

  const existing = menusBySlug.get(slug);
  if (existing) {
    return res.status(409).json({ error: 'Slug ja existe.' });
  }

  const timestamp = nowIso();
  menusBySlug.set(slug, {
    slug,
    title,
    data_json: JSON.stringify({ items: [], settings: {} }),
    owner_id: req.userId,
    created_at: timestamp,
    updated_at: timestamp
  });

  return res.status(201).json({ slug, title });
});

app.put('/api/public/menu/:slug', async (req, res) => {
  const slug = normalizeSlug(req.params.slug);
  const title = String(req.body?.title || '').trim();
  const data = req.body?.data;
  const ownerKey = String(req.body?.ownerKey || '').trim();

  if (!slug || !title || !data || typeof data !== 'object' || !validateOwnerKey(ownerKey)) {
    return res.status(400).json({ error: 'Payload invalido. Envie title, data e ownerKey valido.' });
  }

  const existing = menusBySlug.get(slug);

  if (!existing) {
    const timestamp = nowIso();
    menusBySlug.set(slug, {
      slug,
      title,
      data_json: JSON.stringify(data),
      owner_id: 0,
      owner_key: ownerKey,
      created_at: timestamp,
      updated_at: timestamp
    });
    return res.status(201).json({ slug, title, created: true });
  }

  if (existing.owner_id && existing.owner_id > 0 && !existing.owner_key) {
    return res.status(403).json({ error: 'Este cardapio exige autenticacao pelo fluxo protegido.' });
  }

  if (existing.owner_key && existing.owner_key !== ownerKey) {
    return res.status(403).json({ error: 'ownerKey invalido para este cardapio.' });
  }

  if (!existing.owner_key) {
    existing.owner_key = ownerKey;
  }

  existing.title = title;
  existing.data_json = JSON.stringify(data);
  existing.updated_at = nowIso();
  menusBySlug.set(slug, existing);

  return res.json({ slug, title, created: false });
});

app.get('/api/menu/:slug', async (req, res) => {
  const slug = normalizeSlug(req.params.slug);
  const menu = menusBySlug.get(slug);

  if (!menu) {
    return res.status(404).json({ error: 'Cardapio nao encontrado.' });
  }

  let data = {};
  try {
    data = JSON.parse(menu.data_json);
  } catch {
    data = {};
  }

  return res.json({
    slug: menu.slug,
    title: menu.title,
    data,
    updatedAt: menu.updated_at
  });
});

app.put('/api/menu/:slug', authRequired(JWT_SECRET), async (req, res) => {
  const slug = normalizeSlug(req.params.slug);
  const title = String(req.body?.title || '').trim();
  const data = req.body?.data;

  if (!slug || !title || !data || typeof data !== 'object') {
    return res.status(400).json({ error: 'Payload invalido. Envie title e data.' });
  }

  const existing = menusBySlug.get(slug);

  if (!existing) {
    const timestamp = nowIso();
    menusBySlug.set(slug, {
      slug,
      title,
      data_json: JSON.stringify(data),
      owner_id: req.userId,
      created_at: timestamp,
      updated_at: timestamp
    });
    return res.status(201).json({ slug, title, created: true });
  }

  if (existing.owner_id !== req.userId) {
    return res.status(403).json({ error: 'Sem permissao para editar este cardapio.' });
  }

  existing.title = title;
  existing.data_json = JSON.stringify(data);
  existing.updated_at = nowIso();
  menusBySlug.set(slug, existing);

  return res.json({ slug, title, created: false });
});

app.listen(PORT, () => {
  console.log(`[webcardapio-backend] running on http://localhost:${PORT} (in-memory mode)`);
});
