<?php
/**
 * Serves protected files via PHP — no direct file URL exposed.
 *
 * Rewrite: purecart/{token}  →  index.php?purecart_download_token={token}
 *
 * @package PureCart\Downloads
 */

declare( strict_types=1 );

namespace PureCart\Downloads;

defined( 'ABSPATH' ) || exit;

/**
 * Registers the rewrite rule and streams the file to the browser.
 */
class DownloadDispatcher {

    private const QUERY_VAR = 'purecart_download_token';

    public function __construct() {
        add_action( 'init',              [ $this, 'add_rewrite' ] );
        add_filter( 'query_vars',        [ $this, 'query_vars' ] );
        add_action( 'template_redirect', [ $this, 'handle_download' ] );
    }

    public function add_rewrite(): void {
        add_rewrite_rule(
            '^purecart/([a-zA-Z0-9_\-]+)/?$',
            'index.php?' . self::QUERY_VAR . '=$matches[1]',
            'top'
        );
    }

    /** @param string[] $vars */
    public function query_vars( array $vars ): array {
        $vars[] = self::QUERY_VAR;
        return $vars;
    }

    public function handle_download(): void {
        $token = get_query_var( self::QUERY_VAR );
        if ( empty( $token ) ) {
            return;
        }

        do_action( 'purecart_before_file_download', $token );

        $manager  = new TokenManager();
        $download = $manager->validate_token( $token );

        if ( ! $download ) {
            wp_die(
                esc_html__( 'This download link is invalid or has expired.', 'purecart' ),
                esc_html__( 'Download Error', 'purecart' ),
                [ 'response' => 403 ]
            );
        }

        $file_path = get_post_meta( (int) $download->file_id, '_purecart_file_path', true );

        if ( ! $file_path || ! file_exists( (string) $file_path ) ) {
            wp_die(
                esc_html__( 'The requested file could not be found.', 'purecart' ),
                esc_html__( 'Download Error', 'purecart' ),
                [ 'response' => 404 ]
            );
        }

        $manager->increment_count( (int) $download->id );

        $this->stream_file( (string) $file_path );
    }

    private function stream_file( string $file_path ): void {
        $filename = basename( $file_path );
        $filesize = filesize( $file_path );
        $mime     = mime_content_type( $file_path ) ?: 'application/octet-stream';

        if ( ob_get_level() ) {
            ob_end_clean();
        }

        nocache_headers();
        header( 'Content-Type: '        . $mime );
        header( 'Content-Disposition: attachment; filename="' . $filename . '"' );
        header( 'Content-Length: '      . $filesize );
        header( 'X-Robots-Tag: noindex, nofollow' );
        header( 'X-Content-Type-Options: nosniff' );

        readfile( $file_path ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_readfile -- WP_Filesystem::get_contents() loads the entire file into memory; direct readfile() is required for streaming large files without exhausting PHP memory.
        exit;
    }
}
