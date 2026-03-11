# LeadFlow CRM

Jednoduchý, free CRM systém pro správu leadů a sales pipeline.

## Features

- **Dashboard** - KPI přehled (celkový počet leadů, hodnota pipeline, konverzní poměr)
- **Lead Management** - CRUD operace, vyhledávání, filtrování podle stage
- **Pipeline (Kanban)** - Drag & drop přesouvání leadů mezi fázemi
- **Lead Detail** - Kontaktní info, detaily, tagy, poznámky
- **Activity Log** - Záznamy o hovorech, emailech, schůzkách, úkolech
- **Dark Mode** - Automatická detekce + ruční přepínání
- **Responsive** - Plně funkční na mobilu i desktopu

## Tech Stack

- **Frontend:** React + TypeScript + Tailwind CSS + shadcn/ui
- **Backend:** Express.js + Node.js
- **Routing:** Wouter (hash-based)
- **State:** TanStack Query (React Query)
- **Drag & Drop:** @hello-pangea/dnd
- **Forms:** React Hook Form + Zod validation

## Připraveno pro produkci s:

- **Supabase** - PostgreSQL databáze (free tier)
- **Vercel** - Hosting (free tier)
- **Brevo** - Email sending (volitelné)

## Spuštění lokálně

```bash
npm install
npm run dev
```

Server poběží na `http://localhost:5000`

### Demo přístup
- Username: `demo`
- Password: `demo123`

## Build pro produkci

```bash
npm run build
```

## Migrace na Supabase

1. Vytvoř projekt na [supabase.com](https://supabase.com)
2. V SQL Editoru spusť schéma z `shared/schema.ts`
3. Nastav environment proměnné:
   - `DATABASE_URL` - Supabase connection string
4. Přepni z in-memory storage na Drizzle ORM s PostgreSQL

## Deployment na Vercel

1. Push na GitHub
2. Propoj repo s Vercel
3. Nastav build command: `npm run build`
4. Nastav output directory: `dist/public`
5. Přidej environment proměnné

## Struktura projektu

```
crm-app/
├── client/             # React frontend
│   └── src/
│       ├── components/ # UI komponenty
│       ├── pages/      # Stránky (Dashboard, Leads, Pipeline)
│       ├── lib/        # Auth context, API client
│       └── hooks/      # Custom hooks
├── server/             # Express backend
│   ├── routes.ts       # API endpointy
│   └── storage.ts      # Data storage (in-memory / DB)
├── shared/             # Sdílené typy a schémata
│   └── schema.ts       # Drizzle ORM schéma
└── package.json
```

## API Endpointy

| Method | Endpoint | Popis |
|--------|----------|-------|
| POST | /api/auth/login | Přihlášení |
| POST | /api/auth/register | Registrace |
| GET | /api/leads?userId=X | Seznam leadů |
| POST | /api/leads | Vytvoření leadu |
| PATCH | /api/leads/:id | Úprava leadu |
| DELETE | /api/leads/:id | Smazání leadu |
| GET | /api/activities?leadId=X | Aktivity leadu |
| POST | /api/activities | Přidání aktivity |
| GET | /api/stats?userId=X | Dashboard statistiky |
