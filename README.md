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
| `/shop` | Shirt enquiry / demand collection |
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
```

For the staging deploy, set `NEXT_PUBLIC_SITE_ENV=staging` in Netlify. The
footer also treats any `NEXT_PUBLIC_SITE_URL` containing `staging` as staging.

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
