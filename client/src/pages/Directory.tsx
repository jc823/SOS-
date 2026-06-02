/**
 * Directory — Trusted Installer Directory.
 * Admin manages entries, approved users can browse.
 * Gated access with different levels (public, customer, installer).
 */
import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { useLocation, Link } from 'wouter';
import { getLoginUrl } from '@/const';
import { Button } from '@/components/ui/button';
import ThemeToggle from '@/components/ThemeToggle';
import {
  ArrowLeft, Shield, Plus, Trash2, Pencil, Loader2,
  ExternalLink, Star, MapPin, Phone, Mail, Globe,
  CheckCircle2, Lock, Search, X,
} from 'lucide-react';

const CATEGORY_OPTIONS = [
  { value: 'coating_supplier', label: 'Coating Supplier' },
  { value: 'ppf_brand', label: 'PPF Brand' },
  { value: 'crm_software', label: 'CRM Software' },
  { value: 'training', label: 'Training Provider' },
  { value: 'equipment', label: 'Equipment Supplier' },
  { value: 'marketing', label: 'Marketing Agency' },
  { value: 'insurance', label: 'Insurance Provider' },
  { value: 'accounting', label: 'Accounting / Bookkeeping' },
  { value: 'detailer', label: 'Trusted Detailer' },
  { value: 'other', label: 'Other' },
];

const CATEGORY_COLORS: Record<string, string> = {
  coating_supplier: 'text-blue-400 bg-blue-500/10',
  ppf_brand: 'text-emerald-400 bg-emerald-500/10',
  crm_software: 'text-purple-400 bg-purple-500/10',
  training: 'text-amber-400 bg-amber-500/10',
  equipment: 'text-cyan-400 bg-cyan-500/10',
  marketing: 'text-pink-400 bg-pink-500/10',
  insurance: 'text-orange-400 bg-orange-500/10',
  accounting: 'text-teal-400 bg-teal-500/10',
  detailer: 'text-gold bg-gold/10',
  other: 'text-muted-foreground bg-muted/20',
};

