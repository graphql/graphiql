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
});
