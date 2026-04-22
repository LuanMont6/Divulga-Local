# Guia de Deploy — Web Cardápio
## Backend no Railway + Frontend no Netlify

---

## PARTE 1 — Backend no Railway

### 1. Criar conta e repositório

1. Crie uma conta em https://railway.app (pode entrar com GitHub)
2. Crie um repositório no GitHub chamado `webcardapio-backend`
3. Suba apenas a pasta `backend/` para esse repositório:
   - backend/src/auth.js
   - backend/src/db.js
   - backend/src/server.js
   - backend/package.json
   - backend/.env.example
   - backend/.gitignore   ← garante que .env e data/ não sejam enviados

### 2. Deploy no Railway

1. No Railway, clique em "New Project" → "Deploy from GitHub repo"
2. Selecione o repositório `webcardapio-backend`
3. O Railway detecta automaticamente que é Node.js

### 3. Configurar variáveis de ambiente no Railway

No painel do seu projeto Railway, vá em "Variables" e adicione:

```
PORT          = 3001
DB_PATH       = ./data/app.db
JWT_SECRET    = cole-aqui-uma-string-longa-e-aleatoria
CORS_ORIGIN   = *
```

Para gerar um JWT_SECRET seguro, rode no seu terminal:
```
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Pegar a URL do backend

Após o deploy, o Railway gera uma URL pública parecida com:
```
https://webcardapio-backend-production.up.railway.app
```
**Anote essa URL. Você vai precisar dela no passo seguinte.**

Teste se está funcionando abrindo no navegador:
```
https://sua-url.up.railway.app/api/health
```
Deve retornar: `{"ok":true}`

---

## PARTE 2 — Frontend no Netlify

### 1. Configurar a URL da API no menu.html

Antes de subir o frontend, abra o arquivo `Menu digital/menu.html` e substitua:

```html
<script>
  window.API_BASE_URL = '';
</script>
```

Por:

```html
<script>
  window.API_BASE_URL = 'https://sua-url.up.railway.app';
</script>
```

Use a URL real que o Railway gerou para você.

### 2. Configurar a URL da API no index.html (onboarding)

No `index.html`, a função `obFinish()` já detecta automaticamente:
- Se está em localhost → usa `http://localhost:3001`
- Se está em produção → usa o mesmo domínio + porta 3001

Para garantir que aponte para o Railway em produção, substitua no `index.html`
a linha dentro de `obFinish()`:

```javascript
var apiBase = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
  ? 'http://localhost:3001'
  : location.protocol + '//' + location.hostname + ':3001';
```

Por:

```javascript
var apiBase = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
  ? 'http://localhost:3001'
  : 'https://sua-url.up.railway.app';
```

### 3. Criar conta no Netlify e fazer deploy

1. Acesse https://netlify.com e crie uma conta (pode usar GitHub)
2. Clique em "Add new site" → "Deploy manually"
3. Arraste a pasta `frontend/` inteira para a área de upload
   (ela contém: index.html, styles.css, script.js, favicon.svg e a pasta "Menu digital/")
4. O Netlify gera uma URL como: `https://webcardapio.netlify.app`

### 4. Atualizar CORS no Railway

Agora que você tem a URL do Netlify, volte ao Railway e atualize a variável:

```
CORS_ORIGIN = https://webcardapio.netlify.app
```

Isso garante que só o seu frontend pode chamar a API.

---

## PARTE 3 — Teste final

1. Acesse `https://webcardapio.netlify.app`
2. Clique em "Cardápio Digital" → "Criar meu cardápio grátis"
3. Preencha o onboarding completo e crie uma conta
4. Abra o link gerado e clique no ícone de usuário (FAB) para entrar no painel do dono
5. Faça login com o e-mail e senha criados
6. Confirme que o painel carrega corretamente com o plano certo

---

## Dúvidas frequentes

**O Railway vai dormir meu backend de graite?**
No plano gratuito do Railway há um limite de horas por mês. Para uso inicial
com poucos clientes é suficiente. Quando crescer, o plano pago custa ~$5/mês.

**Como trocar o domínio?**
- Netlify: Settings → Domain management → Add custom domain
- Railway: Settings → Networking → Add custom domain
Ambos oferecem HTTPS gratuito via Let's Encrypt.

**O banco SQLite vai funcionar em produção?**
Sim, para começar. O Railway persiste o arquivo entre deploys se você usar
um volume. Para escalar no futuro, considere migrar para PostgreSQL
(o Railway oferece nativamente).
