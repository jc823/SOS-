/**
 * Templates — Assessment Templates/Presets management page.
 * Save and load scoring presets for common shop archetypes.
 */
import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { useLocation, Link } from 'wouter';
import { getLoginUrl } from '@/const';
import { Button } from '@/components/ui/button';
import ThemeToggle from '@/components/ThemeToggle';
import {
  ArrowLeft, FileStack, Plus, Trash2, Copy, Loader2,
  ChevronRight, Tag,
} from 'lucide-react';

const CATEGORY_COLORS: Record<string, string> = {
  mobile: 'text-blue-400 bg-blue-500/10',
  'mid-size': 'text-purple-400 bg-purple-500/10',
  fleet: 'text-amber-400 bg-amber-500/10',
  boutique: 'text-pink-400 bg-pink-500/10',
  franchise: 'text-emerald-400 bg-emerald-500/10',
  default: 'text-muted-foreground bg-muted/20',
};

export default function Templates() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState('');

  const templatesQuery = trpc.templates.list.useQuery(undefined, { enabled: isAuthenticated });
  const createMutation = trpc.templates.create.useMutation({
    onSuccess: () => {
      templatesQuery.refetch();
      setShowCreate(false);
      setNewName('');
      setNewDesc('');
      setNewCategory('');
    },
  });
  const deleteMutation = trpc.templates.delete.useMutation({
    onSuccess: () => templatesQuery.refetch(),
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

  const templates = templatesQuery.data || [];

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
              <FileStack size={16} className="text-gold" />
              <span className="text-sm font-bold text-foreground">Assessment Templates</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button
              size="sm"
              onClick={() => setShowCreate(!showCreate)}
              className="h-8 text-xs gap-1.5 bg-gold text-black hover:bg-gold-light"
            >
              <Plus size={12} />
              New Template
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        {/* Create Form */}
        {showCreate && (
          <div className="rounded-xl border border-gold/30 bg-card p-5 space-y-4">
            <h3 className="text-sm font-bold text-foreground">Create Template</h3>
            <p className="text-xs text-muted-foreground">
              Save a scoring preset from your current assessment. Templates can be applied when starting new assessments to pre-fill scores.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Template Name</label>
                <input
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="e.g., Typical Mobile Operator"
                  className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-foreground focus:border-gold/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Category</label>
                <select
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value)}
                  className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-foreground focus:border-gold/50 focus:outline-none"
                >
                  <option value="">Select category...</option>
                  <option value="mobile">Mobile Operator</option>
                  <option value="mid-size">Mid-Size Shop</option>
                  <option value="fleet">Fleet / Volume</option>
                  <option value="boutique">Boutique / High-End</option>
                  <option value="franchise">Franchise</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Description</label>
              <textarea
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
                placeholder="Describe the typical shop this template represents..."
                rows={2}
                className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-foreground focus:border-gold/50 focus:outline-none resize-none"
              />
            </div>
            <p className="text-[10px] text-muted-foreground/60">
              Note: To save scores, run an assessment first, then use "Save as Template" from the assessment page. This form creates an empty template shell.
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => {
                  if (!newName.trim()) return;
                  createMutation.mutate({
                    name: newName.trim(),
                    description: newDesc.trim() || undefined,
                    category: newCategory || undefined,
                    scores: {},
                  });
                }}
                disabled={!newName.trim() || createMutation.isPending}
                className="h-8 text-xs bg-gold text-black hover:bg-gold-light"
              >
                {createMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : 'Create'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowCreate(false)}
                className="h-8 text-xs"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Template List */}
        {templatesQuery.isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={24} className="animate-spin text-gold" />
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center py-16">
            <FileStack size={40} className="mx-auto mb-4 text-muted-foreground/30" />
            <h3 className="text-sm font-bold text-foreground mb-1">No Templates Yet</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Create assessment templates to quickly pre-fill scores for common shop archetypes. Save time on repetitive assessments.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {templates.map((t: any) => {
              const catColor = CATEGORY_COLORS[t.category || 'default'] || CATEGORY_COLORS.default;
              const scoreCount = t.scores ? Object.keys(t.scores).length : 0;
              return (
                <div
                  key={t.id}
                  className="glass-card p-4 sm:p-5 hover:border-gold/30 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-bold text-foreground truncate">{t.name}</h3>
                        {t.category && (
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${catColor}`}>
                            {t.category}
                          </span>
                        )}
                        {t.isDefault && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-gold bg-gold/10">
                            Built-in
                          </span>
                        )}
                      </div>
                      {t.description && (
                        <p className="text-xs text-muted-foreground truncate">{t.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground/60">
                        <span>{scoreCount} scores saved</span>
                        <span>Created {new Date(t.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => { e.stopPropagation(); navigate('/assessment'); }}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-gold"
                        title="Use template"
                      >
                        <Copy size={12} />
                      </Button>
                      {!t.isDefault && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm('Delete this template?')) deleteMutation.mutate({ id: t.id });
                          }}
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-red-400"
                          title="Delete"
                        >
                          <Trash2 size={12} />
                        </Button>
                      )}
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
