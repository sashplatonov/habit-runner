# Chart Tooltip Concept

<a name="top"></a>

This note defines the purpose, UX contract, and implementation boundaries for explanatory tooltips used in Stats and habit analytics blocks.

## 📋 Table of Contents

- [Audience and goal](#audience-and-goal)
- [Concept summary](#concept-summary)
- [Where tooltips belong](#where-tooltips-belong)
- [Content contract](#content-contract)
- [Interaction contract](#interaction-contract)
- [Mobile behavior](#mobile-behavior)
- [Visual direction](#visual-direction)
- [Implementation notes](#implementation-notes)
- [Failure modes](#failure-modes)
- [Verification checklist](#verification-checklist)

---

## 🎯 Audience and goal <a name="audience-and-goal"></a>

Use this document when:
- explaining to product or design stakeholders why chart tooltips exist;
- reviewing new analytics blocks before release;
- implementing another chart or heatmap that should follow the same pattern.

Primary goal:
- turn each analytics block into a self-explanatory unit;
- help users understand why the block exists;
- tell users which metrics or patterns deserve attention without requiring separate onboarding.

[↑ Back to top](#top)

---

## 🧭 Concept summary <a name="concept-summary"></a>

Each analytics card may include a small help trigger next to the title. When opened, the tooltip should answer three questions:
- what this block shows;
- why it matters;
- what the user should watch for.

This is not a raw data tooltip for a single point on the chart. It is a block-level explanation layer for the whole chart or heatmap.

[↑ Back to top](#top)

---

## 🧩 Where tooltips belong <a name="where-tooltips-belong"></a>

Tooltips are appropriate for analytics blocks where the meaning is not obvious at first glance.

Current intended coverage in this repo:
- `Daily completion rate`
- `Period trends`
- `Weekly breakdown`
- `Habit performance`
- `Activity — 90 days`
- `Activity - 90 days` on habit detail
- `Monthly completion rate`
- `Weekly completions`

Do not add this pattern to:
- simple labels that are already self-explanatory;
- point-level hover tooltips inside the chart itself;
- highly interactive editors such as the retro calendar unless there is a separate UX need.

[↑ Back to top](#top)

---

## 📝 Content contract <a name="content-contract"></a>

Every chart guide tooltip should contain:
- a short title matching the analytics block;
- a plain-English summary of what the block represents;
- a `Watch for` list with 2-3 concrete signals.

Content rules:
- keep copy short and operational;
- describe patterns, not theory;
- mention observable signals like trend direction, recent bars, empty stretches, completion rate, or streak momentum;
- avoid generic motivational text;
- avoid implementation jargon unless the audience is engineers.

Good examples:
- `Trend direction: rising lines usually mean the habit is stabilizing.`
- `Repeated empty columns: missed stretches that break rhythm.`
- `Latest point: your current monthly baseline.`

Bad examples:
- `This chart is useful and helps the user improve.`
- `Data visualization improves awareness.`

[↑ Back to top](#top)

---

## 🖱️ Interaction contract <a name="interaction-contract"></a>

Required behavior:
- tooltip opens from a dedicated help button near the chart title;
- desktop users can discover it by hover;
- mobile users can open it by tap;
- the tooltip has an explicit close button;
- clicking outside closes it;
- pressing `Esc` closes it;
- the tooltip should not force navigation or scroll jumps.

Important distinction:
- chart hover tooltips explain a data point;
- chart guide tooltips explain the whole block.

[↑ Back to top](#top)

---

## 📱 Mobile behavior <a name="mobile-behavior"></a>

Mobile contract is strict:
- the tooltip must stay inside the viewport;
- it must not overflow horizontally;
- it must be closable without relying on hover;
- the title row must still wrap correctly when the help button is present;
- adjacent analytics cards must keep `min-w-0` behavior so the tooltip trigger does not push the layout wider than the screen.

Current implementation intent:
- use `fixed` positioning for the overlay;
- clamp left and top coordinates against viewport margins;
- prefer a compact width such as `w-72` with `max-w-[calc(100vw-1.5rem)]`.

[↑ Back to top](#top)

---

## 🎨 Visual direction <a name="visual-direction"></a>

The tooltip should feel like part of the analytics system, not a browser default popup.

Visual requirements:
- card-style surface using project background and border tokens;
- small block-specific graphic preview (`bars`, `line`, `grid`, or `columns`);
- compact typography with mono labels and short action-oriented copy;
- clear close affordance;
- visual hierarchy: title, graphic, summary, `Watch for` list.

The tooltip should feel informative and intentional, but not become the dominant object on the screen.

[↑ Back to top](#top)

---

## 🛠️ Implementation notes <a name="implementation-notes"></a>

Current frontend implementation lives in:
- `packages/web/src/components/ChartGuideTooltip.tsx`

When wiring a new analytics block:
1. Place the trigger beside the block title.
2. Choose the visual variant that matches the chart shape.
3. Write one summary sentence.
4. Add 2-3 `focusPoints` that reflect the metrics users can actually act on.
5. Re-check mobile layout around the title row and surrounding card container.

Do not duplicate tooltip logic per chart. Reuse the shared component unless a block truly needs different interaction rules.

[↑ Back to top](#top)

---

## ⚠️ Failure modes <a name="failure-modes"></a>

Common regressions to watch for:
- tooltip opens off-screen on narrow devices;
- opening the tooltip causes render loops or layout thrash;
- title rows overflow because the help button was added without responsive wrapping;
- content becomes too generic and stops explaining real metrics;
- tooltip logic gets copied into individual chart files and drifts from the shared behavior.

If any of these appear, treat it as a UX bug, not as optional polish.

[↑ Back to top](#top)

---

## 🧪 Verification checklist <a name="verification-checklist"></a>

Before closing tooltip-related work:
- confirm the tooltip opens and closes on desktop;
- confirm it can be opened and closed on mobile width;
- confirm no analytics card overflows horizontally after adding the trigger;
- confirm the copy explains the block and points at real metrics;
- run `npm run build:web`;
- for isolated tooltip logic changes, run `npm exec --workspace=@habbit-runner/web -- eslint src/components/ChartGuideTooltip.tsx --ext .tsx --max-warnings 0`.

[↑ Back to top](#top)
