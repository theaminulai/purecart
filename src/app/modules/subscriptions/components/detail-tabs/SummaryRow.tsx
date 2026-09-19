import { M3 } from '@/theme';

/** One label/value row inside the Billing Summary card. */
export function SummaryRow({ label, value }: { label: string; value: React.ReactNode }) {
	return (
		<div className="flex items-center justify-between py-1.5 text-sm" style={{ fontFamily: 'Roboto, sans-serif' }}>
			<span style={{ color: M3.onSurfaceVariant }}>{label}</span>
			<span style={{ color: M3.onSurface }}>{value}</span>
		</div>
	);
}
