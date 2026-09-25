# AnchoredMenu

A floating panel anchored under whatever trigger the caller renders. It owns open/close state, portal rendering, viewport-aware positioning, outside-click/Escape closing, and repositioning on scroll or resize — and nothing about the panel's contents.

Source: [`AnchoredMenu.tsx`](../../src/app/shared/ui/AnchoredMenu/AnchoredMenu.tsx)

Use it when a menu's contents are richer than [ActionDropdown](ActionDropdown.md)'s flat `ActionItem[]` list — the [TopBar](TopBar.md)'s notification feed and account menu are the two current callers.

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `trigger` | `(open: boolean) => ReactNode` | — | Renders the clickable anchor; receives the current open state (for an active/selected style) |
| `children` | `({ close }) => ReactNode` | — | Renders the panel body; receives a `close` callback |
| `panelWidth` | `number` | `320` | Panel width in px |
| `panelMaxHeight` | `number` | `480` | Upper bound on panel height; the panel also never exceeds the space below the anchor |
| `onOpen` | `() => void` | — | Fired each time the panel opens — used to refresh stale data |
| `label` | `string` | — | `aria-label` for the panel |

## Behavior

- The trigger is wrapped in a plain measuring `<div>` that owns the toggle click, **not** in a button — callers pass real interactive elements ([IconButton](IconButton.md), an avatar button), and nesting those inside another button is invalid markup that also breaks keyboard activation. The caller's button still receives focus and Enter/Space; the resulting click bubbles to the wrapper.
- The panel renders through a portal into `document.body` and stops click propagation, because React portals bubble events through the React tree rather than the DOM tree — without that, a click inside the panel would reach the anchor's handler and close it.
- Positioning is `fixed`, computed from the anchor's bounding rect and clamped to an 8px right gutter; it recomputes on scroll (capture phase) and resize.

## Usage

```tsx
import { AnchoredMenu, IconButton } from "@/shared/ui";
import { Bell } from "lucide-react";

<AnchoredMenu
  panelWidth={ 380 }
  label="Notifications"
  onOpen={ refreshIfStale }
  trigger={ ( open ) => (
    <IconButton icon={ Bell } title="Notifications" active={ open } badgeCount={ unread } />
  ) }
>
  { ( { close } ) => <NotificationsPanel onSelect={ () => close() } /> }
</AnchoredMenu>
```

## Related

- [ActionDropdown](ActionDropdown.md) — the older "⋮" menu; it predates this primitive and still carries its own copy of the same positioning/dismiss logic.
- [TopBar](TopBar.md) — both of its menus are built on this component.
