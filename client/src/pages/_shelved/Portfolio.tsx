/**
 * Portfolio — Aggregate analytics dashboard showing Scale's total impact.
 * Admin-only view of all shops, total revenue growth, average improvements.
 */
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { useLocation, Link } from 'wouter';
import { getLoginUrl } from '@/const';
import { Button } from '@/components/ui/button';
import ThemeToggle from '@/components/ThemeToggle';
import {
  ArrowLeft, PieChart, Loader2, Store, ClipboardCheck,
  TrendingUp, Target, Users, MessageSquare,
} from 'lucide-react';

export default function Portfolio() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  const statsQuery = trpc.portfolio.stats.useQuery(undefined, { enabled: isAuthenticated });

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

  const stats = statsQuery.data;

  const cards = [
    { label: 'Total Shops Managed', value: stats?.totalShops || 0, icon: <Store size={20} />, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Assessments Completed', value: stats?.totalAssessments || 0, icon: <ClipboardCheck size={20} />, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Consultations Run', value: stats?.totalConsultations || 0, icon: <MessageSquare size={20} />, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { label: 'Average SOS Score', value: `${stats?.avgScore || 0}%`, icon: <Target size={20} />, color: 'text-gold', bg: 'bg-gold/10' },
    { label: 'Avg Score Improvement', value: `${stats?.avgImprovement && stats.avgImprovement > 0 ? '+' : ''}${stats?.avgImprovement || 0}%`, icon: <TrendingUp size={20} />, color: stats?.avgImprovement && stats.avgImprovement > 0 ? 'text-emerald-400' : 'text-muted-foreground', bg: stats?.avgImprovement && stats.avgImprovement > 0 ? 'bg-emerald-500/10' : 'bg-muted/10' },
  ];

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
              <PieChart size={16} className="text-gold" />
              <span className="text-sm font-bold text-foreground">Portfolio Analytics</span>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="container py-6 space-y-6">
        {/* Hero Stats */}
        {statsQuery.isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={24} className="animate-spin text-gold" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {cards.map((card, i) => (
                <div
                  key={i}
                  className="glass-card p-6 flex items-center gap-4"
                >
                  <div className={`w-12 h-12 rounded-xl ${card.bg} flex items-center justify-center shrink-0 ${card.color}`}>
                    {card.icon}
                  </div>
                  <div>
                    <div className="text-2xl font-bold font-data text-foreground">{card.value}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{card.label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Placeholder for future charts */}
            <div className="glass-card p-8 text-center">
              <PieChart size={40} className="mx-auto mb-4 text-muted-foreground/20" />
              <h3 className="text-sm font-bold text-foreground mb-1">Detailed Analytics Coming Soon</h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Revenue growth tracking, score improvement trends, client retention rates, and ROI calculations will be available here as more assessment data is collected.
              </p>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
