/**
 * CancellationFlowModal component.
 *
 * 3-step cancellation flow that replaces a plain "are you sure?" confirm:
 * (1) pick a reason, (2) see a matching retention offer if the reason has
 * one, (3) pick immediate vs. end-of-period timing. Accepting the retention
 * offer aborts the cancellation entirely - most of the time "cancel" should
 * not end in a cancellation.
 *
 * Reasons come from GET /subscriptions/{id}/cancellation/reasons
 * (RetentionFlow::get_reasons()) and the offer for a chosen reason from
 * GET .../cancellation/offers - both real, backend-driven eligibility
 * rules (subscription age, value, customer LTV), not a fixed local list.
 *
 * @file
 * @since 1.0.0
 */
import { useEffect, useState } from 'react';
import { XCircle } from 'lucide-react';
import { M3 } from '@/theme';
import { fetchCancellationReasons, fetchCancellationOffers } from '../../api';
import { TextButton } from '@/shared/ui/TextButton';
import { FilledButton } from '@/shared/ui/FilledButton';
import { StepIndicator, CancellationReasonList, RetentionOfferCard } from '../shared';
import type { SubscriptionRecord, RetentionOffer, CancellationReason } from '../../types';

type Step = 0 | 1 | 2;

/** Reasons vague enough to benefit from an optional free-text follow-up. */
const REASONS_WITH_TEXTBOX = new Set( [ 'missing_features', 'switching', 'other' ] );

/** Maps one raw offer from GET .../cancellation/offers to the RetentionOffer shape RetentionOfferCard expects. */
function mapBackendOffer( raw: {
	type: RetentionOffer[ 'type' ];
	label: string;
	percent?: number;
	cycles?: number;
	pause_days?: number;
	url?: string;
} ): RetentionOffer {
	return {
		type: raw.type,
		label: raw.label,
		description: raw.label,
		discountPct: raw.percent,
		discountDuration: raw.cycles ? `${ raw.cycles } billing cycle${ raw.cycles === 1 ? '' : 's' }` : undefined,
		pauseDuration: raw.pause_days,
		contactUrl: raw.url,
	};
}

interface CancellationFlowModalProps {
	row: SubscriptionRecord;
	onClose: () => void;
	onCancelled: ( patch: Partial< SubscriptionRecord > ) => void;
	onOfferAccepted: ( offer: RetentionOffer, reasonId: string ) => void;
}

/**
 * Renders the 3-step cancellation flow modal.
 *
 * @since 1.0.0
 *
 * @param {CancellationFlowModalProps} props Component props.
 *
 * @return {JSX.Element} The cancellation flow modal.
 */
