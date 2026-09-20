import { createResource } from './createResource';
import type { Resource } from './createResource';

/**
 * Module-level (not component-state) resource cache, keyed by an arbitrary
 * string — deliberately outside React entirely.
 *
 * A component-local `useState(() => createResource(...))` was tried first
 * and reverted: it re-fetched correctly on a cold page boot, but not on
 * in-app navigation. The likely cause — a component that suspends on its
 * very first mount attempt has no prior committed fiber, so exactly how
 * React re-runs its hooks on retry (once the thrown promise resolves) is
 * genuinely subtle, and differs from a top-level boot where nothing else is
 * mid-render at the same time. A plain module-level cache has none of that
 * ambiguity: "has this key been requested before" is a fact about the
 * module, not about any particular component instance or render attempt,
 * so it behaves identically regardless of how or when React retries.
 *
 * @since 1.1.0
 */
const cache = new Map<string, Resource<unknown>>();

/**
 * Returns the cached resource for `key`, creating (and starting `factory`)
 * it only the first time this key is ever requested in this page load.
 *
 * @param key      Stable identity for what's being loaded, e.g. 'subscriptions'.
 * @param factory  Only called if this is the first request for `key`.
 * @return `resource` to `.read()`, and `created` — true only on the call
 *         that actually created it, so callers that also need to avoid a
 *         duplicate fetch elsewhere (see UpdatesPage.tsx) can tell whether
 *         this request was the one that started it.
 */
export function getOrCreateResource<T>(
	key: string,
	factory: () => Promise<T>
): { resource: Resource<T>; created: boolean } {
	const existing = cache.get(key);
	if (existing) {
		return { resource: existing as Resource<T>, created: false };
	}
	const resource = createResource(factory);
	cache.set(key, resource as Resource<unknown>);
	return { resource, created: true };
}
