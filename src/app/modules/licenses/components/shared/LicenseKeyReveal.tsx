/**
 * LicenseKeyReveal component.
 *
 * Shows a license key blurred by default (per docs/RND-frontend-license-
 * manager.md's frozen "blur-reveal pattern": the key stays in the DOM at all
 * times, blur is a CSS filter toggle, not a re-fetch). Click to reveal, then
 * copy. Always Roboto Mono — license keys are never rendered in the default
 * sans-serif font anywhere in this module.
 *
 * @file
 * @since 1.0.0
 */
import { useState } from 'react';
import { Eye, EyeOff, Copy, Check } from 'lucide-react';
import { __ } from '@wordpress/i18n';
import { M3 } from '@/theme';

interface LicenseKeyRevealProps {
	licenseKey: string;
	/** Renders the key at a larger size for the detail page vs. the table's compact row. */
	size?: 'small' | 'large';
}

/**
 * Renders a blur-by-default, click-to-reveal license key with copy support.
 *
 * @since 1.0.0
 */
export function LicenseKeyReveal( { licenseKey, size = 'small' }: LicenseKeyRevealProps ) {
	const [ revealed, setRevealed ] = useState( false );
	const [ copied, setCopied ] = useState( false );

	const handleCopy = () => {
		navigator.clipboard.writeText( licenseKey ).then( () => {
			setCopied( true );
			setTimeout( () => setCopied( false ), 1500 );
		} );
	};

	const fontSize = size === 'large' ? 14 : 12;

	return (
		<div className="inline-flex items-center gap-2">
			<code
				aria-label={ revealed ? undefined : __( 'License key, hidden. Click to reveal.', 'purecart' ) }
				style={ {
					fontFamily: 'Roboto Mono, monospace',
					fontSize,
					color: M3.onSurface,
					filter: revealed ? 'none' : 'blur(6px)',
					userSelect: revealed ? 'text' : 'none',
					transition: 'filter 0.15s ease',
				} }
			>
				{ licenseKey }
			</code>
			<button
				type="button"
				onClick={ () => setRevealed( ( r ) => ! r ) }
				title={ revealed ? __( 'Hide', 'purecart' ) : __( 'Click to reveal', 'purecart' ) }
				style={ {
					background: 'none',
					border: 'none',
					cursor: 'pointer',
					padding: 2,
					display: 'inline-flex',
					color: M3.onSurfaceVariant,
				} }
			>
				{ revealed ? <EyeOff size={ 14 } /> : <Eye size={ 14 } /> }
			</button>
			{ revealed && (
				<button
					type="button"
					onClick={ handleCopy }
					title={ __( 'Copy', 'purecart' ) }
					style={ {
						background: 'none',
						border: 'none',
						cursor: 'pointer',
						padding: 2,
						display: 'inline-flex',
						color: copied ? M3.success : M3.onSurfaceVariant,
					} }
				>
					{ copied ? <Check size={ 14 } /> : <Copy size={ 14 } /> }
				</button>
			) }
		</div>
	);
}
