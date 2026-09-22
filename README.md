# GGB Stock Tracker

A full-stack inventory, order, and warehouse management platform built for a powersports dealer/manufacturer — covering snowmobile, side-by-side (SxS), and apparel inventory, Shopify-synced order fulfillment, role-based warehouse access, and real-time activity logging.

Built and maintained by **[The Fabcode](https://thefabcode.com)**.

---

## Overview

GGB Stock Tracker replaces manual spreadsheets with a centralized web application for tracking stock across multiple product lines, processing customer orders synced from Shopify, and giving warehouse staff and admins controlled access to the tools they need — all from a single dashboard.

**Key outcomes delivered:**
- Centralized inventory across three distinct product categories (Snow, SxS, Apparel) with category-specific workflows
- Automated Shopify order sync with fulfillment status tracking
- Role-based access control separating admin and warehouse permissions
- Full audit trail of user actions (logins, creates, updates, deletes)
- Webhook-driven integrations with sync status monitoring
- Secure authentication with session management and password recovery

---

## Features

### Inventory Management
- Dedicated views for **Snow**, **SxS (Side-by-Side)**, and **Apparel** product lines
- Production/build tracking for work-in-progress stock
- Product categorization (Trail, Mountain, Sport, Dual, and more) per line

### Order Management
- Two-way sync with **Shopify** orders, including line items, shipping details, and order tags
- Order status pipeline: Pending → Processing → Fulfilled / Cancelled
- Multi-currency support (USD / CAD)
- Sync error visibility so nothing ships out of step with Shopify

### Access Control & Security
- Role-based permissions (Admin / Warehouse)
- Secure session-based authentication with JWT
- Password reset and account recovery flow
- CSRF protection, rate limiting, and security headers on every request

### Operations & Monitoring
- Real-time activity logs for logins, logouts, and data changes
- Automated log cleanup via scheduled jobs
- Webhook management dashboard with live status tracking
- Central admin dashboard with key business metrics at a glance

---

## Tech Stack

**Frontend**
- [Next.js 16](https://nextjs.org) (App Router) + React 19 + TypeScript
- Tailwind CSS with Radix UI primitives
- Zod for schema validation, Axios for API communication

**Backend**
- Node.js + Express + TypeScript
- PostgreSQL with Prisma ORM
- JWT authentication, bcrypt password hashing
- Winston logging, Swagger/OpenAPI documentation
- Scheduled jobs via node-cron, email notifications via Nodemailer

**Architecture**
- Decoupled frontend/backend monorepo, each independently deployable
- RESTful API with layered controller → service → data structure
- Middleware-based security (CORS, Helmet, rate limiting, CSRF, RBAC)

---

## Project Structure

```
ggb/
├── frontend/      # Next.js application (dashboard, inventory, orders, auth UI)
└── backend/       # Express API (REST endpoints, Prisma schema, business logic)
```

---

## About The Fabcode

This project is a representative example of the custom web application work delivered by The Fabcode — end-to-end product builds spanning frontend, backend, database design, third-party integrations (Shopify), and production-grade security practices.

Looking for a similar build? [Get in touch](https://thefabcode.com).

---

## License

This source code is publicly available for viewing and reference purposes only. See [LICENSE](./LICENSE) for full terms. No part of this codebase may be copied, modified, or reused without prior written permission from The Fabcode.
