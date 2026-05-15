# Dashboard Gex

Dashboard operacional do cliente Gex. Lê dados ao vivo de uma Google Sheet.

## Stack

- Next.js 16 (App Router, TypeScript)
- Tailwind CSS v4
- Recharts (gráficos)
- Google Sheets API (Service Account)

## Rodar localmente

```bash
npm install
cp .env.example .env.local
# preencher as 3 variáveis no .env.local
npm run dev
```

Abrir http://localhost:3000

## Variáveis de ambiente

| Variável | Descrição |
|---|---|
| `GEX_SPREADSHEET_ID` | ID da planilha do Gex (da URL: `/spreadsheets/d/<ID>/edit`) |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Email do Service Account criado no Google Cloud |
| `GOOGLE_SERVICE_ACCOUNT_KEY` | Chave privada do Service Account (com `\n` literais) |

Ver `.env.example`.

## Páginas

- `/` — Visão Geral (status da conexão com a Sheet)
- `/sheet` — Lista as abas detectadas na Sheet
- `/leads` — Placeholder (aguardando definição de KPIs)
- `/vendas` — Placeholder (aguardando definição de KPIs)

## Deploy

Push para `main` → Vercel faz deploy automático. Configurar as 3 variáveis de ambiente em Vercel → Settings → Environment Variables.
