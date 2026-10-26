import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpenCheck, ShieldCheck, ShoppingBag, Wrench } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { createBreadcrumbList, serializeJsonLd } from "@/lib/structured-data";

export const metadata: Metadata = {
  title: "Repair guide safety and standards | Vitni",
  description:
    "Learn how Vitni repair guides work, what photo-based suggestions can miss, how to check parts, and when to stop and ask a qualified repairer.",
  alternates: { canonical: "/repair-safety/" },
  openGraph: {
    type: "article",
    title: "Repair guide safety and standards | Vitni",
    description: "How Vitni’s repair guidance works, its limits, and how to choose a safer next step.",
    url: "/repair-safety/",
  },
};

export default function RepairSafetyPage() {
  const origin = (process.env.PUBLIC_SITE_URL || "https://vitni.cc").replace(/\/$/, "");
  const jsonLd = serializeJsonLd({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        name: "Repair guide safety and standards",
        description: "How Vitni repair guidance works, its limits, and how to choose a safer next step.",
        url: `${origin}/repair-safety/`,
      },
      createBreadcrumbList(origin, [
        { name: "Home", path: "/" },
        { name: "Repair guide safety", path: "/repair-safety/" },
      ]),
    ],
  });

  return (
    <main className="repair-safety-page" id="content">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <nav aria-label="Breadcrumb" className="breadcrumb">
        <Link href="/">Home</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">Repair guide safety</span>
      </nav>
      <header className="repair-safety-hero">
        <p className="eyebrow">A clear view of the limits</p>
        <h1>Repair guidance should help you choose a safe next step.</h1>
        <p>
          Vitni helps people understand everyday repair options. It is an educational starting point, not an inspection, a product manual, or a substitute for a qualified repairer.
        </p>
      </header>

      <div className="repair-safety-content">
        <section aria-labelledby="safety-how-title">
          <span aria-hidden="true"><BookOpenCheck /></span>
          <div>
            <h2 id="safety-how-title">How a guide is prepared</h2>
            <p>
              The built-in library offers general steps for common repairs. When you describe a problem or add a photo, Vitni uses that information to suggest a likely issue and a possible route. A photo can hide damage, model differences, or hazards; the suggestion may be wrong or incomplete.
            </p>
            <p>
              Treat generated steps as suggestions. Check the item’s model-specific manual and labels before acting, and stop if the instructions do not match what you see.
            </p>
          </div>
        </section>
        <section aria-labelledby="safety-stop-title">
          <span aria-hidden="true"><ShieldCheck /></span>
          <div>
            <h2 id="safety-stop-title">When to stop and get help</h2>
            <p>
              Do not continue if an item is unstable, hot, smoking, leaking, pressurized, or connected to mains power. Avoid opening electrical appliances, handling damaged batteries, or working on gas, structural, brake, steering, or other safety-critical systems unless you are qualified.
            </p>
            <p>
              Keep the item out of use when a failure could hurt someone. Contact the manufacturer or a qualified local repairer; a nearby repair café may also be able to assess the item.
            </p>
          </div>
        </section>
        <section aria-labelledby="safety-parts-title">
          <span aria-hidden="true"><ShoppingBag /></span>
          <div>
            <h2 id="safety-parts-title">Check every replacement part</h2>
            <p>
              A part name or retailer search is not a confirmed fit, stock check, endorsement, or partnership. Match the make, model, part number, measurements, material, and manufacturer guidance before ordering. Confirm return terms with the seller.
            </p>
          </div>
        </section>
        <section aria-labelledby="safety-community-title">
          <span aria-hidden="true"><Wrench /></span>
          <div>
            <h2 id="safety-community-title">Use local expertise when it matters</h2>
            <p>
              Some repairs need specialist tools, model-specific knowledge, or an in-person safety check. Browse the guide library for a starting point, then find community help or contact a repair professional if the job is outside your comfort level.
            </p>
            <div className="repair-safety-actions">
              <Link className={buttonVariants({ variant: "outline" })} href="/guides/">Browse repair guides <ArrowRight aria-hidden="true" /></Link>
              <Link className={buttonVariants()} href="/#help">Find community help <ArrowRight aria-hidden="true" /></Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
