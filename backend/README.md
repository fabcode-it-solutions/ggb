# GGB Stock Tracker — Backend

The API service powering **GGB Stock Tracker**, a powersports inventory and order management platform. Built with Express, TypeScript, and Prisma, it handles authentication, inventory, Shopify-synced orders, role-based access, and system logging for the [frontend application](../frontend/README.md).

Part of the [GGB Stock Tracker](../README.md) project by **[The Fabcode](https://thefabcode.com)**.

---

## What It Does

- **Authentication** — JWT-based sessions, login/logout, password reset flows
- **Role-Based Access Control** — Admin and Warehouse roles with route-level permission checks
- **Products & Inventory** — CRUD and category logic for Snow, SxS, and Apparel product lines
- **Orders** — Shopify order sync, line items, shipping details, multi-currency (USD/CAD), fulfillment status pipeline
- **Webhooks** — inbound integration handling with sync status tracking
- **Logging** — structured activity logs (login, create, update, delete, error) with scheduled cleanup
- **Dashboard** — aggregated metrics endpoints for the admin dashboard
- **API Docs** — self-documenting via Swagger/OpenAPI

## Tech Stack

- Node.js + [Express](https://expressjs.com) + TypeScript
- PostgreSQL with [Prisma ORM](https://www.prisma.io)
- JWT authentication, bcrypt password hashing
- Helmet, CORS, CSRF protection, and rate limiting on every request
- Winston for structured logging
- node-cron for scheduled jobs (e.g. log cleanup)
- Nodemailer for transactional email

## Project Structure

```
backend/
├── prisma/          # Database schema, migrations, and seed data
└── src/
    ├── controllers/  # Request handlers
    ├── services/     # Business logic
    ├── routes/       # API route definitions
    ├── middlewares/  # Auth, RBAC, CSRF, rate limiting, error handling
    ├── validators/    # Request validation schemas (Zod)
    ├── cron/          # Scheduled jobs
    ├── utils/         # Shared helpers (JWT, email, logging, responses)
    └── config/        # Environment, database, and Swagger config
```

## Getting Started

```bash
npm install
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

The API server starts on the port defined in your environment configuration. API documentation is available via the Swagger UI route once the server is running.

---

## License

Proprietary — see the [root LICENSE](../LICENSE) for full terms.
