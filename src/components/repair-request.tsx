"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ArrowRight, Check, LoaderCircle, MapPin, ShieldAlert, Sparkles, Upload, Wrench } from "lucide-react";
import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { trackAnalyticsEvent } from "@/lib/analytics";
import type { RepairAssessment, RepairGuide } from "@/lib/content";
import { RepairOutcomeFeedback } from "@/components/repair-outcome-feedback";
import { PartSourcingLinks, PartSourcingNote } from "@/components/part-sourcing-links";
import { localizedSectorLabel } from "@/lib/catalog-localization";

type GuideResponse = {
  assessment: RepairAssessment;
  guide?: RepairGuide;
  visuals?: (string | null)[];
  href?: string;
  saved: boolean;
  reused?: boolean;
  sharedPublicly?: boolean;
  message?: string;
  persistence?: string;
};

export function RepairRequest() {
  const t = useTranslations("repair");
  const locale = useLocale();
  const fileInput = useRef<HTMLInputElement>(null);
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [imageName, setImageName] = useState("");
  const [sharePublicly, setSharePublicly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [needsCredits, setNeedsCredits] = useState(false);
  const [result, setResult] = useState<GuideResponse | null>(null);
  const [resultVersion, setResultVersion] = useState(0);

  const chooseImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setError("");
    if (!/^image\/(png|jpeg|webp)$/.test(file.type)) {
      setError(t("errorFileType"));
      event.target.value = "";
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError(t("errorFileSize"));
      event.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setImage(typeof reader.result === "string" ? reader.result : "");
      setImageName(file.name);
    };
    reader.onerror = () => setError(t("errorReadPhoto"));
    reader.readAsDataURL(file);
  };

  const useSamplePhoto = async () => {
    try {
      const response = await fetch("/images/test/chain-off-test.jpg");
      const blob = await response.blob();
      const reader = new FileReader();
      reader.onload = () => {
        setImage(typeof reader.result === "string" ? reader.result : "");
        setImageName(t("samplePhotoFileName"));
        setDescription(t("sampleDescription"));
      };
      reader.readAsDataURL(blob);
    } catch {
      setError(t("errorSamplePhoto"));
    }
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (description.trim().length < 4) {
      setError(t("errorDescription"));
      return;
    }
    setError("");
    setNeedsCredits(false);
    setResult(null);
    setLoading(true);
    trackAnalyticsEvent("repair_request_started", { has_photo: Boolean(image) });
    try {
      const response = await fetch("/api/repair-guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: description.trim(), locale, sharePublicly, ...(image ? { image } : {}) }),
      });
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 402) setNeedsCredits(true);
        const errorKey = response.status === 400 ? "errorDescribe" : response.status === 402 ? "creditsRequired" : response.status === 413 ? "errorFileSize" : response.status === 429 ? "errorRateLimit" : "errorRequest";
        throw new Error(t(errorKey));
      }
      const guideResult = data as GuideResponse;
      if (["safe_diy", "get_help", "do_not_attempt"].includes(guideResult.assessment.safety)) {
        trackAnalyticsEvent("repair_guide_completed", {
          safety: guideResult.assessment.safety,
          saved: Boolean(guideResult.saved),
          reused: Boolean(guideResult.reused),
          has_photo: Boolean(image),
          shared_publicly: Boolean(guideResult.sharedPublicly),
        });
      }
      setResult(guideResult);
      setResultVersion((version) => version + 1);
    } catch (issue) {
      trackAnalyticsEvent("repair_guide_failed", { stage: "request" });
      const message = issue instanceof Error ? issue.message : "";
      const knownErrors = ["errorDescribe", "creditsRequired", "errorFileSize", "errorRateLimit", "errorRequest"].map((key) => t(key));
      setError(knownErrors.includes(message) ? message : t("errorRequest"));
    } finally {
      setLoading(false);
    }
  };

  const clearPhoto = () => {
    setImage("");
    setImageName("");
    if (fileInput.current) fileInput.current.value = "";
  };

  const guide = result?.guide;
  const confidenceLabel = result
    ? result.assessment.confidence >= 80
      ? t("confidenceStrong")
      : result.assessment.confidence >= 55
        ? t("confidenceLikely")
        : t("confidencePossible")
    : "";
  const steps =
    guide?.steps ||
    result?.assessment.steps.map((step, index) => ({
      ...step,
      ordinal: index + 1,
      image: result.visuals?.[index] || "",
      imageAlt: t("stepIllustrationAlt", { title: result.assessment.likely_issue, ordinal: index + 1 }),
    })) ||
    [];

  return (
    <div className="repair-tool-wrap">
      <form className="repair-tool" onSubmit={submit}>
        <div className="repair-tool__heading">
          <div className="repair-tool__bot">
            <Image alt="" aria-hidden="true" width={112} height={126} src="/images/vitni.svg" />
          </div>
          <div>
            <p className="eyebrow">{t("meet")}</p>
            <h2 className="section-title">{t("title")}</h2>
            <p className="repair-tool__lede">{t("intro")}</p>
          </div>
        </div>

        <div className="repair-tool__fields">
          <div className="repair-tool__description">
            <label className="field-label" htmlFor="repair-description">
              {t("describeLabel")} <span aria-hidden="true">*</span>
            </label>
            <Textarea
              autoComplete="off"
              id="repair-description"
              maxLength={1000}
              name="description"
              onChange={(event) => setDescription(event.target.value)}
              placeholder={t("descriptionPlaceholder")}
              required
              rows={7}
              value={description}
            />
            <div className="field-footnote">
              <span>{t("descriptionHint")}</span>
              <span>{description.length}/1000</span>
            </div>
          </div>

          <div className="photo-box">
            <div>
              <p className="eyebrow">{t("photoEyebrow")}</p>
              <h3>{t("photoTitle")}</h3>
              <p className="text-muted-foreground">{t("photoDescription")}</p>
              <p className="repair-data-note">
                {t("photoPrivacy")}
              </p>
            </div>
            <input
              accept="image/png,image/jpeg,image/webp"
              aria-label={t("photoLabel")}
              capture="environment"
              className="sr-only"
              id="repair-photo"
              onChange={chooseImage}
              ref={fileInput}
              type="file"
            />
            {!image ? (
              <div className="photo-actions">
                <Button className="photo-choose" onClick={() => fileInput.current?.click()} type="button" variant="outline">
                  <Upload aria-hidden="true" data-icon="inline-start" />
                  {t("takePhoto")}
                </Button>
                <span className="photo-or">{t("photoTypes")}</span>
                <button className="text-link" onClick={useSamplePhoto} type="button">
                  {t("samplePhoto")}
                </button>
              </div>
            ) : (
              <div className="photo-preview">
                <Image alt={t("photoPreview")} fill sizes="(max-width: 700px) 80vw, 360px" src={image} unoptimized />
                <div className="photo-preview__meta">
                  <span>{imageName}</span>
                  <button onClick={clearPhoto} type="button">
                    {t("removePhoto")}
                  </button>
                </div>
              </div>
            )}
            <div className="photo-tip">
              <strong>{t("photoTipTitle")}</strong>
              <span>{t("photoTip")}</span>
            </div>
          </div>
        </div>

        <label className="repair-share-choice">
          <input checked={sharePublicly} onChange={(event) => setSharePublicly(event.target.checked)} type="checkbox" />
          <span>
            <strong>{t("shareTitle")}</strong>
            <span>
              {t("shareDescription")}
            </span>
          </span>
        </label>

        {error && (
          <Alert variant="destructive">
            <ShieldAlert aria-hidden="true" />
            <AlertTitle>{t("snag")}</AlertTitle>
            <AlertDescription>
              {error}
              {needsCredits ? (
                <> <Link className="repair-credits-link" href="/credits/">{t("buyGuideCredit")}</Link></>
              ) : null}
            </AlertDescription>
          </Alert>
        )}
        <div className="repair-tool__submit">
          <Button className="primary-action" disabled={loading || description.trim().length < 4} size="lg" type="submit">
            {loading ? (
              <>
                <LoaderCircle aria-hidden="true" className="animate-spin" />
                {t("working")}
              </>
            ) : (
              <>
                {t("getSteps")} <ArrowRight aria-hidden="true" />
              </>
            )}
          </Button>
          <span>
            {loading ? t("preparing") : t("submitHint")}
          </span>
        </div>
      </form>

      {loading && (
        <div aria-live="polite" className="generation-status" role="status">
          <Sparkles aria-hidden="true" />
          <span>{t("resultWorking")}</span>
        </div>
      )}

      {result && (
        <section aria-labelledby="result-title" className="repair-result" id="repair-result">
          <div className="repair-result__top">
            <div>
              <p className="eyebrow">{t("planEyebrow", { sector: localizedSectorLabel(result.assessment.sector, locale), confidence: confidenceLabel })}</p>
              <h3 id="result-title">{result.assessment.likely_issue}</h3>
              <p>{result.assessment.summary}</p>
              <p className="confidence-note">
                {t("confidenceNote")}
              </p>
            </div>
            <span className={`safety-pill safety-pill--${result.assessment.safety}`}>
              {result.assessment.safety === "safe_diy" ? <Check aria-hidden="true" /> : <ShieldAlert aria-hidden="true" />}
              {t(result.assessment.safety === "safe_diy" ? "safeDiy" : result.assessment.safety === "get_help" ? "getHelp" : "doNotAttempt")}
            </span>
          </div>
          {result.assessment.safety !== "safe_diy" && (
            <Alert variant={result.assessment.safety === "do_not_attempt" ? "destructive" : "default"}>
              <ShieldAlert aria-hidden="true" />
              <AlertTitle>
                {result.assessment.safety === "do_not_attempt" ? t("stopHere") : t("helperNext")}
              </AlertTitle>
              <AlertDescription>{t("safetyAlert")}</AlertDescription>
            </Alert>
          )}
          {!!result.assessment.tools.length && result.assessment.safety !== "do_not_attempt" && (
            <div className="result-tools">
              <h4>
                <Wrench aria-hidden="true" />
                {t("beforeYouBegin")}
              </h4>
              <p>{result.assessment.tools.join(" · ")}</p>
            </div>
          )}
          {!!result.assessment.parts.length && result.assessment.safety === "safe_diy" && (
            <section aria-label={t("partsToCheck")} className="parts-list">
              <strong>{t("partsToCheck")}</strong>
              <div className="parts-sourcing-list">
                {result.assessment.parts.map((part) => (
                  <PartSourcingLinks context="generated_plan" key={part.name} part={part} />
                ))}
              </div>
              <PartSourcingNote />
              <Link className="parts-partner-link" href="/partners/">
                {t("partsPartner")} <ArrowRight aria-hidden="true" />
              </Link>
            </section>
          )}
          <ol className="result-steps">
            {steps.map((step, index) => (
              <li key={`${step.ordinal}-${step.title}`}>
                <div className="result-step-number">{String(index + 1).padStart(2, "0")}</div>
                <div className="result-step-body">
                  <h4>{step.title}</h4>
                  <p>{step.instruction}</p>
                  {step.image ? (
                    <Image
                      alt={step.imageAlt || t("stepIllustrationAlt", { title: result.assessment.likely_issue, ordinal: index + 1 })}
                      className="result-step-image"
                      height={720}
                      src={step.image}
                      unoptimized
                      width={960}
                    />
                  ) : (
                    <div aria-label={t("illustrationPending")} className="result-image-pending">
                      <Sparkles aria-hidden="true" />
                      <span>{t("illustrationCanAdd")}</span>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ol>
          <div className="repair-result__footer">
            {result.href && (
              <Link className={buttonVariants({ variant: "outline" })} href={result.href}>
                {t("openShare")} <ArrowRight aria-hidden="true" data-icon="inline-end" />
              </Link>
            )}
            {!result.saved && <p>{t("notSaved")}</p>}
            {result.reused && <p>{t("matchesLibrary")}</p>}
            {result.saved && !result.reused && (
              <p className="repair-share-status">
                {result.sharedPublicly
                  ? t("savedPublic")
                  : sharePublicly
                    ? t("notPublic")
                    : result.href?.startsWith("/repairs/")
                      ? t("savedLinkOnly")
                      : t("matchesLibrary")}
              </p>
            )}
          </div>
          <RepairOutcomeFeedback key={resultVersion} />
          <p className="result-nearby">
            <MapPin aria-hidden="true" />
            {t("needHand")} {" "}
            <Link data-analytics-event="community_help_opened" data-analytics-link-type="cta" href="/#help">
              {t("nearbyHelp")}
            </Link>
          </p>
        </section>
      )}
    </div>
  );
}
