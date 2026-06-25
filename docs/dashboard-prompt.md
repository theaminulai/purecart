# Dashboard Design Prompt — Woo Digital Downloads Admin

## Project Context

You are building the **admin dashboard** for `woo-digital-downloads` — a WooCommerce extension that sells WordPress plugins and SaaS products. The dashboard is a **WordPress plugin admin page** rendered as a full React SPA mounted inside the WordPress admin layout (the WP sidebar and top bar are already rendered by WordPress; this React app fills the `#wdd-admin-root` div inside the content area).

The plugin has **10 independent feature modules**, each with its own admin section. Modules that are disabled should still show in the sidebar but render a "Module disabled — enable in Settings" placeholder instead of real data.

---

## Tech Stack (Strict)

| Layer | Technology |
|---|---|
| UI Framework | React 18 (functional components + hooks only — no class components) |
| Routing | React Router v6 (`createHashRouter` — hash router inside WordPress admin) |
| Global State | Context API only (no Redux, no Zustand) — one `AppContext` for global, separate context per module |
| Styling | SCSS with **BEM methodology**. Design language follows **Material Design 3 (Google)** principles — implemented from scratch. **Do NOT install or import MUI, @mui/material, or any Material UI library.** |
| HTTP | Native `fetch` calling WP REST API endpoints under `/wp-json/wdd/v1/` |
| Charts | Recharts |
| Icons | Lucide React |
| Build | WordPress Scripts (`@wordpress/scripts`) → `assets/js/admin.js` + `assets/css/admin.css` |

---

## Design System: Material Design 3 (Custom SCSS Implementation)

Follow Material Design 3 principles exactly, but implement every rule yourself in SCSS. No MUI library. No Material Web Components. Pure custom code.

### Reference
- Spec: https://m3.material.io
- Design tokens: https://m3.material.io/foundations/design-tokens/overview
- Components: https://m3.material.io/components

---

### MD3 Color System (`_variables.scss`)

Material Design 3 uses a **role-based color system**, not raw hex values in components. Define roles first, use roles in components — never raw hex.

```scss
// ─── Seed color ─────────────────────────────────────────────
// Primary brand hue: purple-indigo
// Generate a tonal palette from this seed (manually derived):

// Primary tones
$md-primary:            #6750A4;   // Primary (key color)
$md-on-primary:         #FFFFFF;
$md-primary-container:  #EADDFF;   // light tinted container
$md-on-primary-container: #21005D;

// Secondary tones
$md-secondary:          #625B71;
$md-on-secondary:       #FFFFFF;
$md-secondary-container: #E8DEF8;
$md-on-secondary-container: #1D192B;

// Tertiary tones
$md-tertiary:           #7D5260;
$md-on-tertiary:        #FFFFFF;
$md-tertiary-container: #FFD8E4;
$md-on-tertiary-container: #31111D;

// Error tones
$md-error:              #B3261E;
$md-on-error:           #FFFFFF;
$md-error-container:    #F9DEDC;
$md-on-error-container: #410E0B;

// Surface tones (light scheme)
$md-surface:            #FFFBFE;   // page background
$md-surface-dim:        #DED8E1;
$md-surface-bright:     #FFFBFE;
$md-surface-container-lowest:  #FFFFFF;
$md-surface-container-low:     #F7F2FA;
$md-surface-container:         #F3EDF7;
$md-surface-container-high:    #ECE6F0;
$md-surface-container-highest: #E6E0E9;
$md-on-surface:         #1C1B1F;
$md-on-surface-variant: #49454F;

// Outline
$md-outline:            #79747E;
$md-outline-variant:    #CAC4D0;

// Inverse
$md-inverse-surface:    #313033;
$md-inverse-on-surface: #F4EFF4;
$md-inverse-primary:    #D0BCFF;

// ─── Semantic / Status colors (custom extensions) ───────────
$md-status-success:           #386A20;
$md-status-success-container: #B7F397;
$md-status-warning:           #7A5900;
$md-status-warning-container: #FFDEA6;
$md-status-info:              #00629D;
$md-status-info-container:    #CDE5FF;
```

---

### MD3 Typography Scale (`_typography.scss`)

Material Design 3 defines 15 type roles. Use `Roboto` (loaded via Google Fonts or self-hosted). Apply these as SCSS `%placeholder` selectors or `@mixin` so BEM elements extend them.

```scss
@import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap');

$font-family-base: 'Roboto', sans-serif;

// Display
%type-display-large  { font: 400 57px/64px $font-family-base; letter-spacing: -0.25px; }
%type-display-medium { font: 400 45px/52px $font-family-base; letter-spacing: 0; }
%type-display-small  { font: 400 36px/44px $font-family-base; letter-spacing: 0; }

// Headline
%type-headline-large  { font: 400 32px/40px $font-family-base; letter-spacing: 0; }
%type-headline-medium { font: 400 28px/36px $font-family-base; letter-spacing: 0; }
%type-headline-small  { font: 400 24px/32px $font-family-base; letter-spacing: 0; }

// Title
%type-title-large  { font: 400 22px/28px $font-family-base; letter-spacing: 0; }
%type-title-medium { font: 500 16px/24px $font-family-base; letter-spacing: 0.15px; }
%type-title-small  { font: 500 14px/20px $font-family-base; letter-spacing: 0.1px; }

// Label
%type-label-large  { font: 500 14px/20px $font-family-base; letter-spacing: 0.1px; }
%type-label-medium { font: 500 12px/16px $font-family-base; letter-spacing: 0.5px; }
%type-label-small  { font: 500 11px/16px $font-family-base; letter-spacing: 0.5px; }

// Body
%type-body-large  { font: 400 16px/24px $font-family-base; letter-spacing: 0.5px; }
%type-body-medium { font: 400 14px/20px $font-family-base; letter-spacing: 0.25px; }
%type-body-small  { font: 400 12px/16px $font-family-base; letter-spacing: 0.4px; }
```

**Usage rule:** Every text element in every component must use one of these 15 type roles. No arbitrary font-size values allowed.

---

### MD3 Spacing & Layout Grid

Material Design 3 uses an **8px base grid**. Every spacing value must be a multiple of 4px (4, 8, 12, 16, 20, 24, 32, 40, 48, 56, 64).

