"use client";

import { ArrowRight, Check, LoaderCircle } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type FormState = "idle" | "sending" | "sent" | "emailed" | "saved" | "error";
const partnerInbox = "miki.lombi+vitni@gmail.com";

export function PartnerInquiryForm() {
  const t = useTranslations("partners");
  const [state, setState] = useState<FormState>("idle");
  const [message, setMessage] = useState("");
  const [manualEmail, setManualEmail] = useState("");

  function makeManualEmail(formData: FormData) {
    const body = [
      `${t("manualName")}: ${formData.get("name") || ""}`,
      `${t("manualEmail")}: ${formData.get("email") || ""}`,
      `${t("manualType")}: ${formData.get("partnerType") || ""}`,
      `${t("manualOrganization")}: ${formData.get("organization") || t("manualNotProvided")}`,
      `${t("manualCity")}: ${formData.get("city") || t("manualNotProvided")}`,
      `${t("manualWebsite")}: ${formData.get("website") || t("manualNotProvided")}`,
      "",
      `${t("manualMessage")}:`,
      String(formData.get("message") || ""),
    ].join("\n");
    const query = new URLSearchParams({ subject: t("manualSubject"), body });
    return `mailto:${partnerInbox}?${query.toString()}`;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setState("sending");
    setMessage("");

    try {
      const response = await fetch("/api/partner-inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(formData.entries())),
      });
      const result = await response.json();
      if (result.saved && result.emailSent === false) {
        setState("saved");
        setMessage(t("savedError"));
        setManualEmail(makeManualEmail(formData));
        return;
      }
      if (result.saved === false && result.emailSent) {
        form.reset();
        setState("emailed");
        setMessage(t("emailedMessage"));
        setManualEmail("");
        return;
      }
      if (!response.ok) throw new Error(t("fallbackError"));
      form.reset();
      setState("sent");
      setManualEmail("");
      setMessage(t("sentMessage"));
    } catch {
      setState("error");
      setMessage(t("fallbackError"));
      setManualEmail(makeManualEmail(formData));
    }
  }

  return (
    <form
      className="partner-form"
      onChange={() => {
        if (state !== "idle" && state !== "sending") {
          setState("idle");
          setMessage("");
          setManualEmail("");
        }
      }}
      onSubmit={submit}
    >
      <div className="partner-form__grid">
        <div>
          <label htmlFor="partner-name">{t("name")} <span aria-hidden="true">*</span></label>
          <Input autoComplete="name" id="partner-name" maxLength={100} name="name" required />
        </div>
        <div>
          <label htmlFor="partner-email">{t("email")} <span aria-hidden="true">*</span></label>
          <Input autoComplete="email" id="partner-email" maxLength={254} name="email" required type="email" />
        </div>
        <div>
          <label htmlFor="partner-type">{t("partnerType")} <span aria-hidden="true">*</span></label>
          <select className="partner-form__control" defaultValue="" id="partner-type" name="partnerType" required>
            <option disabled value="">{t("choose")}</option>
            <option value="local_repair">{t("localRepair")}</option>
            <option value="repair_cafe">{t("repairCafe")}</option>
            <option value="parts_retailer">{t("partsRetailer")}</option>
            <option value="brand">{t("brand")}</option>
            <option value="other">{t("other")}</option>
          </select>
        </div>
        <div>
          <label htmlFor="partner-organization">{t("organization")}</label>
          <Input autoComplete="organization" id="partner-organization" maxLength={160} name="organization" />
        </div>
        <div>
          <label htmlFor="partner-city">{t("city")}</label>
          <Input autoComplete="address-level2" id="partner-city" maxLength={100} name="city" placeholder={t("cityPlaceholder")} />
        </div>
        <div>
          <label htmlFor="partner-website">{t("website")}</label>
          <Input autoComplete="url" id="partner-website" maxLength={300} name="website" placeholder="https://" type="url" />
        </div>
      </div>
      <div>
        <label htmlFor="partner-message">{t("message")} <span aria-hidden="true">*</span></label>
        <Textarea id="partner-message" maxLength={2000} minLength={10} name="message" required rows={5} />
      </div>
      <label className="partner-consent" htmlFor="partner-consent">
        <input id="partner-consent" name="consent" required type="checkbox" value="true" />
        <span>{t("consent")} <span aria-hidden="true">*</span></span>
      </label>
      <div aria-hidden="true" className="partner-form__honeypot">
        <label htmlFor="partner-company-website">{t("honeypotLabel")}</label>
        <input autoComplete="off" id="partner-company-website" name="company_website" tabIndex={-1} type="text" />
      </div>
      <div className="partner-form__submit">
        <Button disabled={state === "sending" || state === "saved"} type="submit">
          {state === "sending" ? <LoaderCircle aria-hidden="true" className="animate-spin" /> : state === "sent" || state === "emailed" ? <Check aria-hidden="true" /> : <ArrowRight aria-hidden="true" />}
          {state === "sending" ? t("sending") : state === "sent" ? t("sent") : state === "emailed" ? t("emailed") : state === "saved" ? t("saved") : t("submit")}
        </Button>
        <p aria-live="polite" className={`partner-form__status partner-form__status--${state}`} role={state === "error" ? "alert" : "status"}>
          {message}
        </p>
        {manualEmail && <a className="partner-form__fallback-email" href={manualEmail}>{t("emailDirect")}</a>}
      </div>
      <p className="partner-form__privacy">{t("privacy")}</p>
    </form>
  );
}
