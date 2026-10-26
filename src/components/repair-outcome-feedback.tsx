"use client";

import { Check, HandHeart, RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { trackAnalyticsEvent } from "@/lib/analytics";

const outcomes = [
  { value: "fixed", label: "fixed", icon: Check },
  { value: "in_progress", label: "inProgress", icon: RotateCcw },
  { value: "referred", label: "referred", icon: HandHeart },
] as const;

type Outcome = (typeof outcomes)[number]["value"];

export function RepairOutcomeFeedback() {
  const [selected, setSelected] = useState<Outcome | null>(null);
  const t = useTranslations("feedback");

  const choose = (outcome: Outcome) => {
    setSelected(outcome);
    trackAnalyticsEvent("repair_outcome_reported", { outcome });
  };

  return (
    <fieldset className="repair-outcome" disabled={selected !== null}>
      <legend>{t("legend")}</legend>
      <div className="repair-outcome__options">
        {outcomes.map(({ value, label, icon: Icon }) => (
          <button
            aria-pressed={selected === value}
            className={selected === value ? "is-selected" : ""}
            key={value}
            onClick={() => choose(value)}
            type="button"
          >
            <Icon aria-hidden="true" /> {t(label)}
          </button>
        ))}
      </div>
      <p aria-live="polite" className="repair-outcome__thanks">
        {selected ? t("thanks") : t("privacy")}
      </p>
    </fieldset>
  );
}
