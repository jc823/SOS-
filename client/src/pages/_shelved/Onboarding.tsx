/**
 * Onboarding — Checklist management page.
 * Admin assigns checklists to shops, customers track progress.
 */
import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { useLocation, Link } from 'wouter';
import { getLoginUrl } from '@/const';
import { Button } from '@/components/ui/button';
import ThemeToggle from '@/components/ThemeToggle';
import {
  ArrowLeft, ClipboardList, Plus, Trash2, Loader2,
  CheckCircle2, Circle, ChevronDown, ChevronUp, Store,
} from 'lucide-react';

const DEFAULT_ITEMS = [
  { id: 'crm', title: 'Set up CRM system', description: 'Choose and configure a CRM (Urable, ServiceTitan, etc.)', category: 'Systems', daysOffset: 7 },
  { id: 'gbp', title: 'Optimize Google Business Profile', description: 'Complete all fields, add photos, set hours, enable messaging', category: 'Marketing', daysOffset: 7 },
  { id: 'website', title: 'Website audit & fixes', description: 'Implement SEO audit recommendations, fix mobile issues', category: 'Marketing', daysOffset: 14 },
  { id: 'pricing', title: 'Review & adjust pricing', description: 'Align pricing with market research and value positioning', category: 'Sales', daysOffset: 14 },
  { id: 'social', title: 'Social media content plan', description: 'Create 30-day content calendar with before/after templates', category: 'Marketing', daysOffset: 21 },
  { id: 'reviews', title: 'Review generation system', description: 'Set up automated review request flow after each service', category: 'Marketing', daysOffset: 21 },
  { id: 'followup', title: 'Customer follow-up system', description: 'Automate 7-day, 30-day, and 90-day follow-up messages', category: 'Sales', daysOffset: 30 },
  { id: 'ads', title: 'Launch first ad campaign', description: 'Google Ads or Facebook Ads based on assessment recommendations', category: 'Marketing', daysOffset: 30 },
  { id: 'sops', title: 'Document core SOPs', description: 'Write standard operating procedures for top 3 services', category: 'Operations', daysOffset: 45 },
  { id: 'training', title: 'Team training session', description: 'Train team on new systems, upselling, and customer experience', category: 'Team', daysOffset: 45 },
  { id: 'kpi', title: 'Set up KPI tracking', description: 'Define and begin tracking weekly KPIs (revenue, jobs, close rate)', category: 'Systems', daysOffset: 60 },
  { id: 'review60', title: '60-day progress review', description: 'Reassess key metrics and adjust strategy', category: 'Review', daysOffset: 60 },
];

