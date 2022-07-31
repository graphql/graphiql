import { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { useStorageContext } from './storage';

/**
 * The value `null` semantically means that the user does not explicity choose
 * any theme, so we use the system default.
 */
export type Theme = 'light' | 'dark' | null;

/**
 * Initial attempt @ theme colors / alpha values. 
 * Not a huge fan of adding this whole bit into a single file.
 * Should probably refactor/shuffle all of the hooks into a /hooks directory as part of a larger refactor/shuffle.
 */
type HexValue = `#${string}`;

type ColorTokens = {
  neutral?: HexValue;
  primary?: HexValue;
  secondary?: HexValue;
  error?: HexValue;
  warning?: HexValue;
  info?: HexValue;
  success?: HexValue;
}

export type DesignTokens = {
  colors?: ColorTokens;
};

const defaultColorTokens: DesignTokens["colors"] = {
  neutral: "#3b4b68",
  primary: "#d60690",
  secondary: "#6e6acf",
  info: "#007eea",
  warning: "#d37f00",
  error: "#f85b30",
  success: "#2bab7c",
}

const hexToRGB = ({ hex, alpha }: { hex: HexValue; alpha: number }) => {
  const r = '0x' + hex[1] + hex[2];
  const g = '0x' + hex[3] + hex[4];
  const b = '0x' + hex[5] + hex[6];

  return 'rgba(' + Number(r) + ',' + Number(g) + ',' + Number(b) + ',' + Number(alpha) + ')';
};

const setNeutralPalette = ({baseColor}: {baseColor: HexValue}) => {
  document.documentElement.style.setProperty(`--color-neutral-100`, hexToRGB({hex: baseColor, alpha: 1}));
  document.documentElement.style.setProperty(`--color-neutral-60`, hexToRGB({hex: baseColor, alpha: .60}));
  document.documentElement.style.setProperty(`--color-neutral-40`, hexToRGB({hex: baseColor, alpha: .40}));
  document.documentElement.style.setProperty(`--color-neutral-15`, hexToRGB({hex: baseColor, alpha: .15}));
  document.documentElement.style.setProperty(`--color-neutral-10`, hexToRGB({hex: baseColor, alpha: .10}));
  document.documentElement.style.setProperty(`--color-neutral-7`, hexToRGB({hex: baseColor, alpha: .07}));
  document.documentElement.style.setProperty(`--color-neutral-0`, hexToRGB({hex: `#ffffff`, alpha: 1}));
}

const setPalette = ({baseColor, name}: {baseColor: HexValue; name: string}) => {
  document.documentElement.style.setProperty(`--color-${name}-100`, hexToRGB({hex: baseColor, alpha: 1}));
  document.documentElement.style.setProperty(`--color-${name}-60`, hexToRGB({hex: baseColor, alpha: .60}));
  document.documentElement.style.setProperty(`--color-${name}-15`, hexToRGB({hex: baseColor, alpha: .15}));
  document.documentElement.style.setProperty(`--color-${name}-10`, hexToRGB({hex: baseColor, alpha: .10}));
  document.documentElement.style.setProperty(`--color-${name}-7`, hexToRGB({hex: baseColor, alpha: .07}));  
}


const setThemeColors = ({ colors }:{ colors: ColorTokens }) => {
  Object.entries(colors).forEach(color => {
    const [name, value] = color;
    if (name === "neutral") {
      setNeutralPalette({baseColor: value})
    } else {
      setPalette({baseColor: value, name})
    }
  });
}


export function useTheme() {
  const storageContext = useStorageContext();

  const [theme, setThemeInternal] = useState<Theme>(() => {
    if (!storageContext) {
      return null;
    }

    const stored = storageContext.get(STORAGE_KEY);
    switch (stored) {
      case 'light':
        return 'light';
      case 'dark':
        return 'dark';
      default:
        if (typeof stored === 'string') {
          // Remove the invalid stored value
          storageContext.set(STORAGE_KEY, '');
        }
        return null;
    }
  });

  useLayoutEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    document.body.classList.remove(`graphiql-light`);
    document.body.classList.remove(`graphiql-dark`);
    if (theme) {
      document.body.classList.add(`graphiql-${theme}`);
    }
  }, [theme]);

  const setTheme = useCallback(
    (newTheme: Theme) => {
      storageContext?.set(STORAGE_KEY, newTheme || '');
      setThemeInternal(newTheme);
    },
    [storageContext],
  );


  return useMemo(() => ({ theme, setTheme, setThemeColors, defaultColorTokens }), [theme, setTheme]);
}

const STORAGE_KEY = 'theme';
