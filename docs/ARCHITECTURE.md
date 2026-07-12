# UniCrypt Platform Architecture (v1.0)

This document serves as the source of truth for the UniCrypt architecture. Every new feature, object, or workflow must conform to these definitions.

---

## 1. Object-Centric Design
Every entity in the platform is structured as a standard **Workspace Object**. Visual renderers consume these objects; no raw database documents or ad-hoc templates are allowed.

### Supported Objects Schema
- **Document (`doc.*`)**: Cryptographically signed PDF/image file items.
- **Organization (`org.*`)**: Accredited partner profiles (Universities, Employers, etc.).
- **Metric (`metric.*`)**: Computed benchmarks with equations and audit weights.
- **TimelineEvent (`timeline.*`)**: Cryptographic checkpoints on the ledger.
- **Workflow / Mission / Verification**: Interactive process schemas.

---

## 2. Global Event Bus
Visual components and AI tools communicate exclusively by dispatching events on the Event Bus. Direct DOM manipulation or state-drilling is prohibited.
- `unicrypt.workspace.open`: Slides open the Workspace Panel with a target object payload.
- `unicrypt.workspace.close`: Closes the panel.
- `unicrypt.notification.show`: Dispatches toast messages.

---

## 3. Capability Registry
Permissions are mapped directly to role-specific capabilities. Do not check roles directly (e.g. `role === "admin"`). Instead, query capabilities:
- `deleteUsers`: Super Admin account control.
- `approveVerification`: Verification Officer request audits.
- `shareCredential`: Candidate secure link sharing.
- `compareOrganizations`: Benchmark comparisons.

---

## 4. Decoupled Workspace Panel
Decoupled versioning renders views matching the selected object:
- **WorkspaceRenderer**: Sheet slide wrapper, Esc key closing binds.
- **ObjectRenderer**: Custom tabs mapping (`Overview` with SVG gauges, `AI Insights`, `History`, `Sources`).
- **ActionRenderer**: Contextual button rows queried from the Action Registry.

---

## 5. Providers & Workflows
- **Providers**: Decouple logic matching the organization type (`UniversityProvider`, `EmployerProvider`).
- **Workflows**: Managed task lists with completion check constraints.

---

## 6. Feature Flags
Control availability of system modules:
- `FEATURE_COMMAND_CENTER`: AI floating dock.
- `FEATURE_WORKSPACE_PANEL`: Decoupled panel.
- `FEATURE_METRICS_HUB`: Interactive metrics logs.
- `FEATURE_ADMIN_BULK_ACTIONS`: Administrative profiles operations.
