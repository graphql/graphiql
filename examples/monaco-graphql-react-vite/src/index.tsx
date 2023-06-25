import { createRoot } from 'react-dom/client';
import Editor from './editor';

const root = createRoot(document.getElementById('__next')!);
root.render(<Editor />);
