# Cafe Sonder

> A thoughtful digital cafe menu and lightweight operations dashboard for browsing, ordering, and running the counter.

Cafe Sonder is a mobile-friendly cafe ordering experience built with Next.js. Guests can browse a categorized menu, customize eligible items, review their order, and place it. Cafe staff can sign in to a protected admin workspace to manage the menu, track orders, generate a QR code, and review recent performance.

## Product Surface

### Guest experience

- Cafe header with responsive imagery and menu browsing
- Expandable menu categories
- Vegetarian and non-vegetarian indicators
- Bestseller labels and bestseller filtering
- Veg mode filter
- Item imagery sourced from Unsplash-compatible URLs
- Per-item quantities, prices, and running cart total
- Persistent checkout tab while the cart has items
- Pizza-style customization options with repeat-customization flow
- Checkout summary with item-level customizations and totals
- Animated order confirmation state

### Admin workspace

The `/admin` area is protected by a server-validated HTTP-only cookie session.

- **Menu customization**: add, edit, and delete menu items and categories
- **Orders**: view live and past orders, inspect customizations, and update statuses
- **QR code**: edit a public link, generate a QR code, and download it as a PNG
- **Analytics**: review seven-day revenue, order volume, item performance, category revenue, and status distribution

## Route Map

```text
/
└── redirects to /menu

/menu
└── Public cafe menu

/checkout
└── Cart review and order placement

/admin/login
└── Admin sign-in

/admin
└── Menu customization dashboard

/admin/orders
└── Live and past order operations

/admin/qr
└── Editable link and downloadable QR code

/admin/analytics
└── Recent performance dashboard
```

## Architecture

```text
app/
├── page.tsx                         Root redirect to /menu
├── menu/page.tsx                    Public menu route
├── checkout/page.tsx                Checkout and order placement
├── providers.tsx                    Shared client provider tree
│
├── components/
│   ├── sample-menu.tsx              Menu page composition
│   └── menu-components/
│       └── single-menu-item.tsx     Item display and cart actions
│
├── data.ts                          Static fallback menu data and types
├── menu-context/
│   └── menu-context.tsx             Editable menu and category state
├── order-context/
│   └── order-context.tsx            Current guest cart state
├── orders-context/
│   └── orders-context.tsx           Persisted submitted order state
│
├── admin/
│   ├── actions.ts                   Login/logout server actions
│   ├── admin-sidebar.tsx            Shared dashboard navigation
│   ├── admin-dashboard.tsx          Menu customization workspace
│   ├── page.tsx                     Protected /admin entry point
│   ├── login/                       Authentication UI
│   ├── orders/                      Order operations dashboard
│   ├── qr/                          QR generation dashboard
│   └── analytics/                   Recharts analytics dashboard
│
└── lib/
    ├── admin-auth.ts                Server-only cookie authentication
    └── image-url.ts                 Image URL normalization
```

### Provider flow

```text
Providers
├── MenuProvider
│   └── OrderProvider
│       └── OrdersProvider
│           ├── Public menu
│           ├── Checkout
│           └── Admin dashboards
```

The public menu and admin menu editor share the same `MenuProvider`. Checkout creates an immutable order snapshot through `OrdersProvider` before clearing the guest cart. The orders provider listens for browser `storage` events, so an already-open admin tab can receive orders placed in another tab.

## Tech Stack

- [Next.js](https://nextjs.org/) 16 with the App Router
- [React](https://react.dev/) 19
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Recharts](https://recharts.org/) for analytics visualizations
- [qrcode](https://github.com/soldair/node-qrcode) for client-side QR generation
- [Sonner](https://sonner.emilkowal.ski/) for toast feedback
- Next Image and `next/font` for optimized media and typography

## Getting Started

### Requirements

- Node.js 20 or newer
- npm

### Install

```bash
npm install
```

### Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The root URL redirects to `/menu`.

### Quality checks

```bash
npm run lint
npm run build
```

### Production server

```bash
npm run build
npm run start
```

## Admin Access

The temporary development credentials are:

```text
Username: admin
Password: password123
```

Authentication is isolated in `app/lib/admin-auth.ts` and uses an HTTP-only, same-site cookie. These credentials are intentionally temporary and must be replaced before production use with environment-backed or database-backed authentication.

## Browser Persistence

This prototype uses browser `localStorage`, so data is local to the current browser and origin.

| Key | Purpose |
| --- | --- |
| `airmenus_menu_v1` | Menu item data and edits |
| `airmenus_categories_v1` | Menu category list |
| `airmenus_orders_v1` | Submitted order snapshots and statuses |
| `airmenus_qr_link_v1` | Admin QR link preference |

Order snapshots retain item names, quantities, base prices, customization selections, customization prices, totals, timestamps, and statuses. Analytics are derived from these snapshots rather than stored separately.

## Order Lifecycle

```text
New
  -> Preparing
  -> Ready
  -> Out for delivery
  -> Delivered

Any live status
  -> Cancelled
```

Live orders are shown separately from past orders. Delivered and cancelled orders move into the past section. Cancelled orders remain visible in status analytics but are excluded from revenue and sales-performance metrics.

## Analytics

The analytics dashboard uses the last seven days of orders and provides:

- Net revenue from non-cancelled orders
- Non-cancelled order count
- Average order value
- Items sold
- Best-performing item by units sold
- Top-selling item ranking
- Revenue by category
- Daily revenue and order trends
- Order status distribution

Deleted menu items are grouped under `Other` when their historical order snapshots no longer resolve to a current menu item.

## Deployment

This repository is the deployable project root. In Vercel:

```text
Framework preset: Next.js
Root directory: .
Build command: npm run build
Output directory: leave blank
```

Do not configure a machine-specific path such as `/home/.../frontend`. The Turbopack root is derived from `process.cwd()` in `next.config.ts`, making it portable across local development and Vercel.

## Project Principles

- Keep the guest ordering flow fast and readable on small screens.
- Keep admin operations dense, calm, and easy to scan.
- Prefer shared context state over duplicated menu or order logic.
- Preserve customizations through cart, checkout, order history, and analytics.
- Treat browser persistence as prototype infrastructure, not production storage.
- Keep authentication server-validated and isolated from client JavaScript.

## License

This project is currently an internal prototype for Cafe Sonder.
