/**
 * Benchmarks — Industry Benchmarks page.
 * Admin can add/edit benchmarks, customers can view how they compare.
 */
import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { useLocation, Link } from 'wouter';
import { getLoginUrl } from '@/const';
import { Button } from '@/components/ui/button';
import ThemeToggle from '@/components/ThemeToggle';
import {
  ArrowLeft, BarChart3, Plus, Trash2, Pencil, Loader2,
  TrendingUp, DollarSign, Users, Target, Star,
} from 'lucide-react';

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  revenue: <DollarSign size={14} />,
  marketing: <TrendingUp size={14} />,
  operations: <Target size={14} />,
  team: <Users size={14} />,
  reputation: <Star size={14} />,
};

const CATEGORY_COLORS: Record<string, string> = {
  revenue: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  marketing: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  operations: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  team: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  reputation: 'text-pink-400 bg-pink-500/10 border-pink-500/20',
};

export default function Benchmarks() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const isAdmin = user?.role === 'admin';
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ category: 'revenue', metric: '', label: '', value: '', unit: '$', source: '', region: 'national', shopTier: '', notes: '' });

  const benchmarksQuery = trpc.benchmarks.list.useQuery(undefined, { enabled: isAuthenticated });
  const createMutation = trpc.benchmarks.create.useMutation({
    onSuccess: () => { benchmarksQuery.refetch(); setShowAdd(false); setForm({ category: 'revenue', metric: '', label: '', value: '', unit: '$', source: '', region: 'national', shopTier: '', notes: '' }); },
  });
  const deleteMutation = trpc.benchmarks.delete.useMutation({
    onSuccess: () => benchmarksQuery.refetch(),
  });

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

  const benchmarks = benchmarksQuery.data || [];
  const grouped = benchmarks.reduce((acc: Record<string, any[]>, b: any) => {
    const cat = b.category || 'other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(b);
    return acc;
  }, {});

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
              <span className="text-sm font-bold text-foreground">Industry Benchmarks</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {isAdmin && (
              <Button
                size="sm"
                onClick={() => setShowAdd(!showAdd)}
                className="h-8 text-xs gap-1.5 bg-gold text-black hover:bg-gold-light"
              >
                <Plus size={12} />
                Add Benchmark
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        {/* Add Form (Admin only) */}
        {showAdd && isAdmin && (
          <div className="rounded-xl border border-gold/30 bg-card p-5 space-y-4">
            <h3 className="text-sm font-bold text-foreground">Add Industry Benchmark</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Category</label>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-foreground focus:border-gold/50 focus:outline-none">
                  <option value="revenue">Revenue</option>
                  <option value="marketing">Marketing</option>
                  <option value="operations">Operations</option>
                  <option value="team">Team</option>
                  <option value="reputation">Reputation</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Metric Key</label>
                <input value={form.metric} onChange={e => setForm({ ...form, metric: e.target.value })} placeholder="avg_ticket_size" className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-foreground focus:border-gold/50 focus:outline-none" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Label</label>
                <input value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} placeholder="Average Ticket Size" className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-foreground focus:border-gold/50 focus:outline-none" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Value</label>
                <input type="number" value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} placeholder="250" className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-foreground focus:border-gold/50 focus:outline-none" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Unit</label>
                <select value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-foreground focus:border-gold/50 focus:outline-none">
                  <option value="$">$</option>
                  <option value="%">%</option>
                  <option value="count">Count</option>
                  <option value="rating">Rating</option>
                  <option value="days">Days</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Source</label>
                <input value={form.source} onChange={e => setForm({ ...form, source: e.target.value })} placeholder="IDA 2025 Report" className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-foreground focus:border-gold/50 focus:outline-none" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => {
                  if (!form.metric.trim() || !form.label.trim() || !form.value) return;
                  createMutation.mutate({
                    category: form.category,
                    metric: form.metric.trim(),
                    label: form.label.trim(),
                    value: Number(form.value),
                    unit: form.unit || undefined,
                    source: form.source || undefined,
                    region: form.region || undefined,
                    shopTier: form.shopTier || undefined,
                    notes: form.notes || undefined,
                  });
                }}
                disabled={createMutation.isPending}
                className="h-8 text-xs bg-gold text-black hover:bg-gold-light"
              >
                {createMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : 'Add'}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowAdd(false)} className="h-8 text-xs">Cancel</Button>
            </div>
          </div>
        )}

        {/* Benchmark Categories */}
        {benchmarksQuery.isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={24} className="animate-spin text-gold" />
          </div>
        ) : Object.keys(grouped).length === 0 ? (
          <div className="text-center py-16">
            <BarChart3 size={40} className="mx-auto mb-4 text-muted-foreground/30" />
            <h3 className="text-sm font-bold text-foreground mb-1">No Benchmarks Yet</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {isAdmin
                ? 'Add industry benchmarks to help shops compare their performance against the market.'
                : 'Industry benchmarks will appear here once your consultant adds them.'}
            </p>
          </div>
        ) : (
          Object.entries(grouped).map(([category, items]) => {
            const colors = CATEGORY_COLORS[category] || 'text-muted-foreground bg-muted/10 border-border/20';
            const icon = CATEGORY_ICONS[category] || <BarChart3 size={14} />;
            return (
              <div key={category} className={`rounded-xl border ${colors.split(' ')[2]} bg-card overflow-hidden`}>
                <div className={`px-5 py-3 border-b ${colors.split(' ')[2]} flex items-center gap-2`}>
                  <span className={colors.split(' ')[0]}>{icon}</span>
                  <h3 className="text-sm font-bold text-foreground capitalize">{category}</h3>
                  <span className="text-[10px] text-muted-foreground ml-auto">{(items as any[]).length} metrics</span>
                </div>
                <div className="divide-y divide-white/[0.06]">
                  {(items as any[]).map((b: any) => (
                    <div key={b.id} className="px-5 py-3 flex items-center gap-4 group">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-foreground">{b.label}</div>
                        <div className="text-[10px] text-muted-foreground/60 mt-0.5">
                          {b.source && <span>{b.source}</span>}
                          {b.region && <span> · {b.region}</span>}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold font-data text-gold">
                          {b.unit === '$' ? `$${b.value.toLocaleString()}` : `${b.value}${b.unit || ''}`}
                        </span>
                      </div>
                      {isAdmin && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => { if (confirm('Delete?')) deleteMutation.mutate({ id: b.id }); }}
                          className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400"
                        >
                          <Trash2 size={12} />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </main>
    </div>
  );
}
