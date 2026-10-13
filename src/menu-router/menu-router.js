/**
 * Admin menu router.
 *
 * Intercepts clicks on WP admin sidebar links that point to a PureCart
 * page and routes them through the React HashRouter instead of forcing
 * a full page reload.
 *
 * @since 1.0.0
 * @param {Object.<string, string>} slugToPath Map of WP page slugs
 *   (e.g. "purecart-orders") to SPA routes (e.g. "/orders").
 *   Injected via wp_localize_script as window.purecartMenuMap.
 */
( function ( slugToPath ) {
	'use strict';

	/**
	 * Regular expression that extracts the `page` query parameter value
	 * from a sidebar link's `href` attribute.
	 *
	 * @since 1.0.0
	 * @type {RegExp}
	 */
	var PAGE_SLUG_PATTERN = /[?&]page=(purecart-[\w-]+)/;

	/**
	 * Attaches click handlers to every PureCart sidebar link.
	 *
	 * Runs once on DOMContentLoaded (or immediately when the DOM is
	 * already interactive/complete).
	 *
	 * @since 1.0.0
	 * @return {void}
	 */
	function init() {
		var menuLinks = document.querySelectorAll( '#adminmenu a[href]' );

		menuLinks.forEach( function ( link ) {
			var route = getRouteForLink( link );
			if ( route ) {
				link.addEventListener( 'click', function ( event ) {
					handleMenuClick( event, link, route );
				} );
			}
		} );
	}

	/**
	 * Resolves the SPA route for a sidebar link, if any.
	 *
	 * Extracts the `page` query parameter from the link's `href` and looks
	 * it up in the `slugToPath` map. Returns `null` when the link does not
	 * belong to a PureCart page or has no matching route.
	 *
	 * @since 1.0.0
	 * @param {HTMLAnchorElement} link The sidebar anchor element.
	 * @return {string|null} The matching SPA route, or null.
	 */
	function getRouteForLink( link ) {
		var match = ( link.getAttribute( 'href' ) || '' ).match( PAGE_SLUG_PATTERN );
		if ( ! match ) {
			return null;
		}
		return slugToPath[ match[ 1 ] ] || null;
	}

	/**
	 * Navigates the SPA to a route without reloading the page.
	 *
	 * Prevents the default anchor navigation, updates `window.location.hash`
	 * (which HashRouter reacts to), and then restores the `?page=` URL in the
	 * address bar via `history.replaceState` so refreshes and WP menu
	 * highlighting continue to work.
	 *
	 * @since 1.0.0
	 * @param {MouseEvent}        event The click event.
	 * @param {HTMLAnchorElement} link  The sidebar anchor that was clicked.
	 * @param {string}            route The SPA route to navigate to.
	 * @return {void}
	 */
	function handleMenuClick( event, link, route ) {
		event.preventDefault();

		// 1. Update the hash — HashRouter listens for "hashchange" and navigates.
		window.location.hash = route;

		// 2. Restore the original ?page= URL (minus the reload) so the address
		//    bar stays correct for refreshes and for the WP menu highlighter.
		var baseUrl = link.href.split( '#' )[ 0 ];
		window.history.replaceState( null, '', baseUrl + '#' + route );

		setActiveMenuItem( link );
	}

	/**
	 * Updates the WP admin sidebar's active-item highlighting after a
	 * client-side navigation.
	 *
	 * Removes the `current` and `wp-has-current-submenu` classes from all
	 * existing active items, then applies them to the item that was just
	 * clicked, mirroring WordPress's own page-load behaviour.
	 *
	 * @since 1.0.0
	 * @param {HTMLAnchorElement} link The sidebar anchor that was clicked.
	 * @return {void}
	 */
	function setActiveMenuItem( link ) {
		document
			.querySelectorAll( '#adminmenu .current, .wp-has-current-submenu' )
			.forEach( function ( el ) {
				el.classList.remove( 'current', 'wp-has-current-submenu' );
			} );

		var menuItem = link.closest( 'li' );
		if ( ! menuItem ) {
			return;
		}
		menuItem.classList.add( 'current' );

		var submenu = menuItem.parentElement;
		if ( submenu && submenu.classList.contains( 'wp-submenu' ) ) {
			var parentMenuItem = submenu.closest( 'li' );
			if ( parentMenuItem ) {
				parentMenuItem.classList.add( 'wp-has-current-submenu', 'current' );
			}
		}
	}

	if ( 'loading' === document.readyState ) {
		document.addEventListener( 'DOMContentLoaded', init );
	} else {
		init();
	}
} )( window.purecartMenuMap || {} );