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
RESEND_API_KEY=
SENDER_EMAIL=
RECIPIENT_EMAIL=
```

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
