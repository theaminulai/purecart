import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { __ } from '@wordpress/i18n';

interface ErrorBoundaryProps {
	children: ReactNode;
}

interface ErrorBoundaryState {
	error: Error | null;
}

/**
 * Catches render-time errors anywhere in the admin SPA so one broken
 * component shows a fallback instead of blanking the whole wp-admin page.
 *
 * Deliberately styled with inline styles rather than theme tokens or shared
 * UI components — if the app is broken badly enough to reach here, it
 * shouldn't depend on anything else in the app tree still working.
 *
 * @since 1.1.0
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
	state: ErrorBoundaryState = { error: null };

	static getDerivedStateFromError(error: Error): ErrorBoundaryState {
		return { error };
	}

	componentDidCatch(error: Error, info: ErrorInfo): void {
		// eslint-disable-next-line no-console
		console.error('PureCart admin dashboard crashed:', error, info.componentStack);
	}

	private handleReload = (): void => {
		window.location.reload();
	};

	render() {
		if (this.state.error) {
			return (
				<div
					style={{
						padding: 48,
						textAlign: 'center',
						fontFamily: 'Roboto, sans-serif',
					}}
				>
					<h1 style={{ fontSize: 20, marginBottom: 8 }}>
						{__('Something went wrong', 'purecart')}
					</h1>
					<p style={{ color: '#666', marginBottom: 16 }}>
						{__(
							'The PureCart dashboard hit an unexpected error. Reloading the page usually fixes this.',
							'purecart'
						)}
					</p>
					<button
						onClick={this.handleReload}
						style={{
							padding: '8px 20px',
							borderRadius: 20,
							border: 'none',
							background: '#6750A4',
							color: '#fff',
							cursor: 'pointer',
							fontFamily: 'inherit',
							fontSize: 14,
						}}
					>
						{__('Reload', 'purecart')}
					</button>
				</div>
			);
		}

		return this.props.children;
	}
}
