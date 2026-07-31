# Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** SmartMart
**Category:** E-commerce
**Direction:** Trust purple + transaction green — a distinct accent pair so "brand" (purple) and "money-moving action" (green, add-to-cart/checkout) never compete for the same color.

> **Note:** This file must match `src/app/globals.css` (source of truth for the actual CSS variables shipped) and `src/app/layout.tsx` (font loading). If you regenerate this file via `--design-system`, diff the resulting palette/typography against those two files before committing — don't let either drift out of sync with the other.

---

## Global Rules

### Color Palette

| Role | Hex (light) | Hex (dark) | CSS Variable |
|------|-----|-----|--------------|
| Primary | `#7C3AED` | `#7C3AED` | `--color-primary` |
| On Primary | `#FFFFFF` | `#FFFFFF` | `--color-on-primary` |
| Secondary | `#A78BFA` | `#C4B5FD` | `--color-secondary` |
| Muted foreground | `#6D28D9` | `#C4B5FD` | `--color-muted-foreground` |
| Accent/CTA | `#16A34A` | `#16A34A` | `--color-accent` |
| Accent hover | `#15803D` | `#15803D` | `--color-accent-hover` |
| Background | `#FAF5FF` | `#2E1065` | `--color-background` |
| Foreground | `#4C1D95` | `#EDE9FE` | `--color-foreground` |
| Muted | `#ECEEF9` | `#4C1D95` | `--color-muted` |
| Border | `#DDD6FE` | `#6D28D9` | `--color-border` |
| Destructive | `#DC2626` | `#DC2626` | `--color-destructive` |
| Ring | `#7C3AED` | `#7C3AED` | `--color-ring` |

Dark-mode overrides apply via `@media (prefers-color-scheme: dark)` in `globals.css` — only the rows above with a different dark value actually change; the rest hold their light value in both themes (accent/CTA stays green either way, so "add to cart" reads identically in light/dark).

**Color Notes:** Purple carries brand/trust (primary actions, headings, focus ring); green is reserved *only* for the money-moving CTA (add-to-cart, checkout, confirm) so it's never ambiguous which button actually charges the user or commits an order. `--color-secondary` (`#A78BFA`/light-lavender) is decorative only — it fails 4.5:1 contrast on the light background, so body/secondary text uses `--color-muted-foreground` instead.

### Typography

- **Heading Font:** Rubik (`--font-rubik`, loaded via `next/font/google` in `layout.tsx`)
- **Body Font:** Nunito Sans (`--font-nunito-sans`, loaded via `next/font/google` in `layout.tsx`)
- **Mood:** ecommerce, clean, shopping, product, retail, conversion
- **Google Fonts:** [Rubik + Nunito Sans](https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@300;400;500;600;700&family=Rubik:wght@300;400;500;600;700&display=swap)

Fonts are loaded through `next/font/google` (self-hosted, zero layout shift) rather than a `<link>`/`@import` — see `src/app/layout.tsx`. Tailwind consumes them via `--font-sans: var(--font-nunito-sans)` / `--font-heading: var(--font-rubik)` in the `@theme inline` block of `globals.css`.

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

| Level | Value | Usage |
|-------|-------|-------|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | Subtle lift |
| `--shadow-md` | `0 4px 6px rgba(0,0,0,0.1)` | Cards, buttons |
| `--shadow-lg` | `0 10px 15px rgba(0,0,0,0.1)` | Modals, dropdowns |
| `--shadow-xl` | `0 20px 25px rgba(0,0,0,0.15)` | Hero images, featured cards |

---

## Component Specs

Use the CSS variables above, not hardcoded hex — component examples below reference them directly so they stay correct if the palette is retuned.

### Buttons

```css
/* Primary Button (money-moving CTA — add to cart, checkout, confirm) */
.btn-primary {
  background: var(--color-accent);
  color: var(--color-on-primary);
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 200ms ease;
  cursor: pointer;
}

.btn-primary:hover {
  background: var(--color-accent-hover);
}

/* Secondary Button (brand/navigation actions) */
.btn-secondary {
  background: transparent;
  color: var(--color-primary);
  border: 2px solid var(--color-primary);
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 200ms ease;
  cursor: pointer;
}

.btn-secondary:hover {
  background: var(--color-muted);
}
```

### Cards

```css
.card {
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 24px;
  transition: all 200ms ease;
  cursor: pointer;
}

.card:hover {
  box-shadow: var(--shadow-md);
  border-color: var(--color-secondary);
}
```

### Inputs

```css
.input {
  padding: 12px 16px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 200ms ease;
}

.input:focus {
  border-color: var(--color-ring);
  outline: none;
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-ring) 20%, transparent);
}
```

### Modals

```css
.modal-overlay {
  background: rgba(76, 29, 149, 0.5);
  backdrop-filter: blur(4px);
}

.modal {
  background: var(--color-background);
  border-radius: 16px;
  padding: 32px;
  box-shadow: var(--shadow-lg);
  max-width: 500px;
  width: 90%;
}
```

---

## Style Guidelines

**Style:** E-commerce conversion-focused — product photography and price carry the visual weight; UI chrome (borders, shadows) stays light so it never competes with product imagery.

**Keywords:** Clean, conversion-oriented, product-forward, one CTA color, purple brand accent, green transaction accent, grid-based, approachable.

**Best For:** Product listing/detail pages, cart, checkout — anywhere the user needs one unambiguous "next action" button.

**Key Effects:** Subtle hover (200–250ms), smooth transitions, soft shadows on hover only, clear type hierarchy, fast loading.

### Page Pattern

**Pattern Name:** Feature-Rich Showcase (E-commerce landing pattern)

- **Conversion Strategy:** Product imagery and price are the focus; the green accent appears only on the single "buy" action per screen. Trust signals (reviews, secure checkout badge) sit near the CTA, not as decoration.
- **CTA Placement:** Single green "Add to cart"/"Checkout" button, repeated at natural decision points (product card, product detail, sticky mobile bar) — never more than one green action visible at once. Purple is for navigation/secondary actions and brand elements (logo, active nav state, focus ring).
- **Section Order (home/catalog landing):** 1. Hero (product photography + one headline + one CTA), 2. Category grid, 3. Featured/best-selling products, 4. Trust strip (reviews, shipping/returns policy), 5. Newsletter/footer.

---

## Anti-Patterns (Do NOT Use)

- ❌ Green used for anything other than the single money-moving CTA per screen
- ❌ Multiple competing accent colors on one screen
- ❌ Gradients, glassmorphism, or decorative shadows beyond the tokens above
- ❌ Emojis as icons — use SVG icons (Heroicons/Lucide, per `PROJECT-RULES.md`)
- ❌ Missing `cursor-pointer` on clickable elements
- ❌ Layout-shifting hover transforms
- ❌ Low contrast text — maintain 4.5:1 minimum (use `--color-muted-foreground`, not `--color-secondary`, for body text)
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
- [ ] Only one green (accent) CTA visible per screen