```scss
// _spacing.scss
$space-1:  4px;
$space-2:  8px;
$space-3:  12px;
$space-4:  16px;
$space-5:  20px;
$space-6:  24px;
$space-8:  32px;
$space-10: 40px;
$space-12: 48px;
$space-16: 64px;

// Layout
$layout-sidebar-width:          256px;
$layout-sidebar-collapsed-width: 80px;
$layout-topbar-height:           64px;
$layout-content-padding:         $space-6; // 24px
$layout-card-border-radius:      12px;     // MD3 card uses 12px
$layout-page-max-width:          1440px;
```

---

### MD3 Elevation System

Material Design 3 uses **surface tones + shadow** to express elevation. Higher elevation = lighter tinted surface (primary color overlay) + deeper shadow.

Define as SCSS mixins:

```scss
// _elevation.scss

// MD3: elevation expressed as tonal surface + box-shadow
// Level 0 → Level 5

@mixin md-elevation-0 {
  background-color: $md-surface;
  box-shadow: none;
}

@mixin md-elevation-1 {
  // surface + 5% primary overlay
  background-color: color-mix(in srgb, $md-primary 5%, $md-surface);
  box-shadow: 0 1px 2px rgba(0,0,0,.3), 0 1px 3px 1px rgba(0,0,0,.15);
}

@mixin md-elevation-2 {
  // surface + 8% primary overlay
  background-color: color-mix(in srgb, $md-primary 8%, $md-surface);
  box-shadow: 0 1px 2px rgba(0,0,0,.3), 0 2px 6px 2px rgba(0,0,0,.15);
}

@mixin md-elevation-3 {
  // surface + 11% primary overlay
  background-color: color-mix(in srgb, $md-primary 11%, $md-surface);
  box-shadow: 0 4px 8px 3px rgba(0,0,0,.15), 0 1px 3px rgba(0,0,0,.3);
}

@mixin md-elevation-4 {
  background-color: color-mix(in srgb, $md-primary 12%, $md-surface);
  box-shadow: 0 6px 10px 4px rgba(0,0,0,.15), 0 2px 3px rgba(0,0,0,.3);
}

@mixin md-elevation-5 {
  background-color: color-mix(in srgb, $md-primary 14%, $md-surface);
  box-shadow: 0 8px 12px 6px rgba(0,0,0,.15), 0 4px 4px rgba(0,0,0,.3);
}
```

**Which elevation for which component:**

| Component | Elevation |
|---|---|
| Page background | 0 |
| Cards (resting) | 1 |
| Cards (hovered) | 2 |
| Sidebar / Navigation Drawer | 1 |
| Top App Bar (scrolled) | 2 |
| Dialogs / Modals | 3 |
| Drawers | 1 |
| Menus / Dropdowns | 2 |
| Tooltips | 2 |
| FAB (Floating Action Button) | 3 |

---

### MD3 Shape System

```scss
// _shape.scss
// MD3 shape scale: none → full

$shape-none:        0;
$shape-extra-small: 4px;
$shape-small:       8px;
$shape-medium:      12px;    // cards, dialogs
$shape-large:       16px;    // drawers, side sheets
$shape-extra-large: 28px;    // large cards, bottom sheets
$shape-full:        9999px;  // pills, FABs, chips
```

Apply per component:
- **Cards:** `border-radius: $shape-medium` (12px)
- **Buttons (filled/tonal/outlined):** `border-radius: $shape-full` (pill)
- **Text fields:** `border-radius: $shape-extra-small $shape-extra-small 0 0` (top-rounded, underline style)
- **Chips:** `border-radius: $shape-small` (8px)
- **Dialogs:** `border-radius: $shape-extra-large` (28px)
- **Snackbars/Toasts:** `border-radius: $shape-extra-small` (4px)
- **Navigation Drawer:** `border-radius: 0 $shape-large $shape-large 0` (right side only)

---

### MD3 State Layer System (Ripple + Hover + Focus)

MD3 components communicate interaction through **state layers** — a semi-transparent overlay using the component's content color at specific opacity:

```scss
// _states.scss

// State layer opacities (MD3 spec)
$state-hover-opacity:   0.08;
$state-focus-opacity:   0.12;
$state-pressed-opacity: 0.12;
$state-dragged-opacity: 0.16;

// Mixin: adds a ::before pseudo-element as the state layer
@mixin md-state-layer($color: currentColor) {
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background-color: $color;
    opacity: 0;
    border-radius: inherit;
    transition: opacity 200ms cubic-bezier(0.2, 0, 0, 1);
    pointer-events: none;
  }

  &:hover::before   { opacity: $state-hover-opacity; }
  &:focus::before   { opacity: $state-focus-opacity; }
  &:active::before  { opacity: $state-pressed-opacity; }
}

// Ripple: JS-driven ink ripple for click (attach via useRipple hook)
// The ripple element is injected by useRipple as a <span class="ripple__ink">
.ripple {
  &__ink {
    position: absolute;
    border-radius: $shape-full;
    background-color: currentColor;
    opacity: 0.12;
    transform: scale(0);
    animation: ripple-expand 400ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
    pointer-events: none;
  }
}

@keyframes ripple-expand {
  to { transform: scale(4); opacity: 0; }
}
```

**`useRipple` hook:** On `mousedown`, compute the click position relative to the element, inject a `<span>` at that position sized to cover the element, let the animation play, then remove the span.

---

### MD3 Button Variants

MD3 defines 5 button types. Implement all 5:

```
Filled       → filled with $md-primary, text $md-on-primary
Tonal        → filled with $md-secondary-container, text $md-on-secondary-container
Outlined     → transparent bg, $md-outline border, text $md-primary
Text         → no bg, no border, text $md-primary
Elevated     → md-elevation-1 bg, text $md-primary
```

