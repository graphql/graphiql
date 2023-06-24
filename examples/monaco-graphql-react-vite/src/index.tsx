import { createRoot } from 'react-dom/client';
import { Editor } from './editor';

const root = createRoot(document.getElementById('root')!);
root.render(<Editor />);
