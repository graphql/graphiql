import {
  ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

import { useStorageContext } from '../storage';
import debounce from './debounce';

type ResizableElement = 'first' | 'second';

type CallbackArgs = {
  hiddenElement: ResizableElement | null;
  hide(element: ResizableElement): void;
  reset(): void;
};

type Callback = (args: CallbackArgs) => ReactNode;

export function DragResizeContainer({
  first,
  dragBar,
  second,

  defaultSizeRelation = DEFAULT_FLEX,
  direction,
  initiallyHidden,
  onHiddenElementChange,
  sizeThresholdFirst = 100,
  sizeThresholdSecond = 100,
  storageKey,

  ...divProps
}: {
  first: ReactNode | Callback;
  dragBar: ReactNode | Callback;
  second: ReactNode | Callback;

  defaultSizeRelation?: number;
  direction: 'horizontal' | 'vertical';
  initiallyHidden?: ResizableElement;
  onHiddenElementChange?(hiddenElement: ResizableElement | null): void;
  sizeThresholdFirst?: number;
  sizeThresholdSecond?: number;
  storageKey?: string;
} & JSX.IntrinsicElements['div']) {
  const storage = useStorageContext();
  const firstRef = useRef<HTMLDivElement>(null);
  const dragBarRef = useRef<HTMLDivElement>(null);
  const secondRef = useRef<HTMLDivElement>(null);

  const [hiddenElement, _setHiddenElement] = useState<ResizableElement | null>(
    () => {
      const storedValue =
        storage && storageKey ? storage.get(storageKey) : null;
      if (storedValue === HIDE_FIRST || initiallyHidden === 'first') {
        return 'first';
      }
      if (storedValue === HIDE_SECOND || initiallyHidden === 'second') {
        return 'second';
      }
      return null;
    },
  );

  const setHiddenElement = useCallback(
    (element: ResizableElement | null) => {
      _setHiddenElement(element);
      onHiddenElementChange?.(element);
    },
    [onHiddenElementChange],
  );

  const defaultFlexRef = useRef(`${defaultSizeRelation}`);

  /**
   * Set initial flex values
   */
  useLayoutEffect(() => {
    const storedValue =
      storage && storageKey
        ? storage.get(storageKey) || defaultFlexRef.current
        : defaultFlexRef.current;

    if (firstRef.current) {
      firstRef.current.style.flex =
        storedValue === HIDE_FIRST || storedValue === HIDE_SECOND
          ? defaultFlexRef.current
          : storedValue;
    }
    if (secondRef.current) {
      secondRef.current.style.flex = '1';
    }
  }, [storage, storageKey]);

  /**
   * Hide and show items when state changes
   */
  useLayoutEffect(() => {
    if (firstRef.current) {
      if (hiddenElement === 'first') {
        hide(firstRef.current);
      } else {
        show(firstRef.current);
      }
    }
    if (secondRef.current) {
      if (hiddenElement === 'second') {
        hide(secondRef.current);
      } else {
        show(secondRef.current);
      }
    }
  }, [hiddenElement]);

  const store = useCallback(
    debounce(500, (value: string) => {
      if (storage && storageKey) {
        storage.set(storageKey, value);
      }
    }),
    [storage, storageKey],
  );

  const reset = useCallback(() => {
    if (firstRef.current) {
      firstRef.current.style.flex = defaultFlexRef.current;
    }
    store(defaultFlexRef.current);
    setHiddenElement(null);
  }, [setHiddenElement, store]);

  useEffect(() => {
    if (!dragBarRef.current || !firstRef.current || !secondRef.current) {
      return;
    }
    const dragBarContainer = dragBarRef.current;
    const firstContainer = firstRef.current;
    const wrapper = firstContainer.parentElement!;

    const eventProperty = direction === 'horizontal' ? 'clientX' : 'clientY';
    const rectProperty = direction === 'horizontal' ? 'left' : 'top';
    const adjacentRectProperty =
      direction === 'horizontal' ? 'right' : 'bottom';
    const sizeProperty =
      direction === 'horizontal' ? 'clientWidth' : 'clientHeight';

    function handleMouseDown(downEvent: MouseEvent) {
      downEvent.preventDefault();

      // Distance between the start of the drag bar and the exact point where
      // the user clicked on the drag bar.
      const offset =
        downEvent[eventProperty] -
        dragBarContainer.getBoundingClientRect()[rectProperty];

      function handleMouseMove(moveEvent: MouseEvent) {
        if (moveEvent.buttons === 0) {
          return handleMouseUp();
        }

        const firstSize =
          moveEvent[eventProperty] -
          wrapper.getBoundingClientRect()[rectProperty] -
          offset;
        const secondSize =
          wrapper.getBoundingClientRect()[adjacentRectProperty] -
          moveEvent[eventProperty] +
          offset -
          dragBarContainer[sizeProperty];

        if (firstSize < sizeThresholdFirst) {
          // Hide the first display
          setHiddenElement('first');
          store(HIDE_FIRST);
        } else if (secondSize < sizeThresholdSecond) {
          // Hide the second display
          setHiddenElement('second');
          store(HIDE_SECOND);
        } else {
          // Show both and adjust the flex value of the first one (the flex
          // value for the second one is always `1`)
          setHiddenElement(null);
          const newFlex = `${firstSize / secondSize}`;
          firstContainer.style.flex = newFlex;
          store(newFlex);
        }
      }

      function handleMouseUp() {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      }

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    dragBarContainer.addEventListener('mousedown', handleMouseDown);

    dragBarContainer.addEventListener('dblclick', reset);

    return () => {
      dragBarContainer.removeEventListener('mousedown', handleMouseDown);
      dragBarContainer.removeEventListener('dblclick', reset);
    };
  }, [
    direction,
    reset,
    setHiddenElement,
    sizeThresholdFirst,
    sizeThresholdSecond,
    store,
  ]);

  // This makes sure that the children are stretched to full width or height,
  // depending on the resize direction.
  const flexStyles = {
    display: 'flex',
    flexDirection: direction === 'horizontal' ? 'row' : 'column',
  } as const;

  const callbackArgs: CallbackArgs = {
    hiddenElement,
    hide: setHiddenElement,
    reset,
  };

  return (
    <div
      {...divProps}
      style={{
        display: 'flex',
        flexDirection: direction === 'horizontal' ? 'row' : 'column',
      }}>
      <div ref={firstRef} style={flexStyles}>
        {typeof first === 'function' ? first(callbackArgs) : first}
      </div>
      <div ref={dragBarRef} style={flexStyles}>
        {typeof dragBar === 'function' ? dragBar(callbackArgs) : dragBar}
      </div>
      <div ref={secondRef} style={flexStyles}>
        {typeof second === 'function' ? second(callbackArgs) : second}
      </div>
    </div>
  );
}

function hide(element: HTMLDivElement) {
  // We hide elements off screen because of codemirror. If the page is loaded
  // and the codemirror container would have zero width, the layout isn't
  // instant pretty. By always giving the editor some width we avoid any
  // layout shifts when the editor reappears.
  element.style.left = '-1000px';
  element.style.position = 'absolute';
  element.style.opacity = '0';
  element.style.height = '500px';
  element.style.width = '500px';
}

function show(element: HTMLDivElement) {
  element.style.width = '';
  element.style.height = '';
  element.style.opacity = '';
  element.style.position = '';
  element.style.left = '';
}

const DEFAULT_FLEX = 1;
const HIDE_FIRST = 'hide-first';
const HIDE_SECOND = 'hide-second';
