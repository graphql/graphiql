import {
  ComponentPropsWithoutRef,
  createContext,
  forwardRef,
  ReactNode,
  useContext,
} from 'react';
import { clsx } from 'clsx';
import { Reorder } from 'framer-motion';
import { CloseIcon } from '../../icons';
import { UnStyledButton } from '../button';
import './index.css';

interface TabProps extends ComponentPropsWithoutRef<typeof Reorder.Item> {
  isActive?: boolean;
  isDirty?: boolean;
}

const TabContext = createContext({ isActive: false });

const TabRoot = forwardRef<HTMLLIElement, TabProps>(
  ({ isActive, isDirty, value, children, className, ...props }, ref) => (
    <Reorder.Item
      {...props}
      ref={ref}
      value={value}
      dragElastic={false} // Prevent over scrolling of container
      className={clsx(
        'graphiql-tab',
        isActive && 'graphiql-tab-active',
        className,
      )}
    >
      <TabContext.Provider value={{ isActive: Boolean(isActive) }}>
        {children}
        {isDirty && (
          <span
            className="graphiql-tab-dirty"
            aria-label="Unsaved changes"
            role="status"
          />
        )}
      </TabContext.Provider>
    </Reorder.Item>
  ),
);
TabRoot.displayName = 'Tab';

const TabButton = forwardRef<
  HTMLButtonElement,
  ComponentPropsWithoutRef<'button'>
>(({ children, className, ...props }, ref) => {
  const { isActive } = useContext(TabContext);

  return (
    <UnStyledButton
      {...props}
      ref={ref}
      type="button"
      aria-pressed={isActive}
      className={clsx('graphiql-tab-button', className)}
    >
      {children}
    </UnStyledButton>
  );
});
TabButton.displayName = 'Tab.Button';

const TabClose = forwardRef<
  HTMLButtonElement,
  ComponentPropsWithoutRef<'button'>
>((props, ref) => (
  <UnStyledButton
    aria-label="Close Tab"
    {...props}
    ref={ref}
    type="button"
    className={clsx('graphiql-tab-close', props.className)}
  >
    <CloseIcon />
  </UnStyledButton>
));
TabClose.displayName = 'Tab.Close';

export const Tab = Object.assign(TabRoot, {
  Button: TabButton,
  Close: TabClose,
});

interface TabsProps {
  values: object[];
  onReorder: (newOrder: any[]) => void;
  className?: string;
  children: ReactNode;
}

export const Tabs = forwardRef<HTMLUListElement, TabsProps>(
  ({ values, onReorder, children, className, ...props }, ref) => (
    <Reorder.Group
      {...props}
      ref={ref}
      values={values}
      onReorder={onReorder}
      axis="x"
      className={clsx('graphiql-tabs', className)}
    >
      {children}
    </Reorder.Group>
  ),
);
Tabs.displayName = 'Tabs';
