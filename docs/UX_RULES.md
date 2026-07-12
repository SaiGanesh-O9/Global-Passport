# UniCrypt User Experience (UX) Rules

These design guidelines govern all features, widgets, cards, and pages on the UniCrypt platform.

---

## 1. Interaction Rules
- **Nothing Fake**: Every button, progress percentage bar, and graph segment must either execute a live workflow, fetch real database items, or explicitly state why the data is unavailable.
- **Everything Clickable**: If a metric, organization card, timeline event, or credential document exists in a grid or layout, clicking it must open details in the standard Workspace Panel.
- **No surprise navigation**: Single clicking on objects never redirects the browser path or forces a page reload. It opens the Workspace Panel inside the active context.
- **Context Preservation**:
  - Never reset the active AI Copilot conversation history when inspecting objects.
  - Never reset the conversation scroll position or draft input.

---

## 2. Interface Consistency
- **Single Workspace Panel**: All contextual details (Acceptance rates, WES prerequisites, Document OCR audits) slide up in the exact same Workspace Panel sheet.
- **Universal Action Registry**: Sticky control buttons at the bottom of the panel are resolved dynamically from the Action Registry.
- **No duplications**: A single action (e.g. approve request) should only exist in the action registry block, not duplicated in random ad-hoc panels.
- **Explanation fallbacks**: If data or metrics calculations are unavailable due to server limits, display a clear mock cache state with a "Retry" or "Show Cached" button.
