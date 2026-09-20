/**
 * Central reference for every @wordpress/hooks extension point this admin
 * SPA fires. See DEVELOPMENT_GUIDELINES.md §8 — don't scatter undocumented
 * hook name string literals through the codebase; every hook actually fired
 * anywhere in src/app is named here, once, and the firing site imports its
 * name from this file instead of retyping the string.
 *
 * @file
 * @since 1.1.0
 */

/**
 * Filter — the row-action menu (⋮) items built for one subscription.
 *
 * Fired in `modules/subscriptions/hooks/useSubscriptionActions.tsx`.
 *
 * @param {ActionItem[]}         actions      The default action list for this row.
 * @param {SubscriptionRecord}   subscription The subscription the menu is being built for.
 * @return {ActionItem[]} The (optionally modified) action list to render.
 */
export const SUBSCRIPTION_ACTIONS_FILTER = 'purecart/dashboard/subscriptionActions';

/**
 * Action — fired after a subscription is successfully patched via the
 * generic update path (pause/resume/cancel-via-patch, etc. each have their
 * own dedicated thunk and don't currently fire this — only the general
 * `updateSubscription` PATCH route does).
 *
 * Fired in `modules/subscriptions/store/subscriptions.slice.ts`
 * (`patchSubscription` thunk, after the API call resolves).
 *
 * @param {SubscriptionRecord} subscription The updated subscription record.
 */
export const SUBSCRIPTION_UPDATED_ACTION = 'purecart/dashboard/subscriptionUpdated';
