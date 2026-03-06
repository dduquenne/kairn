/**
 * Anomaly Detector
 *
 * Statistical anomaly detection for analytics metrics.
 * Uses threshold-based and standard deviation analysis
 * to detect drops, spikes, errors, and slow responses.
 */

/** Configurable anomaly detection thresholds */
export interface AnomalyThresholds {
  /** Percentage drop in visits to trigger anomaly */
  visitsDrop: number;
  /** Percentage spike in visits to trigger anomaly */
  visitsSpike: number;
  /** Maximum error rate percentage */
  errorRate: number;
  /** Slow response time threshold (ms) */
  slowResponse: number;
}

/** Detected anomaly structure */
export interface DetectedAnomaly {
  id: string;
  type: 'drop' | 'spike' | 'error' | 'slow';
  severity: 'low' | 'medium' | 'high';
  title: string;
  message: string;
  value: number;
  threshold: number;
  timestamp: string;
}

const DEFAULT_THRESHOLDS: AnomalyThresholds = {
  visitsDrop: -30,
  visitsSpike: 200,
  errorRate: 5,
  slowResponse: 3000,
};

/**
 * Stateful anomaly detector that tracks historical values
 * and detects traffic, error, and performance anomalies.
 */
export class AnomalyDetector {
  private thresholds: AnomalyThresholds;
  private history: number[] = [];
  private maxHistorySize = 100;

  constructor(thresholds: Partial<AnomalyThresholds> = {}) {
    this.thresholds = { ...DEFAULT_THRESHOLDS, ...thresholds };
  }

  /** Adds a value to the internal history */
  addValue(value: number): void {
    this.history.push(value);
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }
  }

  private average(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  private standardDeviation(values: number[]): number {
    const avg = this.average(values);
    const squareDiffs = values.map(value => Math.pow(value - avg, 2));
    return Math.sqrt(this.average(squareDiffs));
  }

  /** Detects visit count anomalies based on historical average */
  detectVisitAnomaly(currentVisits: number): DetectedAnomaly | null {
    if (this.history.length < 10) {
      this.addValue(currentVisits);
      return null;
    }

    const avg = this.average(this.history);
    const change = ((currentVisits - avg) / avg) * 100;

    this.addValue(currentVisits);

    if (change < this.thresholds.visitsDrop) {
      return {
        id: `anomaly-${Date.now()}`,
        type: 'drop',
        severity: change < this.thresholds.visitsDrop * 2 ? 'high' : 'medium',
        title: 'Baisse de trafic détectée',
        message: `Le trafic a chuté de ${Math.abs(Math.round(change))}% par rapport à la moyenne`,
        value: currentVisits,
        threshold: avg,
        timestamp: new Date().toISOString(),
      };
    }

    if (change > this.thresholds.visitsSpike) {
      return {
        id: `anomaly-${Date.now()}`,
        type: 'spike',
        severity: 'medium',
        title: 'Pic de trafic détecté',
        message: `Le trafic a augmenté de ${Math.round(change)}% par rapport à la moyenne`,
        value: currentVisits,
        threshold: avg,
        timestamp: new Date().toISOString(),
      };
    }

    return null;
  }

  /** Detects slow response time anomalies */
  detectSlowResponse(responseTime: number): DetectedAnomaly | null {
    if (responseTime > this.thresholds.slowResponse) {
      return {
        id: `anomaly-${Date.now()}`,
        type: 'slow',
        severity: responseTime > this.thresholds.slowResponse * 2 ? 'high' : 'medium',
        title: 'Temps de réponse lent',
        message: `Le temps de réponse est de ${Math.round(responseTime)}ms (seuil: ${this.thresholds.slowResponse}ms)`,
        value: responseTime,
        threshold: this.thresholds.slowResponse,
        timestamp: new Date().toISOString(),
      };
    }
    return null;
  }

  /** Detects high error rate anomalies */
  detectErrorRate(errorRate: number): DetectedAnomaly | null {
    if (errorRate > this.thresholds.errorRate) {
      return {
        id: `anomaly-${Date.now()}`,
        type: 'error',
        severity: errorRate > this.thresholds.errorRate * 2 ? 'high' : 'medium',
        title: "Taux d'erreur élevé",
        message: `Le taux d'erreur est de ${errorRate.toFixed(1)}% (seuil: ${this.thresholds.errorRate}%)`,
        value: errorRate,
        threshold: this.thresholds.errorRate,
        timestamp: new Date().toISOString(),
      };
    }
    return null;
  }

  /** Resets the internal history */
  reset(): void {
    this.history = [];
  }
}
