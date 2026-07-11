# UniCrypt Design System (v0.95)

This document is the single source of truth for all frontend interfaces, layouts, and components in the UniCrypt platform.

---

## 1. Typography Scales
All textual elements must conform strictly to these sizes. Avoid arbitrary `text-[13px]` or custom style overrides.

| Token | CSS / Tailwind | Font Size | Font Weight | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Hero** | `text-5xl` | 48px | Extrabold (`font-extrabold`) | Splash titles, landing headers |
| **Page** | `text-3xl` | 32px | Extrabold (`font-extrabold`) | Main view page titles |
| **Section** | `text-2xl` | 24px | Extrabold (`font-extrabold`) | Category headers, divider labels |
| **Card Title** | `text-lg` | 18px | Bold (`font-bold`) | Card header blocks |
| **Body** | `text-base` | 16px | Medium (`font-medium`) | Paragraphs, standard label fields |
| **Caption** | `text-sm` | 14px | Medium (`font-medium`) | Subtitles, meta-tags, helper texts |
| **Tiny** | `text-xs` | 12px | Bold (`font-bold`) | Badge tags, chip numbers, status labels |

---

## 2. Color System
The platform utilizes a curated color scheme matching HSL tailwinds. Custom hex values inside JSX components are forbidden.

```
Primary:    Blue 500 equivalent    (hsl(217.2, 91.2%, 59.8%))
Secondary:  Slate gray range       (slate-400 to slate-500)
Success:    Emerald green          (emerald-600)
Warning:    Amber orange           (amber-500)
Danger:     Rose red               (rose-600)
Background: Light: slate-50        Dark: hsl(224, 71%, 4%)
Surface:    Light: white           Dark: hsl(222, 47%, 11%)
Glass:      Light: white/40        Dark: slate-900/40 (backdrop-blur-md)
```

---

## 3. Spacing Grid (8px Scale)
Margins, paddings, and absolute gaps must adhere to increments of 8px:
- `space-1` (4px): Micro-spacing (badge padding)
- `space-2` (8px): Inline gaps (icon text spacing)
- `space-4` (16px): Card padding, standard item margins
- `space-6` (24px): Standard block margins, section separators
- `space-8` (32px): Layout structural gutters, outer page margins

---

## 4. Components

### Buttons
Standardized button components comprise four specific modes:
- **Primary**: Solid blue pill (`bg-blue-600 text-white hover:bg-blue-700 rounded-full py-2.5 px-6 font-bold text-base transition-all duration-150 active:scale-[0.97]`)
- **Secondary**: Glassmorphic pill (`bg-white/40 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50 hover:bg-white/60 text-slate-800 dark:text-slate-200 rounded-full py-2.5 px-6 font-bold text-base transition-all duration-150 active:scale-[0.97]`)
- **Ghost**: Transparent (`bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-full py-2 px-4 font-semibold text-base`)
- **Danger**: Solid rose pill (`bg-rose-600 text-white hover:bg-rose-700 rounded-full py-2.5 px-6 font-bold text-base`)

### Cards
Cards are structured with uniform borders and shadows:
- `bg-white/70 dark:bg-[#0f111a]/60 backdrop-blur-md border border-slate-200/80 dark:border-slate-850/60 shadow-sm hover:shadow-md rounded-2xl p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-500/10`

### Inputs
Standardized text fields and dropdowns:
- `rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 px-4 py-3 text-base text-slate-900 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/85 transition-all duration-200`

---

## 5. Motion (60fps Limit)
Animations exist exclusively to communicate state changes or loading completions:
1. **Interactive Click**: All primary buttons scale down slightly on tap (`active:scale-[0.97] transition-transform duration-100`).
2. **Fade Transition**: Content reveals slide in softly (`animate-in fade-in duration-300`).
3. **Progress Bar**: Animate from 0% on mount (`transition-all duration-1000 ease-out`).
4. **Drawing Checkmarks**: Completed criteria execute drawing SVGs (`animate-checkmark`).

---

## 6. Accessibility & Semantics
- Focus indicators must be highly visible (`focus-visible:ring-2 focus-visible:ring-blue-500`).
- HTML structure must utilize semantic landmark selectors (`<main>`, `<header>`, `<aside>`, `<nav>`).
- Image files must always include explicit `alt` tags.
