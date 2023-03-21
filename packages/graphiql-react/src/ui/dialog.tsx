import { clsx } from 'clsx';
import { forwardRef, ReactElement } from 'react';
import { CloseIcon } from '../icons';
import { createComponentGroup } from '../utility/component-group';
import { UnStyledButton } from './button';
import * as D from '@radix-ui/react-dialog';
import { Root as VisuallyHidden } from '@radix-ui/react-visually-hidden';

import './dialog.css';

const DialogClose = forwardRef<
  HTMLButtonElement,
  JSX.IntrinsicElements['button']
>((props, ref) => (
  <D.Close asChild>
    <UnStyledButton
      {...props}
      ref={ref}
      type="button"
      className={clsx('graphiql-dialog-close', props.className)}
    >
      <VisuallyHidden>Close dialog</VisuallyHidden>
      <CloseIcon />
    </UnStyledButton>
  </D.Close>
));
DialogClose.displayName = 'Dialog.Close';

export function DialogRoot({
  children,
  ...props
}: D.DialogProps): ReactElement {
  return (
    <D.Root {...props}>
      <D.Portal>
        <D.Overlay className="graphiql-dialog-overlay" />
        <D.Content className="graphiql-dialog">{children}</D.Content>
      </D.Portal>
    </D.Root>
  );
}

export const Dialog = createComponentGroup(DialogRoot, {
  Close: DialogClose,
  Title: D.Title,
  Trigger: D.Trigger,
  Description: D.Description,
});
