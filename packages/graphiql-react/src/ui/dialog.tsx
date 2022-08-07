import { Dialog as ReachDialog } from '@reach/dialog';
import { VisuallyHidden } from '@reach/visually-hidden';
import { ComponentProps, forwardRef } from 'react';
import { CloseIcon } from '../icons';
import { createComponentGroup } from '../utility/component-group';
import { compose } from '../utility/compose';
import { UnStyledButton } from './button';

import './dialog.css';

const DialogRoot = forwardRef<
  HTMLDivElement,
  ComponentProps<typeof ReachDialog>
>((props, ref) => <ReachDialog {...props} ref={ref} />);
DialogRoot.displayName = 'Dialog';

const DialogClose = forwardRef<
  HTMLButtonElement,
  JSX.IntrinsicElements['button']
>((props, ref) => (
  <UnStyledButton
    {...props}
    ref={ref}
    className={compose('graphiql-dialog-close', props.className)}
  >
    <VisuallyHidden>Close dialog</VisuallyHidden>
    <CloseIcon />
  </UnStyledButton>
));
DialogClose.displayName = 'Dialog.Close';

export const Dialog = createComponentGroup(DialogRoot, { Close: DialogClose });
