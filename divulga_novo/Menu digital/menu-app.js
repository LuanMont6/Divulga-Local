// WA_NUMBER and ITEMS are set by menu-data.js via window.*
// Reading here avoids redeclaration errors when both scripts load on the same page.
if (typeof window.WA_NUMBER === 'undefined') window.WA_NUMBER = '5582999004440';
if (typeof window.ITEMS === 'undefined') window.ITEMS = {};
const WA_NUMBER = window.WA_NUMBER;
const ITEMS = window.ITEMS;

const CART_STORAGE_KEY = 'webcardapio:cart';
const PROFILE_STORAGE_KEY = 'webcardapio:profiles';
const CUSTOM_MENU_STORAGE_PREFIX = 'webcardapio:custom-menu:';
const ITEM_ALIAS = {
  'prato-dia-2': 'prato-dia',
  'x-tudo-dest': 'x-tudo'
};
const DEFAULT_STORE_NAME = 'Web Cardapio';

/** Helper para rastreamento do Facebook Pixel */
function fbTrack(event, data = {}) {
  if (typeof window.fbq === 'function') {
    window.fbq('track', event, data);
  } else {
    console.debug('[Pixel] Event:', event, data);
  }
}

/** Rastreamento de acessos reais no backend */
function trackAnalytics() {
  const slug = runtimeConfig.store;
  if (!slug || sessionStorage.getItem(`tracked:${slug}`)) return;

  const apiBase = (typeof window.API_BASE_URL === 'string' && window.API_BASE_URL)
    ? window.API_BASE_URL
    : (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
      ? 'http://localhost:3001'
      : 'https://divulga-local-production.up.railway.app';

  fetch(`${apiBase}/api/analytics/track`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slug })
  }).then(() => {
    sessionStorage.setItem(`tracked:${slug}`, '1');
  }).catch(e => console.warn('[Analytics] Fail:', e));
}


const TEMPLATE_THEMES = {
  clean: {
    '--bg': '#F7F5F0',
    '--surface': '#FFFFFF',
    '--text': '#1A1A18',
    '--text-muted': '#7A7870',
    '--text-hint': '#B0AEA8',
    '--border': 'rgba(26,26,24,0.10)',
    '--border-md': 'rgba(26,26,24,0.18)',
    '--accent': '#1A1A18',
    '--accent-fg': '#FFFFFF',
    '--green': '#1A6644',
    '--green-bg': '#E8F5EE',
    '--amber': '#7A4D00',
    '--amber-bg': '#FEF3DC',
    '--blue': '#0C4478',
    '--blue-bg': '#E6F0FB'
  },
  dark: {
    '--bg': '#101214',
    '--surface': '#1a1f24',
    '--text': '#f2f5f7',
    '--text-muted': '#a8b0b7',
    '--text-hint': '#7d8790',
    '--border': 'rgba(255,255,255,0.10)',
    '--border-md': 'rgba(255,255,255,0.18)',
    '--accent': '#f2f5f7',
    '--accent-fg': '#101214',
    '--green': '#6fd49e',
    '--green-bg': 'rgba(111,212,158,0.17)',
    '--amber': '#f3c76e',
    '--amber-bg': 'rgba(243,199,110,0.16)',
    '--blue': '#80bfff',
    '--blue-bg': 'rgba(128,191,255,0.16)'
  },
  red: {
    '--bg': '#fff4f1',
    '--surface': '#ffffff',
    '--text': '#2b1613',
    '--text-muted': '#8b5d56',
    '--text-hint': '#c39f98',
    '--border': 'rgba(192,57,43,0.16)',
    '--border-md': 'rgba(192,57,43,0.28)',
    '--accent': '#c0392b',
    '--accent-fg': '#ffffff',
    '--green': '#2e7d32',
    '--green-bg': '#e9f8ec',
    '--amber': '#a86500',
    '--amber-bg': '#fff2db',
    '--blue': '#0e5fa3',
    '--blue-bg': '#e7f2ff'
  },
  green: {
    '--bg': '#f4fbf5',
    '--surface': '#ffffff',
    '--text': '#18351f',
    '--text-muted': '#4f7558',
    '--text-hint': '#8fb198',
    '--border': 'rgba(27,94,32,0.12)',
    '--border-md': 'rgba(27,94,32,0.22)',
    '--accent': '#1b5e20',
    '--accent-fg': '#ffffff',
    '--green': '#1b5e20',
    '--green-bg': '#e4f5e8',
    '--amber': '#8f6b00',
    '--amber-bg': '#fff7dc',
    '--blue': '#1d5f9e',
    '--blue-bg': '#e8f3ff'
  },
  yellow: {
    '--bg': '#fffde7',
    '--surface': '#ffffff',
    '--text': '#3e2800',
    '--text-muted': '#7a5c00',
    '--text-hint': '#b08f3a',
    '--border': 'rgba(245,127,23,0.15)',
    '--border-md': 'rgba(245,127,23,0.28)',
    '--accent': '#f57f17',
    '--accent-fg': '#ffffff',
    '--green': '#2e7d32',
    '--green-bg': '#e9f8ec',
    '--amber': '#a86500',
    '--amber-bg': '#fff2db',
    '--blue': '#0e5fa3',
    '--blue-bg': '#e7f2ff'
  }
};

const SECTION_LABELS_BY_SEGMENT = {
  restaurante: {
    pratos: 'Pratos',
    lanches: 'Lanches',
    bebidas: 'Bebidas',
    sobremesas: 'Sobremesas',
    porcoes: 'Porcoes'
  },
  hamburgueria: {
    pratos: 'Combos',
    lanches: 'Burgers',
    bebidas: 'Bebidas',
    sobremesas: 'Sobremesas',
    porcoes: 'Porcoes'
  },
  pizzaria: {
    pratos: 'Pizzas',
    lanches: 'Combos',
    bebidas: 'Bebidas',
    sobremesas: 'Doces',
    porcoes: 'Entradas'
  },
  cafe: {
    pratos: 'Pratos',
    lanches: 'Salgados',
    bebidas: 'Cafes',
    sobremesas: 'Doces',
    porcoes: 'Extras'
  },
  bar: {
    pratos: 'Petiscos',
    lanches: 'Sanduiches',
    bebidas: 'Drinks',
    sobremesas: 'Sobremesas',
    porcoes: 'Porcoes'
  },
  outro: {
    pratos: 'Pratos',
    lanches: 'Lanches',
    bebidas: 'Bebidas',
    sobremesas: 'Sobremesas',
    porcoes: 'Porcoes'
  }
};

const SEGMENT_OVERRIDES = {
  hamburgueria: {
    'prato-dia': { name: 'Burger da casa', desc: 'Pao brioche, blend 160g, queijo, molho especial e fritas.', price: 33.9 },
    'combo-familia': { name: 'Combo galera', desc: '4 burgers + 2 porcoes + 1,5L para dividir.' },
    'x-tudo': { name: 'X-bacon duplo', desc: '2 carnes, bacon crocante, cheddar e cebola caramelizada.', price: 36.0 },
    'file-madeira': { name: 'Smash artesanal', desc: 'Dois smashs de 90g com queijo e maionese da casa.', price: 31.9 }
  },
  pizzaria: {
    'prato-dia': { name: 'Pizza promocao', desc: 'Brotinho sabor do dia com borda recheada.', price: 29.9 },
    'combo-familia': { name: 'Combo pizza familia', desc: '2 pizzas grandes + refri 2L.' },
    'x-tudo': { name: 'Calzone especial', desc: 'Massa artesanal com mussarela, presunto e oregano.', price: 34.9 },
    'moqueca': { name: 'Pizza camarao premium', desc: 'Molho da casa, camarao, catupiry e manjericao.', price: 74.0 }
  },
  cafe: {
    'prato-dia': { name: 'Brunch do dia', desc: 'Pao artesanal, ovos mexidos, salada e cafe filtrado.', price: 27.5 },
    'x-tudo': { name: 'Croissant recheado', desc: 'Croissant na chapa com queijo, peito de peru e folhas.', price: 21.0 },
    'suco': { name: 'Cafe especial 300ml', desc: 'Graos selecionados, extraido na hora.', price: 14.0 },
    'petit': { name: 'Torta do dia', desc: 'Fatia artesanal servida com chantilly.', price: 17.0 }
  },
  bar: {
    'prato-dia': { name: 'Petisco do dia', desc: 'Petisco especial com molho da casa para compartilhar.', price: 31.9 },
    'combo-familia': { name: 'Balde + porcao', desc: 'Balde de long neck + porcao de fritas.' },
    'cerveja': { name: 'Long neck premium', desc: 'Escolha entre IPA, Pilsen e Lager.', price: 19.9 },
    'limonada': { name: 'Drink sem alcool', desc: 'Refrescante com limao siciliano e hortela.', price: 18.0 }
  }
};

const cart = {};
const urlParams = new URLSearchParams(window.location.search);

function decodeConfigPayload(rawValue) {
  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(decodeURIComponent(escape(atob(rawValue))));
  } catch {
    return null;
  }
}

function readStoredProfile(slug) {
  if (!slug) {
    return null;
  }

  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const profiles = JSON.parse(raw);
    return profiles && typeof profiles === 'object' ? profiles[slug] : null;
  } catch {
    return null;
  }
}

