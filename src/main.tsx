import { createRoot } from 'react-dom/client';
import { AppProviders } from './app/providers';
import App from './app/App';
// @ts-ignore: side-effect import of CSS without type declarations
import './app/styles/index.css';

const rootEl = document.getElementById('purecart-root');

if (rootEl) {
	createRoot(rootEl).render(
		<AppProviders>
			<App />
		</AppProviders>
	);
}
