import type { Metadata } from "next";
import { HomePage } from "@/components/home-page";
import { getFeaturedRepairs } from "@/lib/guide-repository";

export const metadata: Metadata = {
  title: "RepairLens — Keep good things going",
  description: "Show Vitni what changed. Get safe, illustrated repair steps for bikes, clothes, furniture, and everyday home fixes.",
  alternates: { canonical: "/" },
};

export default async function Page() {
  const featured = await getFeaturedRepairs();
  return <HomePage featured={featured.items} />;
}
