import { M3 } from '@/theme';

/** Small "not built yet" notice, shared visual language across the type-specific tabs. */
export function NotBuiltNotice( { children }: { children: React.ReactNode } ) {
	return (
		<div
			className="text-xs px-3 py-2.5 rounded-xl"
			style={ { backgroundColor: M3.surfaceContainerHigh, color: M3.onSurfaceVariant, fontFamily: 'Roboto, sans-serif' } }
		>
			{ children }
		</div>
	);
}
