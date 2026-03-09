'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Mail, Users, Download, FileText, Table } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useState, useCallback, useEffect } from 'react';

import {
  CommandCenter,
  PeriodSelector,
  TabNavigation,
  TabContent,
  InsightsDrawer,
  useAnalytics,
  SimulationProvider,
  useSimulation,
  type PeriodType,
  type TabId,
} from '../../../components/analytics/v2';

/** Panels chargés en lazy — contiennent recharts (~350 KB) */
const TrafficPanel = dynamic(
  () => import('../../../components/analytics/v2/panels/TrafficPanel').then(m => m.TrafficPanel),
  { ssr: false }
);
const EngagementPanel = dynamic(
  () =>
    import('../../../components/analytics/v2/panels/EngagementPanel').then(m => m.EngagementPanel),
  { ssr: false }
);
const ConversionsPanel = dynamic(
  () =>
    import('../../../components/analytics/v2/panels/ConversionsPanel').then(
      m => m.ConversionsPanel
    ),
  { ssr: false }
);
const SourcesPanel = dynamic(
  () => import('../../../components/analytics/v2/panels/SourcesPanel').then(m => m.SourcesPanel),
  { ssr: false }
);
const SEOPanel = dynamic(
  () => import('../../../components/analytics/v2/panels/SEOPanel').then(m => m.SEOPanel),
  { ssr: false }
);
const BlogPanel = dynamic(
  () => import('../../../components/analytics/v2/panels/BlogPanel').then(m => m.BlogPanel),
  { ssr: false }
);
const PostsPanel = dynamic(
  () => import('../../../components/analytics/v2/panels/PostsPanel').then(m => m.PostsPanel),
  { ssr: false }
);

