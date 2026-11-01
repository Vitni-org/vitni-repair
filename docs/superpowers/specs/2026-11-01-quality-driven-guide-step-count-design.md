# Quality-driven repair guide steps

## Intent

Make generated repair guides complete for the repair at hand instead of forcing them into three or four steps. The user selected full written guidance with illustrations for the first ten steps.

## Approaches

1. **Quality-driven text, up to 20 steps; illustrate the first 10 (chosen).** The model includes each distinct prerequisite, action, check, and finish needed for a complete safe procedure without padding. All written steps remain saved and visible; the first ten can receive generated illustrations. This supports detailed jobs while bounding response size and image-generation cost.
2. **Cap both written and illustrated guides at 10.** Simpler and predictable, but prevents a complete written guide when a repair genuinely needs more steps.
3. **Allow unlimited written steps and images.** Rejected because unbounded output and image generation can create runaway latency and cost.

## Goals and behavior

- Apply the same step-count rules to on-demand photo/description guides and weekly researched drafts.
- Let the repair procedure determine its length. Include prerequisites, distinct actions, inspections, and final checks when relevant; do not pad, split one action artificially, or omit necessary steps to hit a count.
- Support up to 20 written steps for bounded structured output. This is a safety/resource ceiling, not a target.
- Generate and persist a cover plus step illustrations for the first 10 steps at most. Keep every written step, including steps 11–20, in the guide and database.
- Keep the French translation's step count and order identical to the English source.
- Update the guide UI and copy to make clear when later steps are written-only.
- Preserve existing escalation rules: unsafe repairs remain stop/referral guidance and must not be expanded into hazardous DIY instructions.

## Constraints and implementation calls

- The database already stores an ordered JSON/relational step list without a four-step constraint.
- The on-demand generator currently validates at five steps and the weekly scout requires exactly three or four; illustration endpoints/retries also assume a five-step maximum.
- Set one shared on-demand text maximum of 20 and illustration maximum of 10; enforce both in request validation, persistence/illustration mapping, retry routes, weekly scout schemas, and its per-run image budget.
- Keep illustration calls bounded to the first ten items and return alignment-safe empty image values for later steps.
- Keep the guide's written instructions as the source of truth if an illustration is missing or omitted due to the ten-image limit.

## Acceptance criteria

- A generated or researched guide may have more than four and more than ten written steps, up to the 20-step ceiling.
- English and French retain matching step count/order.
- Only the first ten steps are sent for illustration generation; later text steps remain readable and persisted.
- Retry and illustration endpoints accept only steps that are eligible for illustration and report clear validation errors.
- No prompt instructs the model to add filler merely to increase step count.