BEM:
```scss
.btn { } // base: pill shape, label-large type, padding 24px horizontal 10px vertical, transition

.btn--filled   { background: $md-primary; color: $md-on-primary; }
.btn--tonal    { background: $md-secondary-container; color: $md-on-secondary-container; }
.btn--outlined { background: transparent; border: 1px solid $md-outline; color: $md-primary; }
.btn--text     { background: transparent; color: $md-primary; }
.btn--elevated { @include md-elevation-1; color: $md-primary; }

.btn--small  { padding: $space-1 $space-4; @extend %type-label-medium; }
.btn--large  { padding: $space-3 $space-8; }
.btn--icon   { width: 40px; height: 40px; border-radius: $shape-full; padding: 0; }

.btn--danger { background: $md-error; color: $md-on-error; }
.btn--danger.btn--outlined { border-color: $md-error; color: $md-error; background: transparent; }
```

All buttons must include `@include md-state-layer` and `useRipple` hook.

---

### MD3 Card Variants

MD3 defines 3 card types:

```scss
.card { border-radius: $shape-medium; overflow: hidden; }                   // base

.card--elevated  { @include md-elevation-1; &:hover { @include md-elevation-2; } }
.card--filled    { background: $md-surface-container-highest; box-shadow: none; }
.card--outlined  { background: $md-surface; border: 1px solid $md-outline-variant; box-shadow: none; }

.card__header    { padding: $space-4 $space-4 0; }
.card__media     { width: 100%; }
.card__content   { padding: $space-4; @extend %type-body-medium; }
.card__actions   { padding: $space-2 $space-4 $space-4; display: flex; gap: $space-2; }
```

**Dashboard uses: Elevated cards.** Stats cards, data panels, chart containers = `.card--elevated`.

---

### MD3 Navigation Drawer (Sidebar)

The sidebar is an MD3 **Modal Navigation Drawer** on mobile and a **Standard Navigation Drawer** (always visible) on desktop.

```scss
.nav-drawer {
  width: $layout-sidebar-width;
  border-radius: 0 $shape-large $shape-large 0;  // MD3 drawer shape
  @include md-elevation-1;
  background: $md-surface-container-low;
  display: flex;
  flex-direction: column;
  padding: $space-3 0;

  &__headline {
    padding: $space-4 $space-6;
    @extend %type-title-small;
    color: $md-on-surface-variant;
  }

  &__section { margin-bottom: $space-2; }
}

// MD3 Navigation Item
.nav-item {
  display: flex;
  align-items: center;
  gap: $space-3;
  height: 56px;
  padding: 0 $space-6 0 $space-4;
  border-radius: $shape-full;           // MD3: active indicator is pill-shaped
  margin: 0 $space-3;
  cursor: pointer;
  transition: background 200ms;
  @extend %type-label-large;
  color: $md-on-surface-variant;
  @include md-state-layer($md-on-surface);

  &__icon   { width: 24px; height: 24px; flex-shrink: 0; }
  &__label  { flex: 1; }
  &__badge  { }  // notification count

  // Active state: MD3 active indicator
  &--active {
    background: $md-secondary-container;
    color: $md-on-secondary-container;

    .nav-item__icon { color: $md-on-secondary-container; }
  }

  &--disabled {
    opacity: 0.38;
    pointer-events: none;
  }
}
```

---

### MD3 Top App Bar

```scss
.top-app-bar {
  height: $layout-topbar-height;
  display: flex;
  align-items: center;
  padding: 0 $space-4;
  gap: $space-2;
  background: $md-surface;
  transition: box-shadow 200ms;

  &--scrolled { @include md-elevation-2; }

  &__leading    { display: flex; align-items: center; gap: $space-2; }
  &__headline   { flex: 1; @extend %type-title-large; color: $md-on-surface; }
  &__trailing   { display: flex; align-items: center; gap: $space-1; }
}
```

---

### MD3 Data Table

MD3 tables have: column header row with `on-surface-variant` text, data rows with dividers, optional row selection checkboxes, hover state layer.

```scss
.data-table {
  width: 100%;
  border-collapse: collapse;
  background: $md-surface-container-lowest;
  border-radius: $shape-medium;
  overflow: hidden;

  &__head { background: $md-surface-container; }

  &__th {
    padding: $space-3 $space-4;
    @extend %type-label-medium;
    color: $md-on-surface-variant;
    text-align: left;
    border-bottom: 1px solid $md-outline-variant;
    white-space: nowrap;
  }

  &__row {
    border-bottom: 1px solid $md-outline-variant;
    @include md-state-layer($md-on-surface);
    transition: background 150ms;
    cursor: pointer;

    &--selected {
      background: color-mix(in srgb, $md-primary 8%, $md-surface);
    }

    &:last-child { border-bottom: none; }
  }

  &__td {
    padding: $space-3 $space-4;
    @extend %type-body-medium;
    color: $md-on-surface;
    vertical-align: middle;
  }

  &__td--mono { font-family: 'Roboto Mono', monospace; @extend %type-body-small; }
  &__td--actions { text-align: right; white-space: nowrap; }
}
```

---

### MD3 Chips (Filter Chips)

Used in FiltersBar and status filters:

```scss
.chip {
  display: inline-flex;
  align-items: center;
  gap: $space-2;
  height: 32px;
  padding: 0 $space-4;
  border-radius: $shape-small;
  border: 1px solid $md-outline;
  background: transparent;
  @extend %type-label-large;
  color: $md-on-surface-variant;
  cursor: pointer;
  @include md-state-layer($md-on-surface);

  &--selected {
    background: $md-secondary-container;
    border-color: transparent;
    color: $md-on-secondary-container;
  }

  &__icon { width: 18px; height: 18px; }
  &__label { }
  &__trailing-icon { width: 18px; height: 18px; } // remove icon
}
```

---

### MD3 Text Fields

Use **Filled** text fields (not outlined) as the default inside forms. Outlined is used in dialogs/modals.

```scss
.text-field {
  position: relative;
  display: flex;
  flex-direction: column;

  // Filled variant (default)
  &__container {
    background: $md-surface-container-highest;
    border-radius: $shape-extra-small $shape-extra-small 0 0;
    padding: $space-4 $space-4 $space-2;
    border-bottom: 1px solid $md-on-surface-variant;
    transition: border-color 200ms;
  }

  &__label {
    @extend %type-body-small;
    color: $md-on-surface-variant;
    margin-bottom: $space-1;
  }

  &__input {
    background: transparent;
    border: none;
    outline: none;
    width: 100%;
    @extend %type-body-large;
    color: $md-on-surface;
  }

  // Active line indicator
  &__container::after {
    content: '';
    position: absolute;
    bottom: 0; left: 0; right: 0;
    height: 2px;
    background: $md-primary;
    transform: scaleX(0);
    transition: transform 200ms cubic-bezier(0.4, 0, 0.2, 1);
  }

  &:focus-within &__container::after { transform: scaleX(1); }
  &:focus-within &__container { border-color: $md-primary; }

  &__supporting-text {
    @extend %type-body-small;
    color: $md-on-surface-variant;
    padding: $space-1 $space-4 0;
  }

  &--error &__container { border-color: $md-error; }
  &--error &__label { color: $md-error; }
}
```

