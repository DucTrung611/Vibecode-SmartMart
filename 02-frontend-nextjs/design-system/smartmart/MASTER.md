# Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** SmartMart
**Generated:** 2026-07-31 (hand-curated via `ui-ux-pro-max` domain searches — see note below)
**Category:** E-commerce
**Direction:** Modern minimal, trustworthy

> **Note:** `--design-system` auto-reasoning kept matching noisy categories (e.g. "Vibrant & Block-based", "Real-Time / Operations Landing") because the `E-commerce` product-type rule hardcodes a bold/vibrant style regardless of query keywords. This file was assembled by hand from targeted `--domain style/color/typography/product` searches instead, to match the "modern minimal, trustworthy" direction actually chosen for SmartMart. Re-run `--design-system` freely for exploration, but don't let it silently overwrite this file — regenerate only on purpose (`--force`) and re-review against this note.

---

## Global Rules

### Color Palette

Neutral slate + single blue accent — maps directly onto Tailwind's default `slate`/`blue` scales, no custom Tailwind config needed.

| Role | Hex | CSS Variable | Tailwind equivalent |
|------|-----|--------------|----------------------|
| Primary | `#0F172A` | `--color-primary` | `slate-900` |
| On Primary | `#FFFFFF` | `--color-on-primary` | `white` |
| Secondary | `#334155` | `--color-secondary` | `slate-700` |
| Accent/CTA | `#2563EB` | `--color-accent` | `blue-600` |
| Background | `#FFFFFF` | `--color-background` | `white` |
| Foreground | `#0F172A` | `--color-foreground` | `slate-900` |
| Muted | `#F1F5F9` | `--color-muted` | `slate-100` |
| Border | `#E2E8F0` | `--color-border` | `slate-200` |
| Destructive | `#DC2626` | `--color-destructive` | `red-600` |
| Ring | `#2563EB` | `--color-ring` | `blue-600` |

**Color Notes:** Near-black slate for text/primary actions (trust, high contrast, no gimmicks), one saturated blue reserved for the single "buy/CTA" action so it never competes with anything else on the page. Source: `ui-ux-pro-max` `--domain color`, cross-checked against `B2B Service` and `Knowledge Base/Documentation` results (both scored "trustworthy/professional") and simplified to the smallest palette.

### Typography

- **Heading Font:** Inter
- **Body Font:** Inter
- **Mood:** minimal, clean, swiss, functional, neutral, professional
- **Pairing name:** "Minimal Swiss" (`ui-ux-pro-max` `--domain typography`)
- **Google Fonts:** [Inter](https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap)

**CSS Import:**
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
```

**Tailwind config:**
```js
fontFamily: { sans: ['Inter', 'sans-serif'] }
```

### Spacing Variables

| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | `4px` / `0.25rem` | Tight gaps |
| `--space-sm` | `8px` / `0.5rem` | Icon gaps, inline spacing |
| `--space-md` | `16px` / `1rem` | Standard padding |
| `--space-lg` | `24px` / `1.5rem` | Section padding |
| `--space-xl` | `32px` / `2rem` | Large gaps |
| `--space-2xl` | `48px` / `3rem` | Section margins |
| `--space-3xl` | `64px` / `4rem` | Hero padding |

### Shadow Depths

Minimal style — shadows are subtle/rare by default (`Minimalism & Swiss Style` guidance: "no box-shadow unless necessary").

| Level | Value | Usage |
|-------|-------|-------|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | Subtle lift (cards on hover only) |
| `--shadow-md` | `0 4px 6px rgba(0,0,0,0.06)` | Dropdowns, popovers |
| `--shadow-lg` | `0 10px 15px rgba(0,0,0,0.08)` | Modals |
| `--shadow-xl` | `0 20px 25px rgba(0,0,0,0.1)` | Rare — hero-level emphasis only |

---

## Component Specs

### Buttons

```css
/* Primary Button (single CTA color site-wide) */
.btn-primary {
  background: #2563EB;
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 200ms ease;
  cursor: pointer;
}

