/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
/**
 * Système de synchronisation offline
 * Met en file d'attente les actions quand offline et les synchronise quand online
 */

interface QueuedAction {
  id: string;
  type: string;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: any;
  timestamp: number;
  retries: number;
}

const QUEUE_KEY = 'pwa_offline_queue';
const MAX_RETRIES = 3;

class OfflineSyncQueue {
  private queue: QueuedAction[] = [];
  private processing = false;

  constructor() {
    this.loadQueue();
    this.setupOnlineListener();
  }

  /**
   * Charge la file d'attente depuis localStorage
   */
  private loadQueue() {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(QUEUE_KEY);
      if (stored) {
        this.queue = JSON.parse(stored);
        console.log(`📦 ${this.queue.length} action(s) chargée(s) de la file offline`);
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la file offline:', error);
    }
  }

  /**
   * Sauvegarde la file d'attente dans localStorage
   */
  private saveQueue() {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(QUEUE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la file offline:', error);
    }
  }

  /**
   * Ajoute une action à la file d'attente
   */
  enqueue(action: Omit<QueuedAction, 'id' | 'timestamp' | 'retries'>) {
    const queuedAction: QueuedAction = {
      ...action,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retries: 0,
    };

    this.queue.push(queuedAction);
    this.saveQueue();

    console.log(`➕ Action ajoutée à la file: ${action.type}`);

    // Tenter de traiter immédiatement si online
    if (navigator.onLine) {
      this.processQueue();
    }
  }

  /**
   * Configure l'écouteur pour le retour online
   */
  private setupOnlineListener() {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', () => {
      console.log('🌐 Connexion rétablie, traitement de la file...');
      this.processQueue();
    });

    window.addEventListener('offline', () => {
      console.log('📴 Connexion perdue, les actions seront mises en file');
    });
  }

  /**
   * Traite la file d'attente
   */
  async processQueue() {
    if (this.processing || this.queue.length === 0 || !navigator.onLine) {
      return;
    }

    this.processing = true;
    console.log(`⚙️  Traitement de ${this.queue.length} action(s)...`);

    const queue = [...this.queue];

    for (const action of queue) {
      try {
        await this.executeAction(action);

        // Retirer de la file si succès
        this.queue = this.queue.filter(a => a.id !== action.id);
        console.log(`✅ Action traitée: ${action.type}`);

      } catch (error) {
        console.error(`❌ Échec de l'action ${action.type}:`, error);

        // Incrémenter le compteur de tentatives
        const queuedAction = this.queue.find(a => a.id === action.id);
        if (queuedAction) {
          queuedAction.retries++;

          // Retirer si trop de tentatives
          if (queuedAction.retries >= MAX_RETRIES) {
            this.queue = this.queue.filter(a => a.id !== action.id);
            console.warn(`⚠️  Action abandonnée après ${MAX_RETRIES} tentatives: ${action.type}`);
          }
        }
      }
    }

    this.saveQueue();
    this.processing = false;

    if (this.queue.length === 0) {
      console.log('✨ File d\'attente vide');
    }
  }

  /**
   * Exécute une action
   */
  private async executeAction(action: QueuedAction): Promise<void> {
    const options: RequestInit = {
      method: action.method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (action.data) {
      options.body = JSON.stringify(action.data);
    }

    const response = await fetch(action.url, options);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Obtient la taille actuelle de la file
   */
  getQueueSize(): number {
    return this.queue.length;
  }

  /**
   * Obtient la file d'attente complète
   */
  getQueue(): ReadonlyArray<QueuedAction> {
    return [...this.queue];
  }

  /**
   * Vide la file d'attente
   */
  clearQueue() {
    this.queue = [];
    this.saveQueue();
    console.log('🗑️  File d\'attente vidée');
  }
}

// Instance singleton
export const offlineQueue = new OfflineSyncQueue();

/**
 * Helper pour enregistrer une action analytics
 */
export function trackOffline(type: string, data: any) {
  offlineQueue.enqueue({
    type,
    url: '/api/analytics/track',
    method: 'POST',
    data: { type, ...data },
  });
}
