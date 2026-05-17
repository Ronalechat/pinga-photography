# p!nga-photography

Photography portfolio website built with Next.js and Storyblok CMS.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **UI:** React 19, TypeScript
- **CMS:** Storyblok
- **Email:** Resend
- **Component explorer:** Storybook 8

## Routes

| Route      | Description                   |
| ---------- | ----------------------------- |
| `/`        | Landing page with scroll hero |
| `/gallery` | Full gallery — all categories |
| `/exhibits` | Exhibit-specific galleries |
| `/shop` | Shop products, enquiries, cart |
| `/admin/shop` | Token-gated shop admin dashboard |
| `/enquiry` | Enquiry / contact form        |

## Local Development

### 1. Install dependencies

```
npm install
```

### 2. Set environment variables

Copy `.env.example` to `.env.local` and fill in the values:

```
STORYBLOK_ACCESS_TOKEN=
STORYBLOK_PREVIEW_TOKEN=
STORYBLOK_REVALIDATE_SECRET=
NEXT_PUBLIC_STORYBLOK_ACCESS_TOKEN=
NEXT_PUBLIC_SITE_ENV=
NEXT_PUBLIC_SITE_URL=
RESEND_API_KEY=
SENDER_EMAIL=
RECIPIENT_EMAIL=
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY=
GOOGLE_SHEET_ID=
GOOGLE_SHEET_RANGE=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
SHOP_CHECKOUT_ENABLED=false
SHOP_ADMIN_USERNAMES=
SHOP_ADMIN_SESSION_SECRET=
# Numeric, entered with the admin setup number pad.
SHOP_ADMIN_SETUP_SECRET=
```

For the staging deploy, set `NEXT_PUBLIC_SITE_ENV=staging` in Netlify. The
footer also treats any `NEXT_PUBLIC_SITE_URL` containing `staging` as staging.

Shop setup notes:

- Storyblok schema: `docs/storyblok-shop-schema.md`
- Supabase schema: `docs/supabase-shop-schema.sql`
- Checkout/admin environment: `docs/shop-environment.md`
- Admin PIN auth migration: `docs/supabase-admin-auth-migration.sql`
- Checkout hardening migration: `docs/supabase-shop-hardening-migration.sql`

### 3. HTTPS certificates (optional)

The dev script runs with `--experimental-https`, which requires local certificates.
Generate them with mkcert or similar, or run the plain HTTP server:

```
npx next dev
```

### 4. Start the dev server

```
npm run dev
```

## Storybook

```
npm run storybook
```
