/**
 * CommandPalette — Global search (Cmd+K / Ctrl+K)
 * Searches across shops, assessments, SEO audits, and provides quick navigation.
 */
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import {
  Search, Store, ClipboardCheck, Globe, LayoutDashboard, Users,
  Target, ArrowRight, X, Command, FileText,
} from 'lucide-react';

interface SearchResult {
  id: string;
  type: 'shop' | 'assessment' | 'seo' | 'page';
  title: string;
  subtitle: string;
  href: string;
  icon: React.ReactNode;
}

const QUICK_ACTIONS: SearchResult[] = [
  { id: 'nav-assessment', type: 'page', title: 'New Assessment', subtitle: 'Start a new SOS assessment', href: '/assessment', icon: <ClipboardCheck size={16} /> },
  { id: 'nav-seo', type: 'page', title: 'SEO Audit', subtitle: 'Run a website SEO audit', href: '/seo', icon: <Globe size={16} /> },
  { id: 'nav-dashboard', type: 'page', title: 'Dashboard', subtitle: 'View history & analytics', href: '/dashboard', icon: <LayoutDashboard size={16} /> },
  { id: 'nav-invites', type: 'page', title: 'Customer Portal', subtitle: 'Manage invites & access', href: '/invites', icon: <Users size={16} /> },
  { id: 'nav-predictions', type: 'page', title: 'Prediction Accuracy', subtitle: 'Track algorithm accuracy', href: '/predictions', icon: <Target size={16} /> },
];

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();

  // Fetch data for search
  const shopsQuery = trpc.shops.list.useQuery(undefined, { enabled: isAuthenticated && open });
  const assessmentsQuery = trpc.assessments.list.useQuery(undefined, { enabled: isAuthenticated && open });
  const seoQuery = trpc.seo.list.useQuery(undefined, { enabled: isAuthenticated && open });

  // Keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Build search results
  const results = useMemo<SearchResult[]>(() => {
    const q = query.toLowerCase().trim();

    // Quick actions always available
    const actions = QUICK_ACTIONS.filter(a =>
      !q || a.title.toLowerCase().includes(q) || a.subtitle.toLowerCase().includes(q)
    );

    // Shop results
    const shops: SearchResult[] = (shopsQuery.data || [])
      .filter((s: any) => !q || s.name.toLowerCase().includes(q) || (s.location || '').toLowerCase().includes(q))
      .slice(0, 5)
      .map((s: any) => ({
        id: `shop-${s.id}`,
        type: 'shop' as const,
        title: s.name,
        subtitle: s.location || 'No location',
        href: `/dashboard`,
        icon: <Store size={16} />,
      }));

    // Assessment results
    const assessments: SearchResult[] = (assessmentsQuery.data || [])
      .filter((a: any) => !q || (a.shopName || '').toLowerCase().includes(q) || (a.assessorName || '').toLowerCase().includes(q))
      .slice(0, 5)
      .map((a: any) => ({
        id: `assessment-${a.id}`,
        type: 'assessment' as const,
        title: `${a.shopName || 'Unknown Shop'} — ${a.overallPercentage?.toFixed(0)}%`,
        subtitle: `${a.assessmentType === 'consultation' ? 'Consultation' : 'Assessment'} by ${a.assessorName} · ${new Date(a.createdAt).toLocaleDateString()}`,
        href: `/assessment/${a.id}`,
        icon: <FileText size={16} />,
      }));

    // SEO audit results
    const seoAudits: SearchResult[] = (seoQuery.data || [])
      .filter((s: any) => !q || (s.shopName || '').toLowerCase().includes(q) || (s.websiteUrl || '').toLowerCase().includes(q))
      .slice(0, 5)
      .map((s: any) => ({
        id: `seo-${s.id}`,
        type: 'seo' as const,
        title: s.shopName || s.websiteUrl,
        subtitle: `SEO Score: ${s.overallScore?.toFixed(0) || '—'} · ${new Date(s.createdAt).toLocaleDateString()}`,
        href: `/seo`,
        icon: <Globe size={16} />,
      }));

    if (!q) return [...actions.slice(0, 5)];
    return [...shops, ...assessments, ...seoAudits, ...actions].slice(0, 12);
  }, [query, shopsQuery.data, assessmentsQuery.data, seoQuery.data]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault();
      navigate(results[selectedIndex].href);
      setOpen(false);
    }
  }, [results, selectedIndex, navigate]);

  if (!isAuthenticated || !open) return null;

  const typeColors: Record<string, string> = {
    shop: 'text-purple-400',
    assessment: 'text-gold',
    seo: 'text-emerald-400',
    page: 'text-blue-400',
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]" onClick={() => setOpen(false)}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Palette */}
      <div
        className="relative w-full max-w-lg mx-4 rounded-xl border border-border/40 bg-card shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 border-b border-border/30">
          <Search size={16} className="text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setSelectedIndex(0); }}
            onKeyDown={handleKeyDown}
            placeholder="Search shops, assessments, tools..."
            className="flex-1 h-12 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
          />
          <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
            <X size={16} />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto py-2">
          {results.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              No results found for "{query}"
            </div>
          ) : (
            results.map((result, i) => (
              <button
                key={result.id}
                onClick={() => { navigate(result.href); setOpen(false); }}
                onMouseEnter={() => setSelectedIndex(i)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                  i === selectedIndex ? 'bg-accent' : 'hover:bg-accent/50'
                }`}
              >
                <div className={`shrink-0 ${typeColors[result.type] || 'text-muted-foreground'}`}>
                  {result.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">{result.title}</div>
                  <div className="text-xs text-muted-foreground truncate">{result.subtitle}</div>
                </div>
                <ArrowRight size={12} className="text-muted-foreground/40 shrink-0" />
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-border/30 text-[10px] text-muted-foreground/50">
          <span>Navigate with <kbd className="px-1 py-0.5 rounded bg-muted text-muted-foreground">↑↓</kbd> · Select with <kbd className="px-1 py-0.5 rounded bg-muted text-muted-foreground">↵</kbd></span>
          <span><kbd className="px-1 py-0.5 rounded bg-muted text-muted-foreground">esc</kbd> to close</span>
        </div>
      </div>
    </div>
  );
}
