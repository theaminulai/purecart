/**
 * AnchoredMenu UI component.
 *
 * A floating panel anchored to whatever trigger the caller renders: it owns
 * open/close state, portal rendering, viewport-aware positioning, and the
 * outside-click / Escape / scroll behavior, but nothing about what goes
 * inside it.
 *
 * It exists because the top bar needs two such menus (notifications and the
 * account chip) whose contents are nothing like ActionDropdown's flat
 * `ActionItem[]` list — this is the shared mechanism those two sit on,
 * not a second dropdown design. ActionDropdown predates it and still owns
 * its own copy of this logic; it was left alone deliberately (the two are
 * used in different places and rewriting a working, widely-used primitive
 * was not part of the change that introduced this file).
 *
 * @file
 * @since 1.1.0
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { M3 } from '@/theme';

/**
 * Renders a trigger and, while open, a floating panel anchored under it.
 *
 * The trigger is wrapped in a plain measuring element rather than a button
 * of its own: callers pass real interactive elements (IconButton, an avatar
 * button), and nesting those inside another button is invalid markup that
 * also breaks keyboard activation.
 *
 * @since 1.1.0
 *
 * @param {Object}   props                  Component props.
 * @param {Function} props.trigger          Renders the clickable anchor; receives the current open state.
 * @param {Function} props.children         Renders the panel body; receives a `close` callback.
 * @param {number}   [props.panelWidth]     Panel width in px.
 * @param {number}   [props.panelMaxHeight] Upper bound on panel height in px; the panel also never exceeds the space below the anchor.
 * @param {Function} [props.onOpen]         Called each time the panel opens — used to refresh stale data.
 * @param {string}   [props.label]          Accessible label for the panel.
 *
 * @return {JSX.Element} The anchor wrapper plus, when open, the portaled panel.
 */
export function AnchoredMenu( {
	trigger,
	children,
	panelWidth = 320,
	panelMaxHeight = 480,
	onOpen,
	label,
}: {
	trigger: ( open: boolean ) => React.ReactNode;
	children: ( api: { close: () => void } ) => React.ReactNode;
	panelWidth?: number;
	panelMaxHeight?: number;
	onOpen?: () => void;
	label?: string;
} ) {
	const [ open, setOpen ] = useState( false );
	const anchorRef = useRef< HTMLDivElement >( null );
	const panelRef = useRef< HTMLDivElement >( null );
	const [ position, setPosition ] = useState< {
		top: number;
		right: number;
		maxHeight: number;
	} >( { top: 0, right: 0, maxHeight: panelMaxHeight } );

	const close = useCallback( () => setOpen( false ), [] );

	const updatePosition = useCallback( () => {
		if ( ! anchorRef.current ) return;
		const rect = anchorRef.current.getBoundingClientRect();

		setPosition( {
			top: rect.bottom + 8,
			// Clamped so a trigger near the right edge never pushes the panel
			// off-screen, and never narrower than the 8px gutter on the left.
			right: Math.min(
				Math.max( 8, window.innerWidth - rect.right ),
				Math.max( 8, window.innerWidth - panelWidth - 8 )
			),
			maxHeight: Math.max( 160, Math.min( panelMaxHeight, window.innerHeight - rect.bottom - 24 ) ),
		} );
	}, [ panelWidth, panelMaxHeight ] );

	useEffect( () => {
		if ( ! open ) return;

		updatePosition();
		onOpen?.();

		const handleScrollOrResize = () => updatePosition();

		const handleKeyDown = ( e: KeyboardEvent ) => {
			if ( 'Escape' === e.key ) close();
		};

		const handlePointerDown = ( e: MouseEvent | TouchEvent ) => {
			const target = e.target as Node | null;
			if ( ! target ) return;
			if ( panelRef.current?.contains( target ) || anchorRef.current?.contains( target ) ) {
				return;
			}
			close();
		};

		window.addEventListener( 'resize', handleScrollOrResize );
		window.addEventListener( 'scroll', handleScrollOrResize, true );
		window.addEventListener( 'keydown', handleKeyDown );
		document.addEventListener( 'pointerdown', handlePointerDown );

		return () => {
			window.removeEventListener( 'resize', handleScrollOrResize );
			window.removeEventListener( 'scroll', handleScrollOrResize, true );
			window.removeEventListener( 'keydown', handleKeyDown );
			document.removeEventListener( 'pointerdown', handlePointerDown );
		};
		// `onOpen` is intentionally not a dependency: it fires once per open,
		// not again whenever the caller re-creates the callback.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ open, updatePosition, close ] );

	return (
		<div
			ref={ anchorRef }
			className="relative inline-flex"
			onClick={ () => setOpen( ( o ) => ! o ) }
		>
			{ trigger( open ) }
			{ open &&
				createPortal(
					<div
						ref={ panelRef }
						aria-label={ label }
						className="fixed rounded-xl flex flex-col overflow-hidden"
						style={ {
							top: position.top,
							right: position.right,
							zIndex: 9999,
							width: panelWidth,
							maxHeight: position.maxHeight,
							backgroundColor: M3.surface,
							boxShadow: '0 4px 8px rgba(0,0,0,0.12), 0 8px 24px rgba(0,0,0,0.16)',
							border: `1px solid ${ M3.outlineVariant }`,
						} }
						/*
						 * React portals bubble events through the React tree, not
						 * the DOM tree — without this, every click inside the panel
						 * would reach the anchor's onClick and toggle it shut.
						 */
						onClick={ ( e ) => e.stopPropagation() }
					>
						{ children( { close } ) }
					</div>,
					document.body
				) }
		</div>
	);
}
