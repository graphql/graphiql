import { createContext, useContext, FC, ReactNode } from 'react';

/**
 * The DOM element that Radix portals (dialog, tooltip, dropdown) render into.
 *
 * GraphiQL writes its `data-theme` / `data-density` / `data-font-size`
 * attributes onto the `.graphiql-container` element, and those attributes drive
 * the design tokens. Radix portals default to `document.body`, which lives
 * outside the container, so portaled content would not inherit any of them.
 * Providing the container here lets each portal render inside it and pick the
 * tokens up through normal CSS inheritance.
 *
 * `undefined` (no provider, e.g. a component rendered standalone in tests or
 * Storybook) means "use Radix's default" — `document.body`.
 */
const PortalContext = createContext<HTMLElement | null | undefined>(undefined);

export const PortalProvider: FC<{
  container: HTMLElement | null;
  children: ReactNode;
}> = ({ container, children }) => (
  <PortalContext.Provider value={container}>{children}</PortalContext.Provider>
);

/**
 * The element Radix portals should render into, or `undefined`/`null` to fall
 * back to `document.body`. Pass straight to a Radix `Portal`'s `container` prop.
 */
export function usePortalContainer(): HTMLElement | null | undefined {
  return useContext(PortalContext);
}
