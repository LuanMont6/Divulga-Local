# WebCardapio Backend

Backend simples para autenticar usuarios e salvar cardapios por slug, sem banco de dados.
Os dados ficam em memoria enquanto o servidor estiver rodando.

## 1) Configurar

1. Copie `.env.example` para `.env`
2. Ajuste `JWT_SECRET`
3. Ajuste `CORS_ORIGIN` para a origem do seu front

## 2) Instalar e rodar

```bash
cd backend
npm install
npm run dev
```

Servidor: `http://localhost:3001`

## Observacao importante

- Sem banco: ao reiniciar o backend, usuarios e cardapios em memoria sao perdidos.
- Ideal para desenvolvimento rapido de front + back.

## Rotas

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/me/menus` (Bearer token)
- `POST /api/me/menus` (Bearer token)
- `GET /api/menu/:slug` (publico)
- `PUT /api/menu/:slug` (Bearer token, dono)
- `PUT /api/public/menu/:slug` (ownerKey no body, sem login)

## Exemplos

Registro:

```json
POST /api/auth/register
{
  "email": "dono@teste.com",
  "password": "123456"
}
```

Salvar cardapio:

```json
PUT /api/menu/burguer-do-ze
Authorization: Bearer <token>
{
  "title": "Burguer do Ze",
  "data": {
    "settings": { "template": "clean" },
    "items": [
      { "name": "X-Salada", "price": 28.9, "category": "lanches" }
    ]
  }
}
```
