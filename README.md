# RepairLens

RepairLens is a responsive, installable web prototype that gives people a safe, practical repair path for everyday bikes, clothes, and household goods.

## Build and run

```bash
npm run build
npm start
```

Open [http://localhost:4174](http://localhost:4174).

`npm run build` writes the static pages and assets to `dist/`. `npm start` runs the build automatically, then starts the Node server that serves those files and the guide API. Deploy that Node service for the shared Supabase library; a static-only host cannot save generated guides or serve database-backed detail pages.

## Public URL

The build uses `https://vitni.cc` as the production URL for canonical links, social cards, and discovery files. To use a different public origin for a preview deployment, set only `PUBLIC_SITE_URL` in `.env` (or your deployment environment):

```bash
PUBLIC_SITE_URL=https://preview.example.com
```

Configure `https://vitni.cc` at the production host before deploying the default build so those absolute URLs resolve correctly.

## Demo flow

1. Describe what is broken and optionally add a photo.
2. Review the safety status, repair steps, illustrations, and suggested parts.
3. Browse the shared guide library or open a saved guide link later.

## Supabase guide library

The curated guides remain available locally without Supabase. Configure the shared store on the Node server to persist generated guides and illustrations:

```bash
cp .env.example .env
# Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to .env
# Run supabase/migrations/20261024000000_create_guide_library.sql in the Supabase SQL Editor
npm run seed:guides
```

The migration creates `guides`, `guide_steps`, and `guide_parts`, enables row-level security, and creates the private `guide-illustrations` storage bucket. That bucket name is fixed in the migration. The browser never receives the service-role key. Keep it in the server environment on vitni.cc. Generated source photos and raw descriptions are not stored. Public guides are generalized and searchable; photo-specific and do-not-attempt results use unlisted links.

Without Supabase credentials, curated pages continue to work and generated plans are shown as one-time results with a clear “not saved” status.
