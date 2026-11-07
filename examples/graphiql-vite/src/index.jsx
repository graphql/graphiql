import { createRoot } from 'react-dom/client';
import 'graphiql/setup-workers/vite';
import App from './App';

const root = createRoot(document.getElementById('graphiql'));
root.render(<App />);
