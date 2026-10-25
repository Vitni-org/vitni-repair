import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Clock3, Wrench } from "lucide-react";
import type { RepairGuide } from "@/lib/content";

export function GuideCard({ guide }: { guide: RepairGuide }) {
  return (
    <article className="guide-card">
      <Link
        aria-label={`Open guide: ${guide.title}`}
        className="guide-card__media"
        data-analytics-event="guide_opened"
        href={`/guides/${guide.slug}/`}
      >
        <Image
          alt={guide.alt}
          className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          fill
          sizes="(max-width: 700px) 92vw, (max-width: 1100px) 46vw, 30vw"
          src={guide.image || guide.steps.find((step) => step.image)?.image || "/images/og/repairlens-share.png"}
          unoptimized
        />
        <span className="guide-card__category">
          {guide.area} · {guide.level}
        </span>
      </Link>
      <div className="guide-card__copy">
        <p className="guide-card__eyebrow">
          <Wrench aria-hidden="true" /> {guide.steps.length} clear steps
        </p>
        <h2>
          <Link data-analytics-event="guide_opened" href={`/guides/${guide.slug}/`}>
            {guide.title}
          </Link>
        </h2>
        <p>{guide.desc}</p>
        <div className="guide-card__meta">
          <span>
            <Clock3 aria-hidden="true" />
            {guide.time}
          </span>
          <Link aria-label={`Read ${guide.title}`} data-analytics-event="guide_opened" href={`/guides/${guide.slug}/`}>
            <ArrowUpRight aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}
