import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ArrowUpRight, Clock3, Wrench } from "lucide-react";
import type { RepairGuide } from "@/lib/content";
import { guideArtwork } from "@/lib/guide-artwork";
import { localizedSectorLabel } from "@/lib/catalog-localization";

export function GuideCard({ guide }: { guide: RepairGuide }) {
  const locale = useLocale();
  const t = useTranslations("guideDetail");
  const contentLocale = guide.contentLocale || locale;
  const artwork = guideArtwork(guide);
  return (
    <article className="guide-card">
      <Link
        aria-label={t("openGuide", { title: guide.title })}
        className="guide-card__media"
        data-analytics-event="guide_opened"
        href={`/guides/${guide.slug}/`}
      >
        <Image
          alt={artwork.alt}
          lang={contentLocale}
          className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          fill
          sizes="(max-width: 700px) 92vw, (max-width: 1100px) 46vw, 30vw"
          src={artwork.src}
          unoptimized
        />
        <span className="guide-card__category">
          {localizedSectorLabel(guide.sector, locale)} · {guide.level}
        </span>
        {artwork.isFallback && <span className="guide-card__artwork-label">{t("categoryArtwork")}</span>}
      </Link>
      <div className="guide-card__copy">
        <p className="guide-card__eyebrow">
          <Wrench aria-hidden="true" /> {t("stepCount", { count: guide.steps.length })}
        </p>
        <h2>
          <Link data-analytics-event="guide_opened" href={`/guides/${guide.slug}/`} lang={contentLocale}>
            {guide.title}
          </Link>
        </h2>
        <p lang={contentLocale}>{guide.desc}</p>
        <div className="guide-card__meta">
          <span>
            <Clock3 aria-hidden="true" />
            {guide.time}
          </span>
          <Link aria-label={t("readGuide", { title: guide.title })} data-analytics-event="guide_opened" href={`/guides/${guide.slug}/`}>
            <ArrowUpRight aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}
