/**
 * SectionTitle Component Tests
 *
 * Tests for the reusable SectionTitle component.
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { SectionTitle } from '../../section-title';

describe('SectionTitle', () => {
  it('renders the title', () => {
    render(<SectionTitle title="Mon titre" />);
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Mon titre');
  });

  it('renders the eyebrow when provided', () => {
    render(<SectionTitle eyebrow="Sous-titre" title="Titre" />);
    expect(screen.getByText('Sous-titre')).toBeInTheDocument();
  });

  it('does not render the eyebrow when not provided', () => {
    const { container } = render(<SectionTitle title="Titre" />);
    const paragraphs = container.querySelectorAll('p');
    expect(paragraphs).toHaveLength(0);
  });

  it('renders the description when provided', () => {
    render(<SectionTitle title="Titre" description="Une description." />);
    expect(screen.getByText('Une description.')).toBeInTheDocument();
  });

  it('does not render the description when not provided', () => {
    const { container } = render(<SectionTitle title="Titre" />);
    const paragraphs = container.querySelectorAll('p');
    expect(paragraphs).toHaveLength(0);
  });

  it('renders eyebrow, title, and description together', () => {
    render(<SectionTitle eyebrow="Label" title="Heading" description="Some description text." />);
    expect(screen.getByText('Label')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Heading');
    expect(screen.getByText('Some description text.')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<SectionTitle title="Titre" className="custom-class" />);
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('accepts ReactNode as description', () => {
    render(
      <SectionTitle
        title="Titre"
        description={<span data-testid="custom-desc">Custom content</span>}
      />
    );
    expect(screen.getByTestId('custom-desc')).toBeInTheDocument();
  });
});
