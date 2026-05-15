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
    expect(screen.getByRole('button', { name: 'Alpha' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Beta' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Gamma' })).toBeInTheDocument();
  });

  it('marks the selected option with aria-pressed', () => {
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
    expect(
      screen.getByRole('button', { name: 'Alpha', pressed: true }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Beta', pressed: false }),
    ).toBeInTheDocument();
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
    await user.click(screen.getByRole('button', { name: 'Beta' }));
    expect(
      screen.getByRole('button', { name: 'Beta', pressed: true }),
    ).toBeInTheDocument();
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
    await user.click(screen.getByRole('button', { name: 'Beta' }));
    expect(onChange).not.toHaveBeenCalled();
  });
});
