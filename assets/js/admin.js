/**
 * PureCart for WooCommerce — Admin JS
 */
( function ( $ ) {
    'use strict';

    /**
     * Copy API key / license key to clipboard on click.
     */
    $( document ).on( 'click', '.purecart-api-key, .purecart-licenses-table code', function () {
        var text = $( this ).text().trim();

        if ( navigator.clipboard ) {
            navigator.clipboard.writeText( text ).then( function () {
                purecartFlash( 'Copied!' );
            } );
        } else {
            var $tmp = $( '<textarea>' ).val( text ).appendTo( 'body' ).select();
            document.execCommand( 'copy' );
            $tmp.remove();
            purecartFlash( 'Copied!' );
        }
    } );

    function purecartFlash( msg ) {
        var $notice = $( '<div class="purecart-flash">' + msg + '</div>' );
        $( 'body' ).append( $notice );
        setTimeout( function () {
            $notice.fadeOut( 400, function () { $( this ).remove(); } );
        }, 1500 );
    }

    /**
     * Toggle activation limit field visibility based on license type.
     */
    $( document ).on( 'change', '#purecart_license_type', function () {
        var type = $( this ).val();
        var $row = $( '#purecart_activation_limit' ).closest( 'tr' );

        if ( 'unlimited' === type || 'lifetime' === type ) {
            $row.hide();
        } else {
            $row.show();
        }
    } ).trigger( 'change' );

} )( jQuery );
