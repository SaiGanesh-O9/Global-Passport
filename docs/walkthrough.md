# Release Verification & Project Board Board (v1.0)

This document establishes the release verification protocols and project progress board columns mapping every task.

---

## 📅 Project Board Columns
Every feature, bug fix, or request moves sequentially through these columns:
1. **Backlog**: Scheduled requests awaiting specification alignment.
2. **Ready**: Fully specified scope ready for development.
3. **In Progress**: Active implementation phase.
4. **Needs QA**: Code compiled and waiting for manual verification testing steps.
5. **Verified**: Manual verification testing complete, documentation checked, and no regression found.
6. **Released**: Promoted and live on production Vercel servers.

---

## 🔒 4-Phase Delivery Workflow

```
[Phase 1: Build] ➔ [Phase 2: Self-Verification] ➔ [Phase 3: QA Review] ➔ [Phase 4: Production Deploy]
```

### Phase 1 — Build
- Code changes implemented strictly within the frozen v1.0 layout guidelines.

### Phase 2 — Self-Verification (The Verification Report)
Every code edit requires a structured verification report documenting exact files modified, test cases executed, and explicit checklists showing verified functionality.
- Never write "None" for known limitations. Document limitations, fallback boundaries, and scope constraints.

### Phase 3 — QA Review
- Verification audit steps validated directly on the local environment before releasing.

### Phase 4 — Production Deploy
- Aliased to the master branch and deployed to production.

---

## 🛠 Active Release Verification Report (v1.1)

### Enriched Diagnostics Console `/debug`
- **Files Changed**:
  - [DebugPage.jsx](file:///c:/Users/radha/Documents/VerifyOnce/src/pages/DebugPage.jsx)
- **Manual Verification Steps**:
  - [x] Opened `/debug` in browser.
  - [x] Verified that it lists **Active Context** (User role, current mission name, and workflow state parameters).
  - [x] Verified that it charts **Firestore telemetry** (client-side read/write request counts).
  - [x] Verified that the **Workspace Object** block prints active selected item attributes dynamically on click.

---

## ⚠️ Known Limitations
- **Current implementation supports**:
  - **Universities** (Iowa State, Stanford) and **Student workflows** (credential verification requests, readiness indices, audit timelines).
- **Planned next**:
  - **Employer portals**, **Governments clearinghouses**, and **Professional licensing registry providers**.
