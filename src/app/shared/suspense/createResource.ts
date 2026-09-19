/**
 * Minimal "throw a promise" Suspense resource — the manual pattern React's
 * own docs used before `use()` existed. Needed here because this app is on
 * React 18 (`use()` is React 19+) and its data layer is Redux Toolkit
 * `createAsyncThunk`, which resolves outside of render and so never
 * suspends a component on its own — something has to bridge the two.
 *
 * A resource is read during render. While its promise is pending, `read()`
 * throws the promise itself; React's reconciler catches that specific throw
 * type and treats it as "this subtree is waiting," showing the nearest
 * ancestor <Suspense>'s fallback until the promise settles, then re-rendering
 * the same component instance. If the promise rejects, `read()` throws the
 * *error* instead (not a promise) on the next render, which is a normal
 * render-time throw — the nearest ancestor ErrorBoundary catches it, no
 * separate error-handling plumbing needed here.
 *
 * @file
 * @since 1.1.0
 */

export interface Resource<T> {
	/**
	 * Call during render. Returns the resolved value once ready; throws the
	 * pending promise while waiting, or the error if the promise rejected.
	 */
	read(): T;
}

type ResourceState<T> =
	| { status: 'pending' }
	| { status: 'success'; value: T }
	| { status: 'error'; error: unknown };

export function createResource<T>(promiseFactory: () => Promise<T>): Resource<T> {
	let state: ResourceState<T> = { status: 'pending' };

	const promise = promiseFactory().then(
		(value) => {
			state = { status: 'success', value };
		},
		(error: unknown) => {
			state = { status: 'error', error };
		}
	);

	return {
		read(): T {
			if (state.status === 'pending') throw promise;
			if (state.status === 'error') throw state.error;
			return state.value;
		},
	};
}
