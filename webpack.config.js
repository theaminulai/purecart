/**
 * WordPress dependencies
 */
const defaultConfig = require( '@wordpress/scripts/config/webpack.config' );

/**
 * External dependencies
 */
const RemoveEmptyScriptsPlugin = require( 'webpack-remove-empty-scripts' );
const path                     = require( 'path' );

/**
 * Woo Digital Downloads — webpack configuration.
 *
 * Extends the default @wordpress/scripts webpack config with two entry points:
 *
 *  1. JS bundle  — src/main.jsx         → assets/js/admin.js  + assets/js/admin.asset.php
 *  2. CSS bundle — src/styles/main.scss → assets/css/admin.css
 *     (the empty JS stub webpack generates for the CSS entry is removed by
 *     RemoveEmptyScriptsPlugin, so no assets/css/admin.js lands on disk)
 *
 * Source structure:
 *   src/
 *   ├── main.jsx                ← React 19 app entry — mounts into #wdd-admin-root
 *   ├── App.jsx                 ← Router + AppContext.Provider
 *   ├── context/                ← AppContext, LicenseContext, SubscriptionContext, AnalyticsContext
 *   ├── hooks/                  ← useApi, usePagination, useFilters, useClipboard, useRipple
 *   ├── pages/                  ← One folder per route (Dashboard, Licenses, …)
 *   ├── components/             ← Shared UI and layout components
 *   ├── styles/
 *   │   ├── main.scss           ← CSS entry — @use-imports all partials in order
 *   │   ├── _variables.scss
 *   │   ├── _typography.scss
 *   │   ├── _elevation.scss
 *   │   ├── _shape.scss
 *   │   ├── _states.scss
 *   │   ├── _mixins.scss
 *   │   ├── _reset.scss
 *   │   └── _utilities.scss
 *   └── utils/                  ← api.js, format.js, constants.js
 *
 * Output structure:
 *   assets/
 *   ├── js/
 *   │   ├── admin.js            ← Compiled + minified React bundle
 *   │   └── admin.asset.php     ← { dependencies: [...], version: '...' }
 *   └── css/
 *       └── admin.css           ← Compiled + minified CSS (SCSS → CSS)
 *
 * PHP enqueue (includes/Core/Assets.php):
 *   wp_enqueue_script( 'wdd-admin', WDD_PLUGIN_URL . 'assets/js/admin.js',  $deps, $ver, true );
 *   wp_enqueue_style(  'wdd-admin', WDD_PLUGIN_URL . 'assets/css/admin.css', [],   $ver );
 */

const rootDir = process.cwd();

module.exports = {
	...defaultConfig,

	// Source maps disabled in all environments — use React DevTools for debugging.
	devtool: false,

	entry: {
		// JS bundle: React 18 SPA (React Router hash router, Context API, Recharts, Lucide)
		'build/admin/admin':  path.resolve( rootDir, 'src/main.tsx' ),

		// CSS bundle: compiled from SCSS; empty JS stub is removed below by RemoveEmptyScriptsPlugin
		// 'build/admin/admin.css': path.resolve( rootDir, 'src/styles/main.scss' ),
	},

	output: {
		...defaultConfig.output,
		path:  path.resolve( rootDir ),
		// Never wipe the output directory — other plugin files live here
		clean: false,
	},

	optimization: {
		...defaultConfig.optimization,
		// Keep the entire React app in a single JS file — no lazy splitting needed
		// for a WordPress admin page that loads once.
		splitChunks:  false,
		runtimeChunk: false,
	},

	plugins: [
		...defaultConfig.plugins,

		// Removes the empty `assets/css/admin.js` stub webpack generates for
		// the CSS-only entry point. Must run after @wordpress/scripts has
		// already written the *.asset.php dependency files.
		new RemoveEmptyScriptsPlugin( {
			stage: RemoveEmptyScriptsPlugin.STAGE_AFTER_PROCESS_PLUGINS,
		} ),
	],
};