import { M3 } from '@/theme';

export interface SkeletonProps {
	/** CSS width, e.g. '100%', 120 (px), '4rem'. @default '100%' */
	width?: number | string;
	/** CSS height, e.g. 16, '2rem'. @default 16 */
	height?: number | string;
	/** Corner radius in px. @default 8 */
	radius?: number;
	className?: string;
}

/**
 * A pulsing placeholder rectangle — the one atom every module-specific
 * loading skeleton (see e.g. `modules/subscriptions/components/
 * SubscriptionsPageSkeleton.tsx`) composes into a layout that mirrors its
 * real page. Never used directly as a whole-page fallback on its own —
 * always assembled into a shape matching what it's standing in for.
 *
 * @since 1.1.0
 */
export function Skeleton({ width = '100%', height = 16, radius = 8, className = '' }: SkeletonProps) {
	return (
		<div
			className={`animate-pulse ${className}`}
			style={{
				width,
				height,
				borderRadius: radius,
				backgroundColor: M3.surfaceContainerHigh,
			}}
		/>
	);
}
