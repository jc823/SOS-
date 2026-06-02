/**
 * SalesArena — Live dashboard showing Scale's sales rep performance
 * Scale Detail Design System: dark automotive, glass cards, accent stripes,
 * Bebas Neue headers, Space Mono data figures, thin progress bars.
 */
import { useAuth } from '@/_core/hooks/useAuth';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useLocation, Link } from 'wouter';
import { trpc } from '@/lib/trpc';
import { getLoginUrl } from '@/const';
import { Button } from '@/components/ui/button';
import {
  DollarSign, TrendingUp, TrendingDown, Users, Store, RefreshCw,
  Minus, Clock, Award, Zap, BarChart3,
  Target, Activity, LogOut, Loader2, AlertCircle, CheckCircle2,
  MapPin, Search,
} from 'lucide-react';
import { toast } from 'sonner';
import ThemeToggle from '@/components/ThemeToggle';

function formatCurrency(n: number): string {
  if (n >= 10000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatCurrencyFull(n: number): string {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function getGradeColor(grade: string): string {
  switch (grade) {
    case 'A': return 'text-emerald-400';
    case 'B': return 'text-blue-400';
    case 'C': return 'text-amber-400';
    case 'D': return 'text-orange';
    case 'F': return 'text-red-400';
    default: return 'text-muted-foreground';
  }
}

function getGradeBorder(grade: string): string {
  switch (grade) {
    case 'A': return 'border-emerald-400/40';
    case 'B': return 'border-blue-400/40';
    case 'C': return 'border-amber-400/40';
    case 'D': return 'border-orange/40';
    case 'F': return 'border-red-400/40';
    default: return 'border-border';
  }
}

function getHealthBarColor(score: number): string {
  if (score >= 80) return 'bg-emerald-400';
  if (score >= 60) return 'bg-blue-400';
  if (score >= 40) return 'bg-amber-400';
  if (score >= 20) return 'bg-orange';
  return 'bg-red-400';
}

function TrendIcon({ trend }: { trend: string }) {
  if (trend === 'up') return <TrendingUp size={14} className="text-emerald-400" />;
  if (trend === 'down') return <TrendingDown size={14} className="text-red-400" />;
  return <Minus size={14} className="text-muted-foreground" />;
}

export default function SalesArena() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [, navigate] = useLocation();
  const [syncing, setSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<any>(null);

  const liveQuery = trpc.salesData.liveOverview.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 60000,
  });

  const syncMutation = trpc.salesData.syncFromArena.useMutation({
    onSuccess: (result) => {
      setLastSyncResult(result);
      if (result.success) {
        toast.success(`Synced: ${result.salesDataIds.length} records, ${result.teamSnapshotIds.length} snapshots`);
      } else {
        toast.error(`Sync completed with errors: ${result.errors.join(', ')}`);
      }
      setSyncing(false);
      liveQuery.refetch();
    },
    onError: (err) => {
      toast.error(`Sync failed: ${err.message}`);
      setSyncing(false);
    },
  });

  const handleSync = () => {
    setSyncing(true);
    syncMutation.mutate();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  const data = liveQuery.data;
  const overview = data?.data;
  const connected = data?.connected ?? false;
  const isAdmin = user?.role === 'admin';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <Link href="/">
              <img
                src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663344377985/bstGyXVcPKnASnnU.png"
                alt="Scale Detailing"
                className="h-7 w-auto cursor-pointer hover:opacity-80 transition-opacity"
              />
            </Link>
            <div className="h-5 w-px bg-border hidden sm:block" />
            <span className="hidden sm:inline text-sm tracking-wider text-foreground" style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", letterSpacing: '0.08em' }}>
              Sales <span className="text-gold">Arena</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* Connection status */}
            <div className="flex items-center gap-1.5 mr-2">
              <div className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
              <span className="text-[10px] text-muted-foreground hidden sm:inline font-data uppercase tracking-wider">
                {connected ? 'Live' : 'Offline'}
              </span>
            </div>
            {isAdmin && (
              <Button
                onClick={handleSync}
                disabled={syncing}
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5 border-border hover:border-gold/40 hover:text-gold"
              >
                <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
                <span className="hidden sm:inline">{syncing ? 'Syncing...' : 'Sync Now'}</span>
              </Button>
            )}
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={() => logout()} className="h-8 text-xs text-muted-foreground hover:text-destructive">
              <LogOut size={14} />
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* Loading State */}
        {liveQuery.isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin text-gold mr-3" />
            <span className="text-muted-foreground">Connecting to Sales Arena...</span>
          </div>
        )}

        {/* Error State */}
        {liveQuery.isError && (
          <div className="glass-card p-6 text-center border-red-400/30">
            <AlertCircle size={24} className="text-red-400 mx-auto mb-2" />
            <p className="text-sm text-red-400 font-medium">Failed to connect to Sales Arena</p>
            <p className="text-xs text-muted-foreground mt-1">{liveQuery.error?.message}</p>
            <Button onClick={() => liveQuery.refetch()} variant="outline" size="sm" className="mt-3">
              Retry
            </Button>
          </div>
        )}

        {/* Disconnected State */}
        {!liveQuery.isLoading && !liveQuery.isError && !connected && (
          <div className="glass-card p-6 text-center border-amber-400/30">
            <AlertCircle size={24} className="text-amber-400 mx-auto mb-2" />
            <p className="text-sm text-amber-400 font-medium">Sales Arena API not responding</p>
            <p className="text-xs text-muted-foreground mt-1">Check that the API URL and key are configured correctly.</p>
          </div>
        )}

        {/* Connected — Show Data */}
        {connected && overview && (
          <>
            {/* Page Title — left-aligned, accent stripe */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="accent-stripe">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl text-foreground leading-none" style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", letterSpacing: '0.05em' }}>
                  Sales <span className="text-gold">Arena</span>
                </h1>
                <p className="text-sm text-muted-foreground mt-2">
                  Live performance data — Scale's reps closing deals for client shops
                </p>
                {overview.generatedAt && (
                  <p className="text-[10px] text-muted-foreground/50 mt-1 font-data">
                    Last updated: {new Date(overview.generatedAt).toLocaleString()}
                  </p>
                )}
              </div>
            </motion.div>

            {/* ─── Team Summary Cards ─── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                {
                  icon: <DollarSign size={16} />,
                  iconColor: 'text-gold',
                  iconBg: 'bg-gold/10',
                  label: 'All-Time Revenue',
                  value: formatCurrency(overview.summary.totalAllTimeRevenue),
                  sub: `${overview.summary.totalAllTimeSales} deals closed`,
                  valueColor: 'text-gold',
                },
                {
                  icon: <TrendingUp size={16} />,
                  iconColor: 'text-emerald-400',
                  iconBg: 'bg-emerald-400/10',
                  label: 'This Month',
                  value: formatCurrency(overview.summary.currentMonthRevenue),
                  sub: `${overview.summary.currentMonthSales} deals`,
                  trend: overview.forecasts.teamMonthlyTrend,
                  valueColor: 'text-foreground',
                },
                {
                  icon: <Activity size={16} />,
                  iconColor: 'text-blue-400',
                  iconBg: 'bg-blue-400/10',
                  label: 'This Week',
                  value: formatCurrency(overview.summary.currentWeekRevenue),
                  sub: `${overview.summary.currentWeekSales} deals`,
                  trend: overview.forecasts.teamWeeklyTrend,
                  valueColor: 'text-foreground',
                },
                {
                  icon: <Target size={16} />,
                  iconColor: 'text-purple-400',
                  iconBg: 'bg-purple-400/10',
                  label: 'Avg Deal Size',
                  value: formatCurrencyFull(overview.repAnalytics.teamTotals.avgDealSize),
                  sub: `across ${overview.repAnalytics.sellers.length} reps`,
                  valueColor: 'text-foreground',
                },
              ].map((card, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 + i * 0.05 }}
                  className="glass-card p-4"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-8 h-8 rounded-lg ${card.iconBg} flex items-center justify-center ${card.iconColor}`}>
                      {card.icon}
                    </div>
                    <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-medium">{card.label}</span>
                  </div>
                  <p className={`text-xl sm:text-2xl font-bold font-data ${card.valueColor}`}>
                    {card.value}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                    {card.sub}
                    {card.trend && (
                      <span className="inline-flex items-center gap-0.5 ml-1">
                        <TrendIcon trend={card.trend} /> {card.trend}
                      </span>
                    )}
                  </p>
                </motion.div>
              ))}
            </div>

            {/* ─── Revenue Forecast ─── */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="glass-card p-5 sm:p-6 border-gold/20"
            >
              <div className="flex items-center gap-2 mb-4">
                <Zap size={16} className="text-gold" />
                <h2 className="section-heading text-lg sm:text-xl" style={{ border: 'none', padding: 0 }}>
                  Revenue Forecast
                </h2>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-muted-foreground mb-1">Projected Week End</p>
                  <p className="text-lg sm:text-xl font-bold text-gold font-data">{formatCurrency(overview.forecasts.teamProjectedWeekEndRevenue)}</p>
                  <p className="text-[10px] text-muted-foreground font-data">{overview.forecasts.teamProjectedWeekEndDeals} deals</p>
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-muted-foreground mb-1">Projected Month End</p>
                  <p className="text-lg sm:text-xl font-bold text-gold font-data">{formatCurrency(overview.forecasts.teamProjectedMonthEndRevenue)}</p>
                  <p className="text-[10px] text-muted-foreground font-data">{overview.forecasts.teamProjectedMonthEndDeals} deals</p>
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-muted-foreground mb-1">Avg Weekly Revenue</p>
                  <p className="text-lg sm:text-xl font-bold text-foreground font-data">{formatCurrency(overview.forecasts.teamAvgWeeklyRevenue)}</p>
                  <p className="text-[10px] text-muted-foreground">historical avg</p>
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-muted-foreground mb-1">Avg Monthly Revenue</p>
                  <p className="text-lg sm:text-xl font-bold text-foreground font-data">{formatCurrency(overview.forecasts.teamAvgMonthlyRevenue)}</p>
                  <p className="text-[10px] text-muted-foreground">historical avg</p>
                </div>
              </div>
            </motion.div>

            {/* ─── Rep Performance ─── */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="accent-stripe mb-4">
                <h2 className="text-xl sm:text-2xl text-foreground" style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", letterSpacing: '0.05em' }}>
                  Rep Performance
                </h2>
                <p className="text-[10px] text-muted-foreground mt-0.5">Scale's sales reps closing deals for client shops</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {overview.repAnalytics.sellers.map((seller: any, i: number) => {
                  const forecast = overview.forecasts.sellers.find((s: any) => s.seller === seller.name);
                  const isFirst = i === 0;
                  return (
                    <div
                      key={seller.name}
                      className="glass-card p-5 relative overflow-hidden"
                    >
                      {/* Subtle left accent */}
                      <div className={`absolute left-0 top-4 bottom-4 w-[3px] rounded-full ${isFirst ? 'bg-gold' : 'bg-blue-400'}`} />

                      {/* Rep Header */}
                      <div className="flex items-center justify-between mb-4 pl-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-data font-bold text-sm ${
                            isFirst ? 'bg-gold/15 text-gold' : 'bg-blue-400/15 text-blue-400'
                          }`}>
                            {seller.name.charAt(0)}
                          </div>
                          <div>
                            <h3 className="text-base font-semibold text-foreground tracking-wide uppercase" style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", letterSpacing: '0.04em', fontSize: '1.1rem' }}>
                              {seller.name}
                            </h3>
                            <p className="text-[10px] text-muted-foreground font-data">
                              Active {seller.activeSinceWeeks}w · Best day: {seller.bestDay}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-lg font-bold font-data ${isFirst ? 'text-gold' : 'text-foreground'}`}>{formatCurrency(seller.totalRevenue)}</p>
                          <p className="text-[10px] text-muted-foreground font-data">{seller.totalDeals} deals</p>
                        </div>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-3 gap-2 pl-3">
                        {[
                          { label: 'Avg Deal', value: formatCurrencyFull(seller.avgDealSize) },
                          { label: 'This Week', value: formatCurrency(seller.currentWeekRevenue) },
                          { label: 'This Month', value: formatCurrency(seller.currentMonthRevenue) },
                          { label: 'Best Week', value: formatCurrency(seller.bestWeekRevenue) },
                          { label: 'Top Source', value: seller.topSource, noMono: true },
                          { label: 'Best Hour', value: seller.bestHour },
                        ].map((stat) => (
                          <div key={stat.label} className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-2.5">
                            <p className="text-[8px] uppercase tracking-widest text-muted-foreground mb-0.5">{stat.label}</p>
                            <p className={`text-sm font-bold text-foreground ${stat.noMono ? '' : 'font-data'} truncate`}>{stat.value}</p>
                          </div>
                        ))}
                      </div>

                      {/* Forecast */}
                      {forecast && (
                        <div className="mt-3 pt-3 border-t border-white/[0.06] pl-3">
                          <p className="text-[8px] uppercase tracking-widest text-muted-foreground mb-2">Forecast</p>
                          <div className="grid grid-cols-4 gap-2">
                            <div>
                              <p className="text-[8px] text-muted-foreground uppercase">Proj. Week</p>
                              <p className="text-xs font-bold text-foreground font-data">{formatCurrency(forecast.projectedWeekEndRevenue)}</p>
                            </div>
                            <div>
                              <p className="text-[8px] text-muted-foreground uppercase">Proj. Month</p>
                              <p className="text-xs font-bold text-foreground font-data">{formatCurrency(forecast.projectedMonthEndRevenue)}</p>
                            </div>
                            <div>
                              <p className="text-[8px] text-muted-foreground uppercase">Week Pace</p>
                              <p className={`text-xs font-bold font-data ${forecast.weeklyPacePercent >= 100 ? 'text-emerald-400' : 'text-amber-400'}`}>
                                {forecast.weeklyPacePercent.toFixed(0)}%
                              </p>
                            </div>
                            <div>
                              <p className="text-[8px] text-muted-foreground uppercase">Month Pace</p>
                              <p className={`text-xs font-bold font-data ${forecast.monthlyPacePercent >= 100 ? 'text-emerald-400' : 'text-amber-400'}`}>
                                {forecast.monthlyPacePercent.toFixed(0)}%
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* ─── Client Shop Health ─── */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              <div className="accent-stripe mb-4">
                <h2 className="text-xl sm:text-2xl text-foreground" style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", letterSpacing: '0.05em' }}>
                  Client Shop Health
                </h2>
                <p className="text-[10px] text-muted-foreground mt-0.5">Revenue generated by Scale's reps for each shop</p>
              </div>

              <div className="space-y-2">
                {overview.shopHealth.map((shop: any, idx: number) => (
                  <motion.div
                    key={shop.shopId}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + idx * 0.025 }}
                    className="glass-card p-4 hover:bg-white/[0.04] transition-colors"
                  >
                    <div className="flex items-start sm:items-center justify-between gap-3 flex-col sm:flex-row">
                      {/* Shop Info */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center shrink-0 ${getGradeBorder(shop.grade)} bg-white/[0.02]`}>
                          <span className={`text-lg font-bold font-data ${getGradeColor(shop.grade)}`}>{shop.grade}</span>
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-semibold text-foreground truncate tracking-wide uppercase" style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", letterSpacing: '0.03em' }}>
                            {shop.shopName}
                          </h4>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                            {shop.locationLabel && (
                              <span className="flex items-center gap-0.5">
                                <MapPin size={10} /> {shop.locationLabel}
                              </span>
                            )}
                            {shop.assignedSeller && (
                              <span className="flex items-center gap-0.5">
                                <Users size={10} /> {shop.assignedSeller}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Shop Stats */}
                      <div className="flex items-center gap-4 sm:gap-6 w-full sm:w-auto">
                        <div className="text-center">
                          <p className="text-xs font-bold text-gold font-data">{formatCurrency(shop.totalRevenue)}</p>
                          <p className="text-[8px] text-muted-foreground uppercase tracking-wider">revenue</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs font-bold text-foreground font-data">{shop.totalDeals}</p>
                          <p className="text-[8px] text-muted-foreground uppercase tracking-wider">deals</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs font-bold text-foreground font-data">{formatCurrencyFull(shop.avgDealSize)}</p>
                          <p className="text-[8px] text-muted-foreground uppercase tracking-wider">avg deal</p>
                        </div>
                        <div className="text-center">
                          <p className={`text-xs font-bold font-data ${shop.daysSinceLastSale <= 3 ? 'text-emerald-400' : shop.daysSinceLastSale <= 7 ? 'text-amber-400' : 'text-red-400'}`}>
                            {shop.daysSinceLastSale}d
                          </p>
                          <p className="text-[8px] text-muted-foreground uppercase tracking-wider">last sale</p>
                        </div>
                      </div>
                    </div>

                    {/* Thin progress bar — 3px height */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[8px] text-muted-foreground uppercase tracking-wider">Health Score</span>
                        <span className="text-[10px] font-bold text-foreground font-data">{shop.healthScore}/100</span>
                      </div>
                      <div className="progress-bar-thin">
                        <div
                          className={`fill ${getHealthBarColor(shop.healthScore)}`}
                          style={{ width: `${shop.healthScore}%` }}
                        />
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 text-[8px] text-muted-foreground font-data">
                        <span>Freq: {shop.frequencyScore}</span>
                        <span>Deal: {shop.dealSizeScore}</span>
                        <span>Growth: {shop.growthScore}</span>
                        <span>Recency: {shop.recencyScore}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* ─── Sync Status (Admin Only) ─── */}
            {isAdmin && lastSyncResult && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-4"
              >
                <div className="flex items-center gap-2 mb-3">
                  {lastSyncResult.success ? (
                    <CheckCircle2 size={16} className="text-emerald-400" />
                  ) : (
                    <AlertCircle size={16} className="text-amber-400" />
                  )}
                  <h3 className="text-sm font-semibold text-foreground tracking-wide uppercase" style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", letterSpacing: '0.04em' }}>
                    Last Sync Result
                  </h3>
                  <span className="text-[10px] text-muted-foreground ml-auto font-data">
                    {new Date(lastSyncResult.timestamp).toLocaleString()}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <p className="text-[8px] text-muted-foreground uppercase tracking-wider">Sales Records</p>
                    <p className="font-bold text-foreground font-data">{lastSyncResult.salesDataIds.length}</p>
                  </div>
                  <div>
                    <p className="text-[8px] text-muted-foreground uppercase tracking-wider">Team Snapshots</p>
                    <p className="font-bold text-foreground font-data">{lastSyncResult.teamSnapshotIds.length}</p>
                  </div>
                  <div>
                    <p className="text-[8px] text-muted-foreground uppercase tracking-wider">Shops Tracked</p>
                    <p className="font-bold text-foreground font-data">{lastSyncResult.shopHealthCount}</p>
                  </div>
                  <div>
                    <p className="text-[8px] text-muted-foreground uppercase tracking-wider">Errors</p>
                    <p className={`font-bold font-data ${lastSyncResult.errors.length > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                      {lastSyncResult.errors.length}
                    </p>
                  </div>
                </div>
                {lastSyncResult.errors.length > 0 && (
                  <div className="mt-2 p-2 rounded-lg bg-red-400/5 border border-red-400/20">
                    <p className="text-[10px] text-red-400 font-data">
                      {lastSyncResult.errors.join(' | ')}
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
