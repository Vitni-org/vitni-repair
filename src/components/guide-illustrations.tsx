"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { LoaderCircle, RefreshCw, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import type { GuideStep } from "@/lib/content";

export function GuideIllustrations({
  slug,
  title,
  area,
  steps,
  canGenerate,
  contentLocale = "en",
}: {
  slug: string;
  title: string;
  area: string;
  steps: GuideStep[];
  canGenerate: boolean;
  contentLocale?: string;
}) {
  const t = useTranslations("guideDetail");
  const listRef = useRef<HTMLOListElement>(null);
  const [images, setImages] = useState(() => steps.map((step) => step.image || ""));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const generate = async () => {
    if (!canGenerate || loading) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/illustrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          category: area,
          cacheKey: slug,
          steps: steps.map(({ title: stepTitle, instruction }) => ({ title: stepTitle, instruction })),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(t("guidesLoadError"));
      setImages((current) => current.map((image, index) => image || data.visuals?.[index] || ""));
    } catch (cause) {
      setError(t("guidesLoadError"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const list = listRef.current;
    if (!canGenerate || !images.some((image) => !image) || !list) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          observer.disconnect();
          void generate();
        }
      },
      { rootMargin: "180px" },
    );
    observer.observe(list);
    return () => observer.disconnect();
    // This observes each guide once; manual retries reuse the same guide data.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, canGenerate]);

  return (
    <ol className="guide-steps" ref={listRef}>
      {steps.map((step, index) => {
        const image = images[index];
        return (
          <li className="guide-step" key={`${step.ordinal}-${step.title}`}>
            <div aria-hidden="true" className="guide-step__number">
              {String(index + 1).padStart(2, "0")}
            </div>
            <div className="guide-step__content">
              <h3 lang={contentLocale}>{step.title}</h3>
              <p lang={contentLocale}>{step.instruction}</p>
              {image ? (
                <Image
                  alt={step.imageAlt || `${title}: ${step.title}`}
                  lang={contentLocale}
                  className="guide-step__image"
                  data-offline-guide-image=""
                  height={720}
                  src={image}
                  unoptimized
                  width={960}
                />
              ) : (
                <div className="guide-step__placeholder">
                  <span aria-hidden="true" className="guide-step__placeholder-number">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <Sparkles aria-hidden="true" />
                  <span>
                    <strong>{loading ? t("drawStep") : t("illustrationComing")}</strong>
                    <small>{loading ? t("writtenReady") : t("useWritten")}</small>
                  </span>
                </div>
              )}
              {step.illustrationStatus === "failed" && !image && (
                <span className="guide-step__hint">{t("instructionAvailable")}</span>
              )}
            </div>
          </li>
        );
      })}
      {error && (
        <li className="guide-illustration-error">
          <p>{error}</p>
          <Button onClick={() => void generate()} size="sm" type="button" variant="outline">
            <RefreshCw aria-hidden="true" />
            {t("retryIllustrations")}
          </Button>
        </li>
      )}
      {canGenerate && !loading && images.some((image) => !image) && !error && (
        <li className="guide-illustration-retry">
          <Button onClick={() => void generate()} size="sm" type="button" variant="outline">
            <RefreshCw aria-hidden="true" />
            {t("drawMissing")}
          </Button>
        </li>
      )}
      {loading && (
        <li className="guide-illustration-status" aria-live="polite">
          <LoaderCircle aria-hidden="true" className="animate-spin" /> {t("drawingMissing")}
        </li>
      )}
    </ol>
  );
}
