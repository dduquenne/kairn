/**
 * Accessibility tests for Accordion component
 *
 * Tests WCAG 2.1 AA compliance for expandable content sections
 */

import { render, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { axe } from 'vitest-axe';

import { Accordion } from '../../components/accordion';

// Mock lucide-react
vi.mock('lucide-react', () => ({
  ChevronDown: ({ className, ...props }: { className?: string; [key: string]: unknown }) => (
    <span data-testid="chevron" className={className} {...props}>
      v
    </span>
  ),
}));

afterEach(cleanup);

const defaultItems = [
  { id: 'item1', title: 'Section 1', children: <p>Content 1</p> },
  { id: 'item2', title: 'Section 2', children: <p>Content 2</p> },
  { id: 'item3', title: 'Section 3', children: <p>Content 3</p>, defaultOpen: true },
];

/** Helper to find accordion button by item id */
function findButton(container: HTMLElement, itemId: string): HTMLButtonElement | null {
  const buttons = container.querySelectorAll('button');
  return (
    (Array.from(buttons).find(
      btn => btn.id === `accordion-header-${itemId}`
    ) as HTMLButtonElement) ?? null
  );
}

describe('Accordion - Accessibility', () => {
  it('should have no accessibility violations when collapsed', async () => {
    const { container } = render(
      <Accordion items={defaultItems.map(i => ({ ...i, defaultOpen: false }))} ariaLabel="FAQ" />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have no accessibility violations when expanded', async () => {
    const { container } = render(<Accordion items={defaultItems} ariaLabel="FAQ" />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have aria-expanded on toggle buttons', () => {
    const { container } = render(<Accordion items={defaultItems} ariaLabel="FAQ" />);

    const btn1 = findButton(container, 'item1');
    const btn2 = findButton(container, 'item2');
    const btn3 = findButton(container, 'item3');

    expect(btn1).not.toBeNull();
    expect(btn1?.getAttribute('aria-expanded')).toBe('false');
    expect(btn2?.getAttribute('aria-expanded')).toBe('false');
    expect(btn3?.getAttribute('aria-expanded')).toBe('true');
  });

  it('should toggle aria-expanded on click', () => {
    const { container } = render(<Accordion items={defaultItems} ariaLabel="FAQ" />);
    const btn1 = findButton(container, 'item1');
    expect(btn1).not.toBeNull();
    expect(btn1!.getAttribute('aria-expanded')).toBe('false');

    fireEvent.click(btn1!);
    expect(btn1!.getAttribute('aria-expanded')).toBe('true');

    fireEvent.click(btn1!);
    expect(btn1!.getAttribute('aria-expanded')).toBe('false');
  });

  it('should have aria-controls linking button to panel', () => {
    const { container } = render(<Accordion items={defaultItems} ariaLabel="FAQ" />);
    defaultItems.forEach(item => {
      const button = findButton(container, item.id);
      expect(button).not.toBeNull();
      expect(button?.getAttribute('aria-controls')).toBe(`accordion-panel-${item.id}`);
    });
  });

  it('should have region role on content panels with aria-labelledby', () => {
    const { container } = render(<Accordion items={defaultItems} ariaLabel="FAQ" />);

    defaultItems.forEach(item => {
      const panels = container.querySelectorAll(`[id="accordion-panel-${item.id}"]`);
      expect(panels.length).toBe(1);
      expect(panels[0].getAttribute('role')).toBe('region');
      expect(panels[0].getAttribute('aria-labelledby')).toBe(`accordion-header-${item.id}`);
    });
  });

  it('should have decorative chevron icons marked with aria-hidden', () => {
    const { container } = render(<Accordion items={defaultItems} ariaLabel="FAQ" />);
    const chevrons = container.querySelectorAll('[data-testid="chevron"]');
    chevrons.forEach(chevron => {
      expect(chevron.getAttribute('aria-hidden')).toBe('true');
    });
  });

  it('should have hidden attribute on collapsed panels', () => {
    const { container } = render(
      <Accordion items={defaultItems.map(i => ({ ...i, defaultOpen: false }))} ariaLabel="FAQ" />
    );
    const buttons = container.querySelectorAll('button');
    buttons.forEach(button => {
      const panelId = button.getAttribute('aria-controls');
      if (panelId) {
        const panelElements = container.querySelectorAll(`[id="${panelId}"]`);
        expect(panelElements.length).toBe(1);
        expect(panelElements[0].hasAttribute('hidden')).toBe(true);
      }
    });
  });
});
