/**
 * Tests pour le hook useHapticFeedback
 *
 * Ce hook n'utilise pas de hooks React internes (useState/useEffect),
 * il peut donc être testé directement sans renderHook/DOM.
 *
 * @module hooks/__tests__/useHapticFeedback
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { useHapticFeedback } from '../useHapticFeedback';

describe('useHapticFeedback', () => {
  let vibrateMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vibrateMock = vi.fn();
    Object.defineProperty(navigator, 'vibrate', {
      value: vibrateMock,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fournit toutes les fonctions de feedback', () => {
    const result = useHapticFeedback();

    expect(result.triggerHaptic).toBeDefined();
    expect(result.tapFeedback).toBeDefined();
    expect(result.selectionFeedback).toBeDefined();
    expect(result.successFeedback).toBeDefined();
    expect(result.warningFeedback).toBeDefined();
    expect(result.errorFeedback).toBeDefined();
    expect(result.swipeFeedback).toBeDefined();
    expect(result.longPressFeedback).toBeDefined();
  });

  it('déclenche une vibration light par défaut', () => {
    const result = useHapticFeedback();
    result.triggerHaptic();
    expect(vibrateMock).toHaveBeenCalledWith(10);
  });

  it('déclenche le bon pattern pour tapFeedback', () => {
    const result = useHapticFeedback();
    result.tapFeedback();
    expect(vibrateMock).toHaveBeenCalledWith(10);
  });

  it('déclenche le bon pattern pour successFeedback', () => {
    const result = useHapticFeedback();
    result.successFeedback();
    expect(vibrateMock).toHaveBeenCalledWith([10, 50, 10]);
  });

  it('déclenche le bon pattern pour errorFeedback', () => {
    const result = useHapticFeedback();
    result.errorFeedback();
    expect(vibrateMock).toHaveBeenCalledWith([50, 100, 50, 100, 50]);
  });

  it('déclenche le bon pattern pour swipeFeedback', () => {
    const result = useHapticFeedback();
    result.swipeFeedback();
    expect(vibrateMock).toHaveBeenCalledWith(20);
  });

  it('déclenche le bon pattern pour longPressFeedback', () => {
    const result = useHapticFeedback();
    result.longPressFeedback();
    expect(vibrateMock).toHaveBeenCalledWith(40);
  });

  it('ne lance pas d\u2019erreur si vibrate n\u2019est pas supporté', () => {
    Object.defineProperty(navigator, 'vibrate', {
      value: undefined,
      writable: true,
      configurable: true,
    });

    const result = useHapticFeedback();
    expect(() => result.tapFeedback()).not.toThrow();
  });

  it('gère gracieusement les erreurs de vibrate', () => {
    vibrateMock.mockImplementation(() => {
      throw new Error('Vibration failed');
    });

    const result = useHapticFeedback();
    expect(() => result.tapFeedback()).not.toThrow();
  });
});
