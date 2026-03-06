import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import {
  createLogger,
  configureLogger,
  addErrorReporter,
  removeAllErrorReporters,
  type ErrorReportHandler,
} from '../logger';

describe('Logger error reporters', () => {
  beforeEach(() => {
    removeAllErrorReporters();
    configureLogger({ enabled: true, minLevel: 'debug' });
  });

  afterEach(() => {
    removeAllErrorReporters();
  });

  it('appelle le reporter sur un log de niveau error', () => {
    const reporter = vi.fn();
    addErrorReporter(reporter);

    const logger = createLogger('test');
    const testError = new Error('test error');
    logger.error('Something failed', testError);

    expect(reporter).toHaveBeenCalledTimes(1);
    expect(reporter).toHaveBeenCalledWith(
      expect.objectContaining({
        level: 'error',
        message: 'Something failed',
        scope: 'test',
      }),
      testError
    );
  });

  it('appelle le reporter sur un log de niveau warn', () => {
    const reporter = vi.fn();
    addErrorReporter(reporter);

    const logger = createLogger('test');
    logger.warn('Warning message');

    expect(reporter).toHaveBeenCalledTimes(1);
    expect(reporter).toHaveBeenCalledWith(
      expect.objectContaining({
        level: 'warn',
        message: 'Warning message',
      }),
      undefined
    );
  });

  it('ne notifie pas le reporter pour les niveaux info et debug', () => {
    const reporter = vi.fn();
    addErrorReporter(reporter);

    const logger = createLogger('test');
    logger.info('Info message');
    logger.debug('Debug message');

    expect(reporter).not.toHaveBeenCalled();
  });

  it('supporte plusieurs reporters', () => {
    const reporter1 = vi.fn();
    const reporter2 = vi.fn();
    addErrorReporter(reporter1);
    addErrorReporter(reporter2);

    const logger = createLogger('test');
    logger.error('Error message', new Error('err'));

    expect(reporter1).toHaveBeenCalledTimes(1);
    expect(reporter2).toHaveBeenCalledTimes(1);
  });

  it('ne crash pas si un reporter lève une erreur', () => {
    const badReporter: ErrorReportHandler = () => {
      throw new Error('reporter error');
    };
    const goodReporter = vi.fn();
    addErrorReporter(badReporter);
    addErrorReporter(goodReporter);

    const logger = createLogger('test');

    expect(() => {
      logger.error('Error message', new Error('err'));
    }).not.toThrow();

    expect(goodReporter).toHaveBeenCalledTimes(1);
  });

  it('removeAllErrorReporters supprime tous les reporters', () => {
    const reporter = vi.fn();
    addErrorReporter(reporter);
    removeAllErrorReporters();

    const logger = createLogger('test');
    logger.error('Error message', new Error('err'));

    expect(reporter).not.toHaveBeenCalled();
  });
});