function normalizeStoreSlug(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function buildRuntimeConfig() {
  const slug = normalizeStoreSlug((urlParams.get('store') || '').trim());
  const configFromUrl = decodeConfigPayload(urlParams.get('cfg')) || {};
  const configFromStorage = readStoredProfile(slug) || {};
  const fallbackStore = normalizeStoreSlug(configFromUrl.store || configFromStorage.store || '');

  return {
    store: slug || fallbackStore || '',
    storeName: (urlParams.get('storeName') || '').trim() || configFromUrl.storeName || configFromStorage.storeName || '',
    wa: (urlParams.get('wa') || '').trim() || configFromUrl.wa || configFromStorage.wa || '',
    tpl: (urlParams.get('tpl') || '').trim() || configFromUrl.tpl || configFromStorage.tpl || '',
    plan: (urlParams.get('plan') || '').trim() || configFromUrl.plan || configFromStorage.plan || '',
    segmento: (urlParams.get('segmento') || '').trim() || configFromUrl.segmento || configFromStorage.segmento || '',
    logoUrl: configFromUrl.logoUrl || configFromStorage.logoUrl || '',
    coverUrl: configFromUrl.coverUrl || configFromStorage.coverUrl || '',
    items: Array.isArray(configFromUrl.items) ? configFromUrl.items : (Array.isArray(configFromStorage.items) ? configFromStorage.items : [])
  };
}

function normalizePlan(rawPlan) {
  const value = String(rawPlan || '').trim().toLowerCase();
  if (value === 'pro' || value === 'business') {
    return value;
  }
  return 'basico';
}

const runtimeConfig = buildRuntimeConfig();
const customMenuStorageKey = CUSTOM_MENU_STORAGE_PREFIX + (runtimeConfig.store || 'default');

function isStoredOwnerSlug(slug) {
  if (!slug) {
    return false;
  }

  const normalizedSlug = normalizeStoreSlug(slug);
  if (!normalizedSlug) {
    return false;
  }

  try {
    const raw = localStorage.getItem('webcardapio:owner-slugs');
    if (!raw) {
      return false;
    }

    const map = JSON.parse(raw);
    return Boolean(map && typeof map === 'object' && (map[normalizedSlug] || map[slug]));
  } catch {
    return false;
  }
}

const editorEnabled = (urlParams.get('editor') || '').trim() === '1';
const ownerKeyEnabled = (urlParams.get('ownerKey') || '').trim().length > 0;
// owner mode: URL param ?owner=1 OR ownerKey — token in localStorage is only used for API calls
const _storedToken = localStorage.getItem('webcardapio:owner-token');
const _storedOwnerSlug = localStorage.getItem('webcardapio:owner-slug') || '';
function ownerModeEnabled() {
  return (urlParams.get('owner') || '').trim() === '1'
    || ownerKeyEnabled;
}
// plan: URL param > JWT payload > default
function _parsePlanFromToken(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.plan || null;
  } catch { return null; }
}
const _planFromToken = _storedToken ? _parsePlanFromToken(_storedToken) : null;
const currentPlan = normalizePlan(runtimeConfig.plan || _planFromToken || (ownerModeEnabled() ? 'pro' : 'basico'));
const canUseProFeatures = currentPlan === 'pro' || currentPlan === 'business';
const canUseBusinessFeatures = currentPlan === 'business';
function canEdit() { 
  if (currentPlan === 'basico') return false;
  return ownerModeEnabled(); 
}
let removeMode = false;
let editMode = false;
let customMenuState = { added: [], removed: [], updated: {} };
let currentAddPreset = 'item';
let editingItemId = null;
let ownerFilter = 'todos';
let ownerView = 'cardapio';

// window.API_BASE_URL can be set before this script loads to point to production backend
const DEFAULT_API_BASE = (typeof window.API_BASE_URL === 'string' && window.API_BASE_URL)
  ? window.API_BASE_URL
  : (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
    ? 'http://localhost:3001'
    : `${location.protocol}//${location.hostname}:3001`;

function getApiBaseUrl() {
  const fromQuery = (urlParams.get('api') || '').trim();
  const fromStorage = (localStorage.getItem('webcardapio:api-base') || '').trim();
  const base = fromQuery || fromStorage || DEFAULT_API_BASE;
  return base.replace(/\/+$/, '');
}

function getOwnerKey() {
  return (urlParams.get('ownerKey') || '').trim();
}

function getPublicMenuUrl() {
  const clean = new URL(window.location.href);
  clean.searchParams.delete('owner');
  clean.searchParams.delete('editor');
  clean.searchParams.delete('ownerKey');
  clean.searchParams.delete('api');
  // Build a minimal public URL: only keep store, storeName, wa, tpl, plan, segmento
  const keep = new Set(['store','storeName','wa','tpl','plan','segmento','cfg']);
  Array.from(clean.searchParams.keys()).forEach(k => {
    if (!keep.has(k)) clean.searchParams.delete(k);
  });
  return clean.toString();
}

function sanitizeCustomMenuState(input) {
  return {
    added: Array.isArray(input?.added) ? input.added : [],
    removed: Array.isArray(input?.removed) ? input.removed : [],
    updated: input?.updated && typeof input.updated === 'object' ? input.updated : {}
  };
}

async function fetchRemoteMenuData() {
  if (!runtimeConfig.store) return;

  try {
    const response = await fetch(`${getApiBaseUrl()}/api/menu/${encodeURIComponent(runtimeConfig.store)}`);
    if (!response.ok) {
      return;
    }

    const payload = await response.json();
    const remoteData = payload?.data;
    if (!remoteData || typeof remoteData !== 'object') {
      return;
    }

    const settings = remoteData.settings && typeof remoteData.settings === 'object' ? remoteData.settings : {};

    if (typeof settings.storeName === 'string' && settings.storeName.trim()) {
      runtimeConfig.storeName = settings.storeName.trim();
    }
    if (typeof settings.wa === 'string' && settings.wa.trim()) {
      runtimeConfig.wa = settings.wa.trim();
      configuredWaNumber = runtimeConfig.wa.replace(/\D/g, '') || configuredWaNumber;
    }
    if (typeof settings.tpl === 'string' && settings.tpl.trim()) {
      runtimeConfig.tpl = settings.tpl.trim();
    }
    if (typeof settings.segmento === 'string' && settings.segmento.trim()) {
      runtimeConfig.segmento = settings.segmento.trim();
    }
    if (typeof settings.logoUrl === 'string') {
      runtimeConfig.logoUrl = settings.logoUrl.trim();
    }
    if (typeof settings.coverUrl === 'string') {
      runtimeConfig.coverUrl = settings.coverUrl.trim();
    }

    if (Array.isArray(remoteData.items)) {
      runtimeConfig.items = remoteData.items;
    }

    if (remoteData.customMenuState && typeof remoteData.customMenuState === 'object') {
      customMenuState = sanitizeCustomMenuState(remoteData.customMenuState);
    }
  } catch {
    // Keep local behavior when API is offline.
  }
}

async function syncRemoteMenuData() {
  if (!ownerModeEnabled() || !runtimeConfig.store) return;

  const token    = localStorage.getItem('webcardapio:owner-token');
  const ownerKey = getOwnerKey();
  const apiBase  = getApiBaseUrl();
  const slug     = runtimeConfig.store;

  const data = {
    settings: {
      storeName: getConfiguredStoreName(),
      wa:        configuredWaNumber,
      tpl:       getConfiguredTemplate(),
      segmento:  getConfiguredSegment(),
      logoUrl:   runtimeConfig.logoUrl || '',
      coverUrl:  runtimeConfig.coverUrl || ''
    },
    customMenuState: sanitizeCustomMenuState(customMenuState)
  };

  try {
    if (token) {
      // JWT route — authenticated save
      await fetch(`${apiBase}/api/menu/${encodeURIComponent(slug)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ title: getConfiguredStoreName(), data })
      });
    } else if (ownerKey) {
      // fallback ownerKey route
      await fetch(`${apiBase}/api/public/menu/${encodeURIComponent(slug)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ownerKey, title: getConfiguredStoreName(), data })
      });
    }
  } catch {
    // offline — keep local state
  }
}

function getConfiguredWhatsAppNumber() {
  const waFromUrl = (runtimeConfig.wa || '').replace(/\D/g, '');
  if (waFromUrl.length >= 12 && waFromUrl.length <= 13) {
    return waFromUrl;
  }
  return WA_NUMBER;
}

let configuredWaNumber = getConfiguredWhatsAppNumber();

function getConfiguredTemplate() {
  const tpl = (runtimeConfig.tpl || '').trim().toLowerCase();
  return Object.prototype.hasOwnProperty.call(TEMPLATE_THEMES, tpl) ? tpl : 'clean';
}

function getConfiguredSegment() {
  const segment = (runtimeConfig.segmento || '').trim().toLowerCase();
  return Object.prototype.hasOwnProperty.call(SECTION_LABELS_BY_SEGMENT, segment) ? segment : 'restaurante';
}

