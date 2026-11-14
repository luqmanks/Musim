This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Field weather & crop alerts (NASA POWER)

Tap a spot on the map (or pick a demo farm under "Field heat") and the right-hand panel
(below the map on phones) loads the last 90 days from the NASA POWER **daily single-point API**:

```
GET https://power.larc.nasa.gov/api/temporal/daily/point
    ?parameters=T2M,T2M_MAX,T2M_MIN,PRECTOTCORR,RH2M,WS2M,ALLSKY_SFC_SW_DWN,GWETROOT,GWETTOP
    &community=AG&longitude=<lng>&latitude=<lat>&start=YYYYMMDD&end=YYYYMMDD&format=JSON
```

- The browser calls it directly (CORS is open, no API key). Code: `app/lib/power.ts`.
- `-999` is the fill value. The newest 2–4 days are usually still `-999` (solar radiation lags longest),
  so every KPI and alert shows the date its data runs to.
- The grid is about 0.5° (~50 km), so the values describe the surrounding area, not a single field.
- Crop alerts (`app/lib/cropRules.ts`) are rule-of-thumb checks for dry spells, 30-day rain, root-zone
  drought and waterlogging, heavy rain, heat, disease weather, low sunlight, wind and rubber tapping days.
  Thresholds are set per crop (oil palm, padi, durian/fruit, rubber, cocoa, banana, leafy vegetables,
  generic). They look back at past weather. POWER has no forecast, and the alerts are not agronomic advice.

### AI field advisor (Gemini on Vertex AI)

The "Analyse this field" button calls `POST /api/advisor` (`app/api/advisor/route.ts`). The server
re-fetches the NASA POWER data, re-runs the crop rules, and streams a Gemini analysis through the
Vercel AI SDK (`ai` + `@ai-sdk/google-vertex`, express mode with an API key). The browser only sends
`{ lat, lng, cropId, question? }`, so the key and the prompt (`app/lib/advisor.ts`) stay on the server.

`.env` (git-ignored):

```
GEMINI_API_KEY=<Vertex AI express-mode API key>
# optional, default gemini-3.8-flash
GEMINI_MODEL=gemini-3.8-flash
```

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