---

### MD3 Dialogs (Modals)

```scss
.dialog {
  border-radius: $shape-extra-large;    // 28px — MD3 dialog shape
  @include md-elevation-3;
  background: $md-surface-container-high;
  max-width: 560px;
  width: 100%;
  padding: $space-6;

  &__icon    { text-align: center; margin-bottom: $space-4; color: $md-secondary; }
  &__headline {
    @extend %type-headline-small;
    color: $md-on-surface;
    margin-bottom: $space-4;
  }
  &__body {
    @extend %type-body-medium;
    color: $md-on-surface-variant;
    margin-bottom: $space-6;
  }
  &__actions {
    display: flex;
    justify-content: flex-end;
    gap: $space-2;
  }
}

// Scrim (backdrop)
.dialog-scrim {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.32);   // MD3 scrim opacity
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
}
```

---

### MD3 Snackbar (Toast Notifications)

```scss
.snackbar {
  display: flex;
  align-items: center;
  gap: $space-4;
  min-width: 344px;
  max-width: 672px;
  padding: $space-4 $space-6;
  border-radius: $shape-extra-small;   // 4px — MD3 snackbar
  background: $md-inverse-surface;
  color: $md-inverse-on-surface;
  @include md-elevation-3;
  @extend %type-body-medium;

  &__action {
    @extend %type-label-large;
    color: $md-inverse-primary;
    background: none;
    border: none;
    cursor: pointer;
    margin-left: auto;
    flex-shrink: 0;
  }
}

.snackbar-container {
  position: fixed;
  bottom: $space-6;
  left: 50%;
  transform: translateX(-50%);
  z-index: 200;
  display: flex;
  flex-direction: column;
  gap: $space-2;
}
```

---

### MD3 Status Chips (StatusBadge component)

```scss
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: $space-1;
  padding: $space-1 $space-3;
  border-radius: $shape-small;
  @extend %type-label-medium;

  &--active    { background: $md-status-success-container; color: $md-status-success; }
  &--expired   { background: $md-error-container; color: $md-error; }
  &--suspended { background: $md-status-warning-container; color: $md-status-warning; }
  &--cancelled { background: $md-surface-container-highest; color: $md-on-surface-variant; }
  &--paused    { background: $md-secondary-container; color: $md-on-secondary-container; }
  &--pending   { background: $md-status-info-container; color: $md-status-info; }
  &--revoked   { background: $md-error-container; color: $md-on-error-container; }
  &--trialing  { background: $md-tertiary-container; color: $md-on-tertiary-container; }
  &--past-due  { background: $md-status-warning-container; color: $md-status-warning; }
}
```

---

### MD3 Progress Indicators

Use **linear progress** for page-level loading, **circular progress** for inline/button loading.

```scss
.linear-progress {
  height: 4px;
  background: $md-surface-container-highest;
  border-radius: $shape-full;
  overflow: hidden;

  &__bar {
    height: 100%;
    background: $md-primary;
    border-radius: $shape-full;
    transition: width 400ms cubic-bezier(0.4, 0, 0.2, 1);
  }

  // Indeterminate
  &--indeterminate &__bar {
    width: 40%;
    animation: linear-progress-indeterminate 1.5s ease-in-out infinite;
  }
}

@keyframes linear-progress-indeterminate {
  0%   { transform: translateX(-100%); }
  100% { transform: translateX(350%); }
}
```

---

### MD3 Skeleton / Loading Placeholder

```scss
@keyframes skeleton-shimmer {
  0%   { background-position: -400px 0; }
  100% { background-position: 400px 0; }
}

%skeleton-base {
  background: linear-gradient(
    90deg,
    $md-surface-container-high 25%,
    $md-surface-container-highest 50%,
    $md-surface-container-high 75%
  );
  background-size: 800px 100%;
  animation: skeleton-shimmer 1.5s ease-in-out infinite;
  border-radius: $shape-extra-small;
}

.skeleton {
  @extend %skeleton-base;

  &--text   { height: 14px; width: 100%; margin-bottom: $space-2; }
  &--title  { height: 20px; width: 60%; margin-bottom: $space-3; }
  &--card   { height: 120px; border-radius: $shape-medium; }
  &--avatar { width: 40px; height: 40px; border-radius: $shape-full; }
  &--row    { height: 52px; border-radius: 0; border-bottom: 1px solid $md-outline-variant; }
}
```

---

### MD3 FAB (Floating Action Button)

Used for primary actions on each page (e.g., "Upload Version", "Generate Payout").

```scss
.fab {
  display: inline-flex;
  align-items: center;
  gap: $space-3;
  height: 56px;
  padding: 0 $space-5;
  border-radius: $shape-large;  // 16px — MD3 FAB
  @include md-elevation-3;
  background: $md-primary-container;
  color: $md-on-primary-container;
  @extend %type-label-large;
  @include md-state-layer($md-on-primary-container);
  cursor: pointer;

  &__icon { width: 24px; height: 24px; }

  // Small FAB
  &--small { height: 40px; padding: 0 $space-4; border-radius: $shape-medium; }

  // Large FAB
  &--large { height: 96px; width: 96px; border-radius: $shape-extra-large; padding: 0; justify-content: center; }
}
```

---

## SCSS / BEM Rules

Apply these rules strictly throughout every component:

