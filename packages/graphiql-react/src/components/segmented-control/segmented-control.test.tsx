'use no memo';

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { SegmentedControl } from './';

describe('SegmentedControl', () => {
  it('renders all options', () => {
    render(
      <SegmentedControl
        value="a"
        onChange={() => {}}
        options={[
          { value: 'a', label: 'Alpha' },
          { value: 'b', label: 'Beta' },
          { value: 'c', label: 'Gamma' },
        ]}
      />,
    );
    expect(screen.getByRole('radio', { name: 'Alpha' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Beta' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Gamma' })).toBeInTheDocument();
  });

  it('marks the selected option as checked', () => {
    render(
      <SegmentedControl
        value="a"
        onChange={() => {}}
        options={[
          { value: 'a', label: 'Alpha' },
          { value: 'b', label: 'Beta' },
        ]}
      />,
    );
    expect(screen.getByRole('radio', { name: 'Alpha' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Beta' })).not.toBeChecked();
  });

  it('calls onChange when a non-selected option is clicked', async () => {
    const user = userEvent.setup();
    function Wrapper() {
      const [v, setV] = useState('a');
      return (
        <SegmentedControl
          value={v}
          onChange={setV}
          options={[
            { value: 'a', label: 'Alpha' },
            { value: 'b', label: 'Beta' },
          ]}
        />
      );
    }
    render(<Wrapper />);
    await user.click(screen.getByRole('radio', { name: 'Beta' }));
    expect(screen.getByRole('radio', { name: 'Beta' })).toBeChecked();
  });

  it('does not call onChange for a disabled option', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <SegmentedControl
        value="a"
        onChange={onChange}
        options={[
          { value: 'a', label: 'Alpha' },
          { value: 'b', label: 'Beta', disabled: true },
        ]}
      />,
    );
    await user.click(screen.getByRole('radio', { name: 'Beta' }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('moves selection with ArrowRight keyboard navigation', async () => {
    const user = userEvent.setup();
    function Wrapper() {
      const [v, setV] = useState('a');
      return (
        <SegmentedControl
          value={v}
          onChange={setV}
          options={[
            { value: 'a', label: 'Alpha' },
            { value: 'b', label: 'Beta' },
          ]}
        />
      );
    }
    render(<Wrapper />);
    screen.getByRole('radio', { name: 'Alpha' }).focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('radio', { name: 'Beta' })).toBeChecked();
  });
});
