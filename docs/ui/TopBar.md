# TopBar

The plugin's top app bar (M3 Top App Bar). Shows a breadcrumb trail (built from the current `page`), the page title from `PAGE_TITLES`, a contextual help menu, a caller-supplied notifications slot, and the account menu.

Source: [`TopBar.tsx`](../../src/app/shared/layout/TopBar/TopBar.tsx)

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `page` | `Page` | — | Current page id, drives both the breadcrumb trail and the `<h1>` title |
| `onNav` | `(p: Page) => void` | — | Called when a clickable breadcrumb segment — or the account menu's Settings item — navigates |
| `detailLabel` | `string` | — | Overrides the title/final breadcrumb on `subscription-detail` |
| `notificationsSlot` | `ReactNode` | — | The notifications menu, injected by the composition root |

## Behavior

- Breadcrumbs are derived from `PAGE_PARENT`: child pages show their parent as a clickable crumb, root pages show only "PureCart".
- **Help menu** — [`HelpMenu.tsx`](../../src/app/shared/layout/TopBar/HelpMenu.tsx) opens a contextual panel describing the page that is currently open: one sentence on what it is for, a few concrete things that can be done on it, and the plugin version. The text lives in [`page-help.ts`](../../src/app/shared/layout/TopBar/page-help.ts) as a *function*, not a constant map — `__()` in a module-level constant can run before WordPress registers its locale data (the reason `nav-schema.ts`'s labels are untranslated), and building the record inside a call avoids that. It explains the page in place rather than linking out because the plugin ships no documentation site; point the panel's footer at real docs once there are some.
- **Account menu** — [`AccountMenu.tsx`](../../src/app/shared/layout/TopBar/AccountMenu.tsx) renders the avatar chip (Gravatar, falling back to initials) and opens a menu with the signed-in user's name, email, and role, plus *Edit profile* (wp-admin `profile.php`), *PureCart settings* (in-SPA, shown only with `manage_options`), and *Log out*. The user comes from the localized `window.purecartAdmin.currentUser` payload — see [`shared/wp/admin-config.ts`](../../src/app/shared/wp/admin-config.ts) and `Admin::current_user_payload()` — so the chip never renders a placeholder that then changes. With no usable payload the chip renders as a plain, non-interactive badge.
- **Notifications** — `TopBar` lives in `shared/`, which may not import a module, so the bell is passed in as `notificationsSlot` by `App.tsx`. The component behind it is `modules/notifications`' `NotificationsMenu`.

## The notification feed

There is no notifications table and no notifications endpoint. The feed is derived on the client from counts other modules' endpoints already return, fetched in parallel (`Promise.allSettled`, so one failing source degrades the list instead of emptying it):

| Row | Source | Severity |
|---|---|---|
| Subscriptions past due | `GET /subscriptions?status=past_due` (X-WP-Total) | critical |
| Subscriptions awaiting re-authorization | `GET /subscriptions?status=pending_reauth` | warning |
| Licenses expiring within 30 days | `GET /reports/licenses/summary` → `stats.expiring_30d` | warning |
| Suspended SaaS accounts | `GET /saas-accounts/stats` → `suspended` | info |

- A count of 0 produces no row; an empty feed shows "Nothing needs your attention."
- Each row's id is `kind:count`, and read state is keyed on it — a notification returns as unread when the number behind it changes.
- Read state lives in `localStorage` (`purecart:notifications:read`), so it is per browser, not per account. That is the first thing to revisit if the feed ever grows a real backend store.
- Loaded once per admin page load, and refreshed when the bell is opened if the data is more than two minutes old.

## Usage

```tsx
import { TopBar } from "@/shared/layout";
import { NotificationsMenu } from "@/modules/notifications";

<TopBar
  page={ page }
  onNav={ setPage }
  notificationsSlot={ <NotificationsMenu onNav={ setPage } /> }
/>
```

## Related

Pairs with [Sidebar](Sidebar.md) to form the plugin's page chrome. Both of its menus are built on [AnchoredMenu](AnchoredMenu.md).