1. **Block** = the component root (`.license-card`, `.stats-card`, `.data-table`)
2. **Element** = a part of the block (`.license-card__header`, `.stats-card__value`)
3. **Modifier** = a variant or state (`.license-card--expired`, `.btn--filled`)
4. **One SCSS file per component**, imported into `main.scss`
5. **No nesting deeper than 3 levels** inside a block
6. **State classes** use BEM modifier: `.btn--is-loading`, `.nav-item--active`
7. **Utility classes** for spacing only: `.u-mt-4` = `margin-top: $space-4`
8. **Never use `!important`** — solve specificity through BEM
9. **All spacing values** must come from the `$space-*` scale — no arbitrary px values
10. **All font styles** must use one of the 15 MD3 type role `%placeholder` extends
11. **All border-radius values** must come from the `$shape-*` scale
12. **All elevation** applied via `@include md-elevation-N` mixins only
13. **All interactive elements** must include `@include md-state-layer` and the `useRipple` hook

---

## Context API Architecture

### `AppContext` — Global (wrap entire app)

```js
{
  // Loaded from /wp-json/wdd/v1/settings
  activeModules: ['downloads', 'licensing', 'updates', 'subscriptions', 'saas', 'security', 'analytics', 'affiliates', 'abandoned-cart'],
  siteUrl: 'https://example.com',
  pluginVersion: '1.0.0',
  currentUser: { id, name, email, capabilities },

  // UI state
  sidebarCollapsed: false,
  setSidebarCollapsed: fn,

  // Notification toasts
  toasts: [],
  addToast: fn,   // addToast({ type: 'success'|'error'|'warning', message, duration })
  removeToast: fn,
}
```

### `LicenseContext` — License module pages only

```js
{
  licenses: [],
  totalPages: 0,
  currentPage: 1,
  filters: { status: '', product: '', search: '' },
  setFilters: fn,
  isLoading: bool,
  selectedLicenses: [],    // for bulk actions
  toggleSelect: fn,
  selectAll: fn,
  fetchLicenses: fn,
  revokeLicense: fn,
  exportCsv: fn,
}
```

### `SubscriptionContext` — Subscriptions module pages only

```js
{
  subscriptions: [],
  filters: { status: '', product: '', dateFrom: '', dateTo: '' },
  setFilters: fn,
  isLoading: bool,
  fetchSubscriptions: fn,
  cancelSubscription: fn,
  pauseSubscription: fn,
  resumeSubscription: fn,
  triggerRenewal: fn,
}
```

### `AnalyticsContext` — Analytics pages only

```js
{
  dateRange: '30d',   // '7d' | '30d' | '90d' | '12m' | 'custom'
  setDateRange: fn,
  customFrom: '',
  customTo: '',
  metricsLoading: bool,
  revenueData: {},
  licenseData: {},
  downloadData: {},
}
```

---

## Routing Structure (React Router v6 — Hash Router)

```
/#/                           → redirect to /#/dashboard
/#/dashboard                  → <DashboardPage />
/#/licenses                   → <LicensesPage />
/#/licenses/:id               → <LicenseDetailPage />
/#/downloads                  → <DownloadsPage />
/#/downloads/tokens           → <TokensPage />
/#/updates                    → <UpdatesPage />
/#/updates/versions/:productId → <VersionHistoryPage />
/#/subscriptions              → <SubscriptionsPage />
/#/subscriptions/:id          → <SubscriptionDetailPage />
/#/saas                       → <SaaSAccountsPage />
/#/affiliates                 → <AffiliatesPage />
/#/affiliates/commissions     → <CommissionsPage />
/#/affiliates/payouts         → <PayoutsPage />
/#/abandoned-cart             → <AbandonedCartPage />
/#/security                   → <SecurityPage />
/#/analytics                  → <AnalyticsPage />
/#/settings                   → <SettingsPage />
/#/settings/:tab              → <SettingsPage activeTab={tab} />
```

All routes are wrapped in `<PrivateRoute>` which checks `currentUser.capabilities.manage_woocommerce`. If false, render `<AccessDenied />`.

---

## Global Layout

```
<AppLayout>
  ├── <Sidebar />                  // fixed left nav, collapsible
  │     ├── <SidebarLogo />
  │     ├── <SidebarNav />         // nav items from modules list
  │     └── <SidebarFooter />      // plugin version, help link
  ├── <TopBar />                   // page title, breadcrumbs, quick actions
  └── <MainContent>
        <Outlet />                 // React Router outlet
  </MainContent>
  <ToastContainer />               // global toast notifications
</AppLayout>
```

### Sidebar nav items (in order)

| Icon | Label | Route | Module Required |
|---|---|---|---|
| LayoutDashboard | Overview | /dashboard | always |
| Key | Licenses | /licenses | licensing |
| Download | Downloads | /downloads | downloads |
| RefreshCw | Updates | /updates | updates |
| Repeat | Subscriptions | /subscriptions | subscriptions |
| Cloud | SaaS Accounts | /saas | saas |
| Users | Affiliates | /affiliates | affiliates |
| ShoppingCart | Abandoned Cart | /abandoned-cart | abandoned-cart |
| Shield | Security | /security | security |
| BarChart2 | Analytics | /analytics | analytics |
| Settings | Settings | /settings | always |

Disabled modules show the nav item with a lock icon and `--disabled` modifier. Clicking navigates to the page but shows a `<ModuleDisabled>` component with an "Enable Module" button that links to the Settings page.

---

## Page Specifications

---

### 1. Dashboard Overview (`/dashboard`)

**Purpose:** Single-glance health of the entire plugin.

**Layout:** 4-column stat cards row → 2-column charts row → 3-column activity panels.

**Stat Cards (StatsCard component):**

```
┌────────────────┐ ┌────────────────┐ ┌────────────────┐ ┌────────────────┐
│  Active        │ │  MRR           │ │  Downloads     │ │  Expiring      │
│  Licenses      │ │                │ │  This Month    │ │  Soon (30d)    │
│  1,847         │ │  $12,400       │ │  6,234         │ │  143           │
│  ▲ +124        │ │  ▲ +$300       │ │  ▼ -3%         │ │  ⚠ action needed│
└────────────────┘ └────────────────┘ └────────────────┘ └────────────────┘
```

BEM: `.stats-card`, `.stats-card__value`, `.stats-card__label`, `.stats-card__trend`, `.stats-card__trend--up`, `.stats-card__trend--down`, `.stats-card--warning`

