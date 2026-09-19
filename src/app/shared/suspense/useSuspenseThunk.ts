import { getOrCreateResource } from './resourceCache';

/**
 * Suspends the calling component until the load thunk identified by `key`
 * resolves — but only the *first* time `key` is ever requested in this page
 * load (browser tab). Later calls, whether from this component remounting
 * (e.g. navigating away and back) or a different page that happens to need
 * the same data, read the cached, already-resolved resource instantly —
 * no re-fetch, no re-suspend.
 *
 * `key` must be stable and unique per distinct thing being loaded (e.g.
 * `'subscriptions'`), shared by every call site that loads the same data,
 * so they all suspend on — and are satisfied by — the exact same fetch.
 * Call this unconditionally at the top of the page component that should
 * suspend, not conditionally.
 *
 * @since 1.1.0
 * @param key            Stable cache key for what's being loaded.
 * @param dispatchThunk  Dispatches the module's load thunk and returns its
 *                        promise, e.g. `() => dispatch(loadSubscriptions()).unwrap()`.
 *                        Only actually called if `key` hasn't been requested
 *                        before this page load.
 */
export function useSuspenseThunk(key: string, dispatchThunk: () => Promise<unknown>): void {
	getOrCreateResource(key, dispatchThunk).resource.read();
}