function humanizeSlug(slug) {
  return slug
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function getConfiguredStoreName() {
  const explicitName = (runtimeConfig.storeName || '').trim();
  if (explicitName) {
    return explicitName;
  }

  const slug = (runtimeConfig.store || '').trim();
  if (slug) {
    return humanizeSlug(slug);
  }

  return DEFAULT_STORE_NAME;
}

function formatBRL(value) {
  return 'R$ ' + Number(value).toFixed(2).replace('.', ',');
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function applyTemplateTheme(template) {
  const rootStyle = document.documentElement.style;
  const theme = TEMPLATE_THEMES[template] || TEMPLATE_THEMES.clean;

  Object.entries(theme).forEach(([cssVar, cssValue]) => {
    rootStyle.setProperty(cssVar, cssValue);
  });
}

function applyBranding(storeName, segment) {
  const heading = document.querySelector('.hero-info h1');
  if (heading) {
    heading.textContent = storeName;
  }

  const subtitle = document.querySelector('.hero-info p');
  if (subtitle) {
    subtitle.textContent = 'Pedidos online no WhatsApp';
  }

  const segmentLabel = {
    restaurante: 'Restaurante',
    hamburgueria: 'Hamburgueria',
    pizzaria: 'Pizzaria',
    cafe: 'Cafe / Confeitaria',
    bar: 'Bar / Boteco',
    outro: 'Negocio local'
  }[segment] || 'Negocio local';

  const badge = document.querySelector('.badge-open');
  if (badge) {
    badge.textContent = segmentLabel + ' aberto agora';
  }
}

function applyMediaBranding() {
  const logoUrl = (runtimeConfig.logoUrl || '').trim();
  const coverUrl = (runtimeConfig.coverUrl || '').trim();

  const logoContainer = document.querySelector('.logo');
  if (logoContainer) {
    if (logoUrl) {
      logoContainer.innerHTML = `<img src="${escapeHtml(logoUrl)}" alt="Logo" onerror="this.parentElement.innerHTML='<div class=\'logo-placeholder\'></div>'">`;
    } else {
      logoContainer.innerHTML = '<div class="logo-placeholder"></div>';
    }
  }

  const hero = document.querySelector('.hero');
  if (hero) {
    if (coverUrl) {
      hero.style.backgroundImage = `linear-gradient(rgba(12,16,20,0.5), rgba(12,16,20,0.5)), url('${coverUrl}')`;
      hero.style.backgroundSize = 'cover';
      hero.style.backgroundPosition = 'center';
    } else {
      hero.style.backgroundImage = ''; // Volta pro CSS padrão
    }
  }
}

function applySearchFilter(term) {
  const normalized = String(term || '').trim().toLowerCase();
  document.querySelectorAll('.card').forEach((card) => {
    const name = (card.querySelector('.card-name')?.textContent || '').toLowerCase();
    const desc = (card.querySelector('.card-desc')?.textContent || '').toLowerCase();
    const match = !normalized || name.includes(normalized) || desc.includes(normalized);
    card.classList.toggle('search-hidden', !match);
  });
}

function updatePlanStats() {
  if (!canUseProFeatures) {
    return;
  }

  const uniqueItemIds = Array.from(new Set(Object.keys(ITEMS).map((id) => canonicalItemId(id))));
  const prices = uniqueItemIds
    .map((id) => ITEMS[id]?.price)
    .filter((price) => typeof price === 'number' && Number.isFinite(price));

  const totalItems = uniqueItemIds.length;
  const avgPrice = prices.length ? (prices.reduce((sum, value) => sum + value, 0) / prices.length) : 0;

  const totalEl = document.getElementById('pro-stat-total');
  const avgEl = document.getElementById('pro-stat-avg');

  if (totalEl) totalEl.textContent = `${totalItems} itens`;
  if (avgEl) avgEl.textContent = `Ticket medio ${formatBRL(avgPrice)}`;
}

function applyPlanFeatures() {
  const shell = document.getElementById('plan-feature-shell');
  if (!shell) {
    return;
  }

  if (!canUseProFeatures || !canEdit()) {
    shell.innerHTML = '';
    return;
  }

  shell.innerHTML = `
    <div class="plan-shell">
      <span class="plan-pill ${currentPlan}">${currentPlan === 'business' ? 'Business' : 'Pro'}</span>
      <div class="plan-panel">
        <div class="plan-row">
          <input id="pro-search" class="plan-search" type="search" placeholder="Buscar item no cardapio...">
          <span class="plan-chip">${canEdit() ? 'Painel do dono' : 'Painel inteligente'}</span>
        </div>
        <div class="plan-row">
          <span class="plan-chip" id="pro-stat-total">0 itens</span>
          <span class="plan-chip" id="pro-stat-avg">Ticket medio R$ 0,00</span>
          ${canUseBusinessFeatures ? '<select id="business-unit" class="plan-select"><option value="Matriz">Matriz</option><option value="Centro">Unidade Centro</option><option value="Shopping">Unidade Shopping</option></select><button class="plan-action" id="business-open-toggle">Pausar pedidos</button>' : ''}
        </div>
      </div>
    </div>`;

  const searchInput = document.getElementById('pro-search');
  if (searchInput) {
    searchInput.addEventListener('input', (event) => {
      applySearchFilter(event.target.value);
    });
  }

  if (canUseBusinessFeatures) {
    const deliveryMode = document.getElementById('delivery-mode');
    const unitSelect = document.getElementById('business-unit');
    if (unitSelect) {
      unitSelect.addEventListener('change', () => {
        const unit = unitSelect.value;
        if (deliveryMode) {
          deliveryMode.textContent = `${unit} · Entrega e retirada`;
        }
      });
    }

    const openToggle = document.getElementById('business-open-toggle');
    const badge = document.querySelector('.badge-open');
    if (openToggle && badge) {
      let paused = false;
      openToggle.addEventListener('click', () => {
        paused = !paused;
        badge.textContent = paused ? 'Fechado no momento' : 'Aberto agora';
        openToggle.textContent = paused ? 'Retomar pedidos' : 'Pausar pedidos';
      });
    }

    const poweredBy = document.getElementById('powered-by');
    if (poweredBy) {
      poweredBy.style.display = 'none';
    }
  }

  updatePlanStats();
}

function resolveItemSection(itemId) {
  const related = relatedItemIds(itemId);
  for (const relatedId of related) {
    const ctrl = document.getElementById('ctrl-' + relatedId);
    const sec = ctrl?.closest('.sec');
    if (sec) {
      return sec.id.replace('sec-', '');
    }
  }
  return 'pratos';
}

function sectionLabel(section) {
  const labels = {
    destaques: 'Destaque',
    pratos: 'Prato',
    lanches: 'Lanche',
    bebidas: 'Bebida',
    sobremesas: 'Sobremesa',
    porcoes: 'Porcao',
    combos: 'Combo'
  };
  return labels[section] || 'Item';
}

function collectOwnerItems() {
  const unique = new Set(Object.keys(ITEMS).map((id) => canonicalItemId(id)));
  return Array.from(unique)
    .filter((id) => ITEMS[id])
    .map((id) => {
      const updated = customMenuState.updated?.[id] || {};
      const added   = customMenuState.added?.find((a) => a.id === id) || {};
      return {
        id,
        name:    updated.name    || added.name    || ITEMS[id].name,
        price:   updated.price   !== undefined ? updated.price : (added.price || ITEMS[id].price),
        desc:    updated.desc    || added.desc    || '',
        section: updated.section || added.section || resolveItemSection(id)
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
}

function formatWhatsForOwner() {
  const digits = configuredWaNumber || '';
  if (digits.length < 12) return digits;
  return `${digits.slice(2, 4)} ${digits.slice(4, 9)}-${digits.slice(9)}`;
}

function ownerMainContent(items, filteredItems, isOpen, deliveryLabel) {
  if (currentPlan === 'basico' && ownerView !== 'plano') {
    return `
      <div style="padding:60px 20px;text-align:center;background:var(--surface);border-radius:12px;border:1px solid var(--border-md);margin:20px">
        <div style="width:64px;height:64px;background:var(--blue-bg);color:var(--blue);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 24px">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20m0-20l-7 7m7-7l7 7"/></svg>
        </div>
        <h3 style="font-size:20px;margin-bottom:12px;color:var(--text)">Painel Gerencial Bloqueado</h3>
        <p style="color:var(--text-muted);font-size:14px;margin-bottom:32px;max-width:320px;margin-left:auto;margin-right:auto;line-height:1.6">
          O **Plano Básico** permite apenas que o seu cardápio seja visualizado pelos clientes. <br><br>
          Faça o upgrade para o **Plano Pro** para editar itens, trocar templates, ver relatórios e muito mais!
        </p>
        <button class="owner-btn" onclick="ownerView='plano';renderOwnerDashboard()" style="background:var(--blue);color:#fff;padding:12px 32px;font-weight:600">Upgrade Agora</button>
      </div>`;
  }

  if (ownerView === 'templates') {
    const tpls = [
      { id:'clean',  label:'Clean & moderno', desc:'Restaurante, café',    bg:'#F7F5F0', accent:'#1a1a18' },
      { id:'dark',   label:'Dark premium',    desc:'Bar, hamburgueria',    bg:'#1a1a18', accent:'#fff' },
      { id:'red',    label:'Vermelho & bold', desc:'Pizzaria, delivery',   bg:'#FFF0F0', accent:'#C0392B' },
      { id:'green',  label:'Verde natural',   desc:'Açaí, saudável',      bg:'#F0FFF4', accent:'#1B5E20' },
      { id:'yellow', label:'Amarelo vibrante',desc:'Lanchonete',           bg:'#FFFDE7', accent:'#F57F17' },
    ];
    const cur = getConfiguredTemplate();
    return `
      <div class="owner-top">
        <h3 class="owner-title">Templates</h3>
        <p style="font-size:.82rem;color:#888;margin-top:4px">Troque o visual sem perder os itens.</p>
      </div>
      <div class="owner-template-grid">
        ${tpls.map(t => `
          <div class="owner-template-card ${t.id === cur ? 'active' : ''}" data-tpl-id="${t.id}" style="cursor:pointer">
            <div style="height:52px;background:${t.bg};border-radius:6px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;margin-bottom:8px">
              <div style="width:28px;height:4px;background:${t.accent};border-radius:2px;opacity:.9"></div>
              <div style="width:36px;height:2px;background:${t.accent};border-radius:2px;opacity:.5"></div>
            </div>
            <strong>${t.label}</strong>
            <p>${t.desc}</p>
            ${t.id === cur ? '<span class="tpl-active-badge">Ativo</span>' : ''}
          </div>`).join('')}
      </div>`;
  }

  if (ownerView === 'aparencia' && canUseProFeatures) {
    return `
      <div class="owner-top">
        <h3 class="owner-title">Aparência</h3>
        <div class="owner-actions">
          <button class="owner-btn" id="owner-save-brand">Salvar</button>
        </div>
      </div>
      <div class="owner-grid">
        <div class="owner-field full"><label>URL da logo (link direto para imagem)</label><input id="brand-logo" placeholder="https://..." value="${escapeHtml(runtimeConfig.logoUrl||'')}"></div>
      </div>
      <p style="font-size:.78rem;color:#aaa;margin-top:8px">Dica: use o Google Fotos ou Imgur para hospedar suas imagens e copie o link direto.</p>`;
  }

  if (ownerView === 'relatorios' && canUseBusinessFeatures) {
    return `
      <div class="owner-top">
        <h3 class="owner-title">Relatórios</h3>
      </div>
      <div class="owner-stats-grid" style="grid-template-columns:repeat(2,1fr)">
        <div class="owner-stat-card"><p>Pedidos esta semana</p><strong>94</strong><span>+18% vs semana anterior</span></div>
        <div class="owner-stat-card"><p>Ticket médio</p><strong>R$ 47,30</strong><span>baseado nos últimos 30 dias</span></div>
        <div class="owner-stat-card"><p>Item mais pedido</p><strong>X-tudo especial</strong><span>38% dos pedidos</span></div>
        <div class="owner-stat-card"><p>Horário de pico</p><strong>12h – 14h</strong><span>Almoço responde por 61%</span></div>
      </div>
      <p style="font-size:.78rem;color:#aaa;margin-top:16px">Dados simulados — integração com pedidos reais disponível em breve.</p>`;
  }

  if (ownerView === 'multi' && canUseBusinessFeatures) {
    return `
      <div class="owner-top">
        <h3 class="owner-title">Multi-unidades</h3>
        <div class="owner-actions">
          <button class="owner-btn" id="add-unit-btn">+ Nova unidade</button>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;gap:10px">
        <div class="owner-row" style="justify-content:space-between">
          <div><span class="owner-row-name">Matriz</span><br><span style="font-size:.78rem;color:#888">webcardapio.com/${escapeHtml(runtimeConfig.store||'loja')}</span></div>
          <span style="font-size:.75rem;background:#E8F5E9;color:#1B5E20;padding:3px 10px;border-radius:12px;font-weight:600">Ativa</span>
        </div>
        <div class="owner-row" style="justify-content:space-between;opacity:.6">
          <div><span class="owner-row-name">Unidade 2</span><br><span style="font-size:.78rem;color:#888">A configurar</span></div>
          <span style="font-size:.75rem;background:#f5f5f5;color:#aaa;padding:3px 10px;border-radius:12px">Inativa</span>
        </div>
      </div>`;
  }

  if (ownerView === 'qrcode') {
    const pub = window.location.href.split('?')[0] + '?store=' + runtimeConfig.store;
    return `
      <div class="owner-top">
        <h3 class="owner-title">QR Code do Cardápio</h3>
      </div>
      <div style="background:var(--surface);border:1px solid var(--border-md);border-radius:16px;padding:32px;text-align:center;max-width:400px;margin:0 auto">
        <div id="qrcode-display" style="background:#fff;padding:16px;border-radius:12px;display:inline-block;margin-bottom:24px;box-shadow:0 10px 25px rgba(0,0,0,0.05)"></div>
        <h4 style="margin-bottom:8px">${escapeHtml(getConfiguredStoreName())}</h4>
        <p style="font-size:13px;color:var(--text-muted);margin-bottom:24px;word-break:break-all">${pub}</p>
        <div style="display:flex;gap:10px;justify-content:center">
          <button class="owner-btn" onclick="generateMenuQRCode()" style="background:var(--blue);color:#fff">Gerar QR Code</button>
          <button class="owner-btn" id="download-qr-btn" onclick="downloadQRCode()" style="display:none">Baixar PNG</button>
        </div>
        <p style="font-size:11px;color:var(--text-hint);margin-top:16px">Dica: Imprima e cole nas mesas ou no balcão!</p>
      </div>`;
  }


  if (ownerView === 'pedidos') {
    return `
      <div class="owner-top">
        <h3 class="owner-title">Pedidos recentes</h3>
        <div class="owner-actions">
          <button class="owner-btn" id="owner-view-menu">Ver cardapio</button>
          <button class="owner-btn" id="owner-refresh">Atualizar</button>
          <button class="owner-more" aria-label="Mais opcoes">•••</button>
        </div>
      </div>
      <div class="owner-stats-grid">
        <div class="owner-stat-card"><p>Pedidos (simulados)</p><strong>14</strong><span>Pronto em breve</span></div>
        <div class="owner-stat-card" id="stat-real-views"><p>Acessos (reais)</p><strong>...</strong><span>Carregando...</span></div>
        <div class="owner-stat-card"><p>Conversao</p><strong>--</strong><span>...</span></div>
      </div>
      <p class="owner-section-title">Atividade recente</p>
      <div class="owner-activity-list">
        <div class="owner-activity-item"><span class="dot-green"></span><span>Pedido via WhatsApp — 2x X-tudo + 1x Limonada</span><small>ha 4 min</small></div>
        <div class="owner-activity-item"><span class="dot-green"></span><span>Pedido via WhatsApp — 1x Wrap + 2x Suco natural</span><small>ha 18 min</small></div>
        <div class="owner-activity-item"><span class="dot-blue"></span><span>Acesso ao cardapio — usuario novo</span><small>ha 22 min</small></div>
        <div class="owner-activity-item"><span class="dot-green"></span><span>Pedido via WhatsApp — 3x X-tudo especial</span><small>ha 31 min</small></div>
        <div class="owner-activity-item"><span class="dot-blue"></span><span>Acesso ao cardapio — usuario recorrente</span><small>ha 45 min</small></div>
      </div>
      <p class="owner-section-title">Exemplo de mensagem gerada automaticamente:</p>
      <pre class="owner-message-box">Ola! Gostaria de fazer um pedido:\n\n• 2x X-tudo especial — R$ 64,00\n• 1x Limonada suica — R$ 16,00\n\n*Total: R$ 80,00*\n\nPode confirmar meu pedido? 😊</pre>`;
  }

  if (ownerView === 'plano') {
    const plans = [
      { id:'basico',   label:'Básico',    price:'Grátis', period:' para sempre', feats:['Link público','Botão WhatsApp','1 template','Até 20 itens'] },
      { id:'pro',      label:'Pro',       price:'R$40', period:'/mês', feats:['Tudo do Básico','Templates ilimitados','Itens ilimitados','Painel do dono','Busca e filtros','Aparência (logo/capa)','Pedidos recentes'] },
      { id:'business', label:'Business',  price:'R$50', period:'/mês', feats:['Tudo do Pro','Relatórios avançados','Multi-unidades','Domínio próprio','Ocultar "Feito com"','Suporte prioritário'] },
    ];
    return `
      <div class="owner-top">
        <h3 class="owner-title">Plano atual: <strong>${currentPlan.charAt(0).toUpperCase()+currentPlan.slice(1)}</strong></h3>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px">
        ${plans.map(p=>`
          <div style="border-radius:12px;padding:16px;border:${p.id===currentPlan?'2px solid #34A853':'1px solid var(--border-md)'};background:${p.id===currentPlan?'rgba(52,168,83,.07)':'var(--surface)'}">
            ${p.id===currentPlan?'<span style="font-size:10px;background:#34A853;color:#fff;padding:2px 8px;border-radius:8px;font-weight:700">ATUAL</span><br>':''}
            <p style="font-size:.85rem;font-weight:700;color:var(--text);margin:8px 0 2px">${p.label}</p>
            <p style="font-size:1.3rem;font-weight:800;color:var(--text)">${p.price}<span style="font-size:.75rem;font-weight:400;color:var(--text-muted)">${p.period}</span></p>
            <div style="margin-top:10px;display:flex;flex-direction:column;gap:5px">
              ${p.feats.map(f=>`<span style="font-size:.75rem;color:var(--text-muted)">✓ ${f}</span>`).join('')}
            </div>
          </div>`).join('')}
      </div>
      <p style="font-size:.75rem;color:var(--text-hint);margin-top:14px;text-align:center">Para mudar de plano, entre em contato com o suporte.</p>`;
  }

  return `
    <div class="owner-top">
      <h3 class="owner-title">Meu cardapio</h3>
      <div class="owner-actions">
        <button class="owner-btn" id="owner-view-menu">Ver cardapio</button>
        <button class="owner-btn" id="owner-save">Salvar alteracoes</button>
      </div>
    </div>
    <div class="owner-grid">
      <div class="owner-field"><label>Nome do estabelecimento</label><input id="owner-store-name" value="${escapeHtml(getConfiguredStoreName())}"></div>
      <div class="owner-field"><label>WhatsApp (com DDD)</label><input id="owner-whats" value="${escapeHtml(formatWhatsForOwner())}"></div>
      <div class="owner-field"><label>Status</label><select id="owner-status"><option value="aberto" ${isOpen ? 'selected' : ''}>Aberto agora</option><option value="fechado" ${!isOpen ? 'selected' : ''}>Fechado no momento</option></select></div>
      <div class="owner-field"><label>Modalidade</label><select id="owner-delivery"><option value="Entrega e retirada" ${deliveryLabel.includes('Entrega e retirada') ? 'selected' : ''}>Entrega e retirada</option><option value="Somente retirada" ${deliveryLabel.includes('Somente retirada') ? 'selected' : ''}>Somente retirada</option><option value="Somente entrega" ${deliveryLabel.includes('Somente entrega') ? 'selected' : ''}>Somente entrega</option></select></div>
    </div>
    <div class="owner-filter">
      <button class="owner-chip ${ownerFilter === 'todos' ? 'active' : ''}" data-owner-filter="todos">Todos</button>
      <button class="owner-chip ${ownerFilter === 'lanches' ? 'active' : ''}" data-owner-filter="lanches">Lanches</button>
      <button class="owner-chip ${ownerFilter === 'bebidas' ? 'active' : ''}" data-owner-filter="bebidas">Bebidas</button>
      <button class="owner-chip ${ownerFilter === 'sobremesas' ? 'active' : ''}" data-owner-filter="sobremesas">Sobremesas</button>
      <button class="owner-chip ${ownerFilter === 'combos' ? 'active' : ''}" data-owner-filter="combos">Combos</button>
    </div>
    <div class="owner-list">
      ${filteredItems.map((item) => `
        <div class="owner-row">
          <span class="owner-row-name">${escapeHtml(item.name)}</span>
          <span class="owner-row-tag">${sectionLabel(item.section)}</span>
          <span class="owner-row-price">${formatBRL(item.price)}</span>
          <div>
            <button class="owner-icon-btn" data-owner-edit="${item.id}">✎</button>
            <button class="owner-icon-btn" data-owner-remove="${item.id}">×</button>
          </div>
        </div>
      `).join('')}
    </div>
    <button class="owner-add" id="owner-add-item">+ Adicionar item</button>`;
}

function renderOwnerDashboard() {
  if (!canEdit()) {
    return;
  }

  const shell = document.getElementById('owner-dashboard-shell');
  if (!shell) {
    return;
  }

  const items = collectOwnerItems();
  const filteredItems = ownerFilter === 'todos' ? items : items.filter((item) => item.section === ownerFilter);
  const publicUrl = getPublicMenuUrl();
  const isOpen = (document.querySelector('.badge-open')?.textContent || '').toLowerCase().includes('aberto');
  const deliveryLabel = document.getElementById('delivery-mode')?.textContent || 'Entrega e retirada';
  const mainHtml = ownerMainContent(items, filteredItems, isOpen, deliveryLabel);

  shell.innerHTML = `
    <section class="owner-dash">
      <div class="owner-dash-grid">
        <aside class="owner-dash-side">
          <div class="owner-brand">Web Cardapio</div>
          <span class="owner-plan">Plano ${currentPlan} ativo</span>
          <div class="owner-nav">
            <button class="owner-nav-item ${ownerView === 'cardapio' ? 'active' : ''}" data-owner-view="cardapio">Meu cardápio</button>
            <button class="owner-nav-item ${ownerView === 'templates' ? 'active' : ''}" data-owner-view="templates">Templates</button>
            ${canUseProFeatures ? `<button class="owner-nav-item ${ownerView === 'aparencia' ? 'active' : ''}" data-owner-view="aparencia">Aparência</button>` : ''}
            <button class="owner-nav-item ${ownerView === 'pedidos' ? 'active' : ''}" data-owner-view="pedidos">Pedidos recentes</button>
            <button class="owner-nav-item ${ownerView === 'qrcode' ? 'active' : ''}" data-owner-view="qrcode">QR Code</button>
            ${canUseBusinessFeatures ? `<button class="owner-nav-item ${ownerView === 'relatorios' ? 'active' : ''}" data-owner-view="relatorios">Relatórios</button>` : ''}
            ${canUseBusinessFeatures ? `<button class="owner-nav-item ${ownerView === 'multi' ? 'active' : ''}" data-owner-view="multi">Multi-unidades</button>` : ''}
            <button class="owner-nav-item ${ownerView === 'plano' ? 'active' : ''}" data-owner-view="plano">Plano</button>
          </div>
          <div class="owner-public-link">
            <p>Seu link publico</p>
            <a href="${publicUrl}" target="_blank" rel="noopener noreferrer">${publicUrl}</a>
          </div>
        </aside>
        <div class="owner-dash-main">
          ${mainHtml}
        </div>
      </div>
    </section>`;

  shell.querySelectorAll('[data-owner-view]').forEach((button) => {
    button.addEventListener('click', () => {
      ownerView = button.getAttribute('data-owner-view') || 'cardapio';
      renderOwnerDashboard();
    });
  });

  // template click
  shell.querySelectorAll('[data-tpl-id]').forEach((card) => {
    card.addEventListener('click', () => {
      const tplId = card.getAttribute('data-tpl-id');
      runtimeConfig.tpl = tplId;
      applyTemplateTheme(tplId);
      // update URL so public link reflects the new template
      const u = new URL(location.href);
      u.searchParams.set('tpl', tplId);
      history.replaceState(null, '', u.toString());
      saveCustomMenuState();
      renderOwnerDashboard();
    });
  });

  // aparencia save
  document.getElementById('owner-save-brand')?.addEventListener('click', async () => {
    runtimeConfig.logoUrl  = (document.getElementById('brand-logo')?.value||'').trim();
    runtimeConfig.coverUrl = ''; // Campo removido — sempre limpa
    
    applyMediaBranding();
    saveCustomMenuState(); // Salva local
    
    const b = document.getElementById('owner-save-brand');
    if(b){ b.disabled = true; b.textContent = 'Salvando...'; }
    
    try {
      await syncRemoteMenuData(); // Força sincronização com o banco
      if(b){ b.textContent = 'Salvo! ✅'; }
    } catch (e) {
      if(b){ b.textContent = 'Erro ao salvar'; }
    } finally {
      setTimeout(()=>{ if(b){ b.disabled = false; b.textContent = 'Salvar'; } }, 2000);
    }
  });

  shell.querySelectorAll('[data-owner-filter]').forEach((button) => {
    button.addEventListener('click', () => {
      ownerFilter = button.getAttribute('data-owner-filter') || 'todos';
      renderOwnerDashboard();
    });
  });

  shell.querySelectorAll('[data-owner-edit]').forEach((button) => {
    button.addEventListener('click', () => {
      openEditItemModal(button.getAttribute('data-owner-edit'));
    });
  });

  shell.querySelectorAll('[data-owner-remove]').forEach((button) => {
    button.addEventListener('click', () => {
      removeMenuItem(button.getAttribute('data-owner-remove'));
    });
  });

  document.getElementById('owner-add-item')?.addEventListener('click', () => openAddItemModal('item'));

  document.getElementById('owner-view-menu')?.addEventListener('click', () => {
    window.scrollTo({ top: document.querySelector('.hero')?.offsetHeight || 0, behavior: 'smooth' });
  });

  document.getElementById('owner-save')?.addEventListener('click', () => {
    const ownerStoreName = (document.getElementById('owner-store-name')?.value || '').trim();
    const ownerWhats = (document.getElementById('owner-whats')?.value || '').replace(/\D/g, '');

    if (ownerStoreName) {
      runtimeConfig.storeName = ownerStoreName;
      applyBranding(ownerStoreName, getConfiguredSegment());
    }

    if (ownerWhats.length >= 12 && ownerWhats.length <= 13) {
      configuredWaNumber = ownerWhats;
      runtimeConfig.wa = ownerWhats;
    }

    saveCustomMenuState();
    const btn = document.getElementById('owner-save');
    if (!btn) return;
    const prev = btn.textContent;
    btn.textContent = 'Salvo';
    setTimeout(() => {
      btn.textContent = prev;
    }, 1000);
  });

  document.getElementById('owner-status')?.addEventListener('change', (event) => {
    const badge = document.querySelector('.badge-open');
    if (badge) {
      badge.textContent = event.target.value === 'aberto' ? 'Aberto agora' : 'Fechado no momento';
    }
  });

  document.getElementById('owner-delivery')?.addEventListener('change', (event) => {
    const deliveryMode = document.getElementById('delivery-mode');
    if (deliveryMode) deliveryMode.textContent = event.target.value;
  });

  if (ownerView === 'pedidos') {
    fetchRealStats();
  }
}

function applySectionLabels(segment) {
  const labels = SECTION_LABELS_BY_SEGMENT[segment] || SECTION_LABELS_BY_SEGMENT.restaurante;
  // collect all renamed labels to detect duplicates with existing nav buttons
  const renamedLabels = new Set(Object.values(labels).map(l => l.toLowerCase()));
  Object.entries(labels).forEach(([sec, label]) => {
    const navBtn = document.querySelector(`.nav-btn[data-sec="${sec}"]`);
    if (navBtn) {
      navBtn.textContent = label;
    }
  });
  // hide nav buttons whose label would duplicate a renamed section
  document.querySelectorAll('.nav-btn').forEach(btn => {
    const sec = btn.getAttribute('data-sec');
    if (!labels[sec] && renamedLabels.has(btn.textContent.trim().toLowerCase())) {
      btn.style.display = 'none';
    } else {
      btn.style.display = '';
    }
  });
}

function updateItemData(itemId, patch) {
  relatedItemIds(itemId).forEach((id) => {
    if (!ITEMS[id]) {
      return;
    }

    if (patch.name) {
      ITEMS[id].name = patch.name;
    }
    if (typeof patch.price === 'number') {
      ITEMS[id].price = patch.price;
    }
  });
}

function applyItemOverride(itemId, patch) {
  const ctrl = document.getElementById('ctrl-' + itemId);
  if (!ctrl) {
    return;
  }

  const card = ctrl.closest('.card');
  if (!card) {
    return;
  }

  if (patch.name) {
    const nameEl = card.querySelector('.card-name');
    if (nameEl) {
      nameEl.textContent = patch.name;
    }
  }

  if (patch.desc) {
    const descEl = card.querySelector('.card-desc');
    if (descEl) {
      descEl.textContent = patch.desc;
    }
  }

  if (typeof patch.price === 'number') {
    const priceEl = card.querySelector('.price');
    if (priceEl) {
      priceEl.textContent = formatBRL(patch.price);
    }
  }

  updateItemData(itemId, patch);
}

function applySegmentCatalog(segment) {
  const overrides = SEGMENT_OVERRIDES[segment] || {};
  Object.entries(overrides).forEach(([itemId, patch]) => {
    applyItemOverride(itemId, patch);
  });
}

function applyCustomCatalogFromConfig() {
  if (!Array.isArray(runtimeConfig.items)) {
    return;
  }

  runtimeConfig.items.forEach((itemPatch) => {
    if (!itemPatch || typeof itemPatch !== 'object' || !itemPatch.id) {
      return;
    }

    applyItemOverride(itemPatch.id, itemPatch);
  });
}

function loadCustomMenuState() {
  try {
    const raw = localStorage.getItem(customMenuStorageKey);
    if (!raw) {
      return;
    }

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      return;
    }

    customMenuState = {
      added: Array.isArray(parsed.added) ? parsed.added : [],
      removed: Array.isArray(parsed.removed) ? parsed.removed : [],
      updated: parsed.updated && typeof parsed.updated === 'object' ? parsed.updated : {}
    };
  } catch {
    customMenuState = { added: [], removed: [], updated: {} };
  }
}

function saveCustomMenuState() {
  localStorage.setItem(customMenuStorageKey, JSON.stringify(customMenuState));
  syncRemoteMenuData();
}

function sectionContainer(section) {
  return document.querySelector(`#sec-${section} .section`);
}

function cardMarkup(item) {
  const imgHtml = item.imageUrl
    ? `<img src="${escapeHtml(item.imageUrl)}" alt="${escapeHtml(item.name)}" class="card-img-photo" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
       <div class="card-img card-img-fallback" style="display:none"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><circle cx="12" cy="12" r="9"/><path d="M8 12h8"/></svg></div>`
    : `<div class="card-img"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><circle cx="12" cy="12" r="9"/><path d="M8 12h8"/></svg></div>`;
  return `
    <button class="edit-item-btn" onclick="openEditItemModal('${item.id}')">Editar</button>
    <button class="remove-item-btn" onclick="removeMenuItem('${item.id}')">Remover</button>
    ${imgHtml}
    <div class="card-body">
      <p class="card-name">${escapeHtml(item.name)}</p>
      <p class="card-desc">${escapeHtml(item.desc)}</p>
      <div class="card-bottom">
        <span class="price">${formatBRL(item.price)}</span>
        <div id="ctrl-${item.id}"></div>
      </div>
    </div>`;
}

function addCardToSection(item) {
  const target = sectionContainer(item.section);
  if (!target) {
    return;
  }

  const card = document.createElement('div');
  card.className = 'card';
  card.innerHTML = cardMarkup(item);
  target.appendChild(card);
}

function removeCardsByItemId(id) {
  document.querySelectorAll(`#ctrl-${id}`).forEach((ctrl) => {
    const card = ctrl.closest('.card');
    if (card) {
      card.remove();
    }
  });
}

function decorateDefaultCardsForRemove() {
  document.querySelectorAll('.card').forEach((card) => {
    const ctrl = card.querySelector('[id^="ctrl-"]');
    if (!ctrl) {
      return;
    }

    const itemId = ctrl.id.replace('ctrl-', '');

    if (!card.querySelector('.edit-item-btn')) {
      const editButton = document.createElement('button');
      editButton.className = 'edit-item-btn';
      editButton.textContent = 'Editar';
      editButton.onclick = () => openEditItemModal(itemId);
      card.appendChild(editButton);
    }

    if (!card.querySelector('.remove-item-btn')) {
      const removeButton = document.createElement('button');
      removeButton.className = 'remove-item-btn';
      removeButton.textContent = 'Remover';
      removeButton.onclick = () => removeMenuItem(itemId);
      card.appendChild(removeButton);
    }
  });
}

function normalizeSection(input) {
  const value = (input || '').toLowerCase().trim();
  const accepted = ['destaques', 'pratos', 'lanches', 'bebidas', 'sobremesas', 'porcoes', 'combos'];
  if (accepted.includes(value)) {
    return value;
  }
  return null;
}


function fetchRealStats() {
  const slug = runtimeConfig.store;
  const apiBase = (typeof window.API_BASE_URL === 'string' && window.API_BASE_URL)
    ? window.API_BASE_URL
    : (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
      ? 'http://localhost:3001'
      : 'https://divulga-local-production.up.railway.app';

  fetch(`${apiBase}/api/analytics/stats/${slug}`)
    .then(r => r.json())
    .then(data => {
      const el = document.getElementById('stat-real-views');
      if (el) {
        el.querySelector('strong').textContent = data.total || 0;
        const last7 = data.days && data.days.length > 0 ? data.days[data.days.length-1].views : 0;
        el.querySelector('span').textContent = `${last7} hoje`;
      }
    }).catch(e => console.warn('[Stats] Fail:', e));
}

function generateMenuQRCode() {
  const display = document.getElementById('qrcode-display');
  if (!display) return;
  display.innerHTML = '';
  const pub = window.location.href.split('?')[0] + '?store=' + runtimeConfig.store;
  
  new QRCode(display, {
    text: pub,
    width: 200,
    height: 200,
    colorDark : "#000000",
    colorLight : "#ffffff",
    correctLevel : QRCode.CorrectLevel.H
  });
  
  setTimeout(() => {
    const btn = document.getElementById('download-qr-btn');
    if (btn) btn.style.display = 'inline-block';
  }, 100);
}

function downloadQRCode() {
  const canvas = document.querySelector('#qrcode-display canvas');
  if (!canvas) return;
  const link = document.createElement('a');
  link.download = `qrcode-${runtimeConfig.store}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

function openAddItemModal(preset = 'item') {

  if (!canEdit()) {
    return;
  }

  editingItemId = null;
  currentAddPreset = preset;

  const defaults = {
    item: { section: 'pratos', name: 'Novo item', price: '24.90', desc: 'Novo item do cardapio' },
    combo: { section: 'lanches', name: 'Combo da casa', price: '39.90', desc: 'Combo especial com acompanhamento' },
    drink: { section: 'bebidas', name: 'Bebida especial', price: '12.00', desc: 'Bebida gelada para acompanhar' }
  };

  const presetData = defaults[preset] || defaults.item;
  const sectionEl = document.getElementById('editor-section');
  const nameEl = document.getElementById('editor-name');
  const priceEl = document.getElementById('editor-price');
  const descEl = document.getElementById('editor-desc');
  const titleEl = document.getElementById('editor-modal-title');
  const submitBtn = document.querySelector('.editor-btn-primary');

  if (sectionEl) sectionEl.value = presetData.section;
  if (nameEl) nameEl.value = presetData.name;
  if (priceEl) priceEl.value = presetData.price;
  if (descEl) descEl.value = presetData.desc;
  if (titleEl) {
    titleEl.textContent = preset === 'combo' ? 'Adicionar combo' : (preset === 'drink' ? 'Adicionar bebida' : 'Adicionar item');
  }
  if (submitBtn) {
    submitBtn.textContent = 'Salvar item';
  }

  const modal = document.getElementById('editor-modal');
  if (modal) {
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
  }
}

function openEditItemModal(itemId) {
  if (!canEdit()) {
    return;
  }

  editingItemId = itemId;

  // Resolve data from state (works even when menu sections are hidden in owner mode)
  const key     = canonicalItemId(itemId);
  const updated = customMenuState.updated?.[key] || {};
  const added   = customMenuState.added?.find((a) => a.id === key) || {};
  const base    = ITEMS[key] || ITEMS[itemId] || {};

  const name      = updated.name     || added.name     || base.name     || '';
  const price     = updated.price    !== undefined ? updated.price
                    : (added.price   !== undefined ? added.price : (base.price || 0));
  const desc      = updated.desc     || added.desc     || '';
  const section   = updated.section  || added.section  || resolveItemSection(itemId) || 'pratos';
  const imageUrl  = updated.imageUrl || added.imageUrl || base.imageUrl || '';

  const sectionInput   = document.getElementById('editor-section');
  const nameInput      = document.getElementById('editor-name');
  const priceInput     = document.getElementById('editor-price');
  const descInput      = document.getElementById('editor-desc');
  const imageUrlInput  = document.getElementById('editor-imageUrl');
  const titleEl        = document.getElementById('editor-modal-title');
  const submitBtn      = document.querySelector('.editor-btn-primary');

  if (sectionInput)  sectionInput.value  = normalizeSection(section) || 'pratos';
  if (nameInput)     nameInput.value     = name;
  if (priceInput)    priceInput.value    = Number.isFinite(Number(price)) ? Number(price).toFixed(2) : '';
  if (descInput)     descInput.value     = desc;
  if (imageUrlInput) imageUrlInput.value = imageUrl;
  if (titleEl)       titleEl.textContent = 'Editar item';
  if (submitBtn)     submitBtn.textContent = 'Salvar alteracoes';

  const modal = document.getElementById('editor-modal');
  if (modal) {
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    setTimeout(() => nameInput?.focus(), 50);
  }
}

function closeAddItemModal() {
  const modal = document.getElementById('editor-modal');
  if (modal) {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
  }
  editingItemId = null;
}

function submitAddItemModal() {
  const sectionValue  = (document.getElementById('editor-section')?.value  || '').trim();
  const nameValue     = (document.getElementById('editor-name')?.value     || '').trim();
  const priceRaw      = (document.getElementById('editor-price')?.value    || '').replace(',', '.').trim();
  const descValue     = (document.getElementById('editor-desc')?.value     || '').trim();
  const imageUrlValue = (document.getElementById('editor-imageUrl')?.value || '').trim();

  const section = normalizeSection(sectionValue);
  if (!section) {
    alert('Categoria invalida.');
    return;
  }

  if (!nameValue) {
    alert('Nome do item e obrigatorio.');
    return;
  }

  const price = Number(priceRaw);
  if (!Number.isFinite(price) || price <= 0) {
    alert('Preco invalido.');
    return;
  }

  if (editingItemId) {
    updateMenuItem(editingItemId, {
      section,
      name: nameValue,
      price,
      desc: descValue || 'Novo item do cardapio',
      imageUrl: imageUrlValue
    });
  } else {
    addCustomItem({
      section,
      name: nameValue,
      price,
      desc: descValue || 'Novo item do cardapio',
      imageUrl: imageUrlValue
    });
  }

  closeAddItemModal();
}

function updateMenuItem(itemId, patch) {
  const key = canonicalItemId(itemId);
  const related = relatedItemIds(itemId);

  related.forEach((relatedId) => {
    const ctrl = document.getElementById('ctrl-' + relatedId);
    const card = ctrl ? ctrl.closest('.card') : null;
    if (!card) {
      return;
    }

    if (patch.name) {
      const nameEl = card.querySelector('.card-name');
      if (nameEl) nameEl.textContent = patch.name;
    }
    if (patch.desc) {
      const descEl = card.querySelector('.card-desc');
      if (descEl) descEl.textContent = patch.desc;
    }
    if (typeof patch.price === 'number') {
      const priceEl = card.querySelector('.price');
      if (priceEl) priceEl.textContent = formatBRL(patch.price);
    }

    const newSectionContainer = sectionContainer(patch.section);
    if (newSectionContainer && card.parentElement !== newSectionContainer) {
      newSectionContainer.appendChild(card);
    }

    if (ITEMS[relatedId]) {
      if (patch.name) ITEMS[relatedId].name = patch.name;
      if (typeof patch.price === 'number') ITEMS[relatedId].price = patch.price;
    }
  });

  // Update image in card if provided
  if (patch.imageUrl !== undefined) {
    related.forEach((relatedId) => {
      const ctrl2 = document.getElementById('ctrl-' + relatedId);
      const card2 = ctrl2 ? ctrl2.closest('.card') : null;
      if (!card2) return;
      // Rebuild image area
      const oldImg = card2.querySelector('.card-img-photo');
      const oldFallback = card2.querySelector('.card-img-fallback');
      const oldDefault  = card2.querySelector('.card-img:not(.card-img-fallback)');
      if (oldImg) oldImg.remove();
      if (oldFallback) oldFallback.remove();
      if (oldDefault) oldDefault.remove();
      const firstChild = card2.querySelector('.card-body');
      if (patch.imageUrl) {
        const img = document.createElement('img');
        img.src = patch.imageUrl;
        img.alt = patch.name || '';
        img.className = 'card-img-photo';
        img.onerror = function() { this.style.display = 'none'; };
        card2.insertBefore(img, firstChild);
      } else {
        const fallback = document.createElement('div');
        fallback.className = 'card-img';
        fallback.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><circle cx="12" cy="12" r="9"/><path d="M8 12h8"/></svg>';
        card2.insertBefore(fallback, firstChild);
      }
      if (ITEMS[relatedId]) ITEMS[relatedId].imageUrl = patch.imageUrl;
    });
  }

  if (key.startsWith('custom-')) {
    customMenuState.added = customMenuState.added.map((item) => {
      if (item.id !== key) return item;
      return { ...item, section: patch.section, name: patch.name, desc: patch.desc, price: patch.price, imageUrl: patch.imageUrl };
    });
  } else {
    customMenuState.updated[key] = {
      section:  patch.section,
      name:     patch.name,
      desc:     patch.desc,
      price:    patch.price,
      imageUrl: patch.imageUrl
    };
  }

  saveCustomMenuState();
  updateCartBar();
}

function setupEditorModalInteractions() {
  const modal = document.getElementById('editor-modal');
  if (!modal) {
    return;
  }

  modal.addEventListener('click', (event) => {
    if (event.target === modal) {
      closeAddItemModal();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && modal.classList.contains('open')) {
      closeAddItemModal();
    }
  });
}

function addCustomItem(itemInput) {
  const id = `custom-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  const item = {
    id,
    section:  itemInput.section,
    name:     itemInput.name,
    price:    itemInput.price,
    desc:     itemInput.desc,
    imageUrl: itemInput.imageUrl || ''
  };

  ITEMS[id] = { name: item.name, price: item.price, imageUrl: item.imageUrl };
  addCardToSection(item);
  renderCtrl(id);

  customMenuState.removed = customMenuState.removed.filter((removedId) => removedId !== id);
  customMenuState.added.push(item);
  saveCustomMenuState();
  updatePlanStats();
  renderOwnerDashboard();
}

function removeMenuItem(id) {
  const key = canonicalItemId(id);
  const related = relatedItemIds(key);

  related.forEach((itemId) => {
    removeCardsByItemId(itemId);
    delete ITEMS[itemId];
  });

  delete cart[key];
  saveCart();
  updateCartBar();

  const wasCustom = key.startsWith('custom-');
  if (wasCustom) {
    customMenuState.added = customMenuState.added.filter((item) => item.id !== key);
  } else if (!customMenuState.removed.includes(key)) {
    customMenuState.removed.push(key);
  }

  saveCustomMenuState();
  renderOwnerDashboard();
}

function toggleRemoveMode() {
  if (!canEdit()) {
    return;
  }

  removeMode = !removeMode;
  document.body.classList.toggle('remove-mode', removeMode);
  const btn = document.getElementById('btn-remove-mode');
  if (btn) {
    btn.classList.toggle('active', removeMode);
    btn.textContent = removeMode ? 'Concluir remocao' : 'Remover itens';
  }
}

function toggleEditMode() {
  if (!canEdit()) {
    return;
  }

  editMode = !editMode;
  document.body.classList.toggle('edit-mode', editMode);

  const btn = document.getElementById('btn-edit-mode');
  if (btn) {
    btn.classList.toggle('active', editMode);
    btn.textContent = editMode ? 'Concluir edicao' : 'Editar itens';
  }
}

function addGenericItemPrompt() {
  openAddItemModal('item');
}

function addComboPrompt() {
  openAddItemModal('combo');
}

function addDrinkPrompt() {
  openAddItemModal('drink');
}

function applySavedMenuCustomizations() {
  customMenuState.removed.forEach((itemId) => {
    const related = relatedItemIds(itemId);
    related.forEach((relatedId) => {
      removeCardsByItemId(relatedId);
      delete ITEMS[relatedId];
    });
  });

  customMenuState.added.forEach((item) => {
    if (!item || !item.id || !item.section || !item.name || !item.price) {
      return;
    }

    if (ITEMS[item.id]) {
      return;
    }

    ITEMS[item.id] = { name: item.name, price: Number(item.price) };
    addCardToSection(item);
  });

  Object.entries(customMenuState.updated || {}).forEach(([itemId, patch]) => {
    if (!patch || typeof patch !== 'object') {
      return;
    }

    updateMenuItem(itemId, {
      section: normalizeSection(patch.section) || 'pratos',
      name: patch.name || ITEMS[itemId]?.name || 'Item',
      desc: patch.desc || 'Descricao do item',
      price: typeof patch.price === 'number' ? patch.price : (ITEMS[itemId]?.price || 0)
    });
  });

  updatePlanStats();
  renderOwnerDashboard();
}

function canonicalItemId(id) {
  if (ITEM_ALIAS[id]) {
    return ITEM_ALIAS[id];
  }

  return id.replace(/-2$/, '');
}

function relatedItemIds(id) {
  const key = canonicalItemId(id);
  return Object.keys(ITEMS).filter((itemId) => canonicalItemId(itemId) === key);
}

function renderCtrl(id) {
  const el = document.getElementById('ctrl-' + id);
  if (!el) return;

  const qty = cart[canonicalItemId(id)] || 0;
  if (qty === 0) {
    el.innerHTML = `<button class="btn-add" onclick="add('${id}')">+</button>`;
    return;
  }

  el.innerHTML = `
    <div class="qty-ctrl">
      <button onclick="remove('${id}')">−</button>
      <span>${qty}</span>
      <button onclick="add('${id}')">+</button>
    </div>`;
}

function add(id) {
  const key = canonicalItemId(id);
  cart[key] = (cart[key] || 0) + 1;

  // Rastreamento: Adicionar ao Carrinho
  const item = ITEMS[key];
  if (item) {
    fbTrack('AddToCart', {
      content_name: item.name,
      content_ids: [key],
      content_type: 'product',
      value: item.price,
      currency: 'BRL'
    });
  }

  relatedItemIds(id).forEach((itemId) => renderCtrl(itemId));
  saveCart();
  updateCartBar();
}

function remove(id) {
  const key = canonicalItemId(id);
  if (cart[key] > 0) {
    cart[key]--;
  }

  if (cart[key] <= 0) {
    delete cart[key];
  }

  relatedItemIds(id).forEach((itemId) => renderCtrl(itemId));
  saveCart();
  updateCartBar();
}

function clearCart() {
  Object.keys(cart).forEach((id) => delete cart[id]);
  Object.keys(ITEMS).forEach((id) => renderCtrl(id));
  saveCart();
  updateCartBar();
}

function updateCartBar() {
  let count = 0;
  let total = 0;

  for (const [id, qty] of Object.entries(cart)) {
    if (qty > 0 && ITEMS[id]) {
      count += qty;
      total += qty * ITEMS[id].price;
    }
  }

  const bar = document.getElementById('cart-bar');
  if (count > 0) {
    bar.classList.add('visible');
    document.getElementById('cart-count').textContent = count + (count === 1 ? ' item selecionado' : ' itens selecionados');
    document.getElementById('cart-total').textContent = 'R$ ' + total.toFixed(2).replace('.', ',');
  } else {
    bar.classList.remove('visible');
  }

  updatePlanStats();
}

function saveCart() {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
}

function loadCart() {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return;

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return;

    Object.entries(parsed).forEach(([id, qty]) => {
      if (ITEMS[id] && Number.isInteger(qty) && qty > 0) {
        cart[id] = qty;
      }
    });
  } catch {
    localStorage.removeItem(CART_STORAGE_KEY);
  }
}

function sendToWhatsApp() {
  const entries = Object.entries(cart).filter(([id, qty]) => qty > 0 && ITEMS[id]);

  if (entries.length === 0) {
    // No items — just open WhatsApp with generic message
    const msg = 'Olá! Quero ver o cardápio completo e fazer um pedido.';
    fbTrack('Contact', { method: 'WhatsApp', content_name: getConfiguredStoreName() });
    window.open('https://wa.me/' + configuredWaNumber + '?text=' + encodeURIComponent(msg), '_blank');
    return;
  }

  // Show address modal before sending
  showAddressModal(entries);
}

function showAddressModal(entries) {
  // Remove existing modal if any
  const existing = document.getElementById('address-modal');
  if (existing) existing.remove();

  // Calculate total
  let total = 0;
  entries.forEach(([id, qty]) => {
    total += (ITEMS[id].price || 0) * qty;
  });

  const modal = document.createElement('div');
  modal.id = 'address-modal';
  modal.className = 'address-modal open';
  modal.innerHTML = `
    <div class="address-card">
      <div class="address-header">
        <h3>Finalizar pedido</h3>
        <button class="address-close" id="address-close-btn">&times;</button>
      </div>

      <div class="address-summary">
        <p>${entries.length} ${entries.length === 1 ? 'item' : 'itens'} · <strong>${formatBRL(total)}</strong></p>
      </div>

      <div class="address-toggle-wrap">
        <button class="address-toggle active" data-mode="entrega" id="toggle-entrega">🛵 Entrega</button>
        <button class="address-toggle" data-mode="retirada" id="toggle-retirada">🏪 Retirada</button>
      </div>

      <div class="address-form" id="address-form-fields">
        <div class="address-row">
          <label>Seu nome *</label>
          <input type="text" id="addr-nome" placeholder="Ex: João Silva" autocomplete="name">
        </div>

        <div id="addr-delivery-fields">
          <div class="address-row">
            <label>Rua / Avenida *</label>
            <input type="text" id="addr-rua" placeholder="Ex: Rua das Flores" autocomplete="street-address">
          </div>
          <div class="address-row-double">
            <div class="address-row">
              <label>Número *</label>
              <input type="text" id="addr-numero" placeholder="123" autocomplete="address-line2">
            </div>
            <div class="address-row">
              <label>Bairro *</label>
              <input type="text" id="addr-bairro" placeholder="Centro" autocomplete="address-level3">
            </div>
          </div>
          <div class="address-row">
            <label>Complemento</label>
            <input type="text" id="addr-complemento" placeholder="Apto, bloco, referência..." autocomplete="address-line3">
          </div>
          <div class="address-row">
            <label>Ponto de referência</label>
            <input type="text" id="addr-referencia" placeholder="Próximo ao mercado...">
          </div>
        </div>

        <div class="address-row">
          <label>Forma de pagamento *</label>
          <select id="addr-pagamento">
            <option value="">Selecione...</option>
            <option value="Pagamento Online">Pagamento Online (Cartão/Pix)</option>
            <option value="Pix">Pix (na entrega)</option>
            <option value="Dinheiro">Dinheiro</option>
            <option value="Cartão de crédito">Cartão (na entrega)</option>
            <option value="Cartão de débito">Débito (na entrega)</option>
          </select>
          <small id="payment-hint" style="font-size: 11px; color: var(--text-hint); margin-top: 4px; display: block;"></small>
        </div>

        <div class="address-row">
          <label>Observação do pedido</label>
          <input type="text" id="addr-obs" placeholder="Sem cebola, sem gelo, etc...">
        </div>
      </div>

      <button class="address-submit" id="address-submit-btn">
        <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
          <path d="M12 0C5.373 0 0 5.373 0 12c0 2.122.551 4.116 1.515 5.847L.057 23.547a.5.5 0 0 0 .604.635l5.882-1.542A11.944 11.944 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.885 0-3.656-.493-5.193-1.359l-.37-.217-3.84 1.007 1.026-3.748-.237-.386A9.951 9.951 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
        </svg>
        Enviar pedido pelo WhatsApp
      </button>
    </div>
  `;

  document.body.appendChild(modal);

  // Toggle entrega / retirada
  let deliveryMode = 'entrega';
  const toggleEntrega = document.getElementById('toggle-entrega');
  const toggleRetirada = document.getElementById('toggle-retirada');
  const deliveryFields = document.getElementById('addr-delivery-fields');

  toggleEntrega.addEventListener('click', () => {
    deliveryMode = 'entrega';
    toggleEntrega.classList.add('active');
    toggleRetirada.classList.remove('active');
    deliveryFields.style.display = 'block';
  });

  toggleRetirada.addEventListener('click', () => {
    deliveryMode = 'retirada';
    toggleRetirada.classList.add('active');
    toggleEntrega.classList.remove('active');
    deliveryFields.style.display = 'none';
  });

  // Close modal
  document.getElementById('address-close-btn').addEventListener('click', () => modal.remove());
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

  // Submit
  document.getElementById('address-submit-btn').addEventListener('click', async () => {
    const nome = (document.getElementById('addr-nome').value || '').trim();
    if (!nome) {
      alert('Informe seu nome para continuar.');
      document.getElementById('addr-nome').focus();
      return;
    }

    const pagamento = (document.getElementById('addr-pagamento').value || '').trim();
    if (!pagamento) {
      alert('Selecione uma forma de pagamento.');
      document.getElementById('addr-pagamento').focus();
      return;
    }

    if (deliveryMode === 'entrega') {
      const rua = (document.getElementById('addr-rua').value || '').trim();
      const numero = (document.getElementById('addr-numero').value || '').trim();
      const bairro = (document.getElementById('addr-bairro').value || '').trim();

      if (!rua || !numero || !bairro) {
        alert('Preencha rua, número e bairro para entrega.');
        return;
      }
    }

    const btn = document.getElementById('address-submit-btn');
    const originalText = btn.innerHTML;

    // SE FOR PAGAMENTO ONLINE
    if (pagamento === 'Pagamento Online') {
      btn.disabled = true;
      btn.innerHTML = 'Processando pagamento...';

      try {
        const apiBase = getApiBaseUrl();
        const orderItems = entries.map(([id, qty]) => ({
          id,
          qty,
          name: ITEMS[id].name,
          price: ITEMS[id].price
        }));

        const res = await fetch(`${apiBase}/api/payments/create-preference`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: orderItems })
        });

        const data = await res.json();
        if (data.init_point) {
          // Salva os dados do pedido no localStorage para recuperar depois do pagamento se necessário
          localStorage.setItem('pending_order_info', JSON.stringify({
            nome, deliveryMode, pagamento, items: orderItems
          }));
          
          window.location.href = data.init_point;
          return;
        } else {
          throw new Error('Falha ao gerar link');
        }
      } catch (e) {
        alert('Erro ao processar pagamento online. Tente outra forma ou fale conosco.');
        btn.disabled = false;
        btn.innerHTML = originalText;
        return;
      }
    }

    // Build WhatsApp message
    let msg = `Olá! Gostaria de fazer um pedido:\n\n`;
    msg += `*Nome:* ${nome}\n`;
    msg += `*Tipo:* ${deliveryMode === 'entrega' ? 'Entrega' : 'Retirada no local'}\n`;

    if (deliveryMode === 'entrega') {
      const rua = document.getElementById('addr-rua').value.trim();
      const numero = document.getElementById('addr-numero').value.trim();
      const bairro = document.getElementById('addr-bairro').value.trim();
      const complemento = (document.getElementById('addr-complemento').value || '').trim();
      const referencia = (document.getElementById('addr-referencia').value || '').trim();

      msg += `*Endereço:* ${rua}, ${numero}`;
      if (complemento) msg += ` — ${complemento}`;
      msg += `\n*Bairro:* ${bairro}\n`;
      if (referencia) msg += `*Ref:* ${referencia}\n`;
    }

    if (pagamento) msg += `*Pagamento:* ${pagamento}\n`;

    const obs = (document.getElementById('addr-obs').value || '').trim();
    if (obs) msg += `*Obs:* ${obs}\n`;

    msg += `\n────────────────\n\n`;

    let orderTotal = 0;
    entries.forEach(([id, qty]) => {
      const item = ITEMS[id];
      const subtotal = item.price * qty;
      orderTotal += subtotal;
      msg += `• ${qty}x ${item.name} — R$ ${subtotal.toFixed(2).replace('.', ',')}\n`;
    });

    msg += `\n*Total: R$ ${orderTotal.toFixed(2).replace('.', ',')}*`;
    msg += '\n\nPode confirmar meu pedido?';

    // Tracking
    fbTrack('InitiateCheckout', {
      content_ids: entries.map(e => e[0]),
      content_type: 'product',
      value: orderTotal,
      currency: 'BRL',
      num_items: entries.reduce((acc, curr) => acc + curr[1], 0)
    });
    fbTrack('Contact', { method: 'WhatsApp', content_name: getConfiguredStoreName() });

    modal.remove();
    window.open('https://wa.me/' + configuredWaNumber + '?text=' + encodeURIComponent(msg), '_blank');
  });
}

function setupNavigation() {
  const allSections = new Set(Array.from(document.querySelectorAll('.sec')).map((sec) => sec.id.replace('sec-', '')));

  function setActiveSection(sectionId, updateHash = true) {
    if (!allSections.has(sectionId)) {
      return;
    }

    document.querySelectorAll('.nav-btn').forEach((b) => b.classList.toggle('active', b.dataset.sec === sectionId));
    document.querySelectorAll('.sec').forEach((s) => {
      s.classList.toggle('active', s.id === 'sec-' + sectionId);
    });

    const activeBtn = document.querySelector(`.nav-btn[data-sec="${sectionId}"]`);
    if (activeBtn) {
      activeBtn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }

    if (updateHash && window.location.hash !== '#' + sectionId) {
      window.history.replaceState(null, '', '#' + sectionId);
    }
  }

  function sectionFromHash() {
    const hash = window.location.hash.replace('#', '').trim();
    return allSections.has(hash) ? hash : null;
  }

  document.querySelectorAll('.nav-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      setActiveSection(btn.dataset.sec);
    });
  });

  window.addEventListener('hashchange', () => {
    const fromHash = sectionFromHash();
    if (fromHash) {
      setActiveSection(fromHash, false);
    }
  });

  const initialSection = sectionFromHash() || 'destaques';
  setActiveSection(initialSection, false);
}

