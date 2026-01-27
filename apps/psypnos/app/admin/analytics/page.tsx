"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Mail, Users, Download, FileText, Table } from "lucide-react";
import {
  CommandCenter,
  PeriodSelector,
  TabNavigation,
  TabContent,
  InsightsDrawer,
  TrafficPanel,
  EngagementPanel,
  ConversionsPanel,
  SourcesPanel,
  SEOPanel,
  useAnalytics,
  SimulationProvider,
  useSimulation,
  type PeriodType,
  type TabId,
} from "../../../components/analytics/v2";

function AnalyticsPageContent() {
  // State
  const [period, setPeriod] = useState<PeriodType>("last7days");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");
  const [activeTab, setActiveTab] = useState<TabId>("traffic");
  const [isInsightsOpen, setIsInsightsOpen] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Mode simulation
  const { isSimulationMode, toggleSimulationMode } = useSimulation();

  // Fetch analytics data
  const { data, isLoading, error, refresh, isRefreshing, lastUpdated } = useAnalytics({
    period,
    customStartDate: period === "custom" ? customStartDate : undefined,
    customEndDate: period === "custom" ? customEndDate : undefined,
    autoRefresh: period === "realtime",
    refreshInterval: 30000,
  });

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
      if (period === "custom" && customStartDate && customEndDate) {
        params.append("startDate", customStartDate);
        params.append("endDate", customEndDate);
      }
      const response = await fetch(`/api/analytics/export-pdf?${params}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `analytics-report-${new Date().toISOString().split("T")[0]}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error("Export PDF error:", err);
    }
  }, [period, customStartDate, customEndDate]);

  const handleExportExcel = useCallback(async () => {
    setShowExportMenu(false);
    try {
      const params = new URLSearchParams();
      if (period === "custom" && customStartDate && customEndDate) {
        params.append("startDate", customStartDate);
        params.append("endDate", customEndDate);
      }
      const response = await fetch(`/api/analytics/export-excel?${params}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `analytics-data-${new Date().toISOString().split("T")[0]}.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error("Export Excel error:", err);
    }
  }, [period, customStartDate, customEndDate]);

  const handleMarkAlertRead = useCallback((alertId: string) => {
    // Mark alert as read - could call API here
    console.log("Mark alert read:", alertId);
  }, []);

  // Error state
  if (error) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
            <span className="text-2xl">!</span>
          </div>
          <h2 className="text-lg font-semibold text-ivory mb-2">Erreur de chargement</h2>
          <p className="text-sm text-ivory/60 mb-4">{error}</p>
          <button
            onClick={refresh}
            className="px-4 py-2 rounded-lg bg-gold text-night font-medium hover:bg-gold/90 transition-colors"
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
  const unreadAlerts = data?.alerts?.filter((a) => !a.isRead).length || 0;

  return (
    <div className="space-y-6 overflow-x-hidden max-w-full">
      {/* Page Title (hidden but semantic) */}
      <h1 className="sr-only">Analytics Dashboard</h1>

      {/* Simulation Mode Banner */}
      {isSimulationMode && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-purple-500/30 bg-purple-500/10 px-3 sm:px-4 py-2 sm:py-3 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3"
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse flex-shrink-0" />
            <span className="text-xs sm:text-sm font-medium text-purple-300">
              Mode Simulation
            </span>
          </div>
          <span className="text-xs text-purple-300/60 ml-4 sm:ml-0">
            Données générées aléatoirement
          </span>
        </motion.div>
      )}

      {/* Command Center - Sticky Header */}
      <CommandCenter
        healthScore={data?.healthScore || 50}
        kpis={kpis}
        isLoading={isLoading}
        isRealtime={period === "realtime"}
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
            className="fixed top-24 right-4 z-50 w-48 rounded-xl border border-gold/20 bg-night/95 backdrop-blur-xl shadow-2xl overflow-hidden"
          >
            <div className="p-2">
              <button
                onClick={handleExportPDF}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-ivory hover:bg-ivory/5 transition-colors"
              >
                <FileText size={16} className="text-red-400" />
                Exporter en PDF
              </button>
              <button
                onClick={handleExportExcel}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-ivory hover:bg-ivory/5 transition-colors"
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
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowExportMenu(false)}
        />
      )}

      {/* Last Updated Indicator */}
      {lastUpdated && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-end gap-2 text-xs text-ivory/40"
        >
          <span>
            Dernière mise à jour : {lastUpdated.toLocaleTimeString("fr-FR")}
          </span>
          {period === "realtime" && (
            <motion.span
              className="flex items-center gap-1 text-green-400"
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <span className="w-2 h-2 bg-green-500 rounded-full" />
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
        {activeTab === "traffic" && (
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

        {activeTab === "engagement" && (
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

        {activeTab === "conversions" && (
          <TabContent tabId="conversions">
            <ConversionsPanel
              totalConversions={data?.totalConversions || 0}
              conversionRate={data?.conversionRate || 0}
              conversionChange={data?.conversionChange || 0}
              conversionTypes={data?.conversionTypes?.map((ct) => ({
                ...ct,
                icon:
                  ct.id === "appointment_request" ? (
                    <Calendar size={18} className="text-gold" />
                  ) : ct.id === "seminar_registration" ? (
                    <Users size={18} className="text-blue-400" />
                  ) : (
                    <Mail size={18} className="text-green-400" />
                  ),
              })) || []}
              funnelSteps={data?.funnelSteps || []}
              goals={data?.goals || []}
              isLoading={isLoading}
            />
          </TabContent>
        )}

        {activeTab === "sources" && (
          <TabContent tabId="sources">
            <SourcesPanel
              sources={data?.trafficSources || []}
              geoData={data?.geoData || []}
              directTraffic={data?.directTraffic || 0}
              organicTraffic={data?.organicTraffic || 0}
              referralTraffic={data?.referralTraffic || 0}
              socialTraffic={data?.socialTraffic || 0}
              isLoading={isLoading}
            />
          </TabContent>
        )}

        {activeTab === "seo" && (
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
      </AnimatePresence>

      {/* Insights Drawer */}
      <InsightsDrawer
        isOpen={isInsightsOpen}
        onClose={() => setIsInsightsOpen(false)}
        insights={data?.insights || []}
        alerts={data?.alerts || []}
        goals={data?.goals || []}
        isLoadingInsights={isLoading}
        onRefreshInsights={refresh}
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
