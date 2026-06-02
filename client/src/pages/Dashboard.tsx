/*
 * Dashboard — Assessment History, Shop Comparisons, Outcomes, Learning Stats
 * Scale Detail Design System: dark automotive, glass cards, accent stripes,
 * Bebas Neue headers, Space Mono data figures, thin progress bars.
 */
import { useAuth } from '@/_core/hooks/useAuth';
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { getLoginUrl } from '@/const';
import { Button } from '@/components/ui/button';
import {
  Plus, LayoutDashboard, History, GitCompareArrows, Brain, LogOut,
  ChevronRight, Calendar, User, TrendingUp, TrendingDown, Minus,
  ArrowUpRight, ArrowDownRight, Store, Target, CheckCircle2, XCircle,
  AlertCircle, RefreshCw, Clock, Bell, LineChart, Search, Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'wouter';
import { getBandColor } from '@/lib/sos-engine';
import ThemeToggle from '@/components/ThemeToggle';

type Tab = 'history' | 'timeline' | 'compare' | 'learning';

export default function Dashboard() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<Tab>('history');
  const [compareA, setCompareA] = useState<number | null>(null);
  const [compareB, setCompareB] = useState<number | null>(null);
  const [selectedShopId, setSelectedShopId] = useState<number | null>(null);

  const assessmentsQuery = trpc.assessments.list.useQuery(undefined, { enabled: isAuthenticated });
  const shopsQuery = trpc.shops.list.useQuery(undefined, { enabled: isAuthenticated });
  const learningQuery = trpc.learning.stats.useQuery(undefined, { enabled: isAuthenticated && activeTab === 'learning' });
  const dueQuery = trpc.shops.dueForReassessment.useQuery({ daysThreshold: 60 }, { enabled: isAuthenticated });
  const timelineQuery = trpc.shops.timeline.useQuery(
    { shopId: selectedShopId! },
    { enabled: isAuthenticated && activeTab === 'timeline' && selectedShopId !== null }
  );
  const compareQuery = trpc.assessments.compare.useQuery(
    { assessmentIdA: compareA!, assessmentIdB: compareB! },
    { enabled: compareA !== null && compareB !== null }
  );
  const recalibrate = trpc.learning.recalibrate.useMutation();

  const averagedQuery = trpc.assessments.getAveraged.useQuery(
    { shopId: selectedShopId!, windowDays: 1 },
    { enabled: isAuthenticated && activeTab === 'timeline' && selectedShopId !== null }
  );

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

  if (user?.role === 'customer') {
    navigate('/portal');
    return null;
  }

  const assessments = assessmentsQuery.data || [];
  const shops = shopsQuery.data || [];
  const dueShops = dueQuery.data || [];

  const tabs: { id: Tab; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'history', label: 'History', icon: History },
    { id: 'timeline', label: 'Timeline', icon: LineChart },
    { id: 'compare', label: 'Compare', icon: GitCompareArrows },
    { id: 'learning', label: 'Learning', icon: Brain },
  ];

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
              SOS <span className="text-gold">Dashboard</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/seo">
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 border-border hover:border-gold/40 hover:text-gold">
                <Search size={14} />
                <span className="hidden sm:inline">SEO Audit</span>
              </Button>
            </Link>
            <Link href="/predictions">
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 border-border hover:border-gold/40 hover:text-gold">
                <Target size={14} />
                <span className="hidden sm:inline">Predictions</span>
              </Button>
            </Link>
            <Button
              onClick={() => navigate('/assessment')}
              className="h-8 text-xs gap-1.5 bg-gold text-black hover:bg-gold-light"
              size="sm"
            >
              <Plus size={14} />
              <span className="hidden sm:inline">New Assessment</span>
            </Button>
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={() => logout()} className="h-8 text-xs text-muted-foreground hover:text-destructive">
              <LogOut size={14} />
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-6 sm:py-8">
        {/* Tab Navigation */}
        <div className="flex gap-1 mb-6 p-1 rounded-lg bg-white/[0.03] border border-white/[0.06] w-full sm:w-fit overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-gold/15 text-gold border border-gold/30'
                  : 'text-muted-foreground hover:text-foreground border border-transparent'
              }`}
            >
              <tab.icon size={14} />
              {tab.label}
              {tab.id === 'history' && dueShops.length > 0 && (
                <span className="ml-1 w-5 h-5 rounded-full bg-[#E74C3C] text-white text-[9px] font-bold flex items-center justify-center animate-pulse">
                  {dueShops.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'history' && (
            <motion.div key="history" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              {/* Stats Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard label="Total Assessments" value={assessments.length} icon={<LayoutDashboard size={16} className="text-gold" />} />
                <StatCard label="Shops Assessed" value={shops.length} icon={<Store size={16} className="text-gold" />} />
                <StatCard
                  label="Avg Score"
                  value={assessments.length > 0 ? `${(assessments.reduce((s, a) => s + a.assessment.overallPercentage, 0) / assessments.length).toFixed(0)}%` : '—'}
                  icon={<Target size={16} className="text-gold" />}
                />
                <StatCard
                  label="Avg Probability"
                  value={assessments.length > 0 ? `${(assessments.reduce((s, a) => s + a.assessment.scalingProbability, 0) / assessments.length).toFixed(0)}%` : '—'}
                  icon={<TrendingUp size={16} className="text-gold" />}
                />
              </div>

              {/* Assessment List */}
              <div className="glass-card overflow-hidden p-0">
                <div className="px-4 py-3 border-b border-white/[0.06]">
                  <h3 className="text-sm tracking-wide uppercase text-foreground" style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", letterSpacing: '0.04em' }}>
                    Assessment History
                  </h3>
                </div>
                {assessments.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-sm text-muted-foreground mb-3">No assessments yet</p>
                    <Button onClick={() => navigate('/assessment')} className="bg-gold text-black hover:bg-gold-light h-9 text-xs gap-1.5">
                      <Plus size={14} /> Create First Assessment
                    </Button>
                  </div>
                ) : (
                  <div className="divide-y divide-white/[0.04]">
                    {assessments.map((a) => (
                      <AssessmentRow
                        key={a.assessment.id}
                        assessment={a.assessment}
                        shopName={a.shopName || 'Unknown'}
                        onSelect={() => navigate(`/assessment/${a.assessment.id}`)}
                        onCompare={() => {
                          if (!compareA) setCompareA(a.assessment.id);
                          else if (!compareB) {
                            setCompareB(a.assessment.id);
                            setActiveTab('compare');
                          }
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'history' && dueShops.length > 0 && (
            <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-4 mt-4 border-[#E74C3C]/30">
              <div className="flex items-center gap-2 mb-2">
                <Bell size={16} className="text-[#E74C3C]" />
                <h4 className="text-sm tracking-wide uppercase text-[#E74C3C]" style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", letterSpacing: '0.04em' }}>
                  Due for Reassessment
                </h4>
                <span className="text-[9px] text-muted-foreground ml-auto font-data uppercase tracking-wider">60+ days since last</span>
              </div>
              <div className="space-y-2">
                {dueShops.map((shop: any) => (
                  <div key={shop.shopId} className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 hover:bg-white/[0.04] transition-colors">
                    <div className="flex items-center gap-2">
                      <Store size={14} className="text-muted-foreground" />
                      <span className="text-sm font-semibold text-foreground">{shop.shopName}</span>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock size={10} />
                        Last: {shop.assessmentDate || 'Unknown'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-data text-[#E74C3C]">
                        {shop.daysSinceAssessment ? `${shop.daysSinceAssessment}d ago` : ''}
                      </span>
                      <Button
                        onClick={() => {
                          if (shop.assessmentId) {
                            navigate(`/assessment/${shop.assessmentId}`);
                          } else {
                            const shopAssessments = assessments.filter(a => a.assessment.shopId === shop.shopId);
                            if (shopAssessments.length > 0) {
                              navigate(`/assessment/${shopAssessments[0].assessment.id}`);
                            } else {
                              navigate('/assessment');
                            }
                          }
                        }}
                        size="sm"
                        className="h-7 text-[10px] gap-1 bg-gold text-black hover:bg-gold-light"
                      >
                        <RefreshCw size={10} /> Reassess
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'timeline' && (
            <motion.div key="timeline" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              {/* Shop Selector */}
              <div className="glass-card p-4">
                <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-2 block">Select Shop</label>
                <select
                  value={selectedShopId ?? ''}
                  onChange={(e) => setSelectedShopId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-foreground focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/20"
                >
                  <option value="">Choose a shop to view its timeline...</option>
                  {shops.map((s: any) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              {selectedShopId && timelineQuery.isLoading && (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto" />
                </div>
              )}
              {selectedShopId && timelineQuery.data && (
                <>
                  {averagedQuery.data?.isAveraged && (
                    <div className="glass-card p-4 border-gold/30">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center">
                          <Users size={16} className="text-gold" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-bold text-gold">Multi-Assessor Average</h4>
                          <p className="text-[10px] text-muted-foreground">
                            {averagedQuery.data.assessorCount} assessors scored this shop within 24 hours: {averagedQuery.data.assessorNames.join(', ')}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="font-data text-lg font-bold text-gold">
                            {averagedQuery.data.overallPercentage.toFixed(0)}%
                          </div>
                          <div className="text-[10px] text-muted-foreground font-data">
                            {averagedQuery.data.scalingProbability.toFixed(0)}% prob (avg)
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  <ShopTimeline data={timelineQuery.data} onViewAssessment={(id) => navigate(`/assessment/${id}`)} />
                </>
              )}
              {!selectedShopId && (
                <div className="glass-card p-8 text-center">
                  <LineChart size={32} className="text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Select a shop above to view its score progression over time.</p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'compare' && (
            <motion.div key="compare" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <CompareSelector
                  label="Assessment A (Baseline)"
                  selectedId={compareA}
                  assessments={assessments}
                  onSelect={setCompareA}
                />
                <CompareSelector
                  label="Assessment B (Current)"
                  selectedId={compareB}
                  assessments={assessments}
                  onSelect={setCompareB}
                />
              </div>

              {compareQuery.data && (
                <ComparisonResults data={compareQuery.data} />
              )}
              {compareA && compareB && compareQuery.isLoading && (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto" />
                </div>
              )}
              {(!compareA || !compareB) && (
                <div className="glass-card p-8 text-center">
                  <GitCompareArrows size={32} className="text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Select two assessments above to compare them side-by-side.</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Compare the same shop over time, or different shops against each other.</p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'learning' && (
            <motion.div key="learning" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              <LearningPanel
                stats={learningQuery.data}
                isLoading={learningQuery.isLoading}
                onRecalibrate={async () => {
                  const res = await recalibrate.mutateAsync();
                  if (res.success) {
                    toast.success(res.message);
                    learningQuery.refetch();
                  } else {
                    toast.error(res.message);
                  }
                }}
                isRecalibrating={recalibrate.isPending}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

// ─── Sub-components ───

function StatCard({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) {
  return (
    <div className="glass-card p-3 sm:p-4">
      <div className="flex items-center gap-2 mb-1.5">
        {icon}
        <span className="text-[9px] text-muted-foreground uppercase tracking-widest">{label}</span>
      </div>
      <span className="font-data text-lg sm:text-xl font-bold text-foreground">{value}</span>
    </div>
  );
}

function AssessmentRow({
  assessment,
  shopName,
  onSelect,
  onCompare,
}: {
  assessment: any;
  shopName: string;
  onSelect: () => void;
  onCompare: () => void;
}) {
  const bandColor = getBandColor(assessment.overallBand || 'red');
  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.04] transition-colors group">
      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: bandColor }} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground truncate">{shopName}</span>
          {assessment.assessmentType === 'consultation' && (
            <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-400 shrink-0">Consultation</span>
          )}
          <span className="text-[10px] text-muted-foreground/60 shrink-0 font-data">#{assessment.id}</span>
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Calendar size={10} /> {assessment.assessmentDate}
          </span>
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            <User size={10} /> {assessment.assessorName}
          </span>
        </div>
      </div>
      <div className="text-right shrink-0">
        <div className="font-data text-sm font-bold" style={{ color: bandColor }}>
          {assessment.overallPercentage?.toFixed(0) ?? 0}%
        </div>
        <div className="text-[10px] text-muted-foreground font-data">
          {assessment.scalingProbability?.toFixed(0) ?? 0}% prob
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="sm" onClick={onCompare} className="h-7 text-[10px] px-2 text-muted-foreground hover:text-gold">
          Compare
        </Button>
        <Button variant="ghost" size="sm" onClick={onSelect} className="h-7 w-7 p-0 text-muted-foreground hover:text-gold">
          <ChevronRight size={14} />
        </Button>
      </div>
    </div>
  );
}

function CompareSelector({
  label,
  selectedId,
  assessments,
  onSelect,
}: {
  label: string;
  selectedId: number | null;
  assessments: any[];
  onSelect: (id: number) => void;
}) {
  return (
    <div className="glass-card p-4">
      <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-2 block">{label}</label>
      <select
        value={selectedId ?? ''}
        onChange={(e) => onSelect(Number(e.target.value))}
        className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-foreground focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/20"
      >
        <option value="">Select an assessment...</option>
        {assessments.map((a) => (
          <option key={a.assessment.id} value={a.assessment.id}>
            #{a.assessment.id} — {a.shopName || 'Unknown'} ({a.assessment.assessmentDate}) — {a.assessment.overallPercentage?.toFixed(0)}%
          </option>
        ))}
      </select>
    </div>
  );
}

function ComparisonResults({ data }: { data: any }) {
  const { assessmentA, assessmentB, changes } = data;
  const isImproved = changes.overallDelta > 0;

  return (
    <div className="space-y-4">
      {/* Overall Delta */}
      <div className="glass-card p-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-center">
          <div>
            <p className="text-[9px] text-muted-foreground uppercase tracking-widest mb-1">Baseline</p>
            <p className="font-data text-2xl font-bold text-foreground">{assessmentA.overallPercentage?.toFixed(0)}%</p>
            <p className="text-xs text-muted-foreground">{assessmentA.shopName} · {assessmentA.date}</p>
          </div>
          <div className="flex flex-col items-center justify-center">
            <div className={`flex items-center gap-1 text-lg font-bold font-data ${isImproved ? 'text-[#2ECC71]' : changes.overallDelta < 0 ? 'text-[#E74C3C]' : 'text-muted-foreground'}`}>
              {isImproved ? <ArrowUpRight size={20} /> : changes.overallDelta < 0 ? <ArrowDownRight size={20} /> : <Minus size={20} />}
              {Math.abs(changes.overallDelta).toFixed(1)}%
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">Score Change</p>
            <div className={`flex items-center gap-1 text-xs mt-1 font-data ${changes.probabilityDelta > 0 ? 'text-[#2ECC71]' : changes.probabilityDelta < 0 ? 'text-[#E74C3C]' : 'text-muted-foreground'}`}>
              {changes.probabilityDelta > 0 ? '+' : ''}{changes.probabilityDelta.toFixed(1)}% prob
            </div>
          </div>
          <div>
            <p className="text-[9px] text-muted-foreground uppercase tracking-widest mb-1">Current</p>
            <p className="font-data text-2xl font-bold text-foreground">{assessmentB.overallPercentage?.toFixed(0)}%</p>
            <p className="text-xs text-muted-foreground">{assessmentB.shopName} · {assessmentB.date}</p>
          </div>
        </div>
      </div>

      {/* Pillar Deltas */}
      <div className="glass-card p-4">
        <h4 className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Pillar Changes</h4>
        <div className="space-y-2">
          {changes.pillarDeltas?.map((pd: any) => (
            <div key={pd.pillarId} className="flex items-center gap-3">
              <span className="text-xs text-foreground w-20 shrink-0 font-semibold">{pd.label}</span>
              <div className="flex-1 h-[3px] bg-white/[0.06] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.max(5, pd.percentageB)}%`,
                    backgroundColor: pd.delta > 0 ? '#2ECC71' : pd.delta < 0 ? '#E74C3C' : '#C8962E',
                  }}
                />
              </div>
              <span className="font-data text-xs w-12 text-right" style={{ color: pd.delta > 0 ? '#2ECC71' : pd.delta < 0 ? '#E74C3C' : '#999' }}>
                {pd.delta > 0 ? '+' : ''}{pd.delta?.toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Improved / Regressed */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="glass-card p-4 border-[#2ECC71]/20">
          <h4 className="text-[9px] font-bold text-[#2ECC71] uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <TrendingUp size={14} /> Improved ({changes.improved?.length || 0})
          </h4>
          <div className="space-y-1.5">
            {(changes.improved || []).slice(0, 8).map((d: any) => (
              <div key={d.id} className="flex items-center justify-between text-xs">
                <span className="text-foreground truncate">{d.id.replace(/_/g, ' ')}</span>
                <span className="font-data text-[#2ECC71] shrink-0 ml-2">+{d.delta}</span>
              </div>
            ))}
            {(changes.improved?.length || 0) === 0 && <p className="text-xs text-muted-foreground">No improvements</p>}
          </div>
        </div>
        <div className="glass-card p-4 border-[#E74C3C]/20">
          <h4 className="text-[9px] font-bold text-[#E74C3C] uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <TrendingDown size={14} /> Regressed ({changes.regressed?.length || 0})
          </h4>
          <div className="space-y-1.5">
            {(changes.regressed || []).slice(0, 8).map((d: any) => (
              <div key={d.id} className="flex items-center justify-between text-xs">
                <span className="text-foreground truncate">{d.id.replace(/_/g, ' ')}</span>
                <span className="font-data text-[#E74C3C] shrink-0 ml-2">{d.delta}</span>
              </div>
            ))}
            {(changes.regressed?.length || 0) === 0 && <p className="text-xs text-muted-foreground">No regressions</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function LearningPanel({
  stats,
  isLoading,
  onRecalibrate,
  isRecalibrating,
}: {
  stats: any;
  isLoading: boolean;
  onRecalibrate: () => void;
  isRecalibrating: boolean;
}) {
  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Assessments" value={stats?.totalAssessments ?? 0} icon={<LayoutDashboard size={16} className="text-gold" />} />
        <StatCard label="Outcomes Logged" value={stats?.totalOutcomes ?? 0} icon={<CheckCircle2 size={16} className="text-gold" />} />
        <StatCard label="Adjustments Made" value={stats?.adjustmentsMade ?? 0} icon={<Brain size={16} className="text-gold" />} />
        <StatCard
          label="Avg Confidence"
          value={stats?.averageConfidence ? `${(stats.averageConfidence * 100).toFixed(0)}%` : '—'}
          icon={<Target size={16} className="text-gold" />}
        />
      </div>

      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Algorithm Insights</h4>
          <Button
            onClick={onRecalibrate}
            disabled={isRecalibrating || (stats?.totalOutcomes ?? 0) < 3}
            size="sm"
            className="h-7 text-[10px] gap-1 bg-gold text-black hover:bg-gold-light disabled:opacity-40"
          >
            <RefreshCw size={12} className={isRecalibrating ? 'animate-spin' : ''} />
            {isRecalibrating ? 'Recalibrating...' : 'Recalibrate'}
          </Button>
        </div>
        <div className="space-y-2">
          {(stats?.insights || []).map((insight: string, i: number) => (
            <div key={i} className="flex items-start gap-2 text-xs">
              <AlertCircle size={14} className="text-gold shrink-0 mt-0.5" />
              <span className="text-muted-foreground">{insight}</span>
            </div>
          ))}
        </div>
      </div>

      {(stats?.recentAdjustments?.length ?? 0) > 0 && (
        <div className="glass-card p-4">
          <h4 className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Recent Adjustments</h4>
          <div className="space-y-2">
            {stats.recentAdjustments.map((adj: any) => (
              <div key={adj.id} className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-foreground capitalize">{adj.adjustmentType?.replace(/_/g, ' ')}</span>
                  <span className="text-[10px] text-muted-foreground font-data">{adj.confidence ? `${(adj.confidence * 100).toFixed(0)}% confidence` : ''}</span>
                </div>
                <p className="text-[11px] text-muted-foreground">{adj.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="glass-card p-4 border-gold/20">
        <h4 className="text-[9px] font-bold text-gold uppercase tracking-widest mb-2">How the Learning Engine Works</h4>
        <div className="space-y-1.5 text-[11px] text-muted-foreground">
          <p>1. <strong className="text-foreground">Assess shops</strong> — Score all 30 subcategories during your visit.</p>
          <p>2. <strong className="text-foreground">Log outcomes</strong> — After 3–6 months, record whether the shop hit their revenue target.</p>
          <p>3. <strong className="text-foreground">Recalibrate</strong> — With 3+ outcomes, the algorithm analyzes patterns and adjusts probability curves.</p>
          <p>4. <strong className="text-foreground">Get smarter</strong> — Over time, the system learns which subcategories are most predictive of success at each revenue tier.</p>
        </div>
      </div>
    </div>
  );
}

function ShopTimeline({ data, onViewAssessment }: { data: any; onViewAssessment: (id: number) => void }) {
  const assessments = data.assessments || [];
  if (assessments.length === 0) {
    return (
      <div className="glass-card p-8 text-center">
        <LineChart size={32} className="text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">No assessments found for this shop yet.</p>
      </div>
    );
  }

  const maxScore = 100;
  const chartHeight = 200;

  return (
    <div className="space-y-4">
      {/* Shop Header */}
      <div className="glass-card p-4 relative overflow-hidden">
        <div className="absolute left-0 top-4 bottom-4 w-[3px] rounded-full bg-gold" />
        <div className="flex items-center gap-3 pl-3">
          <Store size={20} className="text-gold" />
          <div>
            <h3 className="text-base text-foreground tracking-wide uppercase" style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", letterSpacing: '0.04em' }}>
              {data.shopName}
            </h3>
            <p className="text-xs text-muted-foreground font-data">{assessments.length} assessment{assessments.length !== 1 ? 's' : ''} on record</p>
          </div>
        </div>
      </div>

      {/* Visual Timeline Chart */}
      <div className="glass-card p-4 sm:p-5">
        <h4 className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-4">Score Progression</h4>
        <div className="relative" style={{ height: chartHeight + 40 }}>
          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 bottom-8 w-8 flex flex-col justify-between text-[9px] font-data text-muted-foreground">
            <span>100%</span>
            <span>75%</span>
            <span>50%</span>
            <span>25%</span>
            <span>0%</span>
          </div>

          {/* Grid lines */}
          <div className="absolute left-10 right-0 top-0" style={{ height: chartHeight }}>
            {[0, 25, 50, 75, 100].map(v => (
              <div
                key={v}
                className="absolute w-full border-t border-white/[0.04]"
                style={{ top: `${100 - v}%` }}
              />
            ))}
            <div className="absolute w-full bg-[#E74C3C]/5" style={{ top: '40%', height: '60%' }} />
            <div className="absolute w-full bg-[#D4A843]/5" style={{ top: '20%', height: '20%' }} />
            <div className="absolute w-full bg-[#2ECC71]/5" style={{ top: '0%', height: '20%' }} />
          </div>

          {/* Data points and lines */}
          <div className="absolute left-10 right-0 top-0" style={{ height: chartHeight }}>
            <svg className="w-full h-full" preserveAspectRatio="none" viewBox={`0 0 ${Math.max(assessments.length - 1, 1) * 100} ${chartHeight}`}>
              {assessments.length > 1 && (
                <polyline
                  fill="none"
                  stroke="#C8962E"
                  strokeWidth="2"
                  strokeLinejoin="round"
                  points={assessments.map((a: any, i: number) => {
                    const x = i * 100;
                    const y = chartHeight - (a.overallPercentage / maxScore) * chartHeight;
                    return `${x},${y}`;
                  }).join(' ')}
                />
              )}
              {assessments.length > 1 && (
                <polyline
                  fill="none"
                  stroke="#C8962E"
                  strokeWidth="1"
                  strokeDasharray="4,4"
                  strokeOpacity="0.4"
                  strokeLinejoin="round"
                  points={assessments.map((a: any, i: number) => {
                    const x = i * 100;
                    const y = chartHeight - (a.scalingProbability / maxScore) * chartHeight;
                    return `${x},${y}`;
                  }).join(' ')}
                />
              )}
              {assessments.map((a: any, i: number) => {
                const x = i * 100;
                const y = chartHeight - (a.overallPercentage / maxScore) * chartHeight;
                return (
                  <circle
                    key={a.id}
                    cx={x}
                    cy={y}
                    r="5"
                    fill="#C8962E"
                    stroke="#0D0D0D"
                    strokeWidth="2"
                    className="cursor-pointer"
                    onClick={() => onViewAssessment(a.id)}
                  />
                );
              })}
            </svg>
          </div>

          {/* X-axis labels */}
          <div className="absolute left-10 right-0 flex justify-between" style={{ top: chartHeight + 8 }}>
            {assessments.map((a: any, i: number) => (
              <div key={a.id} className="text-center" style={{ width: assessments.length === 1 ? '100%' : undefined }}>
                <span className="text-[9px] font-data text-muted-foreground">{a.assessmentDate}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 pt-3 border-t border-white/[0.06]">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 bg-gold rounded" />
            <span className="text-[10px] text-muted-foreground">SOS Score</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 bg-gold/40 rounded" style={{ borderTop: '1px dashed' }} />
            <span className="text-[10px] text-muted-foreground">Scaling Probability</span>
          </div>
        </div>
      </div>

      {/* Assessment Cards */}
      <div className="glass-card overflow-hidden p-0">
        <div className="px-4 py-3 border-b border-white/[0.06]">
          <h4 className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Assessment History</h4>
        </div>
        <div className="divide-y divide-white/[0.04]">
          {assessments.map((a: any, i: number) => {
            const prev = i < assessments.length - 1 ? assessments[i + 1] : null;
            const delta = prev ? a.overallPercentage - prev.overallPercentage : null;
            const bandColor = getBandColor(a.overallBand || 'red');
            return (
              <div
                key={a.id}
                className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.04] transition-colors cursor-pointer"
                onClick={() => onViewAssessment(a.id)}
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold font-data" style={{ backgroundColor: `${bandColor}15`, color: bandColor }}>
                  #{i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">{a.assessmentDate}</span>
                    <span className="text-[10px] text-muted-foreground">by {a.assessorName}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-[10px] text-muted-foreground font-data">Tier: {a.revenueTier}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-data text-sm font-bold" style={{ color: bandColor }}>
                    {a.overallPercentage?.toFixed(0)}%
                  </div>
                  {delta !== null && (
                    <div className={`text-[10px] font-data font-semibold ${delta > 0 ? 'text-[#2ECC71]' : delta < 0 ? 'text-[#E74C3C]' : 'text-muted-foreground'}`}>
                      {delta > 0 ? `▲ +${delta.toFixed(1)}%` : delta < 0 ? `▼ ${delta.toFixed(1)}%` : '— no change'}
                    </div>
                  )}
                </div>
                <ChevronRight size={14} className="text-muted-foreground shrink-0" />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