export default function Directory() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const isAdmin = user?.role === 'admin';
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [form, setForm] = useState({
    name: '', category: 'detailer', description: '', website: '',
    contactName: '', contactEmail: '', contactPhone: '', location: '',
    rating: '', featured: false, approved: true, accessLevel: 'customer' as const,
    tags: '', notes: '',
  });

  const directoryQuery = trpc.directory.list.useQuery(undefined, { enabled: isAuthenticated });
  const createMutation = trpc.directory.create.useMutation({
    onSuccess: () => { directoryQuery.refetch(); setShowAdd(false); },
  });
  const deleteMutation = trpc.directory.delete.useMutation({
    onSuccess: () => directoryQuery.refetch(),
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

  const entries = directoryQuery.data || [];
  const filtered = entries.filter((e: any) => {
    const matchesSearch = !filter || e.name.toLowerCase().includes(filter.toLowerCase()) || (e.description || '').toLowerCase().includes(filter.toLowerCase());
    const matchesCat = !categoryFilter || e.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const categories = Array.from(new Set(entries.map((e: any) => e.category)));

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
              <Shield size={16} className="text-gold" />
              <span className="text-sm font-bold text-foreground">Trusted Directory</span>
              <Lock size={10} className="text-muted-foreground/40" />
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
                Add Entry
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        {/* Admin Add Form */}
        {showAdd && isAdmin && (
          <div className="rounded-xl border border-gold/30 bg-card p-5 space-y-4">
            <h3 className="text-sm font-bold text-foreground">Add Directory Entry</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Name *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-foreground focus:border-gold/50 focus:outline-none" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Category *</label>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-foreground focus:border-gold/50 focus:outline-none">
                  {CATEGORY_OPTIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Website</label>
                <input value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} placeholder="https://..." className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-foreground focus:border-gold/50 focus:outline-none" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Contact Name</label>
                <input value={form.contactName} onChange={e => setForm({ ...form, contactName: e.target.value })} className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-foreground focus:border-gold/50 focus:outline-none" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Email</label>
                <input value={form.contactEmail} onChange={e => setForm({ ...form, contactEmail: e.target.value })} className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-foreground focus:border-gold/50 focus:outline-none" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Location</label>
                <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="City, State" className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-foreground focus:border-gold/50 focus:outline-none" />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Description</label>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-foreground focus:border-gold/50 focus:outline-none resize-none" />
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <input type="checkbox" checked={form.featured} onChange={e => setForm({ ...form, featured: e.target.checked })} className="rounded" />
                Featured
              </label>
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <input type="checkbox" checked={form.approved} onChange={e => setForm({ ...form, approved: e.target.checked })} className="rounded" />
                Approved
              </label>
              <select value={form.accessLevel} onChange={e => setForm({ ...form, accessLevel: e.target.value as any })} className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-2 py-1 text-xs text-foreground">
                <option value="public">Public</option>
                <option value="customer">Customer Only</option>
                <option value="installer">Installer Only</option>
              </select>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => {
                  if (!form.name.trim()) return;
                  createMutation.mutate({
                    name: form.name.trim(),
                    category: form.category,
                    description: form.description || undefined,
                    website: form.website || undefined,
                    contactName: form.contactName || undefined,
                    contactEmail: form.contactEmail || undefined,
                    location: form.location || undefined,
                    featured: form.featured,
                    approved: form.approved,
                    accessLevel: form.accessLevel,
                    tags: form.tags ? form.tags.split(',').map(t => t.trim()) : undefined,
                  });
                }}
                disabled={createMutation.isPending}
                className="h-8 text-xs bg-gold text-black hover:bg-gold-light"
              >
                {createMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : 'Add Entry'}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowAdd(false)} className="h-8 text-xs">Cancel</Button>
            </div>
          </div>
        )}

        {/* Search & Filter */}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
            <input
              value={filter}
              onChange={e => setFilter(e.target.value)}
              placeholder="Search directory..."
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-white/[0.08] bg-white/[0.03] text-sm text-foreground focus:border-gold/50 focus:outline-none"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-foreground focus:border-gold/50 focus:outline-none"
          >
            <option value="">All Categories</option>
            {CATEGORY_OPTIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>

        {/* Directory Entries */}
        {directoryQuery.isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={24} className="animate-spin text-gold" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Shield size={40} className="mx-auto mb-4 text-muted-foreground/30" />
            <h3 className="text-sm font-bold text-foreground mb-1">
              {entries.length === 0 ? 'Directory Empty' : 'No Results'}
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {entries.length === 0
                ? 'The trusted installer directory is being curated. Check back soon.'
                : 'Try adjusting your search or filter.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((entry: any) => {
              const catColor = CATEGORY_COLORS[entry.category] || CATEGORY_COLORS.other;
              return (
                <div
                  key={entry.id}
                  className={`rounded-xl border bg-card p-5 transition-all hover:border-gold/30 ${
                    entry.featured ? 'border-gold/30 ring-1 ring-gold/10' : 'border-border/30'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-foreground">{entry.name}</h3>
                        {entry.featured && <Star size={12} className="text-gold fill-gold" />}
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${catColor} inline-block mt-1`}>
                        {CATEGORY_OPTIONS.find(c => c.value === entry.category)?.label || entry.category}
                      </span>
                    </div>
                    {isAdmin && !entry.approved && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-amber-400 bg-amber-500/10">
                        Pending
                      </span>
                    )}
                  </div>

                  {entry.description && (
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{entry.description}</p>
                  )}

                  <div className="space-y-1.5 text-xs text-muted-foreground">
                    {entry.location && (
                      <div className="flex items-center gap-2">
                        <MapPin size={10} className="shrink-0" />
                        <span>{entry.location}</span>
                      </div>
                    )}
                    {entry.contactEmail && (
                      <div className="flex items-center gap-2">
                        <Mail size={10} className="shrink-0" />
                        <span>{entry.contactEmail}</span>
                      </div>
                    )}
                    {entry.website && (
                      <a
                        href={entry.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-gold hover:text-gold-light"
                      >
                        <Globe size={10} className="shrink-0" />
                        <span className="truncate">{entry.website.replace(/^https?:\/\//, '')}</span>
                        <ExternalLink size={8} />
                      </a>
                    )}
                  </div>

                  {entry.rating && (
                    <div className="flex items-center gap-1 mt-3">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={10}
                          className={i < Math.round(entry.rating) ? 'text-gold fill-gold' : 'text-muted-foreground/20'}
                        />
                      ))}
                      <span className="text-[10px] text-muted-foreground ml-1">{entry.rating.toFixed(1)}</span>
                    </div>
                  )}

                  {isAdmin && (
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/[0.06]">
                      <span className="text-[10px] text-muted-foreground/40 flex-1">
                        {entry.accessLevel} · {entry.approved ? 'approved' : 'pending'}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => { if (confirm('Delete?')) deleteMutation.mutate({ id: entry.id }); }}
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-red-400"
                      >
                        <Trash2 size={10} />
                      </Button>
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
