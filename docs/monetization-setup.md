# Vitni monetization setup

Vitni has two early revenue paths: optional repair-part referrals and one-time AI repair-guide credit packs. The public repair library stays free. The app does not require an account for checkout; paid credits are tied to a browser wallet cookie, so clearing site data or switching devices can make a remaining balance inaccessible.

## 1. Set up consumer checkout with Paddle

Paddle is wired as a one-time digital-product checkout. The proposed catalog prices are **€2.49 for one custom guide** and **€9.99 for five** (about 20% less per guide). Create one-time EUR prices with these amounts in Paddle; the amounts shown on the site must match the catalog. Paddle's hosted overlay displays the final tax-inclusive total for the buyer's location.

1. Create a Paddle account and a product for custom AI repair guides. Add two one-time EUR prices and copy their `pri_...` price IDs. The suggested prices are €2.49 and €9.99; checkout stays disabled until the Paddle catalog matches them.
2. Add `vitni.cc` under Paddle website approval and configure a default payment link to `https://vitni.cc/credits/`. The site includes Paddle.js on that route to open the transaction passed by Paddle.
3. Create a client-side token in Paddle. Use a sandbox token and sandbox price IDs while testing; use a live token and live price IDs together for production.
4. Create a notification destination at `https://vitni.cc/api/webhooks/paddle` for `transaction.completed`. Copy its endpoint signing secret.
5. Apply the Supabase migration `20261027000000_add_repair_credit_wallets.sql` before enabling payment. The checkout route checks the ledger table before creating a transaction.
6. Add the following secrets/settings to local `.env` and the Cloudflare Worker environment:

   ```dotenv
   PADDLE_ENVIRONMENT=sandbox
   PADDLE_API_KEY=
   PADDLE_WEBHOOK_SECRET=
   PADDLE_PRICE_REPAIR_GUIDE_SINGLE=pri_...
   PADDLE_PRICE_REPAIR_GUIDE_FIVE=pri_...
   PADDLE_CLIENT_TOKEN=
   ```

7. Restart locally and complete one sandbox checkout for each pack. Confirm the webhook adds exactly one or five credits, a failed generation returns one credit, and a successful generation consumes one. Confirm the public guide library still works without a purchase.
8. Switch to production only after account approval and sandbox verification. Use live keys and live price IDs, then deploy the matching Worker configuration.

Keep `PADDLE_API_KEY` and `PADDLE_WEBHOOK_SECRET` server-only. `PADDLE_CLIENT_TOKEN` is a public Paddle token that the server page passes to Paddle.js. The webhook verifies Paddle's signed raw body, only accepts completed transactions for the configured price IDs, and applies each transaction once.

Before live checkout, confirm seller approval, the catalog amounts, tax presentation, customer terms, and refund handling in Paddle. Keep the system in sandbox until each pack, a failed-generation refund, and a successful generation have been checked end to end.

## 2. Enable part referrals

Part cards already link to Amazon France and a Google Shopping comparison. Join and receive approval from Amazon Associates France before adding its tracking tag. Then set `NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG` in the build environment before `pnpm build:vinext`; Next.js public variables are embedded in the client build. Links stay untagged until the approved tag is present. Existing disclosure text marks Amazon links and explains the possible commission.

Local repairers, repair cafés, ateliers, and parts shops can use the existing [partner page](https://vitni.cc/partners/) to discuss referrals, listings, or pilot partnerships. A partner should confirm the parts, fit information, stock claims, and any commission agreement before Vitni labels a link as a partner recommendation.

## Deployment note

The app implementation is feature-gated. Without Paddle settings, AI guide generation keeps its current behavior. Once Paddle is configured, the ledger migration must be applied before checkout or guide generation can proceed; the app fails closed if the credit ledger is unavailable. Keep `PADDLE_API_KEY` and `PADDLE_WEBHOOK_SECRET` in Cloudflare Worker secrets and configure `PADDLE_CLIENT_TOKEN` as a Worker variable. `NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG` must be available to the build before `pnpm build:vinext`. Adding Worker settings and applying the database migration are deployment steps; they are not done by changing the local `.env` alone.
