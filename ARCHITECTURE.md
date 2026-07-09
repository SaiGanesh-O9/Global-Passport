# System Architecture

UniCrypt is a Single Page Application (SPA) built using React, Vite, TailwindCSS, and Firebase.

## Directory Structure
```
src/
├── ai/             # Modular Intelligence Layer
│   ├── actions/    # UI & Navigation triggers mapping
│   ├── context/    # Context engine compilers for Firestore/State
│   ├── gateway/    # Provider-agnostic AskAI entry gates
│   ├── memory/     # Session conversation logs & summaries
│   ├── prompts/    # Static system/role guidelines
│   ├── providers/  # LLM adapters (OpenAI, Gemini, Claude, Live Search)
│   ├── router/     # Prompt classifier heuristics (General, Platform, Hybrid)
│   └── tools/      # Context-bound function calling triggers
├── components/     # Reusable UI & Layouts
├── firebase/       # Firestore, Auth & rules configurations
├── pages/          # Main views (Admin, User Dashboard, Institution Dashboard)
└── styles/         # Styling index
```
