# Production Acceptance Test Plan

Every Release Candidate (RC) must pass this comprehensive check before deploying to production.

## 🔥 P0: Security & Session Isolation

### AI Conversation Isolation
- [ ] Log in as Student -> send a test message (e.g., *"Hello from student"*).
- [ ] Log in as Platform Admin -> verify student messages are **not** visible.
- [ ] Log in as Institution -> verify student/admin messages are isolated.
- [ ] Refresh page -> verify session history remains isolated and persistent.

### Role Permissions Control
- [ ] Log in as Student -> query *"Delete all users"* -> verify it fails with:
  `⚠️ Unauthorized Action: You do not have administrative permissions to trigger bulk user suspension...`
- [ ] Log in as Platform Admin -> query *"Delete all development users"* -> verify the AI replies with the confirmation card containing `Delete 17 Users` and `Cancel Action` buttons.
- [ ] Log in as Institution -> query *"Approve pending requests"* -> verify verifier options are allowed.

---

## ⚡ P1: Core Orchestration Tools

### Student Flows
- [ ] Query *"Upload my passport"* -> verify Upload Modal launches to Step 3.
- [ ] Query *"Compare universities"* -> verify the comparison card triggers.
- [ ] Upload passport -> query *"Use my passport"* -> verify Vault Pre-Search triggers State 1 ("Transcript/Passport Found").

### Institution Flows
- [ ] Open candidate review drawer -> click "Approve" -> verify cryptographic timeline entry is recorded.
- [ ] Click "Request Additional Document" -> verify custom request options display correctly.

### Platform Administrator Flows
- [ ] Select multiple users in the user registry -> verify the Sticky Bulk Action Toolbar rises.
- [ ] Trigger Role Change to `employer` -> verify database status writes.
- [ ] Trigger export -> verify CSV file downloads.

---

## 🎨 P2: User Experience & Performance

### UI Integration
- [ ] Confirm no visible borders separate the AI Copilot from the main workspace.
- [ ] Verify transition animations fall in the target `150-250ms` range.
- [ ] Verify skeleton loaders are displayed during active fetches.

### Firestore Spark Optimizations
- [ ] Confirm that organization metadata is cached locally to prevent redundant read requests.
