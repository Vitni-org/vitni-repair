# Vitni Ligne Claire Design Addendum

## Intent

Make Vitni feel like one friendly, memorable repair sidekick wherever the mascot appears. The user chose a warm Franco-Belgian ligne claire direction: crisp dark ink contours, expressive eyes, flat color, and small hand-drawn accents.

## Scope

- Refresh the master character illustration and simplified brand mark so Vitni's face and repair tool remain legible at small sizes.
- Rebuild the existing Lottie from the same visual model, with a small, friendly loop (blink, tool lift or wave, gentle body movement) and the existing reduced-motion behavior.
- Reuse that model in the home hero, diagnosis prompt, guide library hero/search, guide-detail hero/safety panels, and OG card.
- Preserve the current palette and the readable 1200×630 OG-card layout.

## Non-goals

- Do not imitate a named artist or existing comic character.
- Do not replace repair-story or guide photography/illustrations that do not depict Vitni.
- Do not change the repair product flow, copy, or safety instructions.

## Approaches

1. **One master vector model, with derived mark and Lottie (chosen):** draw Vitni once as an editable SVG, derive the compact mark from it, and rebuild the Lottie with matching shapes/colors. This keeps the mascot recognizable across tiny and large placements while fitting the existing SVG/Lottie stack.
2. **Redraw each placement independently:** offers local freedom but makes identity drift likely across the logo, page art, and animation.
3. **Replace the mascot with a raster/3D character:** would require a different visual and animation pipeline and would not match the existing crisp, flat-vector site.

## Constraints and decisions

- Use friendly, non-threatening proportions, strong outlines, high-contrast lime eyes, the dark-green body, and the coral tool accent already used by RepairLens.
- The face and tool must be visible in the masthead mark and at social-card scale.
- Keep the Lottie decorative to assistive technology and stop it for reduced-motion users; nearby text continues to name Vitni.
- Keep source SVG editable and use the same mascot colors/proportions in each animation state.

## Acceptance

- All existing Vitni placements use the same refreshed artwork or its matching animation; no old blank-face/old-shape version remains.
- The character is visibly friendly, with two eyes and a recognizable repair tool in both static art and animation.
- The master SVG, mark, Lottie, and OG image remain visually consistent at header, mobile, guide-card, and social-preview sizes.
- Reduced-motion users receive the static Vitni artwork without autoplaying motion.
