# IconButton

Circular, icon-only button with a hover state layer, an optional selected (active) state, and an optional count badge. Used for compact actions like the [TopBar](TopBar.md) help and notifications buttons.

Source: [`IconButton.tsx`](../../src/app/shared/ui/IconButton/IconButton.tsx)

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `icon` | `React.ElementType` | — | Lucide icon component to render |
| `onClick` | `() => void` | — | Click handler |
| `title` | `string` | `""` | Native `title` attribute (tooltip), also used as the `aria-label` |
| `active` | `boolean` | `false` | Keeps the button filled/selected — for a button that opens a menu, pass the menu's open state |
| `badgeCount` | `number` | `0` | Count badge on the icon; `0` renders no badge, anything over 9 renders `9+` |

## Usage

```tsx
import { IconButton } from "@/shared/ui";
import { Bell } from "lucide-react";

<IconButton icon={ Bell } title="Notifications" badgeCount={ 3 } onClick={ openNotifications } />
```

## Related

Used as the [AnchoredMenu](AnchoredMenu.md) trigger for both of the [TopBar](TopBar.md)'s icon menus — help and notifications.
