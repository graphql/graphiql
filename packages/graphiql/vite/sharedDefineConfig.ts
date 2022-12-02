import type { UserConfig } from 'vite';

export const sharedDefineConfig: UserConfig["define"] = {
  'process.env.NODE_ENV': `"${process.env.NODE_ENV}"`  
};