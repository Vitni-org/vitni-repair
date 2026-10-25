"use client";

import { Check, HandHeart, RotateCcw } from "lucide-react";
import { useState } from "react";
import { trackAnalyticsEvent } from "@/lib/analytics";

const outcomes = [
  { value: "fixed", label: "Fixed it", icon: Check },
  { value: "in_progress", label: "Still working on it", icon: RotateCcw },
  { value: "referred", label: "I need a repair pro", icon: HandHeart },
] as const;

type Outcome = (typeof outcomes)[number]["value"];

export function RepairOutcomeFeedback() {
  const [selected, setSelected] = useState<Outcome | null>(null);

  const choose = (outcome: Outcome) => {
    setSelected(outcome);
    trackAnalyticsEvent("repair_outcome_reported", { outcome });
  };

  return (
    <fieldset className="repair-outcome" disabled={selected !== null}>
      <legend>How did the repair go?</legend>
      <div className="repair-outcome__options">
        {outcomes.map(({ value, label, icon: Icon }) => (
          <button
            aria-pressed={selected === value}
            className={selected === value ? "is-selected" : ""}
            key={value}
            onClick={() => choose(value)}
            type="button"
          >
            <Icon aria-hidden="true" /> {label}
          </button>
        ))}
      </div>
      <p aria-live="polite" className="repair-outcome__thanks">
        {selected ? "Thanks — your feedback helps Vitni improve." : "Optional · sent to Google Analytics only if you opted in; no repair details are attached."}
      </p>
    </fieldset>
  );
}
