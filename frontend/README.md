# GGB Stock Tracker — Frontend

The client application for **GGB Stock Tracker**, a powersports inventory and order management platform. Built with Next.js and TypeScript, it gives admins and warehouse staff a fast, role-aware interface for managing stock, orders, and users.

Part of the [GGB Stock Tracker](../README.md) project by **[The Fabcode](https://thefabcode.com)**.

---

## What's Here

- **Dashboard** — at-a-glance view of key inventory and order metrics
- **Inventory** — dedicated pages for Snow, SxS, Apparel, and Production stock
- **Orders** — Shopify-synced order list with status and fulfillment tracking
- **Roles & Users** — admin controls for managing warehouse staff access
- **Webhooks** — integration status and sync monitoring
- **Logs** — searchable activity/audit trail
- **Auth** — login, forgot/reset password, and profile management

## Tech Stack

- [Next.js 16](https://nextjs.org) (App Router) + React 19 + TypeScript
- Tailwind CSS + [Radix UI](https://www.radix-ui.com) primitives
- Zod for form/schema validation
- Axios for API communication with the backend service

## Project Structure

```
frontend/
├── app/          # Routes (dashboard, inventory, orders, auth, roles-users, webhooks, logs)
├── components/    # Reusable UI components
├── hooks/         # Shared React hooks
├── services/      # API client layer
├── lib/           # Utilities and shared logic
└── types/         # Shared TypeScript types
```

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app. The frontend expects the [backend API](../backend/README.md) to be running and reachable.

---

## License

Proprietary — see the [root LICENSE](../LICENSE) for full terms.
