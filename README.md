# RepairLens

RepairLens is a responsive, installable web prototype that gives people a safe, practical repair path for everyday bikes, clothes, and household goods.

## Build and run

```bash
npm run build
npm start
```

Open [http://localhost:4174](http://localhost:4174).

`npm run build` writes the deployable static site to `dist/`; deploy that directory after every build. `npm start` runs the build automatically before starting the local server.

## Public URL

The build uses `https://vitni.cc` as the production URL for canonical links, social cards, and discovery files. To use a different public origin for a preview deployment, set only `PUBLIC_SITE_URL` in `.env` (or your deployment environment):

```bash
PUBLIC_SITE_URL=https://preview.example.com
```

Configure `https://vitni.cc` at the production host before deploying the default build so those absolute URLs resolve correctly.

## Demo flow

1. Choose Bike, Clothes, or Home.
2. Select a supported repair scenario.
3. Review the safety check, time/cost estimate, tool list, and repair steps.
4. Choose **I need local help** to reveal the repair-café fallback.

The initial supported scenarios are deliberately constrained so the hackathon demo is clear and the safety advice is reliable.
