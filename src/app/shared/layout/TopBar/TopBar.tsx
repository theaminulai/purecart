/**
 * TopBar UI component.
 *
 * Renders the admin panel top navigation bar containing a breadcrumb trail,
 * page title, a contextual help menu, a caller-supplied notifications slot,
 * and the account menu.
 * Breadcrumbs are derived from PAGE_PARENT — child pages show their parent
 * as a clickable crumb; root pages show only "PureCart".
 *
 * @file
 * @since 1.0.0
 */
import { ChevronRight } from 'lucide-react';
import { M3 } from '@/theme';
import { PAGE_TITLES, PAGE_PARENT } from '../nav-schema';
import type { Page } from '@/shared/types/page';
import { AccountMenu } from './AccountMenu';
import { HelpMenu } from './HelpMenu';

/**
 * Fixed-height top bar with breadcrumb navigation and utility actions.
 *
 * @since 1.0.0
 *
 * @param {Object}   props            Component props.
 * @param {Page}     props.page       The currently active page identifier used to build breadcrumbs and title.
 * @param {Function} props.onNav      Callback invoked with a target Page when a breadcrumb link is clicked.
 * @param {string}   [props.detailLabel] Overrides the title/final breadcrumb when page is 'subscription-detail' - lets the header show "SUB-003 · SaaS Starter" instead of the generic static title.
 * @param {React.ReactNode} [props.notificationsSlot] The notifications menu, injected by the composition root - shared/ chrome may not import a module (DEVELOPMENT_GUIDELINES.md §1), and the notification feed is built from module data.
 *
 * @return {JSX.Element} The header top bar element.
 */
export function TopBar( {
	page,
	onNav,
	detailLabel,
	notificationsSlot,
}: {
	page: Page;
	onNav: ( p: Page ) => void;
	detailLabel?: string;
	notificationsSlot?: React.ReactNode;
} ) {
	// Build breadcrumb segments: root → optional parent → current page
	const crumbs: Array< { label: string; page?: Page } > = [
		{ label: 'PureCart' },
	];

	const parentPage = PAGE_PARENT[ page ];
	if ( parentPage ) {
		crumbs.push( { label: PAGE_TITLES[ parentPage ], page: parentPage } );
	}

	// Only add the leaf crumb for child pages (where the breadcrumb is meaningful)
	if ( parentPage ) {
		crumbs.push( { label: PAGE_TITLES[ page ] } );
	}
	if ( page === 'subscription-detail' ) {
		crumbs.push( { label: 'Subscriptions', page: 'subscriptions' } );
		crumbs.push( { label: detailLabel ?? PAGE_TITLES[ page ] } );
	}

	const title = page === 'subscription-detail' ? detailLabel ?? PAGE_TITLES[ page ] : PAGE_TITLES[ page ];

	return (
		<header
			className="flex items-center px-6 flex-shrink-0"
			style={ {
				height: 64,
				backgroundColor: M3.surface,
				borderBottom: `1px solid ${ M3.outlineVariant }`,
			} }
		>
			<div className="flex-1 min-w-0">
				{ /* Breadcrumb */ }
				<div
					className="flex items-center gap-1 text-xs"
					style={ { color: M3.onSurfaceVariant, fontFamily: 'Roboto, sans-serif' } }
				>
					{ crumbs.map( ( c, i ) => (
						<span key={ i } className="flex items-center gap-1">
							{ i > 0 && <ChevronRight size={ 12 } /> }
							{ c.page ? (
								<button
									onClick={ () => onNav( c.page! ) }
									style={ {
										background: 'none',
										border: 'none',
										cursor: 'pointer',
										color: M3.primary,
										fontFamily: 'Roboto, sans-serif',
										fontSize: 12,
										padding: 0,
									} }
								>
									{ c.label }
								</button>
							) : (
								<span>{ c.label }</span>
							) }
						</span>
					) ) }
				</div>

				{ /* Page title */ }
				<h1
					className="font-medium leading-tight"
					style={ {
						fontSize: 22,
						color: M3.onSurface,
						fontFamily: 'Roboto, sans-serif',
						margin: 0,
					} }
				>
					{ title }
				</h1>
			</div>

			{ /* Actions */ }
			<div className="flex items-center gap-1">
				<HelpMenu page={ page } />
				{ notificationsSlot }
				<AccountMenu onNav={ onNav } />
			</div>
		</header>
	);
}
