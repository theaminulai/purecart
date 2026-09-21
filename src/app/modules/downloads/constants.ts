/**
 * Shared display helpers for the Downloads module.
 *
 * Functions, not module-level constant objects — `__()` calls inside a
 * top-level object literal would evaluate at import time, before
 * WordPress's locale data is registered, and silently ship untranslated
 * strings (see shared/layout/nav-schema.ts's docblock for the same pitfall
 * already documented there). Calling these inside a component's render
 * instead evaluates `__()` at a safe time.
 *
 * @file
 * @since 1.0.0
 */
import { __ } from '@wordpress/i18n';
import { M3 } from '@/theme';
import type { DownloadLogStatus, DownloadTokenStatus } from './types';

/** Display label for a download log entry's status. */
export function downloadStatusLabel( status: DownloadLogStatus | string ): string {
	switch ( status ) {
		case 'success': return __( 'Success', 'purecart' );
		case 'rejected_expired': return __( 'Expired', 'purecart' );
		case 'rejected_exhausted': return __( 'Limit Reached', 'purecart' );
		case 'rejected_revoked': return __( 'Revoked', 'purecart' );
		default: return status;
	}
}

/** Badge colors for a download log entry's status. */
export function downloadStatusBadgeStyle( status: DownloadLogStatus | string ): { bg: string; color: string } {
	switch ( status ) {
		case 'success': return { bg: M3.successContainer, color: M3.success };
		case 'rejected_expired':
		case 'rejected_exhausted':
			return { bg: '#FFDEA5', color: '#5C4200' };
		case 'rejected_revoked':
			return { bg: M3.errorContainer, color: M3.error };
		default: return { bg: M3.surfaceContainerHigh, color: M3.onSurfaceVariant };
	}
}

/** Display label for a download token's lifecycle status. */
export function tokenStatusLabel( status: DownloadTokenStatus | string ): string {
	switch ( status ) {
		case 'active': return __( 'Active', 'purecart' );
		case 'expired': return __( 'Expired', 'purecart' );
		case 'revoked': return __( 'Revoked', 'purecart' );
		default: return status;
	}
}

const FILE_TYPE_COLORS: Record<string, string> = {
	zip: '#FF9800',
	pdf: '#F44336',
	exe: '#9E9E9E',
	dmg: '#607D8B',
	pkg: '#607D8B',
	deb: '#E91E63',
	rpm: '#9C27B0',
	tar: '#FF9800',
	gz: '#FF9800',
	mp4: '#3F51B5',
	mp3: '#009688',
	ttf: '#795548',
	otf: '#795548',
	fbx: '#4CAF50',
	epub: '#FF5722',
	xlsx: '#4CAF50',
};

/** Short uppercase label for a file extension, used by FileTypeChip. */
export function fileTypeLabel( extension: string ): string {
	const ext = extension.toLowerCase();
	switch ( ext ) {
		case 'mp4': return __( 'Video', 'purecart' );
		case 'mp3': return __( 'Audio', 'purecart' );
		case 'ttf':
		case 'otf':
			return __( 'Font', 'purecart' );
		case 'fbx': return __( '3D', 'purecart' );
		case 'epub': return __( 'eBook', 'purecart' );
		case 'xlsx': return __( 'Sheet', 'purecart' );
		case '': return __( 'File', 'purecart' );
		default: return ext.toUpperCase();
	}
}

/** Dot color for a file extension, used by FileTypeChip. */
export function fileTypeColor( extension: string ): string {
	return FILE_TYPE_COLORS[ extension.toLowerCase() ] ?? M3.onSurfaceVariant;
}
