// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
export interface AnomalyThresholds {
  visitsDrop: number;      // % de baisse des visites
  visitsSpike: number;     // % d'augmentation des visites
  errorRate: number;       // Taux d'erreur maximum
  slowResponse: number;    // Temps de réponse lent (ms)
}

export interface Anomaly {
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
  visitsDrop: -30,      // -30% de visites
  visitsSpike: 200,     // +200% de visites
  errorRate: 5,         // 5% d'erreurs
  slowResponse: 3000    // 3 secondes
};

export class AnomalyDetector {
  private thresholds: AnomalyThresholds;
  private history: number[] = [];
  private maxHistorySize = 100;

  constructor(thresholds: Partial<AnomalyThresholds> = {}) {
    this.thresholds = { ...DEFAULT_THRESHOLDS, ...thresholds };
  }

  /**
   * Ajoute une valeur à l'historique
   */
  addValue(value: number) {
    this.history.push(value);
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }
  }

  /**
   * Calcule la moyenne des valeurs
   */
  private average(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  /**
   * Calcule l'écart-type
   */
  private standardDeviation(values: number[]): number {
    const avg = this.average(values);
    const squareDiffs = values.map(value => Math.pow(value - avg, 2));
    return Math.sqrt(this.average(squareDiffs));
  }

  /**
   * Détecte les anomalies dans les visites
   */
  detectVisitAnomaly(currentVisits: number): Anomaly | null {
    if (this.history.length < 10) {
      this.addValue(currentVisits);
      return null;
    }

    const avg = this.average(this.history);
    const change = ((currentVisits - avg) / avg) * 100;

    this.addValue(currentVisits);

    // Détection de baisse
    if (change < this.thresholds.visitsDrop) {
      return {
        id: `anomaly-${Date.now()}`,
        type: 'drop',
        severity: change < this.thresholds.visitsDrop * 2 ? 'high' : 'medium',
        title: 'Baisse de trafic détectée',
        message: `Le trafic a chuté de ${Math.abs(Math.round(change))}% par rapport à la moyenne`,
        value: currentVisits,
        threshold: avg,
        timestamp: new Date().toISOString()
      };
    }

    // Détection de pic
    if (change > this.thresholds.visitsSpike) {
      return {
        id: `anomaly-${Date.now()}`,
        type: 'spike',
        severity: 'medium',
        title: 'Pic de trafic détecté',
        message: `Le trafic a augmenté de ${Math.round(change)}% par rapport à la moyenne`,
        value: currentVisits,
        threshold: avg,
        timestamp: new Date().toISOString()
      };
    }

    return null;
  }

  /**
   * Détecte les anomalies de temps de réponse
   */
  detectSlowResponse(responseTime: number): Anomaly | null {
    if (responseTime > this.thresholds.slowResponse) {
      return {
        id: `anomaly-${Date.now()}`,
        type: 'slow',
        severity: responseTime > this.thresholds.slowResponse * 2 ? 'high' : 'medium',
        title: 'Temps de réponse lent',
        message: `Le temps de réponse est de ${Math.round(responseTime)}ms (seuil: ${this.thresholds.slowResponse}ms)`,
        value: responseTime,
        threshold: this.thresholds.slowResponse,
        timestamp: new Date().toISOString()
      };
    }
    return null;
  }

  /**
   * Détecte les anomalies de taux d'erreur
   */
  detectErrorRate(errorRate: number): Anomaly | null {
    if (errorRate > this.thresholds.errorRate) {
      return {
        id: `anomaly-${Date.now()}`,
        type: 'error',
        severity: errorRate > this.thresholds.errorRate * 2 ? 'high' : 'medium',
        title: 'Taux d\'erreur élevé',
        message: `Le taux d'erreur est de ${errorRate.toFixed(1)}% (seuil: ${this.thresholds.errorRate}%)`,
        value: errorRate,
        threshold: this.thresholds.errorRate,
        timestamp: new Date().toISOString()
      };
    }
    return null;
  }

  /**
   * Réinitialise l'historique
   */
  reset() {
    this.history = [];
  }
}

// Instance singleton
export const anomalyDetector = new AnomalyDetector();