**Charts Row:**
- Left (60%): `MrrTrendChart` — Recharts LineChart, 12-month MRR + ARR trend
- Right (40%): `LicenseStatusChart` — Recharts PieChart, active/expired/suspended/revoked

**Activity Panels:**
- `RecentLicenses` — last 10 licenses issued, with status badge + product name
- `RecentDownloads` — last 10 download events, IP, country flag, product
- `ExpiringLicenses` — next 10 licenses expiring, sorted by date, "Send reminder" quick action

---

### 2. Licenses (`/licenses`)

**Purpose:** Full license management table.

**Top Bar:** Page title + "Export CSV" button + "Revoke Selected" bulk action (appears when rows selected).

**Filters Bar (FiltersBar component):**
- Search input (by license key or customer email)
- Status dropdown: All / Active / Expired / Revoked / Suspended
- Product dropdown: populated from API
- Date range picker

**Table (DataTable component):**

| # | License Key | Customer | Product | Plan | Sites | Status | Expires | Actions |
|---|---|---|---|---|---|---|---|---|
| ☐ | A1B2-... (click to copy) | john@email.com | My Plugin | Single | 1/1 | Active | 24 Jun 2027 | View · Revoke |

- Status column: `<StatusBadge>` component with BEM modifiers (`.status-badge--active`, `--expired`, `--revoked`, `--suspended`)
- License key: truncated, click to copy full key (toast confirmation)
- Pagination: `<Pagination>` component, 20 per page
- Clicking a row navigates to `/licenses/:id`
- Checkbox column enables bulk select → shows bulk action bar

BEM example:
```scss
.data-table { }
.data-table__header { }
.data-table__row { }
.data-table__row--selected { }
.data-table__cell { }
.data-table__cell--key { font-family: monospace; }
.data-table__cell--actions { }
```

---

### 3. License Detail (`/licenses/:id`)

**Layout:** 2-column — left: license info card, right: activation records + log.

**Left column:**
- License key (large monospace, copy button)
- Status badge
- Customer name + email + avatar initial
- Product name + type badge (wdd_plugin / wdd_saas / wdd_bundle)
- Plan type badge
- Activation limit / sites used progress bar
- Expires at (or "Lifetime")
- Created at
- Actions: Revoke, Extend Expiry (date picker modal), Reset Activations

**Right column (tabs):**
- **Activations tab:** Table of activated domains — domain, environment badge (production/staging/local), IP, activated at, deactivate button
- **Event Log tab:** Chronological list of events — activation, deactivation, revocation, expiry check — with timestamps

---

### 4. Downloads (`/downloads`)

**Purpose:** View and manage download tokens.

**Tab nav:** Tokens | Logs

**Tokens tab — table:**

| Token (truncated) | Customer | Product | Downloads | Limit | Expires | Status | Actions |
|---|---|---|---|---|---|---|---|
| 3fa2... | jane@x.com | My Plugin v1.3 | 2/3 | 3 | 24h | Active | Revoke |

**Logs tab — table:**
- Download event log: token (link), product, version, IP, country (flag icon), user agent, downloaded at

**Stat cards at top:**
- Total tokens issued
- Active tokens
- Downloads today
- Failed attempts (security indicator, shown in warning color if > 0)

---

### 5. Plugin Updates (`/updates`)

**Purpose:** Manage product versions and update delivery.

**Left panel: Product list** — product name, latest version, total downloads, release channel toggle (stable/beta).

**Right panel: Version history for selected product** (`/updates/versions/:productId`)

Table:
| Version | Channel | Released | Downloads | SHA-256 (truncated) | Changelog | Actions |
|---|---|---|---|---|---|---|
| 1.3.0 | Stable | 24 Jun 2026 | 1,204 | abc123... | Preview | Delete |

**Upload new version** — button opens modal:
- Version number input
- Channel select (Stable / Beta)
- ZIP file upload
- WP requires / tested / PHP requires fields
- Changelog textarea (Markdown)
- Submit → POST `/wdd/v1/plugin/version`

---

### 6. Subscriptions (`/subscriptions`)

**Purpose:** Full subscription lifecycle management.

**Stat cards:** Active, Paused, Past Due, Cancelled (this month).

**Filters:** Status, Product, Billing cycle (monthly/yearly), Date range.

**Table:**

| ID | Customer | Product | Amount | Cycle | Status | Next Payment | Actions |
|---|---|---|---|---|---|---|---|
| SUB-1234 | john@x.com | My Plugin | $49 | Yearly | Active | 24 Jun 2027 | View · Cancel · Renew |

**Status badges:** active (green), paused (blue), past_due (yellow), suspended (orange), cancelled (red), expired (gray).

**Bulk actions:** Cancel selected, Retry payment selected.

---

### 7. Subscription Detail (`/subscriptions/:id`)

**Layout:** Same 2-column pattern as License Detail.

**Left card:**
- Subscription ID (SUB-XXXXX)
- Customer name/email
- Product
- Recurring amount + billing cycle
- Status badge
- Started / Next payment / Cancelled at
- Trial ends at (if applicable)
- Gateway + gateway subscription ID
- Retry count (shown in warning style if > 0)
- Actions: Pause, Resume, Cancel, Trigger Manual Renewal, Upgrade/Downgrade

**Right tabs:**
- **Payment Log:** each renewal attempt — order ID (link), amount, result (success/failed), date
- **Status History:** every status change with reason and timestamp
- **Emails Sent:** list of all notification emails sent for this subscription

---

### 8. SaaS Accounts (`/saas`)

**Purpose:** View provisioned SaaS accounts and manage API keys.

**Stat cards:** Total provisioned, Active, Suspended, Cancelled.

**Table:**

| Account | Customer | Product | Plan | API Key | Status | Provisioned | Actions |
|---|---|---|---|---|---|---|---|
| #42 | john@x.com | My SaaS | Pro | wdd_a1b2... (copy) | Active | 24 Jun 2026 | Suspend · Activate |

**Detail modal (click row):**
- Full API key (reveal/copy)
- Rotate API key button (confirm modal)
- Webhook events log (provision / suspend / activate / plan_change)

---

### 9. Affiliates (`/affiliates`)

**Purpose:** Full affiliate program management.

**Sub-navigation tabs (inside page):** Affiliates | Commissions | Payouts

