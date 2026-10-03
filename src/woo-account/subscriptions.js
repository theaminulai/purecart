/**
 * PureCart — My Account: Subscriptions tab — frontend script.
 *
 * Handles the pause / resume / cancel / skip / early-renewal / resubscribe
 * action buttons rendered by templates/myaccount/purecart-subscriptions.php.
 *
 * Reads runtime values from `window.purecartMyAccount` which is set by
 * Dashboard.php via wp_localize_script():
 *
 *   window.purecartMyAccount = {
 *     apiUrl   : 'https://example.com/wp-json/purecart/v1/subscriptions/',
 *     nonce    : '<wp_rest nonce>',
 *     i18n     : {
 *       processing : 'Processing…',
 *       done       : 'Done! Refreshing…',
 *       error      : 'An error occurred. Please try again.',
 *     },
 *   };
 *
 * @package PureCart
 */

import './subscriptions.css';

( function () {
	'use strict';

	const cfg = window.purecartMyAccount || {};
	const API_URL = cfg.apiUrl || '';
	const NONCE   = cfg.nonce  || '';
	const I18N    = Object.assign(
		{
			processing: 'Processing…',
			done:       'Done! Refreshing…',
			error:      'An error occurred. Please try again.',
		},
		cfg.i18n || {}
	);

	/**
	 * Show a feedback message inside a subscription table row.
	 *
	 * @param {HTMLElement} row  The <tr> element.
	 * @param {string}      msg
	 * @param {'is-loading'|'is-success'|'is-error'} type
	 */
	function showFeedback( row, msg, type ) {
		const fb = row.querySelector( '.purecart-sub-feedback' );
		if ( ! fb ) { return; }
		fb.textContent = msg;
		fb.className   = 'purecart-sub-feedback ' + type;
		fb.hidden      = false;
	}

	/**
	 * Hide the feedback element inside a row.
	 *
	 * @param {HTMLElement} row
	 */
	function hideFeedback( row ) {
		const fb = row.querySelector( '.purecart-sub-feedback' );
		if ( fb ) {
			fb.hidden    = true;
			fb.className = 'purecart-sub-feedback';
		}
	}

	/**
	 * Disable or re-enable all action buttons inside a row.
	 *
	 * @param {HTMLElement} row
	 * @param {boolean}     disabled
	 */
	function setButtonsDisabled( row, disabled ) {
		row.querySelectorAll( 'button.purecart-sub-action' ).forEach( ( btn ) => {
			btn.disabled = disabled;
		} );
	}

	/**
	 * POST to the PureCart REST API for a subscription sub-resource.
	 * On success the page is reloaded so the row re-renders with fresh DB state.
	 *
	 * @param {string}      subId    Subscription row ID.
	 * @param {string}      endpoint REST sub-resource, e.g. 'pause', 'cancel'.
	 * @param {object|null} body     Optional JSON request body.
	 * @param {HTMLElement} row      The <tr> element.
	 */
	function callApi( subId, endpoint, body, row ) {
		setButtonsDisabled( row, true );
		showFeedback( row, I18N.processing, 'is-loading' );

		fetch( API_URL + subId + '/' + endpoint, {
			method:  'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-WP-Nonce':   NONCE,
			},
			body: body ? JSON.stringify( body ) : undefined,
		} )
			.then( ( res ) => {
				if ( ! res.ok ) {
					return res.json().then( ( data ) => {
						throw new Error( data.message || I18N.error );
					} );
				}
				return res.json();
			} )
			.then( () => {
				showFeedback( row, I18N.done, 'is-success' );
				setTimeout( () => window.location.reload(), 900 );
			} )
			.catch( ( err ) => {
				showFeedback( row, err.message, 'is-error' );
				setButtonsDisabled( row, false );
			} );
	}

	/**
	 * Event delegation — single listener on the document covers all cards,
	 * even ones added after DOMContentLoaded (e.g. by a page-builder).
	 */
	document.addEventListener( 'click', ( e ) => {
		const btn = /** @type {HTMLElement} */ ( e.target ).closest( 'button.purecart-sub-action' );
		if ( ! btn ) { return; }

		const action     = btn.getAttribute( 'data-action' );
		const subId      = btn.getAttribute( 'data-sub-id' );
		const row        = btn.closest( '.purecart-subscription-row' );
		const confirmMsg = btn.getAttribute( 'data-confirm' );

		if ( ! action || ! subId || ! row ) { return; }

		// Destructive actions (cancel) carry a confirmation message.
		if ( confirmMsg && ! window.confirm( confirmMsg ) ) { return; }

		hideFeedback( row );

		switch ( action ) {
			case 'pause':
				callApi( subId, 'pause', null, row );
				break;
			case 'resume':
				callApi( subId, 'resume', null, row );
				break;
			case 'cancel':
				callApi( subId, 'cancel', null, row );
				break;
			case 'skip':
				callApi( subId, 'skip', null, row );
				break;
			case 'early-renewal':
				callApi( subId, 'early-renewal', null, row );
				break;
			case 'resubscribe':
				callApi( subId, 'resubscribe', null, row );
				break;
			default:
				break;
		}
	} );
}() );
