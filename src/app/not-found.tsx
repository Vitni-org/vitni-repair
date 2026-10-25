import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="not-found-page" id="content">
      <p className="eyebrow">Nothing to fix here</p>
      <h1>We couldn’t find that page.</h1>
      <p>The link may have moved, or this shared guide is no longer available.</p>
      <div>
        <Link className={buttonVariants({ variant: "outline" })} href="/guides/">
          <Search aria-hidden="true" /> Browse the guide library
        </Link>
        <Link className={buttonVariants()} href="/">
          <ArrowLeft aria-hidden="true" /> Back to Vitni
        </Link>
      </div>
    </main>
  );
}
