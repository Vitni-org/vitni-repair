"use client";

import { ArrowRight, Check, LoaderCircle } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type FormState = "idle" | "sending" | "sent" | "error";

export function PartnerInquiryForm() {
  const [state, setState] = useState<FormState>("idle");
  const [message, setMessage] = useState("");

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
      if (!response.ok) throw new Error(result.error || "We could not send your message right now.");
      form.reset();
      setState("sent");
      setMessage("Thanks for reaching out. Your message has been sent to the Vitni team.");
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "We could not send your message right now. Please try again.");
    }
  }

  return (
    <form
      className="partner-form"
      onChange={() => {
        if (state !== "idle" && state !== "sending") {
          setState("idle");
          setMessage("");
        }
      }}
      onSubmit={submit}
    >
      <div className="partner-form__grid">
        <div>
          <label htmlFor="partner-name">Your name <span aria-hidden="true">*</span></label>
          <Input autoComplete="name" id="partner-name" maxLength={100} name="name" required />
        </div>
        <div>
          <label htmlFor="partner-email">Email <span aria-hidden="true">*</span></label>
          <Input autoComplete="email" id="partner-email" maxLength={254} name="email" required type="email" />
        </div>
        <div>
          <label htmlFor="partner-type">How would you like to work with Vitni? <span aria-hidden="true">*</span></label>
          <select className="partner-form__control" defaultValue="" id="partner-type" name="partnerType" required>
            <option disabled value="">Choose one</option>
            <option value="local_repair">Local repair shop or independent repairer</option>
            <option value="repair_cafe">Repair café or community workshop</option>
            <option value="parts_retailer">Parts retailer or marketplace</option>
            <option value="brand">Product brand or manufacturer</option>
            <option value="other">Other community or partnership idea</option>
          </select>
        </div>
        <div>
          <label htmlFor="partner-organization">Business or organization</label>
          <Input autoComplete="organization" id="partner-organization" maxLength={160} name="organization" />
        </div>
        <div>
          <label htmlFor="partner-city">City or service area</label>
          <Input autoComplete="address-level2" id="partner-city" maxLength={100} name="city" placeholder="e.g. Paris, Île-de-France" />
        </div>
        <div>
          <label htmlFor="partner-website">Website</label>
          <Input autoComplete="url" id="partner-website" maxLength={300} name="website" placeholder="https://" type="url" />
        </div>
      </div>
      <div>
        <label htmlFor="partner-message">What would you like to explore? <span aria-hidden="true">*</span></label>
        <Textarea id="partner-message" maxLength={2000} minLength={10} name="message" required rows={5} />
      </div>
      <label className="partner-consent" htmlFor="partner-consent">
        <input id="partner-consent" name="consent" required type="checkbox" value="true" />
        <span>I agree that Vitni can store these details to respond to this partnership enquiry. <span aria-hidden="true">*</span></span>
      </label>
      <div aria-hidden="true" className="partner-form__honeypot">
        <label htmlFor="partner-company-website">Company website</label>
        <input autoComplete="off" id="partner-company-website" name="company_website" tabIndex={-1} type="text" />
      </div>
      <div className="partner-form__submit">
        <Button disabled={state === "sending"} type="submit">
          {state === "sending" ? <LoaderCircle aria-hidden="true" className="animate-spin" /> : state === "sent" ? <Check aria-hidden="true" /> : <ArrowRight aria-hidden="true" />}
          {state === "sending" ? "Sending…" : state === "sent" ? "Message sent" : "Start a conversation"}
        </Button>
        <p aria-live="polite" className={`partner-form__status partner-form__status--${state}`} role={state === "error" ? "alert" : "status"}>
          {message}
        </p>
      </div>
      <p className="partner-form__privacy">Please don’t include customer data or sensitive information. Vitni is an early project; sending this form does not create a commercial agreement.</p>
    </form>
  );
}
