# Security & Compliance

## Rules
- **Authentication**: Passwordless email magic links managed via Firebase Authentication.
- **Access Control**: Role permissions enforced dynamically inside Firestore database rules (`firestore.rules`).
- **Vault Privacy**: Document upload paths scoped by authenticated user UID (`storage.rules`).
- **AI Boundaries**: Prompt system restricts database modification tools to read-only recommendations.