export default function Onboarding() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const isStaff = user?.role === 'admin' || user?.role === 'user';
  const [selectedShopId, setSelectedShopId] = useState<number | null>(null);
  const [expandedChecklist, setExpandedChecklist] = useState<number | null>(null);

  const shopsQuery = trpc.shops.list.useQuery(undefined, { enabled: isAuthenticated });
  const checklistQuery = trpc.onboarding.getByShop.useQuery(
    { shopId: selectedShopId! },
    { enabled: isAuthenticated && selectedShopId !== null }
  );
  const assignMutation = trpc.onboarding.assignToShop.useMutation({
    onSuccess: () => checklistQuery.refetch(),
  });
  const updateMutation = trpc.onboarding.updateItem.useMutation({
    onSuccess: () => checklistQuery.refetch(),
  });
  const deleteMutation = trpc.onboarding.deleteChecklist.useMutation({
    onSuccess: () => checklistQuery.refetch(),
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

  const shops = shopsQuery.data || [];
  const checklists = checklistQuery.data || [];

  const handleAssignDefault = () => {
    if (!selectedShopId) return;
    const startDate = new Date();
    const items = DEFAULT_ITEMS.map(item => ({
      ...item,
      dueDate: new Date(startDate.getTime() + item.daysOffset * 86400000).toISOString().slice(0, 10),
      completedAt: null,
      completedById: null,
    }));
    assignMutation.mutate({
      shopId: selectedShopId,
      name: '30/60/90 Day Onboarding Plan',
      items,
    });
  };

  const handleToggleItem = (checklist: any, itemIndex: number) => {
    const items = [...(checklist.items as any[])];
    if (items[itemIndex].completedAt) {
      items[itemIndex] = { ...items[itemIndex], completedAt: null, completedById: null };
    } else {
      items[itemIndex] = { ...items[itemIndex], completedAt: new Date().toISOString(), completedById: user?.id };
    }
    const completed = items.filter((i: any) => i.completedAt).length;
    const progress = Math.round((completed / items.length) * 100);
    updateMutation.mutate({ checklistId: checklist.id, items, progress });
  };

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
              <ClipboardList size={16} className="text-gold" />
              <span className="text-sm font-bold text-foreground">Onboarding</span>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="container py-6 space-y-6">
        {/* Shop Selector */}
        <div className="glass-card p-5">
          <div className="flex items-center gap-3 mb-3">
            <Store size={16} className="text-gold" />
            <h3 className="text-sm font-bold text-foreground">Select Shop</h3>
          </div>
          <div className="flex gap-3">
            <select
              value={selectedShopId || ''}
              onChange={e => setSelectedShopId(e.target.value ? Number(e.target.value) : null)}
              className="flex-1 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-foreground focus:border-gold/50 focus:outline-none"
            >
              <option value="">Choose a shop...</option>
              {shops.map((s: any) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            {isStaff && selectedShopId && (
              <Button
                size="sm"
                onClick={handleAssignDefault}
                disabled={assignMutation.isPending}
                className="h-9 text-xs gap-1.5 bg-gold text-black hover:bg-gold-light"
              >
                <Plus size={12} />
                {assignMutation.isPending ? 'Creating...' : 'Assign Default Plan'}
              </Button>
            )}
          </div>
        </div>

        {/* Checklists */}
        {!selectedShopId ? (
          <div className="text-center py-12 text-muted-foreground">
            <ClipboardList size={32} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm">Select a shop to view or assign onboarding checklists.</p>
          </div>
        ) : checklistQuery.isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={24} className="animate-spin text-gold" />
          </div>
        ) : checklists.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <ClipboardList size={32} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm">No onboarding checklists assigned to this shop yet.</p>
            {isStaff && <p className="text-xs mt-1">Click "Assign Default Plan" to get started.</p>}
          </div>
        ) : (
          <div className="space-y-4">
            {checklists.map((cl: any) => {
              const items = cl.items as any[];
              const completedCount = items.filter((i: any) => i.completedAt).length;
              const isExpanded = expandedChecklist === cl.id;
              const categories = Array.from(new Set(items.map((i: any) => i.category)));

              return (
                <div key={cl.id} className="glass-card overflow-hidden">
                  {/* Header */}
                  <div
                    className="px-5 py-4 flex items-center gap-4 cursor-pointer hover:bg-white/[0.04] transition-colors"
                    onClick={() => setExpandedChecklist(isExpanded ? null : cl.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-foreground">{cl.name}</h3>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span>{completedCount}/{items.length} complete</span>
                        <span>Created {new Date(cl.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="w-24 sm:w-32">
                      <div className="flex items-center justify-between text-[10px] mb-1">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-data font-bold text-gold">{cl.progress}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted/30 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gold transition-all duration-500"
                          style={{ width: `${cl.progress}%` }}
                        />
                      </div>
                    </div>
                    {isExpanded ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
                  </div>

                  {/* Items */}
                  {isExpanded && (
                    <div className="border-t border-white/[0.06]">
                      {categories.map(cat => (
                        <div key={cat}>
                          <div className="px-5 py-2 bg-muted/10 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            {cat}
                          </div>
                          {items.filter((i: any) => i.category === cat).map((item: any, idx: number) => {
                            const realIdx = items.indexOf(item);
                            const isComplete = !!item.completedAt;
                            const isOverdue = !isComplete && item.dueDate && new Date(item.dueDate) < new Date();
                            return (
                              <div
                                key={item.id}
                                className={`px-5 py-3 flex items-start gap-3 border-b border-border/10 last:border-0 ${
                                  isComplete ? 'opacity-60' : ''
                                }`}
                              >
                                <button
                                  onClick={() => handleToggleItem(cl, realIdx)}
                                  className={`mt-0.5 shrink-0 ${isComplete ? 'text-emerald-400' : 'text-muted-foreground/40 hover:text-gold'}`}
                                >
                                  {isComplete ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                                </button>
                                <div className="flex-1 min-w-0">
                                  <div className={`text-sm ${isComplete ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                                    {item.title}
                                  </div>
                                  <div className="text-[10px] text-muted-foreground mt-0.5">{item.description}</div>
                                </div>
                                <div className="text-right shrink-0">
                                  {item.dueDate && (
                                    <span className={`text-[10px] ${isOverdue ? 'text-red-400 font-semibold' : 'text-muted-foreground/60'}`}>
                                      {isOverdue ? 'Overdue · ' : ''}{item.dueDate}
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ))}
                      {isStaff && (
                        <div className="px-5 py-3 border-t border-white/[0.06]">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => { if (confirm('Delete this checklist?')) deleteMutation.mutate({ id: cl.id }); }}
                            className="h-7 text-[10px] text-red-400 hover:text-red-300"
                          >
                            <Trash2 size={10} className="mr-1" />
                            Delete Checklist
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