**Affiliates tab:**
- Stat cards: Total affiliates, Active, Pending approval, Total earned
- Table: Name, Referral code, Status, Total clicks, Total orders, Total earned, Total paid, Actions (Approve / Suspend / View)
- "Pending" tab filter highlighted when there are pending approvals

**Commissions tab (`/affiliates/commissions`):**
- Filters: Affiliate, Status (pending/approved/rejected/paid/reversed), Date range
- Table: Commission ID, Affiliate, Order ID, Product, Amount, Rate, Status, Date, Actions (Approve / Reject)
- Bulk approve button

**Payouts tab (`/affiliates/payouts`):**
- "Generate Payout" button → modal: select affiliate or "All eligible", select date range → shows preview total → confirm
- Table: Payout ID, Affiliate, Amount, Period, Method, Status, Completed At
- "Export CSV (PayPal Mass Pay format)" button

---

### 10. Abandoned Cart (`/abandoned-cart`)

**Purpose:** View and manage abandoned carts.

**Stat cards (top):** Abandoned (30d), Recovered, Recovery Rate %, Revenue Recovered $.

**Filters:** Status, Date range.

**Table:**

| Customer | Cart Value | Products | Abandoned At | Emails Sent | Status | Actions |
|---|---|---|---|---|---|---|
| jane@x.com | $49 | My Plugin | 2h ago | 1 of 3 | Abandoned | Send Email · Delete |

- "Emails Sent" column: `1 of 3` (progress indicator)
- Status badges: active (blue), abandoned (yellow), email_1_sent / email_2_sent / email_3_sent (orange shades), recovered (green), unsubscribed (gray)
- Click row → detail drawer showing: full cart contents, restore link, all emails sent (with open/click tracking if available), coupon code used

---

### 11. Security (`/security`)

**Purpose:** Monitor and respond to security events.

**4 panels:**

**Rate Limiting panel:**
- Current rate limit settings (editable inline)
- List of currently throttled IPs with countdown and "Whitelist" action

**Abuse Detection panel:**
- Licenses flagged as abused — license key, reason, countries detected, IPs in 24h, Suspend / Review actions
- Sensitivity sliders: max countries / max IPs (save to API)

**Download Integrity panel:**
- Recent checksum failures (if any) — file, expected vs. actual hash, timestamp
- "All ZIPs verified" green banner if none

**Geo-Blocking panel:**
- Toggle: Block mode / Allow mode
- Country tag input (type ISO code or country name, autocomplete, add to list)
- Save button → PUT `/wdd/v1/settings/geo-block`

---

### 12. Analytics (`/analytics`)

**Purpose:** Revenue and product health reporting.

**Date range picker (top right):** 7d | 30d | 90d | 12m | Custom.

**Row 1 — Revenue stat cards:**
MRR | ARR | Churn Rate | LTV

**Row 2 — Charts:**
- Full-width: `MrrTrendChart` — 12-month LineChart with MRR + New MRR + Churned MRR as three lines

**Row 3 — Split:**
- Left: `LicenseHealthChart` — stacked BarChart (active / expired / suspended / revoked) by month
- Right: `DownloadsByCountryTable` — top 10 countries with download count + flag

**Row 4 — Split:**
- Left: `VersionAdoptionChart` — PieChart of % customers on each plugin version
- Right: `DownloadsByProductTable` — product name, version, download count, trend arrow

**Export buttons:** "Export Revenue CSV", "Export License CSV", "Export Downloads CSV" — call `/wdd/v1/analytics/{report}/export`.

---

### 13. Settings (`/settings/:tab`)

**Layout:** Left tab nav + right form panel.

**Tabs:**

| Tab slug | Label | Description |
|---|---|---|
| `modules` | Modules | Toggle each module on/off; shows status for each |
| `licenses` | Licensing | Default plan type, activation limit, duration, staging patterns |
| `downloads` | Downloads | Default expiry, max downloads, geo-block settings |
| `updates` | Plugin Updates | Update requires license toggle, beta channel, GitHub webhook settings |
| `subscriptions` | Subscriptions | Auto-renew, retry policy, dunning schedule, proration mode |
| `saas` | SaaS Provisioning | Webhook URL + secret, JWT expiry, API key prefix |
| `affiliates` | Affiliates | Commission rate, cookie days, attribution model, auto-approve, min payout |
| `abandoned-cart` | Abandoned Cart | Timeout, email sequence delays, coupon %, restore link expiry |
| `security` | Security | Rate limit settings, abuse detection thresholds |
| `emails` | Email Notifications | Per-event enable/disable toggles, subject lines |
| `advanced` | Advanced | Debug mode, clear analytics cache, WP-CLI info |

**Modules tab** special UI:
```
┌──────────────────────────────────────────────┐
│ ● Secure Downloads    [ON ]  Phase 1  Active  │
│ ● Licensing           [ON ]  Phase 1  Active  │
│ ● Plugin Updates      [ON ]  Phase 1  Active  │
│ ○ Subscriptions       [OFF]  Phase 2  Disabled│
│ ○ SaaS Provisioning   [OFF]  Phase 2  Disabled│
└──────────────────────────────────────────────┘
```
Each row: module icon, name, toggle switch, phase badge, status badge. Toggling fires `POST /wdd/v1/settings/modules` and updates `AppContext.activeModules`.

---

## Shared / Reusable Components

| Component | BEM Block | Props |
|---|---|---|
| `StatsCard` | `.stats-card` | `label`, `value`, `trend`, `trendDirection`, `icon`, `variant` |
| `StatusBadge` | `.status-badge` | `status` → modifier auto-applied |
| `DataTable` | `.data-table` | `columns`, `rows`, `onRowClick`, `selectable`, `loading` |
| `Pagination` | `.pagination` | `currentPage`, `totalPages`, `onPageChange` |
| `FiltersBar` | `.filters-bar` | `fields` (array of filter configs) |
| `Modal` | `.modal` | `isOpen`, `onClose`, `title`, `children`, `size` |
| `ConfirmModal` | `.confirm-modal` | `message`, `onConfirm`, `onCancel`, `danger` |
| `Drawer` | `.drawer` | `isOpen`, `onClose`, `title`, `children` |
| `Toast` | `.toast` | `type`, `message` — rendered in `ToastContainer` |
| `Skeleton` | `.skeleton` | `width`, `height`, `variant` (text/card/row) |
| `EmptyState` | `.empty-state` | `icon`, `title`, `description`, `action` |
| `ModuleDisabled` | `.module-disabled` | `moduleName` |
| `CopyButton` | `.copy-btn` | `value` — copies to clipboard, shows tick for 2s |
| `ToggleSwitch` | `.toggle-switch` | `checked`, `onChange`, `disabled` |
| `TabNav` | `.tab-nav` | `tabs`, `activeTab`, `onTabChange` |
| `Breadcrumb` | `.breadcrumb` | auto-derived from current route |

