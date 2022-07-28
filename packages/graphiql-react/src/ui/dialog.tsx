import { Dialog as ReachDialog } from '@reach/dialog';
import { VisuallyHidden } from '@reach/visually-hidden';
import { ComponentProps } from 'react';
import { CloseIcon } from '../icons';
import { compose } from '../utility/compose';
import { UnStyledButton } from './button';

import './dialog.css';

export function Dialog(props: ComponentProps<typeof ReachDialog>) {
  return <ReachDialog {...props} />;
}

function DialogClose(props: JSX.IntrinsicElements['button']) {
  return (
    <UnStyledButton
      {...props}
      className={compose('graphiql-dialog-close', props.className)}>
      <VisuallyHidden>Close dialog</VisuallyHidden>
      <CloseIcon />
    </UnStyledButton>
  );
}

Dialog.Close = DialogClose;
