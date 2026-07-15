import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { parse } from 'graphql';
import { describe, expect, it, vi } from 'vitest';
import { FragmentSection } from '../fragment-section';

function doc(query: string) {
  return parse(query, { noLocation: true });
}

describe('FragmentSection', () => {
  it('shows a "no fragments" message when the document has none', () => {
    render(<FragmentSection doc={doc('{ hero { name } }')} />);
    expect(screen.getByText(/no fragments defined/i)).toBeInTheDocument();
  });

  it('lists existing fragment names', () => {
    const d = doc(`
      { hero { ...HeroFields } }
      fragment HeroFields on Hero { name }
    `);
    render(<FragmentSection doc={d} />);
    expect(screen.getByText('HeroFields')).toBeInTheDocument();
  });

  it('lists multiple fragment names', () => {
    const d = doc(`
      { hero { ...HeroFields } droid { ...DroidFields } }
      fragment HeroFields on Hero { name }
      fragment DroidFields on Droid { primaryFunction }
    `);
    render(<FragmentSection doc={d} />);
    expect(screen.getByText('HeroFields')).toBeInTheDocument();
    expect(screen.getByText('DroidFields')).toBeInTheDocument();
  });

  it('has an accessible section label', () => {
    render(<FragmentSection doc={doc('{ hero { name } }')} />);
    expect(
      screen.getByRole('region', { name: /fragments/i }),
    ).toBeInTheDocument();
  });

  it('no longer renders a "create fragment from selection" button', () => {
    const d = doc(`
      { hero { ...HeroFields } }
      fragment HeroFields on Hero { name }
    `);
    render(<FragmentSection doc={d} onRenameFragment={() => {}} />);
    expect(
      screen.queryByRole('button', { name: /create fragment from selection/i }),
    ).not.toBeInTheDocument();
  });
});

describe('FragmentSection — inline rename', () => {
  const withFragment = () =>
    doc(`
      { hero { ...HeroFields } }
      fragment HeroFields on Hero { name }
    `);

  it('shows a rename affordance per fragment when onRenameFragment is supplied', () => {
    render(
      <FragmentSection doc={withFragment()} onRenameFragment={() => {}} />,
    );
    expect(
      screen.getByRole('button', { name: /rename fragment HeroFields/i }),
    ).toBeInTheDocument();
  });

  it('does not show a rename affordance without onRenameFragment', () => {
    render(<FragmentSection doc={withFragment()} />);
    expect(
      screen.queryByRole('button', { name: /rename fragment/i }),
    ).not.toBeInTheDocument();
  });

  it('commits a new name on Enter', async () => {
    const onRenameFragment = vi.fn();
    render(
      <FragmentSection
        doc={withFragment()}
        onRenameFragment={onRenameFragment}
      />,
    );
    await userEvent.click(
      screen.getByRole('button', { name: /rename fragment HeroFields/i }),
    );
    const input = screen.getByRole('textbox', {
      name: /rename fragment HeroFields/i,
    });
    await userEvent.clear(input);
    await userEvent.type(input, 'HeroBasics{Enter}');
    expect(onRenameFragment).toHaveBeenCalledWith('HeroFields', 'HeroBasics');
  });

  it('cancels on Escape without renaming', async () => {
    const onRenameFragment = vi.fn();
    render(
      <FragmentSection
        doc={withFragment()}
        onRenameFragment={onRenameFragment}
      />,
    );
    await userEvent.click(
      screen.getByRole('button', { name: /rename fragment HeroFields/i }),
    );
    const input = screen.getByRole('textbox', {
      name: /rename fragment HeroFields/i,
    });
    await userEvent.clear(input);
    await userEvent.type(input, 'Nope{Escape}');
    expect(onRenameFragment).not.toHaveBeenCalled();
    expect(screen.getByText('HeroFields')).toBeInTheDocument();
  });

  it('does not fire a rename when the name is unchanged', async () => {
    const onRenameFragment = vi.fn();
    render(
      <FragmentSection
        doc={withFragment()}
        onRenameFragment={onRenameFragment}
      />,
    );
    await userEvent.click(
      screen.getByRole('button', { name: /rename fragment HeroFields/i }),
    );
    const input = screen.getByRole('textbox', {
      name: /rename fragment HeroFields/i,
    });
    await userEvent.type(input, '{Enter}');
    expect(onRenameFragment).not.toHaveBeenCalled();
  });
});
