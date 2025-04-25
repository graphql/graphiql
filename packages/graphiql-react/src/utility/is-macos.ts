'use no memo';

export const isMacOs =
  typeof navigator !== 'undefined' && navigator.userAgent.includes('Mac');
