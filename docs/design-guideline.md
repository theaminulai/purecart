# PureCart Admin Dashboard — Design Guideline

**Version 1.0 | Status: Authoritative**

This document is the single source of truth for all visual and interaction design decisions in the PureCart admin dashboard. Every developer, every component, every pull request must follow these rules. When a rule conflicts with personal preference, this document wins.

---

## 1. Design Foundation

### 1.1 Design Language

The PureCart admin dashboard follows **Material Design 3 (MD3)** principles, implemented from scratch in custom SCSS. No MUI library. No Material Web Components. Every token, every mixin, every component rule in this document is derived directly from the [MD3 specification](https://m3.material.io).

### 1.2 Core Principles

**1. Use roles, never raw values.**
Color, elevation, and shape are expressed through named tokens. A component never hard-codes `#6750A4` or `12px`. It uses `$md-primary` and `$shape-medium`. This is the non-negotiable foundation of the entire system.

**2. Hierarchy through surface, not weight.**
Visual importance is communicated by elevation level (which surface a component sits on), not by making text bolder or larger. Reserve bold weight for label roles only.

**3. State is always visible.**
Every interactive element communicates hover, focus, pressed, and disabled states — without exception. Invisible states are an accessibility failure.

**4. Skeleton over spinner.**
Page-level and component-level loading always uses skeleton screens. No circular spinners anywhere in the dashboard.

**5. Confirm before destroy.**
Any action that cannot be undone (revoke, cancel, delete, suspend) must require explicit confirmation in a dialog. No silent destructive actions.

**6. BEM is law.**
Every class name follows BEM. No exceptions, no utility-class shortcuts in component markup, no inline styles.

---

## 2. Color System

### 2.1 Tonal Palette & Role Tokens

MD3 derives all colors from a single **seed color** (`#6750A4`, purple-indigo) and maps them to semantic **roles**. Components reference roles only — never raw hex values.

```scss
// _variables.scss — Color Roles

// ─── Primary ─────────────────────────────────────────────────
$md-primary:                  #6750A4;
$md-on-primary:               #FFFFFF;
$md-primary-container:        #EADDFF;
$md-on-primary-container:     #21005D;

// ─── Secondary ───────────────────────────────────────────────
$md-secondary:                #625B71;
$md-on-secondary:             #FFFFFF;
$md-secondary-container:      #E8DEF8;
$md-on-secondary-container:   #1D192B;

// ─── Tertiary ────────────────────────────────────────────────
$md-tertiary:                 #7D5260;
$md-on-tertiary:              #FFFFFF;
$md-tertiary-container:       #FFD8E4;
$md-on-tertiary-container:    #31111D;

// ─── Error ───────────────────────────────────────────────────
$md-error:                    #B3261E;
$md-on-error:                 #FFFFFF;
$md-error-container:          #F9DEDC;
$md-on-error-container:       #410E0B;

// ─── Surface ─────────────────────────────────────────────────
$md-surface:                  #FFFBFE;   // page background
$md-surface-dim:              #DED8E1;
$md-surface-bright:           #FFFBFE;
$md-surface-container-lowest: #FFFFFF;
$md-surface-container-low:    #F7F2FA;
$md-surface-container:        #F3EDF7;
$md-surface-container-high:   #ECE6F0;
$md-surface-container-highest:#E6E0E9;
$md-on-surface:               #1C1B1F;
$md-on-surface-variant:       #49454F;

// ─── Outline ─────────────────────────────────────────────────
$md-outline:                  #79747E;
$md-outline-variant:          #CAC4D0;

// ─── Inverse (used in snackbars) ─────────────────────────────
$md-inverse-surface:          #313033;
$md-inverse-on-surface:       #F4EFF4;
$md-inverse-primary:          #D0BCFF;

// ─── Status (custom semantic extension) ──────────────────────
$md-status-success:           #386A20;
$md-status-success-container: #B7F397;
$md-status-warning:           #7A5900;
$md-status-warning-container: #FFDEA6;
$md-status-info:              #00629D;
$md-status-info-container:    #CDE5FF;
```

### 2.2 Color Rules

**MUST:**
- Use color roles in every component property (`color`, `background-color`, `border-color`, `box-shadow` color)
- Use `$md-on-*` tokens for text/icons that sit on a container color. If the background is `$md-primary`, the text must be `$md-on-primary`
- Use status color tokens for all status indicators (status badges, alert banners, trend indicators)

**MUST NOT:**
- Write any hex value or RGB value directly in a component SCSS file
- Use `$md-primary` for backgrounds unless it is the correct role for that container
- Invert `on-*` relationships (e.g., dark text on `$md-primary` background)
- Use opacity to approximate a different color role

### 2.3 Color Pairing Reference

| Background | Text / Icon | Use Case |
|---|---|---|
| `$md-primary` | `$md-on-primary` | Filled buttons, FAB active |
| `$md-primary-container` | `$md-on-primary-container` | FAB default, highlight banners |
| `$md-secondary-container` | `$md-on-secondary-container` | Nav item active state, tonal buttons |
| `$md-surface-container-low` | `$md-on-surface` | Navigation drawer |
| `$md-surface-container-highest` | `$md-on-surface` | Filled text field background |
| `$md-surface-container-high` | `$md-on-surface` | Dialog background |
| `$md-inverse-surface` | `$md-inverse-on-surface` | Snackbar |
| `$md-error-container` | `$md-on-error-container` | Error state containers |
| `$md-status-success-container` | `$md-status-success` | Active/success badges |
| `$md-status-warning-container` | `$md-status-warning` | Warning badges, past-due |

---

## 3. Typography System

### 3.1 Type Scale

Load Roboto via Google Fonts. All 15 MD3 type roles are defined as SCSS `%placeholder` selectors. Components extend these placeholders — they never set `font-size`, `line-height`, `font-weight`, or `letter-spacing` manually.

```scss
// _typography.scss

@import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap');

$font-family-base:  'Roboto', sans-serif;
$font-family-mono:  'Roboto Mono', monospace;

// Display
%type-display-large  { font: 400 57px/64px $font-family-base; letter-spacing: -0.25px; }
%type-display-medium { font: 400 45px/52px $font-family-base; letter-spacing:  0; }
%type-display-small  { font: 400 36px/44px $font-family-base; letter-spacing:  0; }

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

### 3.2 Type Role Assignment

| Type Role | Assigned To |
|---|---|
| `%type-headline-small` | Dialog headlines, page section titles |
| `%type-title-large` | Top App Bar page title |
| `%type-title-medium` | Card headers, sidebar section labels |
| `%type-title-small` | Navigation drawer section labels |
| `%type-label-large` | All buttons, navigation items, tab labels |
| `%type-label-medium` | Table column headers (`th`), chip labels, supporting labels |
| `%type-label-small` | Caption text, metadata, overlines |
| `%type-body-large` | Text field input values |
| `%type-body-medium` | Table cell data (`td`), card body, dialog body text |
| `%type-body-small` | Text field labels (floating), supporting/helper text |

### 3.3 Typography Rules

**MUST:**
- Every text-rendering element extends exactly one type-role placeholder
- Monospace text (license keys, API keys, tokens, SHA-256 hashes) uses `$font-family-mono` with `%type-body-small`
- Apply `%type-label-large` to all button text — no exceptions

**MUST NOT:**
- Set `font-size`, `line-height`, `font-weight`, or `letter-spacing` on any component element directly
- Use `font-weight: bold` anywhere — use the correct type role instead
- Create intermediate font sizes (e.g., 15px, 13px) not in the scale

---

## 4. Spacing & Grid

### 4.1 Spacing Scale

MD3 uses an 8px base grid. All spacing values are multiples of 4px.

```scss
// _variables.scss — Spacing

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
```

### 4.2 Layout Dimensions

```scss
// _variables.scss — Layout

$layout-sidebar-width:           256px;
$layout-sidebar-collapsed-width:  80px;
$layout-topbar-height:            64px;
$layout-content-padding:          $space-6;   // 24px, applied on all sides
$layout-page-max-width:         1440px;
$layout-card-gap:                 $space-4;   // 16px gap between cards in a grid
$layout-section-gap:              $space-6;   // 24px gap between page sections
```

### 4.3 Spacing Rules

**MUST:**
- Use `$space-*` tokens for all `margin`, `padding`, `gap`, `top`, `bottom`, `left`, `right` values
- Use `$space-4` (16px) as the minimum internal padding for any card or panel
- Use `$space-6` (24px) as the standard content area padding

**MUST NOT:**
- Write any `px` value directly in a component — only in the `_variables.scss` token definitions
- Use odd spacing values (6px, 10px, 14px) — round to the nearest `$space-*` token
- Use CSS `margin: auto` as a primary layout tool — use flexbox `gap` with `$space-*`

---

## 5. Elevation System

### 5.1 Elevation Levels

MD3 elevation combines a **tonal surface overlay** (primary color at low opacity mixed into the surface) with a **box-shadow**. Higher elevation = more primary color in the surface + deeper shadow.

```scss
// _elevation.scss

@mixin md-elevation-0 {
  background-color: $md-surface;
  box-shadow: none;
}

@mixin md-elevation-1 {
  background-color: color-mix(in srgb, $md-primary 5%, $md-surface);
  box-shadow: 0 1px 2px rgba(0,0,0,.3), 0 1px 3px 1px rgba(0,0,0,.15);
}

@mixin md-elevation-2 {
  background-color: color-mix(in srgb, $md-primary 8%, $md-surface);
  box-shadow: 0 1px 2px rgba(0,0,0,.3), 0 2px 6px 2px rgba(0,0,0,.15);
}

@mixin md-elevation-3 {
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

### 5.2 Component Elevation Map

| Elevation | Components |
|---|---|
| 0 | Page background, filled cards (resting) |
| 1 | Elevated cards (resting), navigation drawer, top app bar (default) |
| 2 | Cards (hovered), top app bar (on scroll), dropdown menus, tooltips |
| 3 | Dialogs / modals, FAB, snackbars |
| 4 | Navigation drawer (when modal/overlaid) |
| 5 | Reserved — use only for content that must sit above all other UI |

### 5.3 Elevation Rules

**MUST:**
- Apply elevation exclusively via `@include md-elevation-N` — never write `box-shadow` or tonal `background-color` manually
- Increase elevation by exactly 1 level on hover for elevated cards
- Apply elevation-3 to all dialog overlays

**MUST NOT:**
- Use `filter: drop-shadow()` as a substitute for elevation
- Apply elevation to flat/filled components (filled cards, filled buttons, text fields)
- Stack elevated components inside other elevated containers without resetting to a relative level

---

## 6. Shape System

### 6.1 Shape Scale

```scss
// _shape.scss

$shape-none:         0;
$shape-extra-small:  4px;
$shape-small:        8px;
$shape-medium:       12px;
$shape-large:        16px;
$shape-extra-large:  28px;
$shape-full:         9999px;   // pill / circle
```

### 6.2 Component Shape Map

| Shape Token | Components |
|---|---|
| `$shape-extra-small` (4px) | Snackbars, skeleton elements, text field containers |
| `$shape-small` (8px) | Chips, status badges |
| `$shape-medium` (12px) | Cards (all variants), data tables |
| `$shape-large` (16px) | Navigation drawer (right side only), FAB small |
| `$shape-extra-large` (28px) | Dialogs, bottom sheets, large cards |
| `$shape-full` (9999px) | All buttons, nav item active indicator, FAB default, chips when pill style needed |

Navigation drawer: `border-radius: 0 $shape-large $shape-large 0` — right side only, left side flush.

### 6.3 Shape Rules

**MUST:**
- Apply `border-radius` using `$shape-*` tokens only
- Use `$shape-full` for all button variants (buttons are always pill-shaped)
- Use `$shape-medium` for all card variants

**MUST NOT:**
- Use arbitrary `border-radius` values (e.g., `6px`, `10px`, `20px`)
- Apply `$shape-full` to rectangular containers (tables, panels, page sections)
- Mix shape tokens on the same component (e.g., 12px on some corners, 8px on others — unless intentional like the drawer)

---

## 7. Motion & Animation

### 7.1 Easing Curves

```scss
// _variables.scss — Motion

// MD3 easing: "Emphasized" for elements entering/leaving the screen
$motion-easing-emphasized:         cubic-bezier(0.2, 0, 0, 1);
// MD3 easing: "Standard" for elements that don't enter/leave
$motion-easing-standard:           cubic-bezier(0.4, 0, 0.2, 1);
// "Standard decelerate" for elements entering
$motion-easing-standard-decelerate: cubic-bezier(0, 0, 0, 1);
// "Standard accelerate" for elements leaving
$motion-easing-standard-accelerate: cubic-bezier(0.3, 0, 1, 1);
```

### 7.2 Duration Scale

```scss
$motion-duration-short-1:   50ms;
$motion-duration-short-2:   100ms;
$motion-duration-short-3:   150ms;
$motion-duration-short-4:   200ms;
$motion-duration-medium-1:  250ms;
$motion-duration-medium-2:  300ms;
$motion-duration-medium-3:  350ms;
$motion-duration-medium-4:  400ms;
$motion-duration-long-1:    450ms;
$motion-duration-long-2:    500ms;
```

### 7.3 Motion Rules

| Use Case | Duration | Easing |
|---|---|---|
| State layer (hover/focus) | `$motion-duration-short-4` (200ms) | `$motion-easing-standard` |
| Button/chip press | `$motion-duration-short-3` (150ms) | `$motion-easing-standard` |
| Card hover elevation change | `$motion-duration-short-4` (200ms) | `$motion-easing-standard` |
| Ripple ink expand | `$motion-duration-medium-4` (400ms) | `$motion-easing-standard` |
| Dialog open | `$motion-duration-medium-2` (300ms) | `$motion-easing-emphasized` |
| Dialog close | `$motion-duration-short-4` (200ms) | `$motion-easing-standard-accelerate` |
| Sidebar collapse/expand | `$motion-duration-medium-2` (300ms) | `$motion-easing-emphasized` |
| Skeleton shimmer cycle | `1500ms` | `ease-in-out` |
| Linear progress indeterminate | `1500ms` | `ease-in-out` |
| Page-level fade-in | `$motion-duration-short-4` (200ms) | `$motion-easing-standard-decelerate` |

**MUST NOT:**
- Use transitions longer than 400ms for micro-interactions (state layers, hover)
- Animate `width`, `height`, or `top/left/right/bottom` — use `transform` and `opacity` instead
- Use `animation: none` or `transition: none` on interactive elements — remove motion only via `prefers-reduced-motion` media query

---

## 8. State Layer System

### 8.1 State Layers

MD3 communicates interaction through a **state layer** — a semi-transparent overlay applied via `::before` pseudo-element using the component's content color at a defined opacity.

```scss
// _states.scss

$state-hover-opacity:   0.08;
$state-focus-opacity:   0.12;
$state-pressed-opacity: 0.12;
$state-dragged-opacity: 0.16;
$state-disabled-opacity: 0.38;

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
    transition: opacity $motion-duration-short-4 $motion-easing-standard;
    pointer-events: none;
  }

  &:hover::before   { opacity: $state-hover-opacity; }
  &:focus::before   { opacity: $state-focus-opacity; }
  &:active::before  { opacity: $state-pressed-opacity; }
}
```

### 8.2 Disabled State

```scss
// Applied via &--disabled modifier on the component
&--disabled {
  opacity: $state-disabled-opacity;   // 0.38
  pointer-events: none;
  cursor: not-allowed;
}
```

### 8.3 Ripple (Ink Effect)

The ripple is a **JS-driven** ink spread applied on `mousedown`. It supplements — does not replace — the state layer.

```scss
// _states.scss — Ripple keyframes

.ripple__ink {
  position: absolute;
  border-radius: $shape-full;
  background-color: currentColor;
  opacity: 0.12;
  transform: scale(0);
  animation: ripple-expand $motion-duration-medium-4
    $motion-easing-standard forwards;
  pointer-events: none;
}

@keyframes ripple-expand {
  to { transform: scale(4); opacity: 0; }
}
```

`useRipple` hook behavior: on `mousedown`, measure click coordinates relative to the element, inject a `<span class="ripple__ink">` sized to cover the full element, let it animate, remove it on animation end.

### 8.4 State Rules

**MUST:**
- Include `@include md-state-layer($color)` on every interactive element (buttons, nav items, table rows, chips, cards that are clickable)
- Use `$md-on-primary` as the state layer color when the component background is `$md-primary`
- Use `$md-on-surface` as the state layer color on neutral surfaces
- Apply the `useRipple` hook to all buttons, nav items, chips, and FABs
- Show a visible `:focus-visible` outline (at minimum the focus state layer at 0.12 opacity) for keyboard accessibility

**MUST NOT:**
- Change background-color on hover directly — use the state layer only
- Skip state layers on table rows that are clickable
- Apply ripple to non-interactive elements

---

## 9. Component Specifications

### 9.1 Buttons

Five variants. All buttons: pill shape (`border-radius: $shape-full`), `%type-label-large`, minimum touch target 48px height, `@include md-state-layer`, `useRipple` hook, `transition: box-shadow $motion-duration-short-4 $motion-easing-standard`.

```scss
// components/_button.scss

.btn {
  display: inline-flex;
  align-items: center;
  gap: $space-2;
  height: 40px;
  padding: 0 $space-6;
  border-radius: $shape-full;
  border: none;
  cursor: pointer;
  @extend %type-label-large;
  text-decoration: none;
  transition: box-shadow $motion-duration-short-4 $motion-easing-standard;
  @include md-state-layer;

  // ── Variants ──────────────────────────────────────────────
  &--filled   { background: $md-primary; color: $md-on-primary; }
  &--tonal    { background: $md-secondary-container; color: $md-on-secondary-container; }
  &--outlined { background: transparent; border: 1px solid $md-outline; color: $md-primary; }
  &--text     { background: transparent; color: $md-primary; padding: 0 $space-3; }
  &--elevated { @include md-elevation-1; color: $md-primary;
                &:hover { @include md-elevation-2; } }

  // ── Sizes ─────────────────────────────────────────────────
  &--small { height: 32px; padding: 0 $space-4; @extend %type-label-medium; }
  &--large { height: 48px; padding: 0 $space-8; }

  // ── Icon-only ─────────────────────────────────────────────
  &--icon { width: 40px; height: 40px; padding: 0; justify-content: center; }

  // ── Danger ────────────────────────────────────────────────
  &--danger         { background: $md-error; color: $md-on-error; }
  &--danger#{&}--outlined { background: transparent; border-color: $md-error; color: $md-error; }

  // ── Disabled ──────────────────────────────────────────────
  &--disabled,
  &:disabled { opacity: $state-disabled-opacity; pointer-events: none; }
}
```

**Rules:**
- The primary action on any page uses `.btn--filled`
- Secondary or supporting actions use `.btn--tonal` or `.btn--outlined`
- Destructive actions use `.btn--danger` (never styled as a default button)
- Never use `.btn--text` as the sole button — always pair with a stronger variant

---

### 9.2 Cards

Three variants. All cards: `border-radius: $shape-medium`, `overflow: hidden`.

```scss
// components/_card.scss

.card {
  border-radius: $shape-medium;
  overflow: hidden;
  transition: box-shadow $motion-duration-short-4 $motion-easing-standard;

  &--elevated { @include md-elevation-1; &:hover { @include md-elevation-2; } }
  &--filled   { background: $md-surface-container-highest; box-shadow: none; }
  &--outlined { background: $md-surface; border: 1px solid $md-outline-variant; }

  &__header  { padding: $space-4 $space-4 0; }
  &__media   { width: 100%; display: block; }
  &__content { padding: $space-4; @extend %type-body-medium; color: $md-on-surface; }
  &__actions { padding: $space-2 $space-4 $space-4; display: flex; gap: $space-2; }
}
```

**Rules:**
- Stats cards, data panels, and chart containers: always `.card--elevated`
- Settings form panels: `.card--filled`
- Info/notice blocks: `.card--outlined`
- Clickable cards must include `@include md-state-layer($md-on-surface)` on the root

---

### 9.3 Navigation Drawer

Standard drawer (always visible) on desktop ≥ 1200px. Modal (overlay) on smaller screens.

```scss
// components/_nav-drawer.scss

.nav-drawer {
  width: $layout-sidebar-width;
  height: 100%;
  background: $md-surface-container-low;
  border-radius: 0 $shape-large $shape-large 0;
  @include md-elevation-1;
  display: flex;
  flex-direction: column;
  padding: $space-3 0;
  overflow-y: auto;

  &__headline {
    padding: $space-4 $space-6;
    @extend %type-title-small;
    color: $md-on-surface-variant;
    text-transform: uppercase;
    letter-spacing: 0.8px;
  }

  &__section   { margin-bottom: $space-2; }
  &__divider   { height: 1px; background: $md-outline-variant; margin: $space-2 0; }
}

.nav-item {
  display: flex;
  align-items: center;
  gap: $space-3;
  height: 56px;
  padding: 0 $space-6 0 $space-4;
  margin: 0 $space-3;
  border-radius: $shape-full;
  cursor: pointer;
  @extend %type-label-large;
  color: $md-on-surface-variant;
  text-decoration: none;
  transition: background $motion-duration-short-4 $motion-easing-standard;
  @include md-state-layer($md-on-surface);

  &__icon    { width: 24px; height: 24px; flex-shrink: 0; }
  &__label   { flex: 1; }
  &__badge   { @extend %type-label-small; background: $md-error; color: $md-on-error;
               border-radius: $shape-full; padding: 0 $space-1; min-width: 18px; text-align: center; }

  &--active {
    background: $md-secondary-container;
    color: $md-on-secondary-container;

    .nav-item__icon { color: $md-on-secondary-container; }
  }

  &--disabled {
    opacity: $state-disabled-opacity;
    pointer-events: none;
    cursor: default;
  }
}
```

**Rules:**
- The active nav item always uses the pill-shaped active indicator (`.nav-item--active`)
- Disabled nav items (module not enabled) show a lock icon and 38% opacity — they still navigate; the page renders a `<ModuleDisabled>` component
- Collapsed sidebar (< 1200px) shows icon-only: hide `&__label`, set `width: $layout-sidebar-collapsed-width`

---

### 9.4 Top App Bar

```scss
// components/_top-app-bar.scss

.top-app-bar {
  height: $layout-topbar-height;
  display: flex;
  align-items: center;
  padding: 0 $space-4;
  gap: $space-2;
  background: $md-surface;
  transition: box-shadow $motion-duration-short-4 $motion-easing-standard;

  &--scrolled { @include md-elevation-2; }

  &__leading   { display: flex; align-items: center; gap: $space-2; }
  &__headline  { flex: 1; @extend %type-title-large; color: $md-on-surface; }
  &__trailing  { display: flex; align-items: center; gap: $space-1; }
}
```

**Rules:**
- Page title goes in `&__headline` — it reflects the current route section
- Primary page action (e.g., "Upload Version", "Add Affiliate") goes in `&__trailing` as `.btn--filled`
- Top bar transitions from elevation-0 to elevation-2 when the content area scrolls past 4px

---

### 9.5 Data Table

```scss
// components/_data-table.scss

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
    user-select: none;
  }

  &__th--sortable { cursor: pointer; @include md-state-layer($md-on-surface); }

  &__row {
    border-bottom: 1px solid $md-outline-variant;
    transition: background $motion-duration-short-3 $motion-easing-standard;
    @include md-state-layer($md-on-surface);

    &:last-child { border-bottom: none; }
    &--selected { background: color-mix(in srgb, $md-primary 8%, $md-surface); }
  }

  &__td {
    padding: $space-3 $space-4;
    @extend %type-body-medium;
    color: $md-on-surface;
    vertical-align: middle;
  }

  &__td--mono     { font-family: $font-family-mono; @extend %type-body-small; }
  &__td--actions  { text-align: right; white-space: nowrap; }
  &__td--numeric  { text-align: right; font-variant-numeric: tabular-nums; }
}
```

**Rules:**
- Column headers: `%type-label-medium`, `$md-on-surface-variant`
- Body cells: `%type-body-medium`, `$md-on-surface`
- Clickable rows must include `@include md-state-layer`
- License keys, API keys, tokens, SHA-256 hashes, version numbers → `&__td--mono`
- Currency and number columns → `&__td--numeric`
- The checkbox column (row selection) is always the first column

---

### 9.6 Status Badge

```scss
// components/_status-badge.scss

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: $space-1;
  padding: $space-1 $space-3;
  border-radius: $shape-small;
  @extend %type-label-medium;

  // ── Status Modifiers ──────────────────────────────────────
  &--active     { background: $md-status-success-container; color: $md-status-success; }
  &--expired    { background: $md-error-container;          color: $md-error; }
  &--revoked    { background: $md-error-container;          color: $md-on-error-container; }
  &--suspended  { background: $md-status-warning-container; color: $md-status-warning; }
  &--cancelled  { background: $md-surface-container-highest; color: $md-on-surface-variant; }
  &--paused     { background: $md-secondary-container;      color: $md-on-secondary-container; }
  &--pending    { background: $md-status-info-container;    color: $md-status-info; }
  &--trialing   { background: $md-tertiary-container;       color: $md-on-tertiary-container; }
  &--past-due   { background: $md-status-warning-container; color: $md-status-warning; }
  &--recovered  { background: $md-status-success-container; color: $md-status-success; }
  &--abandoned  { background: $md-status-warning-container; color: $md-status-warning; }
}
```

**Rules:**
- One status badge per table row — in the "Status" column only
- Status badge modifier is derived programmatically from the API `status` field value
- Never render a status as plain text or with a colored dot — always use `.status-badge`

---

### 9.7 Chips

Used in filter bars, tag groups, and multi-select fields.

```scss
// components/_chip.scss

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

  &__icon          { width: 18px; height: 18px; }
  &__trailing-icon { width: 18px; height: 18px; opacity: 0.6; }
}
```

**Rules:**
- Filter chips in the FiltersBar use `.chip--selected` when the filter is active
- Status filter groups render as a row of chips, not a `<select>` dropdown
- Chips have a maximum label length of ~24 characters — truncate with ellipsis beyond that

---

### 9.8 Text Fields

**Filled** variant is the default for inline/page forms. **Outlined** variant is used inside dialogs.

```scss
// components/_text-field.scss

.text-field {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;

  // ── Filled (default) ──────────────────────────────────────
  &__container {
    background: $md-surface-container-highest;
    border-radius: $shape-extra-small $shape-extra-small 0 0;
    padding: $space-4 $space-4 $space-2;
    border-bottom: 1px solid $md-on-surface-variant;
    transition: border-color $motion-duration-short-4 $motion-easing-standard;
    position: relative;
  }

  // Active indicator line
  &__container::after {
    content: '';
    position: absolute;
    bottom: -1px; left: 0; right: 0;
    height: 2px;
    background: $md-primary;
    transform: scaleX(0);
    transition: transform $motion-duration-short-4 $motion-easing-standard;
  }

  &:focus-within &__container::after { transform: scaleX(1); }
  &:focus-within &__container        { border-color: $md-primary; }

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

  &__supporting-text {
    @extend %type-body-small;
    color: $md-on-surface-variant;
    padding: $space-1 $space-4 0;
  }

  // ── Error state ───────────────────────────────────────────
  &--error &__container     { border-color: $md-error; }
  &--error &__container::after { background: $md-error; }
  &--error &__label         { color: $md-error; }
  &--error &__supporting-text { color: $md-error; }
}
```

**Rules:**
- Inline page forms (Settings, filters): filled text fields
- Dialog forms: outlined text fields (add border, remove bottom-line style)
- Error state is applied via `&--error` modifier, not by JS toggling inline styles
- Supporting text (`.text-field__supporting-text`) shows validation errors or hints — always present in the DOM (empty string when no message), so the field height is stable

---

### 9.9 Dialogs

```scss
// components/_dialog.scss

.dialog-scrim {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.32);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dialog {
  border-radius: $shape-extra-large;    // 28px
  @include md-elevation-3;
  background: $md-surface-container-high;
  max-width: 560px;
  width: calc(100% - #{$space-8});
  padding: $space-6;

  &__icon     { text-align: center; margin-bottom: $space-4; color: $md-secondary; }
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
```

**Rules:**
- All destructive confirmations (revoke, cancel, delete, suspend) use a dialog with a danger icon and `.btn--danger` confirm button
- Dialog cancel/dismiss button: `.btn--text`
- Dialog confirm button: `.btn--filled` (or `.btn--danger` for destructive)
- Scrim opacity is always `rgba(0,0,0,0.32)` — do not change this value
- Dialog must trap keyboard focus (Tab cycles within) and dismiss on Escape key

---

### 9.10 Snackbar / Toast

```scss
// components/_snackbar.scss

.snackbar-container {
  position: fixed;
  bottom: $space-6;
  left: 50%;
  transform: translateX(-50%);
  z-index: 200;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $space-2;
  pointer-events: none;
}

.snackbar {
  display: flex;
  align-items: center;
  gap: $space-4;
  min-width: 344px;
  max-width: 672px;
  padding: $space-4 $space-6;
  border-radius: $shape-extra-small;
  background: $md-inverse-surface;
  color: $md-inverse-on-surface;
  @include md-elevation-3;
  @extend %type-body-medium;
  pointer-events: all;

  &__message { flex: 1; }
  &__action {
    @extend %type-label-large;
    color: $md-inverse-primary;
    background: none;
    border: none;
    cursor: pointer;
    flex-shrink: 0;
    padding: 0;
  }
  &__close { color: $md-inverse-on-surface; opacity: 0.7; }
}
```

**Rules:**
- Snackbars are always bottom-center — never top-right, never floating near the triggering element
- Auto-dismiss after 4000ms for information/success; 8000ms for error (user needs time to read)
- Maximum 1 snackbar visible at a time — queue additional ones
- Never use a snackbar for a destructive action that requires a response — use a dialog
- Copy-to-clipboard always triggers a snackbar: `"Copied to clipboard"`

---

### 9.11 FAB (Floating Action Button)

```scss
// components/_fab.scss

.fab {
  display: inline-flex;
  align-items: center;
  gap: $space-3;
  height: 56px;
  padding: 0 $space-5;
  border-radius: $shape-large;
  @include md-elevation-3;
  background: $md-primary-container;
  color: $md-on-primary-container;
  @extend %type-label-large;
  border: none;
  cursor: pointer;
  @include md-state-layer($md-on-primary-container);

  &__icon { width: 24px; height: 24px; }

  &--small { height: 40px; padding: 0 $space-4; border-radius: $shape-medium; }
  &--large { height: 96px; width: 96px; padding: 0; border-radius: $shape-extra-large;
             justify-content: center; flex-direction: column; }
}
```

**Rules:**
- FAB is used for the single most important action on a page, when that action is always accessible regardless of scroll position
- Used on: Upload Version (Updates page), Generate Payout (Payouts tab)
- FAB is always positioned bottom-right of the content area, `position: fixed`

---

### 9.12 Progress Indicators

**Linear progress** for page-level and data-loading. **Circular progress** for inline or button-level loading only.

```scss
// components/_progress.scss

// Linear
.linear-progress {
  height: 4px;
  background: $md-surface-container-highest;
  border-radius: $shape-full;
  overflow: hidden;
  width: 100%;

  &__bar {
    height: 100%;
    background: $md-primary;
    border-radius: $shape-full;
    transition: width $motion-duration-medium-4 $motion-easing-standard;
  }

  &--indeterminate &__bar {
    width: 40%;
    animation: linear-progress-indeterminate 1500ms ease-in-out infinite;
  }
}

@keyframes linear-progress-indeterminate {
  0%   { transform: translateX(-100%); }
  100% { transform: translateX(350%); }
}
```

**Rules:**
- Page-level data loading: linear progress bar positioned at the top of the content area, below the top app bar
- Never use a circular spinner for page-level or table-level loading — use skeleton screens
- A linear progress bar is acceptable for file upload operations where a percentage is known

---

### 9.13 Skeleton Screens

```scss
// components/_skeleton.scss

@keyframes skeleton-shimmer {
  0%   { background-position: -400px 0; }
  100% { background-position:  400px 0; }
}

%skeleton-base {
  background: linear-gradient(
    90deg,
    $md-surface-container-high   25%,
    $md-surface-container-highest 50%,
    $md-surface-container-high   75%
  );
  background-size: 800px 100%;
  animation: skeleton-shimmer 1500ms ease-in-out infinite;
  border-radius: $shape-extra-small;
}

.skeleton {
  @extend %skeleton-base;

  &--text   { height: 14px; width: 100%; margin-bottom: $space-2; }
  &--title  { height: 20px; width: 60%; margin-bottom: $space-3; }
  &--card   { height: 120px; border-radius: $shape-medium; }
  &--avatar { width: 40px; height: 40px; border-radius: $shape-full; }
  &--row    { height: 52px; border-radius: 0; border-bottom: 1px solid $md-outline-variant; }
  &--stat   { height: 64px; border-radius: $shape-medium; }
}
```

**Rules:**
- Skeleton layout must match the real content layout exactly — same column count, same approximate heights
- Stats card area: 4 × `.skeleton--stat` in a row
- Table loading: render 10 × `.skeleton--row`
- Skeleton is rendered server-side (initial page shell) and replaced on data arrival — no flash of unstyled content

---

## 10. SCSS / BEM Methodology

### 10.1 Naming Convention

```
.block {}                 // Component root
.block__element {}        // Part of the block
.block--modifier {}       // Variant or state of the block
.block__element--modifier {} // Variant of a specific element
```

### 10.2 File Structure

Every component has its own `.scss` file. Import order in `main.scss`:

```
1. _reset.scss
2. _variables.scss         (tokens: color, spacing, layout, motion)
3. _typography.scss        (15 type role %placeholders)
4. _elevation.scss         (md-elevation-0 → md-elevation-5 mixins)
5. _shape.scss             ($shape-* scale)
6. _states.scss            (md-state-layer mixin, ripple keyframes)
7. _mixins.scss            (respond-to, flex-center, truncate)
8. _utilities.scss         (.u-mt-N spacing utilities)
9. components/*.scss       (each component file)
10. pages/*.scss           (page-specific overrides only)
```

### 10.3 BEM Rules

**MUST:**
- Block names are kebab-case nouns (`data-table`, `stats-card`, `nav-item`)
- Element names are kebab-case (`data-table__header`, `nav-item__icon`)
- Modifier names describe a variant or state (`btn--filled`, `nav-item--active`, `text-field--error`)
- One SCSS file per component block
- Nest elements and modifiers inside their block using the `&` parent selector

**MUST NOT:**
- Nest deeper than 3 levels inside a block (`.block__element__sub-element` is a design smell — create a new sub-component)
- Use `!important` — solve specificity with proper BEM structure
- Use IDs (`#id`) for styling
- Write page-specific overrides inside a component file
- Use camelCase or PascalCase in class names
- Abbreviate class names in ways that are not immediately obvious

### 10.4 Utility Classes

Utility classes exist only for spacing and are not used inside component markup — only in page layout glue.

```scss
// _utilities.scss
// Generated: .u-mt-1 through .u-mt-16, .u-mb-*, .u-ml-*, .u-mr-*, .u-p-*, .u-pt-*, etc.
@each $key, $val in (1: $space-1, 2: $space-2, 3: $space-3, 4: $space-4,
                     5: $space-5, 6: $space-6, 8: $space-8, 10: $space-10,
                     12: $space-12, 16: $space-16) {
  .u-mt-#{$key} { margin-top:    $val !important; }
  .u-mb-#{$key} { margin-bottom: $val !important; }
  .u-ml-#{$key} { margin-left:   $val !important; }
  .u-mr-#{$key} { margin-right:  $val !important; }
}
```

---

## 11. Page Layout

### 11.1 App Shell Structure

```
┌─────────────────────────────────────────────────────────────┐
│  #purecart-admin-root                                            │
│  ├── .nav-drawer          [256px fixed left]                │
│  └── .app-main            [flex: 1]                         │
│       ├── .top-app-bar    [64px fixed top of app-main]      │
│       └── .main-content   [padding: $space-6, scrollable]   │
│            └── <Outlet /> [routed page component]           │
│                                                             │
│  .snackbar-container      [fixed bottom-center, z: 200]     │
└─────────────────────────────────────────────────────────────┘
```

```scss
// components/layout/_app-layout.scss

.app-root {
  display: flex;
  height: 100vh;
  background: $md-surface;
  overflow: hidden;
}

.app-main {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
}

.main-content {
  flex: 1;
  padding: $layout-content-padding;
  overflow-y: auto;
  max-width: $layout-page-max-width;
}
```

### 11.2 Standard Page Anatomy

Every page follows this top-to-bottom sequence:

```
1. Page header row (title is in TopBar — not repeated on page)
2. Stats cards row    — 4-up grid, .card--elevated
3. Primary content    — table or main chart
4. Secondary content  — supplementary panels, logs, charts
```

### 11.3 Grid System

```scss
// Page-level grids

// 4-column stats row
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: $layout-card-gap;
  margin-bottom: $layout-section-gap;
}

// 2-column content split
.content-grid-2 {
  display: grid;
  grid-template-columns: 3fr 2fr;   // 60% / 40%
  gap: $layout-card-gap;
}

// Equal 2-column
.content-grid-2-equal {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $layout-card-gap;
}
```

### 11.4 Responsive Breakpoints

```scss
// _mixins.scss

$breakpoint-sm: 768px;
$breakpoint-md: 1024px;
$breakpoint-lg: 1200px;
$breakpoint-xl: 1440px;

@mixin respond-to($bp) {
  @if $bp == 'sm' { @media (max-width: #{$breakpoint-sm}) { @content; } }
  @if $bp == 'md' { @media (max-width: #{$breakpoint-md}) { @content; } }
  @if $bp == 'lg' { @media (max-width: #{$breakpoint-lg}) { @content; } }
}
```

**Responsive rules:**
- `< 1200px`: Sidebar collapses to icon-only (`$layout-sidebar-collapsed-width: 80px`), labels hidden
- `< 768px`: Sidebar becomes a modal drawer (full overlay), stats grid goes 2-column, tables become card stacks

---

## 12. Data Display Rules

### 12.1 Numbers & Currency

- All monetary values: `Intl.NumberFormat` with `window.purecartAdmin.currency` (localized from PHP)
- All dates: `Intl.DateTimeFormat` with `window.purecartAdmin.locale`
- Large numbers: format with thousands separator (`1,847` not `1847`)
- Percentages: one decimal place (`94.3%`, not `94.31487%`)
- Never hard-code currency symbols — always derive from WooCommerce locale

### 12.2 Trend Indicators (StatsCard)

```scss
.stats-card {
  &__trend       { display: flex; align-items: center; gap: $space-1; @extend %type-label-medium; }
  &__trend--up   { color: $md-status-success; }
  &__trend--down { color: $md-error; }
  &__trend--warn { color: $md-status-warning; }
}
```

- Positive trend (↑): `$md-status-success`
- Negative trend (↓): `$md-error`
- Warning/attention (⚠): `$md-status-warning`

### 12.3 Empty States

When a table or panel has no data, render `<EmptyState>` — never an empty container.

```scss
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: $space-16 $space-8;
  text-align: center;
  gap: $space-4;

  &__icon        { color: $md-on-surface-variant; opacity: 0.5; width: 48px; height: 48px; }
  &__title       { @extend %type-title-medium; color: $md-on-surface; }
  &__description { @extend %type-body-medium; color: $md-on-surface-variant; max-width: 320px; }
}
```

### 12.4 Bulk Action Bar

When table rows are selected, a floating bulk action bar appears at the bottom of the screen.

```scss
.bulk-action-bar {
  position: fixed;
  bottom: $space-6;
  left: 50%;
  transform: translateX(-50%);
  z-index: 150;
  display: flex;
  align-items: center;
  gap: $space-4;
  padding: $space-3 $space-6;
  border-radius: $shape-full;
  @include md-elevation-3;
  background: $md-inverse-surface;
  color: $md-inverse-on-surface;

  &__count { @extend %type-label-large; flex-shrink: 0; }
  &__actions { display: flex; gap: $space-2; }
}
```

---

## 13. Accessibility

### 13.1 Contrast Requirements

All text must meet WCAG 2.1 AA contrast ratios:
- Normal text (< 18pt): minimum **4.5:1** against its background
- Large text (≥ 18pt or ≥ 14pt bold): minimum **3:1**
- UI components and graphical objects: minimum **3:1**

The defined color pairs in section 2.3 satisfy these requirements. Do not swap roles.

### 13.2 Focus Indicators

Every interactive element must have a visible focus indicator when navigated by keyboard.

```scss
// _states.scss — Focus ring
@mixin md-focus-ring {
  &:focus-visible {
    outline: 3px solid $md-primary;
    outline-offset: 2px;
    border-radius: inherit;
  }
}
```

Apply `@include md-focus-ring` to every interactive element. The `:focus` state layer (opacity 0.12) is insufficient alone for keyboard users — the outline must also be present.

### 13.3 ARIA Requirements

- All icon-only buttons: `aria-label` describing the action
- All dialogs: `role="dialog"`, `aria-modal="true"`, `aria-labelledby` pointing to the headline ID
- All data tables: `<caption>` element (visually hidden if needed) describing the table content
- All form inputs: `<label>` associated via `htmlFor`, or `aria-label` if visual label is elsewhere
- All status badges: `aria-label` with full status text (not just visual color)
- Navigation drawer: `<nav>` element with `aria-label="Main navigation"`
- Loading states: `aria-busy="true"` on the container being loaded

### 13.4 Reduced Motion

```scss
// _states.scss
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 13.5 Interactive Target Sizes

Every interactive element must have a minimum touch/click target of **48 × 48px** — even if the visual size is smaller. Use padding or an `::after` pseudo-element to extend the target area without affecting layout.

---

## 14. Icon Usage

All icons use **Lucide React**. No other icon library is permitted.

### 14.1 Icon Sizes

| Context | Size |
|---|---|
| Navigation drawer items | 24 × 24px |
| Button icons (leading/trailing) | 20 × 20px |
| Icon-only buttons | 24 × 24px |
| Table action icons | 18 × 18px |
| Status badge leading icon | 14 × 14px |
| Chip icons | 18 × 18px |
| Empty state illustration | 48 × 48px |

### 14.2 Icon Color Rules

Icons always inherit their color from the component context. Never hard-code icon colors. Apply the correct `$md-on-*` color to the icon container; icons will inherit via `currentColor` (Lucide uses `stroke: currentColor`).

### 14.3 Navigation Icon Map

| Module | Lucide Icon |
|---|---|
| Overview / Dashboard | `LayoutDashboard` |
| Licenses | `Key` |
| Downloads | `Download` |
| Plugin Updates | `RefreshCw` |
| Subscriptions | `Repeat` |
| SaaS Accounts | `Cloud` |
| Affiliates | `Users` |
| Abandoned Cart | `ShoppingCart` |
| Security | `Shield` |
| Analytics | `BarChart2` |
| Settings | `Settings` |

---

## 15. Charts (Recharts)

All charts use **Recharts**. Chart colors must use the MD3 role tokens.

### 15.1 Chart Color Palette

```js
// utils/constants.js
export const CHART_COLORS = {
  primary:   '#6750A4',   // $md-primary
  secondary: '#625B71',   // $md-secondary
  tertiary:  '#7D5260',   // $md-tertiary
  success:   '#386A20',   // $md-status-success
  error:     '#B3261E',   // $md-error
  warning:   '#7A5900',   // $md-status-warning
  info:      '#00629D',   // $md-status-info
};
```

### 15.2 Chart Rules

- All `<Tooltip>` components use `$md-surface-container-high` background, `$md-on-surface` text, `$shape-medium` border-radius
- All `<CartesianGrid>` uses `$md-outline-variant` stroke, `strokeDasharray="3 3"`
- All axis tick text: `%type-label-small` sizing (12px), `$md-on-surface-variant` fill
- Chart containers are always `.card--elevated` with `$space-4` internal padding
- Recharts `ResponsiveContainer` fills 100% of its card container — never set a fixed pixel width on a chart

---

## 16. What Never Changes

These rules are frozen. They do not bend for edge cases, deadlines, or personal preference.

1. **No raw hex values in component SCSS** — only token variables
2. **No MUI, Material Web, or any third-party design system library**
3. **No arbitrary px values in components** — only `$space-*`, `$shape-*`, `$layout-*` tokens
4. **No arbitrary font sizes** — only `%type-*` placeholder extends
5. **No `!important`** in component files — only in `_utilities.scss` utility classes
6. **No class-based approach other than BEM** — no Tailwind, no atomic CSS
7. **No loading spinners** — skeleton screens for all data-loading states
8. **No silent destructive actions** — always a confirm dialog
9. **No page reload to reflect state changes** — all mutations update local state (Context API) immediately after a successful API response
10. **No inline styles** — no `style={{ ... }}` on any JSX element, except for Recharts which requires it internally
