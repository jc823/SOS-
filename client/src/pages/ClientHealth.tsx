/**
 * ClientHealth — Traffic-light dashboard showing all active clients at a glance.
 * Green/Yellow/Red status per shop, days since last assessment, overdue alerts.
 */
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { useLocation, Link } from 'wouter';
import { getLoginUrl } from '@/const';
import { Button } from '@/components/ui/button';
import ThemeToggle from '@/components/ThemeToggle';
import {
  ArrowLeft, Store, Clock, AlertTriangle, CheckCircle2,
  TrendingUp, TrendingDown, Minus, RefreshCw, Loader2,
  ArrowRight, BarChart3,
} from 'lucide-react';

function getHealthColor(score: number): { bg: string; text: string; label: string; ring: string } {
  if (score >= 70) return { bg: 'bg-emerald-500/10', text: 'text-emerald-400', label: 'Healthy', ring: 'ring-emerald-500/30' };
  if (score >= 45) return { bg: 'bg-amber-500/10', text: 'text-amber-400', label: 'Needs Attention', ring: 'ring-amber-500/30' };
  return { bg: 'bg-red-500/10', text: 'text-red-400', label: 'Critical', ring: 'ring-red-500/30' };
}

function daysSince(date: string | Date): number {
  return Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
}

export default function ClientHealth() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  const shopsQuery = trpc.shops.list.useQuery(undefined, { enabled: isAuthenticated });
  const assessmentsQuery = trpc.assessments.list.useQuery(undefined, { enabled: isAuthenticated });

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-gold" />
      </div>
    );
  }

  if (!isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  const shops = shopsQuery.data || [];
  const assessments = assessmentsQuery.data || [];

  // Build shop health data
  const shopHealth = shops.map(shop => {
    const shopAssessments = assessments
      .filter((a: any) => a.assessment.shopId === shop.id && a.assessment.assessmentType !== 'consultation')
      .sort((a: any, b: any) => new Date(b.assessment.createdAt).getTime() - new Date(a.assessment.createdAt).getTime());

    const latest = shopAssessments[0];
    const previous = shopAssessments[1];
    const days = latest ? daysSince(latest.assessment.createdAt) : null;
    const isOverdue = days !== null && days > 60;
    const score = latest?.assessment.overallPercentage || 0;
    const prevScore = previous?.assessment.overallPercentage || null;
    const trend = prevScore !== null ? score - prevScore : null;

    return { shop, latest, previous, days, isOverdue, score, prevScore, trend, assessmentCount: shopAssessments.length };
  }).sort((a, b) => {
    // Overdue first, then by score ascending (worst first)
    if (a.isOverdue && !b.isOverdue) return -1;
    if (!a.isOverdue && b.isOverdue) return 1;
    return a.score - b.score;
  });

  const overdueCount = shopHealth.filter(s => s.isOverdue).length;
  const criticalCount = shopHealth.filter(s => s.score < 45 && s.score > 0).length;
  const healthyCount = shopHealth.filter(s => s.score >= 70).length;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <Link href="/">
              <button className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-sm">
                <ArrowLeft size={16} />
                <span className="hidden sm:inline">Back</span>
              </button>
            </Link>
            <div className="h-5 w-px bg-border/40" />
            <div className="flex items-center gap-2">
              <BarChart3 size={16} className="text-gold" />
              <span className="text-sm font-bold text-foreground">Client Health</span>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="container py-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="glass-card p-4 text-center">
            <div className="text-2xl font-bold text-foreground">{shops.length}</div>
            <div className="text-xs text-muted-foreground mt-1">Total Shops</div>
          </div>
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-center">
            <div className="text-2xl font-bold text-emerald-400">{healthyCount}</div>
            <div className="text-xs text-muted-foreground mt-1">Healthy (70%+)</div>
          </div>
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-center">
            <div className="text-2xl font-bold text-red-400">{criticalCount}</div>
            <div className="text-xs text-muted-foreground mt-1">Critical (&lt;45%)</div>
          </div>
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-center">
            <div className="text-2xl font-bold text-amber-400">{overdueCount}</div>
            <div className="text-xs text-muted-foreground mt-1">Overdue (60+ days)</div>
          </div>
        </div>

        {/* Shop Cards */}
        {shopsQuery.isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={24} className="animate-spin text-gold" />
          </div>
        ) : shopHealth.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Store size={32} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm">No shops found. Run an assessment to get started.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {shopHealth.map(({ shop, latest, days, isOverdue, score, trend, assessmentCount }) => {
              const health = getHealthColor(score);
              return (
                <div
                  key={shop.id}
                  className={`rounded-xl border bg-card p-4 sm:p-5 transition-all hover:border-gold/30 cursor-pointer ${
                    isOverdue ? 'border-amber-500/40' : 'border-border/30'
                  }`}
                  onClick={() => navigate(`/dashboard`)}
                >
                  <div className="flex items-center gap-4">
                    {/* Health indicator */}
                    <div className={`w-12 h-12 rounded-xl ${health.bg} ring-1 ${health.ring} flex items-center justify-center shrink-0`}>
                      <span className={`text-lg font-bold font-mono ${health.text}`}>
                        {score > 0 ? score.toFixed(0) : '—'}
                      </span>
                    </div>

                    {/* Shop info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-bold text-foreground truncate">{shop.name}</h3>
                        {isOverdue && (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-semibold shrink-0">
                            <AlertTriangle size={10} />
                            Overdue
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {shop.location && <span>{shop.location}</span>}
                        <span>{assessmentCount} assessment{assessmentCount !== 1 ? 's' : ''}</span>
                        {days !== null && (
                          <span className="flex items-center gap-1">
                            <Clock size={10} />
                            {days}d ago
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Trend */}
                    <div className="flex items-center gap-2 shrink-0">
                      {trend !== null && (
                        <div className={`flex items-center gap-1 text-xs font-mono ${
                          trend > 0 ? 'text-emerald-400' : trend < 0 ? 'text-red-400' : 'text-muted-foreground'
                        }`}>
                          {trend > 0 ? <TrendingUp size={14} /> : trend < 0 ? <TrendingDown size={14} /> : <Minus size={14} />}
                          {trend > 0 ? '+' : ''}{trend.toFixed(1)}%
                        </div>
                      )}
                      <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${health.bg} ${health.text}`}>
                        {health.label}
                      </span>
                      <ArrowRight size={14} className="text-muted-foreground/30" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
