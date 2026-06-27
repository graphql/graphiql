import { cn } from '../../utility';
import { forwardRef, FC, ComponentPropsWithoutRef } from 'react';
import { CloseIcon } from '../../icons';
import { UnStyledButton } from '../button';
import * as D from '@radix-ui/react-dialog';
import { Root as VisuallyHidden } from '@radix-ui/react-visually-hidden';

import './index.css';

const DialogClose = forwardRef<
  HTMLButtonElement,
  ComponentPropsWithoutRef<'button'>
>((props, ref) => (
  <D.Close asChild>
    <UnStyledButton
      {...props}
      ref={ref}
      type="button"
      className={cn('graphiql-dialog-close', props.className)}
    >
      <VisuallyHidden>Close dialog</VisuallyHidden>
      <CloseIcon />
    </UnStyledButton>
  </D.Close>
));
DialogClose.displayName = 'Dialog.Close';

/**
 * The styled header of a dialog: a title on the left and a close button on the
 * right, with a bottom divider. A string child is wrapped in `Dialog.Title`
 * automatically (Radix requires a title for accessibility); pass JSX to render
 * your own title node.
 */
const DialogHeader = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<'div'>
>(({ children, className, ...props }, ref) => (
  <div {...props} ref={ref} className={cn('graphiql-dialog-header', className)}>
    {typeof children === 'string' ? (
      <D.Title className="graphiql-dialog-title">{children}</D.Title>
    ) : (
      children
    )}
    <DialogClose />
  </div>
));
DialogHeader.displayName = 'Dialog.Header';

/** The content region of a dialog, with consistent padding. */
const DialogBody = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<'div'>>(
  ({ children, className, ...props }, ref) => (
    <div {...props} ref={ref} className={cn('graphiql-dialog-body', className)}>
      {children}
    </div>
  ),
);
DialogBody.displayName = 'Dialog.Body';

/** The action row at the bottom of a dialog, right-aligned with a top divider. */
const DialogFooter = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<'div'>
>(({ children, className, ...props }, ref) => (
  <div {...props} ref={ref} className={cn('graphiql-dialog-footer', className)}>
    {children}
  </div>
));
DialogFooter.displayName = 'Dialog.Footer';

const DialogRoot: FC<D.DialogProps> = ({ children, ...props }) => {
  return (
    <D.Root {...props}>
      <D.Portal>
        <D.Overlay className="graphiql-dialog-overlay" />
        <D.Content className="graphiql-dialog">{children}</D.Content>
      </D.Portal>
    </D.Root>
  );
};

export const Dialog = Object.assign(DialogRoot, {
  Close: DialogClose,
  Title: D.Title,
  Trigger: D.Trigger,
  Description: D.Description,
  Header: DialogHeader,
  Body: DialogBody,
  Footer: DialogFooter,
});