async function init() {
  loadCustomMenuState();
  await fetchRemoteMenuData();

  const template = getConfiguredTemplate();
  const segment = getConfiguredSegment();
  const storeName = getConfiguredStoreName();

  applyTemplateTheme(template);
  applyBranding(storeName, segment);
  applyMediaBranding();
  applyPlanFeatures();
  applySectionLabels(segment);
  applySegmentCatalog(segment);
  applyCustomCatalogFromConfig();
  applySavedMenuCustomizations();
  
  // Track analytics (once per session)
  trackAnalytics();

  if (canEdit()) {
    document.body.classList.add('editor-enabled');

    // Owner links should open the management dashboard, while customer links stay on public menu.
    if (ownerModeEnabled()) {
      document.body.classList.add('owner-dashboard-enabled');
      renderOwnerDashboard();
    }
  }

  decorateDefaultCardsForRemove();
  setupEditorModalInteractions();

  loadCart();
  setupNavigation();
  Object.keys(ITEMS).forEach((id) => renderCtrl(id));
  updateCartBar();

  window.__MENU_APP_READY__ = true;
}

function ownerSetView(view) {
  ownerView = String(view || 'cardapio');
  renderOwnerDashboard();
}

function ownerLogout() {
  localStorage.removeItem('webcardapio:owner-token');
  const u = new URL(window.location.href);
  u.searchParams.delete('owner');
  u.searchParams.delete('ownerKey');
  window.location.replace(u.toString());
}

function ownerFilterSearch(term) {
  ownerFilter = String(term || 'todos');
  renderOwnerDashboard();
}

window.add = add;
window.remove = remove;
window.sendToWhatsApp = sendToWhatsApp;
window.clearCart = clearCart;
window.toggleRemoveMode = toggleRemoveMode;
window.toggleEditMode = toggleEditMode;
window.addGenericItemPrompt = addGenericItemPrompt;
window.addComboPrompt = addComboPrompt;
window.addDrinkPrompt = addDrinkPrompt;
window.openAddItemModal = openAddItemModal;
window.openEditItemModal = openEditItemModal;
window.closeAddItemModal = closeAddItemModal;
window.submitAddItemModal = submitAddItemModal;
window.removeMenuItem = removeMenuItem;
window.renderOwnerDashboard = renderOwnerDashboard;
window.ownerSetView = ownerSetView;
window.ownerLogout = ownerLogout;
window.ownerFilterSearch = ownerFilterSearch;
window.generateMenuQRCode = generateMenuQRCode;
window.downloadQRCode = downloadQRCode;

window.__MENU_APP_READY__ = 'booting';
init();
