import type { CSSOptions } from 'vite';

// utils
import path from 'path';

export const sharedCSSConfig: CSSOptions =  {
    postcss: {
      file: path.resolve(__dirname, 'src', 'css'),
    } as any,    
}; 