function AnalyticsPageContent() {
  // State
  const [period, setPeriod] = useState<PeriodType>('last7days');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [activeTab, setActiveTab] = useState<TabId>('traffic');
  const [isInsightsOpen, setIsInsightsOpen] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [formattedLastUpdated, setFormattedLastUpdated] = useState<string | null>(null);

  // Mode simulation
  const { isSimulationMode, toggleSimulationMode } = useSimulation();

  // Fetch analytics data
  const {
    data,
    isLoading,
    error,
    refresh,
    isRefreshing,
    lastUpdated,
    fetchInsights,
    isLoadingInsights,
  } = useAnalytics({
    period,
    customStartDate: period === 'custom' ? customStartDate : undefined,
    customEndDate: period === 'custom' ? customEndDate : undefined,
    autoRefresh: period === 'realtime',
    refreshInterval: 30000,
  });

  // Fetch AI insights when the drawer opens
  useEffect(() => {
    if (isInsightsOpen) {
      fetchInsights();
    }
  }, [isInsightsOpen, fetchInsights]);

  // Format lastUpdated on client-side only to avoid hydration mismatch
  useEffect(() => {
    if (lastUpdated) {
      setFormattedLastUpdated(lastUpdated.toLocaleTimeString('fr-FR'));
    } else {
      setFormattedLastUpdated(null);
    }
  }, [lastUpdated]);

  // Handlers
  const handlePeriodChange = useCallback((newPeriod: PeriodType) => {
    setPeriod(newPeriod);
  }, []);

  const handleCustomDateChange = useCallback((start: string, end: string) => {
    setCustomStartDate(start);
    setCustomEndDate(end);
  }, []);

  const handleExportPDF = useCallback(async () => {
    setShowExportMenu(false);
    try {
      const params = new URLSearchParams();
      if (period === 'custom' && customStartDate && customEndDate) {
        params.append('startDate', customStartDate);
        params.append('endDate', customEndDate);
      }
      const response = await fetch(`/api/analytics/export-pdf?${params}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-report-${new Date().toISOString().split('T')[0]}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Export PDF error:', err);
    }
  }, [period, customStartDate, customEndDate]);

  const handleExportExcel = useCallback(async () => {
    setShowExportMenu(false);
    try {
      const params = new URLSearchParams();
      if (period === 'custom' && customStartDate && customEndDate) {
        params.append('startDate', customStartDate);
        params.append('endDate', customEndDate);
      }
      const response = await fetch(`/api/analytics/export-excel?${params}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-data-${new Date().toISOString().split('T')[0]}.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Export Excel error:', err);
    }
  }, [period, customStartDate, customEndDate]);

  const handleMarkAlertRead = useCallback((alertId: string) => {
    // Mark alert as read - could call API here
    console.log('Mark alert read:', alertId);
  }, []);

  // Error state
  if (error) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
            <span className="text-2xl">!</span>
          </div>
          <h2 className="text-ivory mb-2 text-lg font-semibold">Erreur de chargement</h2>
          <p className="text-ivory/60 mb-4 text-sm">{error}</p>
          <button
            onClick={refresh}
            className="bg-gold text-night hover:bg-gold/90 rounded-lg px-4 py-2 font-medium transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  // Default KPIs for loading state
  const kpis = data?.kpis || {
    visitors: 0,
    visitorsChange: 0,
    conversionRate: 0,
    conversionChange: 0,
    avgDuration: 0,
    durationChange: 0,
  };

  // Get unread alerts count
  const unreadAlerts = data?.alerts?.filter(a => !a.isRead).length || 0;

  return (
    <div className="max-w-full space-y-6 overflow-x-hidden">
      {/* Page Title (hidden but semantic) */}
      <h1 className="sr-only">Analytics Dashboard</h1>

      {/* Simulation Mode Banner */}
      {isSimulationMode && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-start gap-2 rounded-xl border border-purple-500/30 bg-purple-500/10 px-3 py-2 sm:flex-row sm:items-center sm:gap-3 sm:px-4 sm:py-3"
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="h-2 w-2 flex-shrink-0 animate-pulse rounded-full bg-purple-500" />
            <span className="text-xs font-medium text-purple-300 sm:text-sm">Mode Simulation</span>
          </div>
          <span className="ml-4 text-xs text-purple-300/60 sm:ml-0">
            Données générées aléatoirement
          </span>
        </motion.div>
      )}

      {/* Command Center - Sticky Header */}
      <CommandCenter
        healthScore={data?.healthScore || 50}
        kpis={kpis}
        isLoading={isLoading}
        isRealtime={period === 'realtime'}
        alertCount={unreadAlerts}
        isSimulationMode={isSimulationMode}
        onRefresh={refresh}
        onAlertsClick={() => setIsInsightsOpen(true)}
        onExportClick={() => setShowExportMenu(!showExportMenu)}
        onSimulationToggle={toggleSimulationMode}
      >
        <PeriodSelector
          value={period}
          onChange={handlePeriodChange}
          customStartDate={customStartDate}
          customEndDate={customEndDate}
          onCustomDateChange={handleCustomDateChange}
        />
      </CommandCenter>

      {/* Export Menu Dropdown */}
      <AnimatePresence>
        {showExportMenu && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="border-gold/20 bg-night/95 fixed right-2 top-24 z-50 w-48 overflow-hidden rounded-xl border shadow-2xl backdrop-blur-xl sm:right-4"
          >
            <div className="p-2">
              <button
                onClick={handleExportPDF}
                className="text-ivory hover:bg-ivory/5 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors"
              >
                <FileText size={16} className="text-red-400" />
                Exporter en PDF
              </button>
              <button
                onClick={handleExportExcel}
                className="text-ivory hover:bg-ivory/5 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors"
              >
                <Table size={16} className="text-green-400" />
                Exporter en Excel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Click outside to close export menu */}
      {showExportMenu && (
        <div className="fixed inset-0 z-40" onClick={() => setShowExportMenu(false)} />
      )}

      {/* Last Updated Indicator */}
      {formattedLastUpdated && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-ivory/40 flex items-center justify-end gap-2 text-xs"
        >
          <span>Dernière mise à jour : {formattedLastUpdated}</span>
          {period === 'realtime' && (
            <motion.span
              className="flex items-center gap-1 text-green-400"
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <span className="h-2 w-2 rounded-full bg-green-500" />
              Temps réel
            </motion.span>
          )}
        </motion.div>
      )}

      {/* Tab Navigation */}
      <TabNavigation
        activeTab={activeTab}
        onChange={setActiveTab}
        onInsightsClick={() => setIsInsightsOpen(true)}
      />

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'traffic' && (
          <TabContent tabId="traffic">
            <TrafficPanel
              chartData={data?.trafficChart || []}
              topPages={data?.topPages || []}
              totalViews={data?.totalViews || 0}
              totalVisitors={data?.totalVisitors || 0}
              newVisitors={data?.newVisitors || 0}
              isLoading={isLoading}
            />
          </TabContent>
        )}

        {activeTab === 'engagement' && (
          <TabContent tabId="engagement">
            <EngagementPanel
              avgSessionDuration={data?.avgSessionDuration || 0}
              avgPagesPerSession={data?.avgPagesPerSession || 0}
              bounceRate={data?.bounceRate || 0}
              scrollDepth={data?.scrollDepth || 0}
              sectionEngagement={data?.sectionEngagement || []}
              deviceBreakdown={data?.deviceBreakdown || []}
              isLoading={isLoading}
            />
          </TabContent>
        )}

        {activeTab === 'conversions' && (
          <TabContent tabId="conversions">
            <ConversionsPanel
              totalConversions={data?.totalConversions || 0}
              conversionRate={data?.conversionRate || 0}
              conversionChange={data?.conversionChange || 0}
              conversionTypes={
                data?.conversionTypes?.map(ct => ({
                  ...ct,
                  icon:
                    ct.id === 'appointment_request' ? (
                      <Calendar size={18} className="text-gold" />
                    ) : ct.id === 'seminar_registration' ? (
                      <Users size={18} className="text-blue-400" />
                    ) : (
                      <Mail size={18} className="text-green-400" />
                    ),
                })) || []
              }
              funnelSteps={data?.funnelSteps || []}
              goals={data?.goals || []}
              isLoading={isLoading}
            />
          </TabContent>
        )}

        {activeTab === 'sources' && (
          <TabContent tabId="sources">
            <SourcesPanel
              sources={data?.trafficSources || []}
              geoCountries={data?.geoCountries || []}
              geoCities={data?.geoCities || []}
              directTraffic={data?.directTraffic || 0}
              organicTraffic={data?.organicTraffic || 0}
              referralTraffic={data?.referralTraffic || 0}
              socialTraffic={data?.socialTraffic || 0}
              isLoading={isLoading}
            />
          </TabContent>
        )}

        {activeTab === 'seo' && (
          <TabContent tabId="seo">
            <SEOPanel
              totalBotVisits={data?.totalBotVisits || 0}
              uniqueBots={data?.uniqueBots || 0}
              crawledPages={data?.crawledPages || 0}
              avgCrawlRate={data?.avgCrawlRate || 0}
              botVisitsTimeline={data?.botVisitsTimeline || []}
              botTypes={data?.botTypes || []}
              topCrawledPages={data?.topCrawledPages || []}
              isLoading={isLoading}
            />
          </TabContent>
        )}

        {activeTab === 'blog' && (
          <TabContent tabId="blog">
            <BlogPanel data={data?.blogData || null} isLoading={isLoading} />
          </TabContent>
        )}

        {activeTab === 'posts' && (
          <TabContent tabId="posts">
            <PostsPanel data={data?.postsData || null} isLoading={isLoading} />
          </TabContent>
        )}
      </AnimatePresence>

      {/* Insights Drawer */}
      <InsightsDrawer
        isOpen={isInsightsOpen}
        onClose={() => setIsInsightsOpen(false)}
        insights={data?.insights || []}
        alerts={data?.alerts || []}
        goals={data?.goals || []}
        isLoadingInsights={isLoadingInsights}
        onRefreshInsights={fetchInsights}
        onMarkAlertRead={handleMarkAlertRead}
      />
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <SimulationProvider>
      <AnalyticsPageContent />
    </SimulationProvider>
  );
}
