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

  it('renders the "create fragment from selection" button when onCreateFragment is supplied', () => {
    render(
      <FragmentSection
        doc={doc('{ hero { name } }')}
        onCreateFragment={() => undefined}
      />,
    );
    expect(
      screen.getByRole('button', { name: /create fragment from selection/i }),
    ).toBeInTheDocument();
  });

  it('does not render the create button when onCreateFragment is not supplied', () => {
    render(<FragmentSection doc={doc('{ hero { name } }')} />);
    expect(
      screen.queryByRole('button', { name: /create fragment from selection/i }),
    ).not.toBeInTheDocument();
  });

  it('calls onCreateFragment when the button is clicked', async () => {
    const onCreateFragment = vi.fn();
    render(
      <FragmentSection
        doc={doc('{ hero { name } }')}
        onCreateFragment={onCreateFragment}
      />,
    );
    await userEvent.click(
      screen.getByRole('button', { name: /create fragment from selection/i }),
    );
    expect(onCreateFragment).toHaveBeenCalledOnce();
  });

  it('has an accessible section label', () => {
    render(<FragmentSection doc={doc('{ hero { name } }')} />);
    expect(screen.getByRole('region', { name: /fragments/i })).toBeInTheDocument();
  });
});
