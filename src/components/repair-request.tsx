"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, LoaderCircle, MapPin, ShieldAlert, Sparkles, Upload, Wrench } from "lucide-react";
import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { trackAnalyticsEvent } from "@/lib/analytics";
import type { RepairAssessment, RepairGuide } from "@/lib/content";
import { RepairOutcomeFeedback } from "@/components/repair-outcome-feedback";
import { PartSourcingLinks, PartSourcingNote } from "@/components/part-sourcing-links";

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
  const fileInput = useRef<HTMLInputElement>(null);
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [imageName, setImageName] = useState("");
  const [sharePublicly, setSharePublicly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<GuideResponse | null>(null);
  const [resultVersion, setResultVersion] = useState(0);

  const chooseImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setError("");
    if (!/^image\/(png|jpeg|webp)$/.test(file.type)) {
      setError("Please choose a PNG, JPEG, or WebP photo.");
      event.target.value = "";
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError("Choose a photo smaller than 8 MB.");
      event.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setImage(typeof reader.result === "string" ? reader.result : "");
      setImageName(file.name);
    };
    reader.onerror = () => setError("We could not read that photo. Try another file.");
    reader.readAsDataURL(file);
  };

  const useSamplePhoto = async () => {
    try {
      const response = await fetch("/images/test/chain-off-test.jpg");
      const blob = await response.blob();
      const reader = new FileReader();
      reader.onload = () => {
        setImage(typeof reader.result === "string" ? reader.result : "");
        setImageName("Sample bicycle chain photo");
        setDescription("My bike chain slips off when I change gear, and I can’t see anything obviously bent.");
      };
      reader.readAsDataURL(blob);
    } catch {
      setError("We could not load the sample photo. Please choose one from your device.");
    }
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (description.trim().length < 4) {
      setError("Add a few words about what changed so Vitni can help.");
      return;
    }
    setError("");
    setResult(null);
    setLoading(true);
    trackAnalyticsEvent("repair_request_started", { has_photo: Boolean(image) });
    try {
      const response = await fetch("/api/repair-guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: description.trim(), sharePublicly, ...(image ? { image } : {}) }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "We could not make your repair plan yet.");
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
      setError(issue instanceof Error ? issue.message : "We could not make your repair plan yet.");
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
      ? "Strong match"
      : result.assessment.confidence >= 55
        ? "Likely match"
        : "Possible match"
    : "";
  const steps =
    guide?.steps ||
    result?.assessment.steps.map((step, index) => ({
      ...step,
      ordinal: index + 1,
      image: result.visuals?.[index] || "",
      imageAlt: `Illustration for ${result.assessment.likely_issue}, step ${index + 1}`,
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
            <p className="eyebrow">Meet Vitni · your repair sidekick</p>
            <h2 className="section-title">What happened to it?</h2>
            <p className="repair-tool__lede">Show me what changed. I’ll help identify the issue and find a safe next step.</p>
          </div>
        </div>

        <div className="repair-tool__fields">
          <div className="repair-tool__description">
            <label className="field-label" htmlFor="repair-description">
              Describe what’s wrong <span aria-hidden="true">*</span>
            </label>
            <Textarea
              autoComplete="off"
              id="repair-description"
              maxLength={1000}
              name="description"
              onChange={(event) => setDescription(event.target.value)}
              placeholder="e.g. My bike chain slips off when I change gear."
              required
              rows={7}
              value={description}
            />
            <div className="field-footnote">
              <span>A few details help Vitni understand what changed or stopped working.</span>
              <span>{description.length}/1000</span>
            </div>
          </div>

          <div className="photo-box">
            <div>
              <p className="eyebrow">Photo helps us see the details</p>
              <h3>Add a photo if you have one</h3>
              <p className="text-muted-foreground">Take a clear close-up, or use words alone.</p>
              <p className="repair-data-note">
                Vitni sends your description and optional photo to OpenAI to prepare the guide. The original photo is not saved with it.
              </p>
            </div>
            <input
              accept="image/png,image/jpeg,image/webp"
              aria-label="Choose a repair photo"
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
                  Take a photo or choose a file
                </Button>
                <span className="photo-or">PNG, JPG or WebP · max 8 MB</span>
                <button className="text-link" onClick={useSamplePhoto} type="button">
                  Try the sample photo
                </button>
              </div>
            ) : (
              <div className="photo-preview">
                <Image alt="Preview of the selected repair photo" fill sizes="(max-width: 700px) 80vw, 360px" src={image} unoptimized />
                <div className="photo-preview__meta">
                  <span>{imageName}</span>
                  <button onClick={clearPhoto} type="button">
                    Remove photo
                  </button>
                </div>
              </div>
            )}
            <div className="photo-tip">
              <strong>For a better match</strong>
              <span>Take one close photo in good light. Include the damaged part and one wider view for context.</span>
            </div>
          </div>
        </div>

        <label className="repair-share-choice">
          <input checked={sharePublicly} onChange={(event) => setSharePublicly(event.target.checked)} type="checkbox" />
          <span>
            <strong>Add this guide to the public library</strong>
            <span>
              Your original photo and wording are not published. Leave unchecked to keep a new guide link-only; Vitni may point you to an existing
              public match.
            </span>
          </span>
        </label>

        {error && (
          <Alert variant="destructive">
            <ShieldAlert aria-hidden="true" />
            <AlertTitle>We hit a snag</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <div className="repair-tool__submit">
          <Button className="primary-action" disabled={loading || description.trim().length < 4} size="lg" type="submit">
            {loading ? (
              <>
                <LoaderCircle aria-hidden="true" className="animate-spin" />
                Vitni is looking…
              </>
            ) : (
              <>
                Get my repair steps <ArrowRight aria-hidden="true" />
              </>
            )}
          </Button>
          <span>
            {loading ? "Checking the photo and description, then preparing a safe route." : "Clear steps, safety notes, and parts to check."}
          </span>
        </div>
      </form>

      {loading && (
        <div aria-live="polite" className="generation-status" role="status">
          <Sparkles aria-hidden="true" />
          <span>Vitni is working out a safe, practical next step…</span>
        </div>
      )}

      {result && (
        <section aria-labelledby="result-title" className="repair-result" id="repair-result">
          <div className="repair-result__top">
            <div>
              <p className="eyebrow">Vitni’s repair plan · {result.assessment.sector} · {confidenceLabel}</p>
              <h3 id="result-title">{result.assessment.likely_issue}</h3>
              <p>{result.assessment.summary}</p>
              <p className="confidence-note">
                This is an AI-assisted suggestion based on the details you shared. Check each step and stop if the repair feels unsafe.
              </p>
            </div>
            <span className={`safety-pill safety-pill--${result.assessment.safety}`}>
              {result.assessment.safety === "safe_diy" ? <Check aria-hidden="true" /> : <ShieldAlert aria-hidden="true" />}
              {result.assessment.safety.replaceAll("_", " ")}
            </span>
          </div>
          {result.assessment.safety !== "safe_diy" && (
            <Alert variant={result.assessment.safety === "do_not_attempt" ? "destructive" : "default"}>
              <ShieldAlert aria-hidden="true" />
              <AlertTitle>
                {result.assessment.safety === "do_not_attempt" ? "Stop here and get qualified help" : "A repair helper is the safe next step"}
              </AlertTitle>
              <AlertDescription>Vitni found a possible safety risk. Follow only the safe observation and referral advice below.</AlertDescription>
            </Alert>
          )}
          {!!result.assessment.tools.length && result.assessment.safety !== "do_not_attempt" && (
            <div className="result-tools">
              <h4>
                <Wrench aria-hidden="true" />
                Before you begin
              </h4>
              <p>{result.assessment.tools.join(" · ")}</p>
            </div>
          )}
          {!!result.assessment.parts.length && result.assessment.safety === "safe_diy" && (
            <section aria-label="Parts to check" className="parts-list">
              <strong>Parts to check</strong>
              <div className="parts-sourcing-list">
                {result.assessment.parts.map((part) => (
                  <PartSourcingLinks context="generated_plan" key={part.name} part={part} />
                ))}
              </div>
              <PartSourcingNote />
              <Link className="parts-partner-link" href="/partners/">
                Know a local parts source? Tell us about it <ArrowRight aria-hidden="true" />
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
                      alt={step.imageAlt || `Illustration for ${step.title}`}
                      className="result-step-image"
                      height={720}
                      src={step.image}
                      unoptimized
                      width={960}
                    />
                  ) : (
                    <div aria-label="Step illustration is being prepared" className="result-image-pending">
                      <Sparkles aria-hidden="true" />
                      <span>Illustration can be added from this saved guide.</span>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ol>
          <div className="repair-result__footer">
            {result.href && (
              <Link className={buttonVariants({ variant: "outline" })} href={result.href}>
                Open and share this guide <ArrowRight aria-hidden="true" data-icon="inline-end" />
              </Link>
            )}
            {!result.saved && <p>{result.message || "This plan is ready for you, but the shared guide library is not connected yet."}</p>}
            {result.reused && <p>This matches a guide already in the shared library.</p>}
            {result.saved && !result.reused && (
              <p className="repair-share-status">
                {result.sharedPublicly
                  ? "You chose to add this general guide to the public library."
                  : sharePublicly
                    ? "This repair was kept link-only because it was not suitable for the public library."
                    : result.href?.startsWith("/repairs/")
                      ? "Saved as an unlisted guide. Anyone with its link can open it."
                      : "This opens a matching guide that was already in the public library."}
              </p>
            )}
          </div>
          <RepairOutcomeFeedback key={resultVersion} />
          <p className="result-nearby">
            <MapPin aria-hidden="true" />
            Need a hand?{" "}
            <Link data-analytics-event="community_help_opened" data-analytics-link-type="cta" href="/#help">
              Find a repair café or community workshop nearby.
            </Link>
          </p>
        </section>
      )}
    </div>
  );
}
