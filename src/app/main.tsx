import { createRoot } from 'react-dom/client';
import { AppProviders } from './providers';
import App from './App';
// @ts-ignore: side-effect import of CSS without type declarations
import './styles/index.css';

const rootEl = document.getElementById('purecart-root');

if (rootEl) {
	createRoot(rootEl).render(
		<AppProviders>
			<App />
		</AppProviders>
	);
}
