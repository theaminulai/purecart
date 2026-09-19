import { TYPE_CONFIG } from './shared';
import type { SubscriptionLinkedEntity } from '../types';

/**
 * Renders the type-specific "Linked" column content for one row.
 *
 * @since 1.0.0
 *
 * @param {Object}                  props        Component props.
 * @param {SubscriptionLinkedEntity} props.entity The row's linked entity.
 *
 * @return {JSX.Element} A small icon + summary text matching the entity's delivery type.
 */
export function LinkedEntityCell({ entity }: { entity: SubscriptionLinkedEntity }) {
	const iconStyle = { display: 'inline', verticalAlign: -2, marginRight: 4 };
	switch (entity.type) {
		case 'software': {
			const Icon = TYPE_CONFIG.software.icon;
			return (
				<>
					<Icon size={12} style={iconStyle} />
					{entity.licenseKey.slice(0, 9)}… · {entity.domainCount}
				</>
			);
		}
		case 'saas': {
			const Icon = TYPE_CONFIG.saas.icon;
			return (
				<>
					<Icon size={12} style={iconStyle} />
					{entity.saasAccountName} · {entity.seatUsage}
				</>
			);
		}
		case 'membership': {
			const Icon = TYPE_CONFIG.membership.icon;
			return (
				<>
					<Icon size={12} style={iconStyle} />
					{entity.membershipTier} · {entity.assignedRole}
				</>
			);
		}
		case 'download': {
			const Icon = TYPE_CONFIG.download.icon;
			return (
				<>
					<Icon size={12} style={iconStyle} />
					{entity.downloadsThisCycle}/{entity.downloadLimit ?? '∞'} downloads
				</>
			);
		}
		case 'course': {
			const Icon = TYPE_CONFIG.course.icon;
			return (
				<>
					<Icon size={12} style={iconStyle} />
					{entity.enrolledCourses.length} course
					{entity.enrolledCourses.length !== 1 ? 's' : ''}
				</>
			);
		}
		case 'service': {
			const Icon = TYPE_CONFIG.service.icon;
			return (
				<>
					<Icon size={12} style={iconStyle} />
					Next due {entity.nextDeliverableDue ?? '—'}
				</>
			);
		}
	}
}
