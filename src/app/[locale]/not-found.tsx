import { useTranslations } from "next-intl";
import { ArrowLeft, Search } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export default function NotFound() {
  const t = useTranslations("common");
  return (
    <main className="not-found-page" id="content">
      <p className="eyebrow">{t("notFoundEyebrow")}</p>
      <h1>{t("notFoundTitle")}</h1>
      <p>{t("notFoundDescription")}</p>
      <div>
        <Link className={buttonVariants({ variant: "outline" })} href="/guides/">
          <Search aria-hidden="true" /> {t("browseGuides")}
        </Link>
        <Link className={buttonVariants()} href="/">
          <ArrowLeft aria-hidden="true" /> {t("backHome")}
        </Link>
      </div>
    </main>
  );
}
