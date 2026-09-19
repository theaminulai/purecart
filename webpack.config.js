/**
 * WordPress dependencies
 */
const defaultConfig = require( '@wordpress/scripts/config/webpack.config' );

/**
 * External dependencies
 */
const RemoveEmptyScriptsPlugin = require( 'webpack-remove-empty-scripts' );
const path = require('path');

/* PureCart for WooCommerce — webpack configuration.
 *
 * Extends the default @wordpress/scripts webpack config with two entry points:
 *
 *  1. React admin SPA — src/app/main.tsx        → build/admin/app/app.js
 *  2. Menu router      — src/menu-router/...js → build/admin/menu-router/menu-router.js
 *
 * Source structure (src/):
 *   app/                  ← the whole admin SPA — application root
 *     main.tsx              ← React app entry — mounts into #purecart-root
 *     App.tsx, ErrorBoundary.tsx, router/, store/, providers/  ← composition root
 *     modules/               ← one folder per business capability (subscriptions, updates, ...)
 *     shared/                  ← cross-cutting infrastructure (api client, ui primitives, layout)
 *     theme/                     ← design tokens
 *     styles/                      ← plain CSS + Tailwind
 *   menu-router/                    ← non-React wp-admin sidebar hash-navigation helper
 *
 * See src/DEVELOPMENT_GUIDELINES.md for the architecture this maps to.
 *
 * PHP enqueue (includes/Admin/Admin.php):
 *   wp_enqueue_script( 'purecart-app', PURECART_URL . 'build/admin/app/app.js', $asset['dependencies'], $asset['version'], true );
 *   wp_enqueue_style(  'purecart-app', PURECART_URL . 'build/admin/app/app.css', [], $asset['version'] );
 */

const rootDir = process.cwd();

module.exports = {
	...defaultConfig,

	devtool: false,

	entry: {
		'build/admin/app/app': path.resolve(rootDir, 'src/app/main.tsx'),
		'build/admin/menu-router/menu-router': path.resolve(rootDir, 'src/menu-router/menu-router.js'),
	},

	resolve: {
		...defaultConfig.resolve,
		alias: {
			...defaultConfig.resolve?.alias,
			'@/app': path.resolve(rootDir, 'src/app'),
			'@/modules': path.resolve(rootDir, 'src/app/modules'),
			'@/shared': path.resolve(rootDir, 'src/app/shared'),
			'@/theme': path.resolve(rootDir, 'src/app/theme'),
		},
	},

	output: {
		...defaultConfig.output,
		path:  path.resolve( rootDir ),
		clean: false,
	},

	optimization: {
		...defaultConfig.optimization,
		splitChunks:  false,
		runtimeChunk: false,
	},

	plugins: [
		...defaultConfig.plugins,
		// Run after @wordpress/scripts has
		// already written the *.asset.php dependency files.
		new RemoveEmptyScriptsPlugin( {
			stage: RemoveEmptyScriptsPlugin.STAGE_AFTER_PROCESS_PLUGINS,
		} ),
	],
};