export function CancellationFlowModal( {
	row,
	onClose,
	onCancelled,
	onOfferAccepted,
}: CancellationFlowModalProps ) {
	const [ step, setStep ] = useState< Step >( 0 );
	const [ reasons, setReasons ] = useState< CancellationReason[] >( [] );
	const [ selectedReasonId, setSelectedReasonId ] = useState< string | null >( null );
	const [ reasonText, setReasonText ] = useState( '' );
	const [ timing, setTiming ] = useState< 'end_of_period' | 'immediate' >( 'end_of_period' );
	const [ offer, setOffer ] = useState< RetentionOffer | null >( null );
	const [ loadingOffer, setLoadingOffer ] = useState( false );

	useEffect( () => {
		fetchCancellationReasons( row.id ).then( ( labels ) => {
			setReasons(
				Object.entries( labels ).map( ( [ id, label ] ) => ( {
					id,
					label,
					hasTextBox: REASONS_WITH_TEXTBOX.has( id ),
					offer: null,
				} ) )
			);
		} );
	}, [ row.id ] );

	const goNext = async () => {
		if ( step === 0 ) {
			if ( ! selectedReasonId ) return;

			setLoadingOffer( true );
			const eligible = await fetchCancellationOffers( row.id, selectedReasonId ).catch( () => [] );
			setLoadingOffer( false );

			if ( eligible.length > 0 ) {
				setOffer( mapBackendOffer( eligible[ 0 ] ) );
				setStep( 1 );
			} else {
				setOffer( null );
				setStep( 2 );
			}
			return;
		}
		if ( step === 1 ) setStep( 2 );
	};

	const goBack = () => {
		if ( step === 2 ) {
			setStep( offer ? 1 : 0 );
		} else if ( step === 1 ) {
			setStep( 0 );
		}
	};

	const handleAcceptOffer = () => {
		if ( ! offer || ! selectedReasonId ) return;
		onOfferAccepted( offer, selectedReasonId );
		onClose();
	};

	const handleCancel = () => {
		onCancelled(
			timing === 'immediate'
				? {
						status: 'cancelled',
						nextPayment: null,
						cancellationDate: new Date().toISOString().slice( 0, 10 ),
						cancellationReasonId: selectedReasonId,
				  }
				: {
						status: 'pending_cancel',
						cancellationDate: row.nextPayment,
						cancellationReasonId: selectedReasonId,
				  }
		);
		onClose();
	};

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center"
			style={ { backgroundColor: 'rgba(0,0,0,0.40)' } }
			onClick={ ( e ) => {
				if ( e.target === e.currentTarget ) onClose();
			} }
		>
			<div
				className="rounded-3xl overflow-hidden flex flex-col"
				style={ {
					width: 480,
					backgroundColor: M3.surfaceContainer,
					boxShadow: '0 8px 32px rgba(0,0,0,0.24)',
				} }
			>
				<div className="px-6 pt-6 pb-2">
					<StepIndicator steps={ 3 } current={ step } />
				</div>

				{ step === 0 && (
					<>
						<div className="px-6 pt-4 pb-2 text-center">
							<div
								className="font-semibold text-lg"
								style={ { color: M3.onSurface, fontFamily: 'Roboto, sans-serif' } }
							>
								Why are you cancelling?
							</div>
							<div
								className="text-sm mt-1"
								style={ { color: M3.onSurfaceVariant, fontFamily: 'Roboto, sans-serif' } }
							>
								{ row.customer } · { row.product }
							</div>
						</div>
						<div className="px-6 pb-6 pt-2">
							<CancellationReasonList
								reasons={ reasons }
								selectedId={ selectedReasonId }
								onSelect={ setSelectedReasonId }
								textValue={ reasonText }
								onTextChange={ setReasonText }
							/>
						</div>
						<div
							className="flex items-center justify-end gap-2 px-6 py-4"
							style={ { borderTop: `1px solid ${ M3.outlineVariant }` } }
						>
							<TextButton onClick={ onClose }>Cancel</TextButton>
							<FilledButton small onClick={ goNext } disabled={ ! selectedReasonId || loadingOffer }>
								{ loadingOffer ? 'Loading…' : 'Next →' }
							</FilledButton>
						</div>
					</>
				) }

				{ step === 1 && offer && (
					<>
						<div className="px-6 pt-4 pb-4 text-center">
							<div
								className="font-semibold text-lg"
								style={ { color: M3.onSurface, fontFamily: 'Roboto, sans-serif' } }
							>
								Before you go…
							</div>
						</div>
						<div className="px-6 pb-4">
							<RetentionOfferCard
								offer={ offer }
								currentAmount={ row.amount }
								onAccept={ handleAcceptOffer }
								onDecline={ goNext }
							/>
						</div>
						<div
							className="flex items-center justify-between gap-2 px-6 py-4"
							style={ { borderTop: `1px solid ${ M3.outlineVariant }` } }
						>
							<TextButton onClick={ goBack }>← Back</TextButton>
							<TextButton onClick={ onClose }>Keep Subscription</TextButton>
						</div>
					</>
				) }

				{ step === 2 && (
					<>
						<div className="px-6 pt-4 pb-2 text-center">
							<div
								className="font-semibold text-lg"
								style={ { color: M3.onSurface, fontFamily: 'Roboto, sans-serif' } }
							>
								When should access end?
							</div>
						</div>
						<div className="px-6 pb-4 flex flex-col gap-2">
							<button
								onClick={ () => setTiming( 'end_of_period' ) }
								className="flex items-start gap-3 p-4 rounded-2xl text-left transition-all"
								style={ {
									border: `2px solid ${ timing === 'end_of_period' ? M3.primary : M3.outlineVariant }`,
									backgroundColor: timing === 'end_of_period' ? M3.primaryContainer : M3.surfaceContainerLow,
									cursor: 'pointer',
								} }
							>
								<span
									className="w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5"
									style={ {
										border: `2px solid ${ timing === 'end_of_period' ? M3.primary : M3.outlineVariant }`,
										backgroundColor: timing === 'end_of_period' ? M3.primary : 'transparent',
									} }
								>
									{ timing === 'end_of_period' && (
										<span className="w-1.5 h-1.5 rounded-full" style={ { backgroundColor: M3.onPrimary } } />
									) }
								</span>
								<span>
									<div className="text-sm font-medium" style={ { color: M3.onSurface, fontFamily: 'Roboto, sans-serif' } }>
										Cancel at end of billing period
									</div>
									<div className="text-xs mt-0.5" style={ { color: M3.onSurfaceVariant, fontFamily: 'Roboto, sans-serif' } }>
										Access continues until { row.nextPayment ?? 'the end of the current period' }
									</div>
								</span>
							</button>
							<button
								onClick={ () => setTiming( 'immediate' ) }
								className="flex items-start gap-3 p-4 rounded-2xl text-left transition-all"
								style={ {
									border: `2px solid ${ timing === 'immediate' ? M3.error : M3.outlineVariant }`,
									backgroundColor: timing === 'immediate' ? '#FFDAD6' : M3.surfaceContainerLow,
									cursor: 'pointer',
								} }
							>
								<span
									className="w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5"
									style={ {
										border: `2px solid ${ timing === 'immediate' ? M3.error : M3.outlineVariant }`,
										backgroundColor: timing === 'immediate' ? M3.error : 'transparent',
									} }
								>
									{ timing === 'immediate' && (
										<span className="w-1.5 h-1.5 rounded-full" style={ { backgroundColor: '#FFF' } } />
									) }
								</span>
								<span>
									<div className="text-sm font-medium" style={ { color: M3.onSurface, fontFamily: 'Roboto, sans-serif' } }>
										Cancel immediately
									</div>
									<div className="text-xs mt-0.5" style={ { color: M3.onSurfaceVariant, fontFamily: 'Roboto, sans-serif' } }>
										Access ends now
									</div>
								</span>
							</button>
						</div>
						<div
							className="flex items-center justify-between gap-2 px-6 py-4"
							style={ { borderTop: `1px solid ${ M3.outlineVariant }` } }
						>
							<TextButton onClick={ goBack }>← Back</TextButton>
							<div className="flex items-center gap-2">
								<TextButton onClick={ onClose }>Keep Subscription</TextButton>
								<FilledButton danger small onClick={ handleCancel }>
									<XCircle size={ 14 } /> Cancel Subscription
								</FilledButton>
							</div>
						</div>
					</>
				) }
			</div>
		</div>
	);
}