.btn-primary:hover {
  background: #1D4ED8;
}

/* Secondary Button */
.btn-secondary {
  background: transparent;
  color: #0F172A;
  border: 1px solid #E2E8F0;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 200ms ease;
  cursor: pointer;
}

.btn-secondary:hover {
  border-color: #0F172A;
}
```

### Cards

```css
.card {
  background: #FFFFFF;
  border: 1px solid #E2E8F0;
  border-radius: 12px;
  padding: 24px;
  transition: all 200ms ease;
  cursor: pointer;
}

.card:hover {
  box-shadow: var(--shadow-sm);
  border-color: #CBD5E1;
}
```

### Inputs

```css
.input {
  padding: 12px 16px;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 200ms ease;
}

.input:focus {
  border-color: #2563EB;
  outline: none;
  box-shadow: 0 0 0 3px #2563EB20;
}
```

### Modals

```css
.modal-overlay {
  background: rgba(15, 23, 42, 0.5);
  backdrop-filter: blur(4px);
}

.modal {
  background: white;
  border-radius: 16px;
  padding: 32px;
  box-shadow: var(--shadow-lg);
  max-width: 500px;
  width: 90%;
}
```

---

## Style Guidelines

**Style:** Minimalism & Swiss Style

**Keywords:** Clean, simple, spacious, functional, white space, high contrast, geometric, sans-serif, grid-based, essential

**Best For:** Enterprise apps, dashboards, professional tools — adapted here for a trust-first e-commerce storefront (product-heavy pages stay grid-based and low-decoration so product photography carries the visual weight, not chrome).

**Key Effects:** Subtle hover (200-250ms), smooth transitions, sharp/no shadows by default, clear type hierarchy, fast loading.

### Page Pattern

**Pattern Name:** Feature-Rich Showcase (E-commerce landing pattern, kept but restyled minimal — no bold blocks/gradients)

- **Conversion Strategy:** Product imagery and price are the focus; UI chrome stays out of the way. Trust signals (reviews, secure checkout badge) near the CTA, not decorative.
- **CTA Placement:** Single accent-color "Add to cart" / "Shop now" button, repeated at natural decision points (product card, product detail, sticky mobile bar) — never more than one accent-colored action visible at once.
- **Section Order (home/catalog landing):** 1. Hero (product photography + one headline + one CTA), 2. Category grid, 3. Featured/best-selling products, 4. Trust strip (reviews, shipping/returns policy), 5. Newsletter/footer.

---

## Anti-Patterns (Do NOT Use)

- ❌ Multiple competing accent colors on one screen
- ❌ Gradients, glassmorphism, or decorative shadows (contradicts "minimal, trustworthy")
- ❌ Emojis as icons — use SVG icons (Heroicons/Lucide, per `PROJECT-RULES.md`)
- ❌ Missing `cursor-pointer` on clickable elements
- ❌ Layout-shifting hover transforms
- ❌ Low contrast text — maintain 4.5:1 minimum
- ❌ Instant state changes — always transition (150–300ms)
- ❌ Invisible focus states

---

## Pre-Delivery Checklist

Before delivering any UI code, verify:

- [ ] No emojis used as icons (use SVG instead)
- [ ] All icons from one consistent icon set (Heroicons/Lucide)
- [ ] `cursor-pointer` on all clickable elements
- [ ] Hover states with smooth transitions (150-300ms)
- [ ] Text contrast 4.5:1 minimum
- [ ] Focus states visible for keyboard navigation
- [ ] `prefers-reduced-motion` respected
- [ ] Responsive: 375px, 768px, 1024px, 1440px
- [ ] No content hidden behind fixed navbars
- [ ] No horizontal scroll on mobile
- [ ] Only one accent-colored CTA visible per screen