---

## Loading & Error States

Every data-fetching page/component must handle three states:

1. **Loading** — render `<Skeleton>` components matching the layout (no spinners, use skeleton screens)
2. **Error** — render `<EmptyState>` with error icon and "Retry" button that calls the fetch function again
3. **Empty** — render `<EmptyState>` with contextual illustration and call-to-action

---

## File / Folder Structure

```
src/
├── main.jsx                        // mounts React app into #wdd-admin-root
├── App.jsx                         // Router + AppContext.Provider
├── context/
│   ├── AppContext.jsx
│   ├── LicenseContext.jsx
│   ├── SubscriptionContext.jsx
│   └── AnalyticsContext.jsx
├── hooks/
│   ├── useApi.js                   // generic fetch hook with loading/error state
│   ├── usePagination.js
│   ├── useFilters.js
│   ├── useClipboard.js
│   └── useRipple.js                // MD3 ink ripple — inject/remove ripple span on mousedown
├── pages/
│   ├── Dashboard/
│   │   ├── DashboardPage.jsx
│   │   └── DashboardPage.scss
│   ├── Licenses/
│   │   ├── LicensesPage.jsx
│   │   ├── LicensesPage.scss
│   │   ├── LicenseDetailPage.jsx
│   │   └── LicenseDetailPage.scss
│   ├── Downloads/
│   ├── Updates/
│   ├── Subscriptions/
│   ├── SaaS/
│   ├── Affiliates/
│   ├── AbandonedCart/
│   ├── Security/
│   ├── Analytics/
│   └── Settings/
├── components/
│   ├── Layout/
│   │   ├── AppLayout.jsx
│   │   ├── AppLayout.scss
│   │   ├── Sidebar.jsx
│   │   ├── Sidebar.scss
│   │   └── TopBar/
│   ├── UI/
│   │   ├── StatsCard/
│   │   ├── DataTable/
│   │   ├── StatusBadge/
│   │   ├── Modal/
│   │   ├── Drawer/
│   │   ├── Toast/
│   │   ├── Skeleton/
│   │   ├── EmptyState/
│   │   ├── Pagination/
│   │   ├── FiltersBar/
│   │   ├── ToggleSwitch/
│   │   ├── CopyButton/
│   │   ├── TabNav/
│   │   └── Breadcrumb/
│   └── Charts/
│       ├── MrrTrendChart.jsx
│       ├── LicenseStatusChart.jsx
│       ├── VersionAdoptionChart.jsx
│       └── DownloadsByCountryTable.jsx
├── styles/
│   ├── main.scss                   // imports all partials in order
│   ├── _variables.scss             // MD3 color roles, spacing scale, layout
│   ├── _typography.scss            // 15 MD3 type role %placeholders
│   ├── _elevation.scss             // md-elevation-0 → md-elevation-5 mixins
│   ├── _shape.scss                 // $shape-* border-radius scale
│   ├── _states.scss                // md-state-layer mixin + ripple keyframes
│   ├── _mixins.scss                // respond-to, flex-center, truncate
│   ├── _reset.scss                 // minimal reset (box-sizing, margin, padding)
│   └── _utilities.scss             // .u-mt-N spacing utilities
└── utils/
    ├── api.js                      // base fetch wrapper, adds WP nonce header
    ├── format.js                   // formatCurrency, formatDate, formatNumber
    └── constants.js                // STATUS_LABELS, STATUS_COLORS, MODULE_LIST
```

---

## API Integration Rules

All REST calls go through `utils/api.js`:

```js
// utils/api.js
const BASE = window.wddAdmin.restUrl;         // localized from PHP: rest_url('wdd/v1/')
const NONCE = window.wddAdmin.nonce;          // localized from PHP: wp_create_nonce('wp_rest')

export async function apiFetch(endpoint, options = {}) {
  const res = await fetch(`${BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-WP-Nonce': NONCE,
      ...options.headers,
    },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
```

All data fetching uses the `useApi` custom hook which returns `{ data, loading, error, refetch }`.

---

## Specific Design Rules

1. **No page has a loading spinner** — use skeleton screens only
2. **Destructive actions** (Revoke, Cancel, Suspend, Delete) always show a `<ConfirmModal>` before executing
3. **All monetary values** formatted with `Intl.NumberFormat` — currency from `window.wddAdmin.currency`
4. **All dates** formatted with `Intl.DateTimeFormat` — locale from `window.wddAdmin.locale`
5. **License keys** always rendered in monospace font (`.license-key` class)
6. **Copy to clipboard** always shows a green tick toast: `"Copied to clipboard"`
7. **Table row selection** → floating bulk action bar appears at bottom of screen (fixed position)
8. **Module disabled state** → full page renders but with `<ModuleDisabled>` overlay over the main content area, sidebar item shows lock icon
9. **Responsive** → sidebar collapses to icon-only at < 1200px; all tables become card stacks at < 768px
10. **SCSS: never use `!important`** — solve specificity through BEM structure

---

## What to Build First (Priority Order)

1. `AppLayout` + `Sidebar` + `TopBar` + routing skeleton (all routes registered, pages are empty)
2. `AppContext` with module toggle logic
3. Shared UI components: `StatsCard`, `DataTable`, `StatusBadge`, `Pagination`, `Modal`, `Toast`, `Skeleton`, `EmptyState`
4. `DashboardPage` (uses all stat cards + charts)
5. `LicensesPage` + `LicenseDetailPage`
6. `SubscriptionsPage` + `SubscriptionDetailPage`
7. Remaining pages in phase order
8. `SettingsPage` (all tabs, module toggles)
