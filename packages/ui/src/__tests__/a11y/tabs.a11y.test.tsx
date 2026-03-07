/**
 * Accessibility tests for Tabs component
 *
 * Tests WCAG 2.1 AA compliance for tabbed interface pattern
 */

import { render, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { axe } from 'vitest-axe';

import { Tabs } from '../../components/tabs';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) => (
      <div {...props}>{children}</div>
    ),
  },
}));

afterEach(cleanup);

const defaultItems = [
  { id: 'tab-1', label: 'Onglet 1', children: <p>Contenu 1</p> },
  { id: 'tab-2', label: 'Onglet 2', children: <p>Contenu 2</p> },
  { id: 'tab-3', label: 'Onglet 3', children: <p>Contenu 3</p>, disabled: true },
];

describe('Tabs - Accessibility', () => {
  it('should have no accessibility violations', async () => {
    const { container } = render(<Tabs items={defaultItems} ariaLabel="Sections" />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have tablist role on container', () => {
    const { getByRole } = render(<Tabs items={defaultItems} ariaLabel="Sections" />);
    const tablist = getByRole('tablist');
    expect(tablist).toBeTruthy();
    expect(tablist).toHaveAttribute('aria-label', 'Sections');
  });

  it('should have tab role on each tab button', () => {
    const { getAllByRole } = render(<Tabs items={defaultItems} ariaLabel="Sections" />);
    const tabs = getAllByRole('tab');
    expect(tabs).toHaveLength(3);
  });

  it('should have aria-selected on active tab only', () => {
    const { getAllByRole } = render(
      <Tabs items={defaultItems} defaultTab="tab-1" ariaLabel="Sections" />
    );
    const tabs = getAllByRole('tab');
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
    expect(tabs[1]).toHaveAttribute('aria-selected', 'false');
    expect(tabs[2]).toHaveAttribute('aria-selected', 'false');
  });

  it('should have tabpanel role on content area', () => {
    const { getByRole } = render(<Tabs items={defaultItems} ariaLabel="Sections" />);
    const panel = getByRole('tabpanel');
    expect(panel).toBeTruthy();
    expect(panel).toHaveAttribute('aria-labelledby');
  });

  it('should have aria-controls linking tab to panel', () => {
    const { getAllByRole, getByRole } = render(
      <Tabs items={defaultItems} defaultTab="tab-1" ariaLabel="Sections" />
    );
    const activeTab = getAllByRole('tab')[0];
    const panel = getByRole('tabpanel');

    expect(activeTab).toHaveAttribute('aria-controls', panel.id);
    expect(panel).toHaveAttribute('aria-labelledby', activeTab.id);
  });

  it('should use roving tabindex (0 on active, -1 on inactive)', () => {
    const { getAllByRole } = render(
      <Tabs items={defaultItems} defaultTab="tab-1" ariaLabel="Sections" />
    );
    const tabs = getAllByRole('tab');
    expect(tabs[0]).toHaveAttribute('tabindex', '0');
    expect(tabs[1]).toHaveAttribute('tabindex', '-1');
    expect(tabs[2]).toHaveAttribute('tabindex', '-1');
  });

  it('should navigate tabs with ArrowRight key', () => {
    const { getAllByRole, getByRole } = render(
      <Tabs items={defaultItems} defaultTab="tab-1" ariaLabel="Sections" />
    );
    const tablist = getByRole('tablist');

    fireEvent.keyDown(tablist, { key: 'ArrowRight' });
    const tabs = getAllByRole('tab');
    expect(tabs[1]).toHaveAttribute('aria-selected', 'true');
  });

  it('should navigate tabs with ArrowLeft key', () => {
    const { getAllByRole, getByRole } = render(
      <Tabs items={defaultItems} defaultTab="tab-2" ariaLabel="Sections" />
    );
    const tablist = getByRole('tablist');

    fireEvent.keyDown(tablist, { key: 'ArrowLeft' });
    const tabs = getAllByRole('tab');
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
  });

  it('should skip disabled tabs in keyboard navigation', () => {
    const items = [
      { id: 'a', label: 'A', children: <p>A</p> },
      { id: 'b', label: 'B', children: <p>B</p>, disabled: true },
      { id: 'c', label: 'C', children: <p>C</p> },
    ];
    const { getAllByRole, getByRole } = render(
      <Tabs items={items} defaultTab="a" ariaLabel="Test" />
    );
    const tablist = getByRole('tablist');

    fireEvent.keyDown(tablist, { key: 'ArrowRight' });
    const tabs = getAllByRole('tab');
    expect(tabs[2]).toHaveAttribute('aria-selected', 'true');
  });

  it('should navigate to first tab with Home key', () => {
    const { getAllByRole, getByRole } = render(
      <Tabs items={defaultItems} defaultTab="tab-2" ariaLabel="Sections" />
    );
    const tablist = getByRole('tablist');

    fireEvent.keyDown(tablist, { key: 'Home' });
    const tabs = getAllByRole('tab');
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
  });

  it('should navigate to last tab with End key', () => {
    const { getAllByRole, getByRole } = render(
      <Tabs items={defaultItems} defaultTab="tab-1" ariaLabel="Sections" />
    );
    const tablist = getByRole('tablist');

    fireEvent.keyDown(tablist, { key: 'End' });
    const tabs = getAllByRole('tab');
    // Last enabled tab (tab-2, since tab-3 is disabled)
    expect(tabs[1]).toHaveAttribute('aria-selected', 'true');
  });

  it('should have no violations with different variants', async () => {
    for (const variant of ['default', 'pills', 'underline'] as const) {
      const { container } = render(
        <Tabs items={defaultItems} variant={variant} ariaLabel="Test" />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
      cleanup();
    }
  });
});
