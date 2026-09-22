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

	/**
	 * Register rewrite and download-handling hooks.
	 *
	 * @since 1.0.0
	 */
	public function __construct() {
		add_action( 'init', array( $this, 'add_rewrite' ) );
		add_filter( 'query_vars', array( $this, 'query_vars' ) );
		add_action( 'template_redirect', array( $this, 'handle_download' ) );
	}

	/**
	 * Register the rewrite rule that maps purecart/{token} to a query var.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function add_rewrite(): void {
		add_rewrite_rule(
			'^purecart/([a-zA-Z0-9_\-]+)/?$',
			'index.php?' . self::QUERY_VAR . '=$matches[1]',
			'top'
		);
	}

	/**
	 * Register the purecart_download_token query variable.
	 *
	 * @since  1.0.0
	 * @param  string[] $vars Existing public query variables.
	 * @return string[]
	 */
	public function query_vars( array $vars ): array {
		$vars[] = self::QUERY_VAR;
		return $vars;
	}

	/**
	 * Validate the download token and stream the protected file to the browser.
	 *
	 * @since 1.0.0
	 * @return void
	 */
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
				array( 'response' => 403 )
			);
		}

		$file_path = get_post_meta( (int) $download->file_id, '_purecart_file_path', true );

		if ( ! $file_path || ! file_exists( (string) $file_path ) ) {
			wp_die(
				esc_html__( 'The requested file could not be found.', 'purecart' ),
				esc_html__( 'Download Error', 'purecart' ),
				array( 'response' => 404 )
			);
		}

		$manager->increment_count( (int) $download->id );

		$this->stream_file( (string) $file_path );
	}

	/**
	 * Send HTTP headers and stream the file to the browser, then exit.
	 *
	 * @since  1.0.0
	 * @param  string $file_path Absolute server path to the file.
	 * @return void
	 */
	private function stream_file( string $file_path ): void {
		$filename = basename( $file_path );
		$filesize = filesize( $file_path );
		$mime     = mime_content_type( $file_path ) ?: 'application/octet-stream';

		if ( ob_get_level() ) {
			ob_end_clean();
		}

		nocache_headers();
		header( 'Content-Type: ' . $mime );
		header( 'Content-Disposition: attachment; filename="' . $filename . '"' );
		header( 'Content-Length: ' . $filesize );
		header( 'X-Robots-Tag: noindex, nofollow' );
		header( 'X-Content-Type-Options: nosniff' );

		readfile( $file_path ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_readfile -- WP_Filesystem::get_contents() loads the entire file into memory; direct readfile() is required for streaming large files without exhausting PHP memory.
		exit;
	}
}
