/**
 * SEO Audit Tool — Admin page with nine tabs:
 * 1. Website Audit (automated - homepage)
 * 2. Full Site Crawl (automated - all pages)
 * 3. Local SEO Checklist (manual)
 * 4. Keyword Analysis (automated)
 * 5. Competitors (enhanced - LLM)
 * 6. GBP Audit (enhanced - LLM)
 * 7. Content Gaps (enhanced - LLM)
 * 8. Reviews (enhanced - LLM)
 * 9. Citations (enhanced - LLM)
 */
import { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import ThemeToggle from '@/components/ThemeToggle';
import {
  Globe, Search, MapPin, CheckCircle2, XCircle, AlertTriangle,
  Loader2, ChevronDown, ChevronUp, ExternalLink, BarChart3,
  ClipboardCheck, Target, ArrowLeft, Layers, FileSearch,
  Users, Building2, FileText, Star, Sparkles, Plus, Trash2,
} from 'lucide-react';
import { Link } from 'wouter';
import { CompetitorPanel, GBPPanel, ContentGapPanel, ReviewPanel, CitationPanel } from '@/components/SeoEnhancedPanels';

type TabId = 'audit' | 'crawl' | 'checklist' | 'keywords' | 'competitors' | 'gbp' | 'content' | 'reviews' | 'citations';
type CheckStatus = 'pass' | 'warn' | 'fail';

interface SeoCheck {
  id: string;
  category: string;
  label: string;
  status: CheckStatus;
  value: string;
  recommendation: string;
  weight: number;
}

interface KeywordMatch {
  keyword: string;
  foundIn: {
    title: boolean;
    metaDescription: boolean;
    h1: boolean;
    h2: boolean;
    bodyContent: boolean;
    urlSlug: boolean;
    imageAlts: boolean;
  };
  density: number;
  occurrences: number;
}

interface LocalSeoItem {
  id: string;
  category: string;
  label: string;
  description: string;
  status: CheckStatus;
  weight: number;
}

interface PageAudit {
  url: string;
  score: number;
  statusCode: number;
  fetchTimeMs: number;
  checks: SeoCheck[];
  error?: string;
}

interface FullSiteResult {
  baseUrl: string;
  totalPages: number;
  pagesAudited?: number;
  averageScore: number;
  pages: PageAudit[];
  siteWideChecks?: SeoCheck[];
  siteWideIssues?: string[];
  crawlTimeMs: number;
}

// ─── Status Badge ───
function StatusBadge({ status }: { status: CheckStatus }) {
  if (status === 'pass') return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">
      <CheckCircle2 size={12} /> Pass
    </span>
  );
  if (status === 'warn') return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full">
      <AlertTriangle size={12} /> Warning
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-400 bg-red-400/10 px-2 py-0.5 rounded-full">
      <XCircle size={12} /> Fail
    </span>
  );
}

// ─── Score Ring ───
function ScoreRing({ score, size = 80, label }: { score: number; size?: number; label: string }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 70 ? '#34d399' : score >= 40 ? '#fbbf24' : '#f87171';

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={4} className="text-border/20" />
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={4}
            strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
            className="transition-all duration-700" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-data text-lg font-bold" style={{ color }}>{score}</span>
        </div>
      </div>
      <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{label}</span>
    </div>
  );
}

// ─── Page Score Bar ───
function PageScoreBar({ page, isExpanded, onToggle }: { page: PageAudit; isExpanded: boolean; onToggle: () => void }) {
  const color = page.score >= 70 ? 'bg-emerald-400' : page.score >= 40 ? 'bg-amber-400' : 'bg-red-400';
  const textColor = page.score >= 70 ? 'text-emerald-400' : page.score >= 40 ? 'text-amber-400' : 'text-red-400';
  const passCount = page.checks.filter(c => c.status === 'pass').length;
  const warnCount = page.checks.filter(c => c.status === 'warn').length;
  const failCount = page.checks.filter(c => c.status === 'fail').length;

  let pagePath = '/';
  try {
    const u = new URL(page.url);
    pagePath = u.pathname || '/';
  } catch { pagePath = page.url; }

  return (
    <div className="glass-card overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-4 hover:bg-white/[0.04] transition-colors"
      >
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-data text-sm font-bold ${
          page.score >= 70 ? 'bg-emerald-400/10 text-emerald-400' :
          page.score >= 40 ? 'bg-amber-400/10 text-amber-400' :
          'bg-red-400/10 text-red-400'
        }`}>
          {page.score}
        </div>
        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground truncate">{pagePath}</span>
            {page.error && <span className="text-[10px] text-red-400 bg-red-400/10 px-1.5 py-0.5 rounded">Error</span>}
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-[10px] text-muted-foreground">{page.fetchTimeMs}ms</span>
            <span className="text-[10px] text-emerald-400">{passCount} pass</span>
            {warnCount > 0 && <span className="text-[10px] text-amber-400">{warnCount} warn</span>}
            {failCount > 0 && <span className="text-[10px] text-red-400">{failCount} fail</span>}
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 w-32">
          <div className="flex-1 h-2 rounded-full bg-muted/20 overflow-hidden">
            <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${page.score}%` }} />
          </div>
          <span className={`font-data text-xs font-bold ${textColor}`}>{page.score}%</span>
        </div>
        {isExpanded ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
      </button>

      {isExpanded && (
        <div className="border-t border-white/[0.06] p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <a href={page.url} target="_blank" rel="noopener noreferrer" className="text-gold hover:underline flex items-center gap-1">
              {page.url} <ExternalLink size={10} />
            </a>
          </div>
          {['fail', 'warn', 'pass'].map(status => {
            const filtered = page.checks.filter(c => c.status === status);
            if (filtered.length === 0) return null;
            return (
              <div key={status} className="space-y-1.5">
                <h4 className={`text-[10px] font-bold uppercase tracking-wider ${
                  status === 'fail' ? 'text-red-400' : status === 'warn' ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {status === 'fail' ? 'Issues' : status === 'warn' ? 'Warnings' : 'Passing'}
                  {' '}({filtered.length})
                </h4>
                {filtered.map(check => (
                  <div key={check.id} className="flex items-start gap-2 py-1.5">
                    <div className="mt-0.5">
                      {check.status === 'pass' ? <CheckCircle2 size={12} className="text-emerald-400" /> :
                       check.status === 'warn' ? <AlertTriangle size={12} className="text-amber-400" /> :
                       <XCircle size={12} className="text-red-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-medium text-foreground">{check.label}</span>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{check.value}</p>
                      {check.recommendation && check.status !== 'pass' && (
                        <p className="text-[10px] text-amber-400/80 mt-0.5">→ {check.recommendation}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function SeoAudit() {
  const [activeTab, setActiveTab] = useState<TabId>('audit');

  // ─── Audit form state ───
  const [url, setUrl] = useState('');
  const [city, setCity] = useState('');
  const [areas, setAreas] = useState('');
  const [customKw, setCustomKw] = useState('');
  const [shopName, setShopName] = useState('');
  const [competitorUrls, setCompetitorUrls] = useState<string[]>(['']);

  // ─── Audit results ───
  const [auditResult, setAuditResult] = useState<any>(null);
  const [currentAuditId, setCurrentAuditId] = useState<number | null>(null);

  // ─── Enhanced audit results ───
  const [enhancedResults, setEnhancedResults] = useState<{
    gbp: any | null;
    review: any | null;
    citation: any | null;
    contentGap: any | null;
    competitor: any | null;
  } | null>(null);
  const [enhancedLoading, setEnhancedLoading] = useState(false);
  const [enhancedError, setEnhancedError] = useState<string | null>(null);

  // ─── Local SEO checklist state ───
  const [checklist, setChecklist] = useState<LocalSeoItem[]>([]);
  const [checklistLoaded, setChecklistLoaded] = useState(false);

  // ─── Expanded categories ───
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());

  // ─── Expanded pages (for full crawl) ───
  const [expandedPages, setExpandedPages] = useState<Set<number>>(new Set());

  // ─── History ───
  const [showHistory, setShowHistory] = useState(false);

  // ─── tRPC mutations/queries ───
  const runAuditMutation = trpc.seo.runAudit.useMutation();
  const runEnhancedMutation = trpc.seo.runEnhancedAudit.useMutation();
  const saveChecklistMutation = trpc.seo.saveLocalChecklist.useMutation();
  const checklistTemplate = trpc.seo.getChecklistTemplate.useQuery(undefined, { enabled: checklistLoaded === false });
  const auditHistory = trpc.seo.list.useQuery(undefined, { enabled: showHistory });
  const utils = trpc.useUtils();

  // Load checklist template
  if (checklistTemplate.data && !checklistLoaded) {
    setChecklist(checklistTemplate.data as LocalSeoItem[]);
    setChecklistLoaded(true);
  }

  // ─── Competitor URL management ───
  const addCompetitorUrl = () => {
    if (competitorUrls.length < 5) {
      setCompetitorUrls([...competitorUrls, '']);
    }
  };
  const removeCompetitorUrl = (index: number) => {
    setCompetitorUrls(competitorUrls.filter((_, i) => i !== index));
  };
  const updateCompetitorUrl = (index: number, value: string) => {
    const updated = [...competitorUrls];
    updated[index] = value;
    setCompetitorUrls(updated);
  };

  const handleRunAudit = async () => {
    if (!url.trim()) return;
    const result = await runAuditMutation.mutateAsync({
      websiteUrl: url.trim(),
      city: city.trim() || undefined,
      surroundingAreas: areas.trim() ? areas.split(',').map(a => a.trim()).filter(Boolean) : undefined,
      customKeywords: customKw.trim() ? customKw.split(',').map(k => k.trim()).filter(Boolean) : undefined,
      shopName: shopName.trim() || undefined,
    });
    setAuditResult(result);
    setCurrentAuditId(result.id);
    setExpandedPages(new Set());
    setEnhancedResults(null);
    setEnhancedError(null);
    utils.seo.list.invalidate();
  };

  const handleRunEnhancedAudit = async () => {
    if (!currentAuditId || !url.trim() || !shopName.trim() || !city.trim()) return;
    setEnhancedLoading(true);
    setEnhancedError(null);
    try {
      const validCompetitors = competitorUrls.filter(u => u.trim().length > 0);
      const result = await runEnhancedMutation.mutateAsync({
        auditId: currentAuditId,
        websiteUrl: url.trim(),
        shopName: shopName.trim(),
        city: city.trim(),
        competitorUrls: validCompetitors.length > 0 ? validCompetitors : undefined,
      });
      setEnhancedResults(result);
    } catch (err: any) {
      setEnhancedError(err.message || 'Enhanced audit failed');
    } finally {
      setEnhancedLoading(false);
    }
  };

  const handleSaveChecklist = async () => {
    if (!currentAuditId) return;
    await saveChecklistMutation.mutateAsync({
      auditId: currentAuditId,
      checklist,
    });
    utils.seo.list.invalidate();
  };

  const toggleChecklistItem = (id: string) => {
    setChecklist(prev => prev.map(item => {
      if (item.id !== id) return item;
      const nextStatus: CheckStatus = item.status === 'fail' ? 'pass' : item.status === 'pass' ? 'warn' : 'fail';
      return { ...item, status: nextStatus };
    }));
  };

  const toggleCategory = (cat: string) => {
    setExpandedCats(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat); else next.add(cat);
      return next;
    });
  };

  const togglePage = (idx: number) => {
    setExpandedPages(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });
  };

  // Group checks by category
  const websiteChecks: SeoCheck[] = auditResult?.websiteAudit?.checks || [];
  const checksByCategory = useMemo(() => {
    const map: Record<string, SeoCheck[]> = {};
    for (const check of websiteChecks) {
      if (!map[check.category]) map[check.category] = [];
      map[check.category].push(check);
    }
    return map;
  }, [websiteChecks]);

  // Group checklist by category
  const checklistByCategory = useMemo(() => {
    const map: Record<string, LocalSeoItem[]> = {};
    for (const item of checklist) {
      if (!map[item.category]) map[item.category] = [];
      map[item.category].push(item);
    }
    return map;
  }, [checklist]);

  // Calculate local SEO score
  const localSeoScore = useMemo(() => {
    let totalWeight = 0;
    let earnedWeight = 0;
    for (const item of checklist) {
      totalWeight += item.weight;
      if (item.status === 'pass') earnedWeight += item.weight;
      else if (item.status === 'warn') earnedWeight += item.weight * 0.5;
    }
    return totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 0;
  }, [checklist]);

  // Full site crawl data
  const fullSiteData: FullSiteResult | null = auditResult?.fullSiteAudit || null;

  // Sort pages: worst scores first
  const sortedPages = useMemo(() => {
    if (!fullSiteData?.pages) return [];
    return [...fullSiteData.pages].sort((a, b) => a.score - b.score);
  }, [fullSiteData]);

  // Site-wide stats
  const siteStats = useMemo(() => {
    if (!fullSiteData?.pages) return null;
    const pages = fullSiteData.pages;
    const totalFails = pages.reduce((sum, p) => sum + p.checks.filter(c => c.status === 'fail').length, 0);
    const totalWarns = pages.reduce((sum, p) => sum + p.checks.filter(c => c.status === 'warn').length, 0);
    const totalPasses = pages.reduce((sum, p) => sum + p.checks.filter(c => c.status === 'pass').length, 0);
    const worstPage = pages.reduce((worst, p) => p.score < worst.score ? p : worst, pages[0]);
    const bestPage = pages.reduce((best, p) => p.score > best.score ? p : best, pages[0]);
    return { totalFails, totalWarns, totalPasses, worstPage, bestPage };
  }, [fullSiteData]);

  // Keyword results
  const keywordResults: KeywordMatch[] = auditResult?.keywordAnalysis?.keywords || [];
  const missingHighValue: string[] = auditResult?.keywordAnalysis?.missingHighValue || [];

  // Can run enhanced audit?
  const canRunEnhanced = currentAuditId !== null && shopName.trim().length > 0 && city.trim().length > 0;

  // ─── Tab definitions ───
  const baseTabs: { id: TabId; label: string; icon: React.ReactNode; badge?: number; enhanced?: boolean }[] = [
    { id: 'audit', label: 'Homepage', icon: <Globe size={14} /> },
    { id: 'crawl', label: 'Full Site', icon: <Layers size={14} />, badge: fullSiteData?.totalPages },
    { id: 'checklist', label: 'Local SEO', icon: <ClipboardCheck size={14} /> },
    { id: 'keywords', label: 'Keywords', icon: <Target size={14} /> },
  ];

  const enhancedTabs: { id: TabId; label: string; icon: React.ReactNode; badge?: number; enhanced?: boolean }[] = [
    { id: 'competitors', label: 'Competitors', icon: <Users size={14} />, enhanced: true },
    { id: 'gbp', label: 'GBP', icon: <MapPin size={14} />, enhanced: true },
    { id: 'content', label: 'Content', icon: <FileText size={14} />, enhanced: true },
    { id: 'reviews', label: 'Reviews', icon: <Star size={14} />, enhanced: true },
    { id: 'citations', label: 'Citations', icon: <Building2 size={14} />, enhanced: true },
  ];

  const allTabs = [...baseTabs, ...enhancedTabs];

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
                className="h-5 sm:h-7 w-auto shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
              />
            </Link>
            <div className="h-5 w-px bg-border/40" />
            <div className="flex items-center gap-2">
              <Search size={16} className="text-gold" />
              <span className="text-sm font-bold text-foreground">SEO Audit Tool</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHistory(!showHistory)}
              className="h-8 text-xs gap-1.5 border-border/40"
            >
              <BarChart3 size={12} />
              History
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        {/* Input Form */}
        <div className="glass-card p-5 space-y-4">
          <h2 className="text-base font-bold text-foreground">Run SEO Analysis</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="text-xs text-muted-foreground mb-1 block">Website URL *</label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example-detailing.com"
                className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/20"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Shop Name</label>
              <input
                type="text"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder="Mike's Detail Shop"
                className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/20"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Austin"
                className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/20"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Surrounding Areas <span className="text-muted-foreground/40">(comma-separated)</span></label>
              <input
                type="text"
                value={areas}
                onChange={(e) => setAreas(e.target.value)}
                placeholder="Round Rock, Cedar Park, Georgetown"
                className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/20"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Extra Keywords <span className="text-muted-foreground/40">(comma-separated)</span></label>
              <input
                type="text"
                value={customKw}
                onChange={(e) => setCustomKw(e.target.value)}
                placeholder="window tint, paint correction"
                className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/20"
              />
            </div>
          </div>

          {/* Competitor URLs */}
          <div className="border-t border-white/[0.06] pt-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Users size={14} className="text-gold" />
                <label className="text-xs text-muted-foreground font-medium">Competitor URLs <span className="text-muted-foreground/40">(for enhanced audit, up to 5)</span></label>
              </div>
              {competitorUrls.length < 5 && (
                <button
                  onClick={addCompetitorUrl}
                  className="text-[10px] text-gold hover:text-gold-light flex items-center gap-1 transition-colors"
                >
                  <Plus size={10} /> Add
                </button>
              )}
            </div>
            <div className="space-y-2">
              {competitorUrls.map((compUrl, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={compUrl}
                    onChange={(e) => updateCompetitorUrl(idx, e.target.value)}
                    placeholder={`https://competitor${idx + 1}.com`}
                    className="flex-1 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/20"
                  />
                  {competitorUrls.length > 1 && (
                    <button
                      onClick={() => removeCompetitorUrl(idx)}
                      className="text-muted-foreground hover:text-red-400 transition-colors p-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={handleRunAudit}
              disabled={!url.trim() || runAuditMutation.isPending}
              className="h-10 px-6 text-sm gap-2 bg-gold text-black hover:bg-gold-light disabled:opacity-40"
            >
              {runAuditMutation.isPending ? (
                <><Loader2 size={16} className="animate-spin" /> Crawling Site... (this may take 15-30s)</>
              ) : (
                <><FileSearch size={16} /> Run Full Site Audit</>
              )}
            </Button>
            <Button
              onClick={handleRunEnhancedAudit}
              disabled={!canRunEnhanced || enhancedLoading}
              variant="outline"
              className="h-10 px-6 text-sm gap-2 border-gold/40 text-gold hover:bg-gold/10 disabled:opacity-40"
            >
              {enhancedLoading ? (
                <><Loader2 size={16} className="animate-spin" /> Running AI Analysis... (30-60s)</>
              ) : (
                <><Sparkles size={16} /> Run Enhanced Audit</>
              )}
            </Button>
          </div>
          {!canRunEnhanced && currentAuditId && (
            <p className="text-[10px] text-muted-foreground">Fill in Shop Name and City to enable Enhanced Audit</p>
          )}
          {runAuditMutation.isError && (
            <p className="text-xs text-red-400">Error: {runAuditMutation.error.message}</p>
          )}
          {enhancedError && (
            <p className="text-xs text-red-400">Enhanced audit error: {enhancedError}</p>
          )}
        </div>

        {/* Results */}
        {auditResult && (
          <>
            {/* Score Overview */}
            <div className="rounded-xl border border-gold/20 bg-gold/5 p-5">
              <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8">
                <ScoreRing score={auditResult.websiteScore ?? 0} size={80} label="Homepage" />
                {fullSiteData && (
                  <ScoreRing score={Math.round(fullSiteData.averageScore)} size={80} label={`Site (${fullSiteData.totalPages}pg)`} />
                )}
                <ScoreRing score={localSeoScore} size={80} label="Local SEO" />
                {auditResult.keywordScore !== null && (
                  <ScoreRing score={auditResult.keywordScore ?? 0} size={80} label="Keywords" />
                )}

                {/* Enhanced scores */}
                {enhancedResults?.gbp && (
                  <ScoreRing score={enhancedResults.gbp.score} size={80} label="GBP" />
                )}
                {enhancedResults?.contentGap && (
                  <ScoreRing score={enhancedResults.contentGap.score} size={80} label="Content" />
                )}
                {enhancedResults?.review && (
                  <ScoreRing score={enhancedResults.review.score} size={80} label="Reviews" />
                )}
                {enhancedResults?.citation && (
                  <ScoreRing score={enhancedResults.citation.score} size={80} label="Citations" />
                )}
                {enhancedResults?.competitor && (
                  <ScoreRing score={enhancedResults.competitor.shopData.score} size={80} label="vs Comp." />
                )}

                <div className="h-16 w-px bg-border/30 hidden sm:block" />
                <div className="text-center">
                  <div className="font-data text-3xl font-bold text-gold">
                    {Math.round(
                      (auditResult.websiteScore ?? 0) * 0.35 +
                      localSeoScore * 0.35 +
                      (auditResult.keywordScore ?? 0) * 0.30
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">Overall</span>
                </div>
              </div>
            </div>

            {/* Tabs — two rows on mobile */}
            <div className="space-y-1">
              {/* Base tabs */}
              <div className="flex gap-1 p-1 rounded-lg bg-muted/20 border border-border/20 overflow-x-auto">
                {baseTabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-md text-xs font-semibold transition-all ${
                      activeTab === tab.id
                        ? 'bg-gold/10 text-gold border border-gold/30'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {tab.icon}
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className="sm:hidden">{tab.label.slice(0, 4)}</span>
                    {tab.badge && (
                      <span className="text-[10px] bg-gold/20 text-gold px-1.5 py-0.5 rounded-full font-mono">
                        {tab.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>
              {/* Enhanced tabs */}
              <div className="flex gap-1 p-1 rounded-lg bg-muted/20 border border-border/20 overflow-x-auto">
                <div className="flex items-center gap-1 px-2">
                  <Sparkles size={10} className="text-gold" />
                  <span className="text-[9px] text-gold font-bold uppercase tracking-wider">AI</span>
                </div>
                {enhancedTabs.map(tab => {
                  const hasData = enhancedResults && (
                    (tab.id === 'competitors' && enhancedResults.competitor) ||
                    (tab.id === 'gbp' && enhancedResults.gbp) ||
                    (tab.id === 'content' && enhancedResults.contentGap) ||
                    (tab.id === 'reviews' && enhancedResults.review) ||
                    (tab.id === 'citations' && enhancedResults.citation)
                  );
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex-1 flex items-center justify-center gap-1 px-2 py-2 rounded-md text-xs font-semibold transition-all ${
                        activeTab === tab.id
                          ? 'bg-gold/10 text-gold border border-gold/30'
                          : hasData
                            ? 'text-muted-foreground hover:text-foreground'
                            : 'text-muted-foreground/40 hover:text-muted-foreground'
                      }`}
                    >
                      {tab.icon}
                      <span className="hidden sm:inline">{tab.label}</span>
                      <span className="sm:hidden">{tab.label.slice(0, 4)}</span>
                      {hasData && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ─── Tab: Homepage Audit ─── */}
            {activeTab === 'audit' && (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span>URL: <a href={auditResult.websiteAudit?.url} target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">{auditResult.websiteAudit?.url}</a></span>
                  <span>Response: {auditResult.websiteAudit?.fetchTimeMs}ms</span>
                  <span>Status: {auditResult.websiteAudit?.statusCode}</span>
                </div>

                {Object.entries(checksByCategory).map(([category, checks]) => {
                  const passCount = checks.filter(c => c.status === 'pass').length;
                  const isExpanded = expandedCats.has(`audit-${category}`);
                  return (
                    <div key={category} className="glass-card overflow-hidden">
                      <button
                        onClick={() => toggleCategory(`audit-${category}`)}
                        className="w-full flex items-center justify-between p-4 hover:bg-white/[0.04] transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-foreground">{category}</span>
                          <span className="text-xs text-muted-foreground">{passCount}/{checks.length} passed</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex gap-0.5">
                            {checks.map(c => (
                              <div
                                key={c.id}
                                className={`w-2 h-2 rounded-full ${
                                  c.status === 'pass' ? 'bg-emerald-400' :
                                  c.status === 'warn' ? 'bg-amber-400' : 'bg-red-400'
                                }`}
                              />
                            ))}
                          </div>
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </div>
                      </button>
                      {isExpanded && (
                        <div className="border-t border-white/[0.06] divide-y divide-white/[0.04]">
                          {checks.map(check => (
                            <div key={check.id} className="p-4 space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-foreground">{check.label}</span>
                                <StatusBadge status={check.status} />
                              </div>
                              <p className="text-xs text-muted-foreground">{check.value}</p>
                              {check.recommendation && (
                                <p className="text-xs text-amber-400/80 bg-amber-400/5 rounded-lg px-3 py-2 mt-1">
                                  → {check.recommendation}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* ─── Tab: Full Site Crawl ─── */}
            {activeTab === 'crawl' && (
              <div className="space-y-4">
                {!fullSiteData ? (
                  <div className="glass-card p-8 text-center">
                    <Layers size={32} className="mx-auto text-muted-foreground/30 mb-3" />
                    <p className="text-sm text-muted-foreground">Full site crawl data not available. Run a new audit to crawl the full site.</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="glass-card p-4 text-center">
                        <div className="font-data text-2xl font-bold text-foreground">{fullSiteData.totalPages}</div>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Pages Found</span>
                      </div>
                      <div className="glass-card p-4 text-center">
                        <div className="font-data text-2xl font-bold text-foreground">{fullSiteData.pagesAudited ?? fullSiteData.pages?.length ?? 0}</div>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Pages Audited</span>
                      </div>
                      <div className={`rounded-xl border p-4 text-center ${
                        fullSiteData.averageScore >= 70 ? 'border-emerald-400/30 bg-emerald-400/5' :
                        fullSiteData.averageScore >= 40 ? 'border-amber-400/30 bg-amber-400/5' :
                        'border-red-400/30 bg-red-400/5'
                      }`}>
                        <div className={`font-data text-2xl font-bold ${
                          fullSiteData.averageScore >= 70 ? 'text-emerald-400' :
                          fullSiteData.averageScore >= 40 ? 'text-amber-400' : 'text-red-400'
                        }`}>{Math.round(fullSiteData.averageScore)}</div>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Avg Score</span>
                      </div>
                      <div className="glass-card p-4 text-center">
                        <div className="font-data text-2xl font-bold text-foreground">{(fullSiteData.crawlTimeMs / 1000).toFixed(1)}s</div>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Crawl Time</span>
                      </div>
                    </div>

                    {siteStats && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                        <div className="rounded-xl border border-red-400/20 bg-red-400/5 p-3 text-center">
                          <div className="font-data text-xl font-bold text-red-400">{siteStats.totalFails}</div>
                          <span className="text-[10px] text-muted-foreground">Total Issues</span>
                        </div>
                        <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-3 text-center">
                          <div className="font-data text-xl font-bold text-amber-400">{siteStats.totalWarns}</div>
                          <span className="text-[10px] text-muted-foreground">Total Warnings</span>
                        </div>
                        <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-3 text-center">
                          <div className="font-data text-xl font-bold text-emerald-400">{siteStats.totalPasses}</div>
                          <span className="text-[10px] text-muted-foreground">Total Passes</span>
                        </div>
                      </div>
                    )}

                    {/* Site-wide issues: support both siteWideChecks (SeoCheck[]) and siteWideIssues (string[]) */}
                    {(() => {
                      const checks = fullSiteData.siteWideChecks || [];
                      const issues = fullSiteData.siteWideIssues || [];
                      if (checks.length === 0 && issues.length === 0) return null;
                      return (
                        <div className="rounded-xl border-2 border-red-400/30 bg-red-400/5 p-4">
                          <h3 className="text-sm font-bold text-red-400 mb-2 flex items-center gap-2">
                            <AlertTriangle size={16} /> Site-Wide Issues
                          </h3>
                          <ul className="space-y-1.5">
                            {checks.map((check, i) => (
                              <li key={`check-${i}`} className="text-xs text-muted-foreground flex items-start gap-2">
                                {check.status === 'fail' ? <XCircle size={12} className="text-red-400 mt-0.5 shrink-0" /> : <AlertTriangle size={12} className="text-amber-400 mt-0.5 shrink-0" />}
                                <div>
                                  <span className="font-medium text-foreground">{check.label}</span>
                                  <span className="text-muted-foreground"> — {check.value}</span>
                                  {check.recommendation && <p className="text-amber-400/80 mt-0.5">→ {check.recommendation}</p>}
                                </div>
                              </li>
                            ))}
                            {issues.map((issue, i) => (
                              <li key={`issue-${i}`} className="text-xs text-muted-foreground flex items-start gap-2">
                                <XCircle size={12} className="text-red-400 mt-0.5 shrink-0" />
                                {issue}
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    })()}

                    <div>
                      <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                        <FileSearch size={16} className="text-gold" />
                        Page-by-Page Breakdown
                        <span className="text-xs text-muted-foreground font-normal">(sorted worst → best)</span>
                      </h3>
                      <div className="space-y-2">
                        {sortedPages.map((page, idx) => (
                          <PageScoreBar
                            key={idx}
                            page={page}
                            isExpanded={expandedPages.has(idx)}
                            onToggle={() => togglePage(idx)}
                          />
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ─── Tab: Local SEO Checklist ─── */}
            {activeTab === 'checklist' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Click each item to cycle: <span className="text-red-400">Fail</span> → <span className="text-emerald-400">Pass</span> → <span className="text-amber-400">Partial</span>
                  </p>
                  <Button
                    onClick={handleSaveChecklist}
                    disabled={!currentAuditId || saveChecklistMutation.isPending}
                    size="sm"
                    className="h-8 text-xs gap-1.5 bg-gold text-black hover:bg-gold-light"
                  >
                    {saveChecklistMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : null}
                    Save Checklist
                  </Button>
                </div>
                {saveChecklistMutation.isSuccess && (
                  <p className="text-xs text-emerald-400">Checklist saved! Local SEO Score: {saveChecklistMutation.data.localSeoScore}/100</p>
                )}

                {Object.entries(checklistByCategory).map(([category, items]) => {
                  const passCount = items.filter(i => i.status === 'pass').length;
                  const isExpanded = expandedCats.has(`cl-${category}`);
                  return (
                    <div key={category} className="glass-card overflow-hidden">
                      <button
                        onClick={() => toggleCategory(`cl-${category}`)}
                        className="w-full flex items-center justify-between p-4 hover:bg-white/[0.04] transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-foreground">{category}</span>
                          <span className="text-xs text-muted-foreground">{passCount}/{items.length} passed</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex gap-0.5">
                            {items.map(i => (
                              <div
                                key={i.id}
                                className={`w-2 h-2 rounded-full ${
                                  i.status === 'pass' ? 'bg-emerald-400' :
                                  i.status === 'warn' ? 'bg-amber-400' : 'bg-red-400'
                                }`}
                              />
                            ))}
                          </div>
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </div>
                      </button>
                      {!isExpanded ? null : (
                        <div className="border-t border-white/[0.06] divide-y divide-white/[0.04]">
                          {items.map(item => (
                            <button
                              key={item.id}
                              onClick={() => toggleChecklistItem(item.id)}
                              className="w-full flex items-center gap-3 p-4 hover:bg-white/[0.04] transition-colors text-left"
                            >
                              <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${
                                item.status === 'pass' ? 'bg-emerald-400/20 text-emerald-400' :
                                item.status === 'warn' ? 'bg-amber-400/20 text-amber-400' :
                                'bg-red-400/20 text-red-400'
                              }`}>
                                {item.status === 'pass' ? <CheckCircle2 size={14} /> :
                                 item.status === 'warn' ? <AlertTriangle size={14} /> :
                                 <XCircle size={14} />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className="text-sm font-medium text-foreground block">{item.label}</span>
                                <span className="text-xs text-muted-foreground">{item.description}</span>
                              </div>
                              <StatusBadge status={item.status} />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* ─── Tab: Keywords ─── */}
            {activeTab === 'keywords' && (
              <div className="space-y-4">
                {keywordResults.length === 0 ? (
                  <div className="glass-card p-8 text-center">
                    <MapPin size={32} className="mx-auto text-muted-foreground/30 mb-3" />
                    <p className="text-sm text-muted-foreground">Enter a city name above and run the audit to see keyword analysis.</p>
                  </div>
                ) : (
                  <>
                    {missingHighValue.length > 0 && (
                      <div className="rounded-xl border-2 border-red-400/30 bg-red-400/5 p-4">
                        <h3 className="text-sm font-bold text-red-400 mb-2">Missing High-Value Keywords</h3>
                        <p className="text-xs text-muted-foreground mb-2">
                          These important keywords are NOT found anywhere on the website:
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {missingHighValue.map(kw => (
                            <span key={kw} className="text-xs bg-red-400/10 text-red-400 px-2 py-1 rounded-md font-mono">
                              {kw}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="glass-card overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-white/[0.06] bg-muted/10">
                              <th className="text-left p-3 font-semibold text-muted-foreground">Keyword</th>
                              <th className="text-center p-3 font-semibold text-muted-foreground">Title</th>
                              <th className="text-center p-3 font-semibold text-muted-foreground">Meta</th>
                              <th className="text-center p-3 font-semibold text-muted-foreground">H1</th>
                              <th className="text-center p-3 font-semibold text-muted-foreground">H2</th>
                              <th className="text-center p-3 font-semibold text-muted-foreground">Body</th>
                              <th className="text-center p-3 font-semibold text-muted-foreground">URL</th>
                              <th className="text-center p-3 font-semibold text-muted-foreground">Alt</th>
                              <th className="text-center p-3 font-semibold text-muted-foreground">Count</th>
                            </tr>
                          </thead>
                          <tbody>
                            {keywordResults.slice(0, 30).map((kw, i) => {
                              const anyFound = Object.values(kw.foundIn).some(v => v);
                              return (
                                <tr key={i} className={`border-b border-border/10 ${!anyFound ? 'bg-red-400/5' : ''}`}>
                                  <td className="p-3 font-data text-foreground">{kw.keyword}</td>
                                  {(['title', 'metaDescription', 'h1', 'h2', 'bodyContent', 'urlSlug', 'imageAlts'] as const).map(field => (
                                    <td key={field} className="text-center p-3">
                                      {kw.foundIn[field] ? (
                                        <span className="text-emerald-400">✓</span>
                                      ) : (
                                        <span className="text-red-400/40">✗</span>
                                      )}
                                    </td>
                                  ))}
                                  <td className="text-center p-3 font-data text-muted-foreground">{kw.occurrences}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      {keywordResults.length > 30 && (
                        <div className="p-3 text-center text-xs text-muted-foreground border-t border-white/[0.06]">
                          Showing top 30 of {keywordResults.length} keywords
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ─── Tab: Competitors (Enhanced) ─── */}
            {activeTab === 'competitors' && (
              <div className="space-y-4">
                {!enhancedResults?.competitor ? (
                  <EnhancedPlaceholder
                    icon={<Users size={32} />}
                    title="Competitor Comparison"
                    description="Compare your website against local competitors. Add competitor URLs above and run the Enhanced Audit."
                    loading={enhancedLoading}
                    canRun={canRunEnhanced}
                    onRun={handleRunEnhancedAudit}
                  />
                ) : (
                  <CompetitorPanel data={enhancedResults.competitor} />
                )}
              </div>
            )}

            {/* ─── Tab: GBP (Enhanced) ─── */}
            {activeTab === 'gbp' && (
              <div className="space-y-4">
                {!enhancedResults?.gbp ? (
                  <EnhancedPlaceholder
                    icon={<MapPin size={32} />}
                    title="Google Business Profile Audit"
                    description="Analyze your website for GBP optimization signals — maps links, address, hours, review widgets, and local schema markup."
                    loading={enhancedLoading}
                    canRun={canRunEnhanced}
                    onRun={handleRunEnhancedAudit}
                  />
                ) : (
                  <GBPPanel data={enhancedResults.gbp} />
                )}
              </div>
            )}

            {/* ─── Tab: Content Gaps (Enhanced) ─── */}
            {activeTab === 'content' && (
              <div className="space-y-4">
                {!enhancedResults?.contentGap ? (
                  <EnhancedPlaceholder
                    icon={<FileText size={32} />}
                    title="Content Gap Analysis"
                    description="Identify missing pages and content opportunities — service pages, area pages, about, gallery, FAQ, and more."
                    loading={enhancedLoading}
                    canRun={canRunEnhanced}
                    onRun={handleRunEnhancedAudit}
                  />
                ) : (
                  <ContentGapPanel data={enhancedResults.contentGap} />
                )}
              </div>
            )}

            {/* ─── Tab: Reviews (Enhanced) ─── */}
            {activeTab === 'reviews' && (
              <div className="space-y-4">
                {!enhancedResults?.review ? (
                  <EnhancedPlaceholder
                    icon={<Star size={32} />}
                    title="Review & Reputation Analysis"
                    description="Check for review platform presence, testimonials, review schema, and estimated ratings across Google, Yelp, and more."
                    loading={enhancedLoading}
                    canRun={canRunEnhanced}
                    onRun={handleRunEnhancedAudit}
                  />
                ) : (
                  <ReviewPanel data={enhancedResults.review} />
                )}
              </div>
            )}

            {/* ─── Tab: Citations (Enhanced) ─── */}
            {activeTab === 'citations' && (
              <div className="space-y-4">
                {!enhancedResults?.citation ? (
                  <EnhancedPlaceholder
                    icon={<Building2 size={32} />}
                    title="Citation & Directory Check"
                    description="Verify your business listings across directories, social profiles, and check NAP (Name, Address, Phone) consistency."
                    loading={enhancedLoading}
                    canRun={canRunEnhanced}
                    onRun={handleRunEnhancedAudit}
                  />
                ) : (
                  <CitationPanel data={enhancedResults.citation} />
                )}
              </div>
            )}
          </>
        )}

        {/* History Panel */}
        {showHistory && auditHistory.data && (
          <div className="glass-card p-5 space-y-3">
            <h3 className="text-sm font-bold text-foreground">Audit History</h3>
            {auditHistory.data.length === 0 ? (
              <p className="text-xs text-muted-foreground">No audits yet.</p>
            ) : (
              <div className="space-y-2">
                {auditHistory.data.map((audit: any) => (
                  <div key={audit.id} className="flex items-center justify-between p-3 rounded-lg border border-border/20 hover:bg-white/[0.04] transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-data text-xs font-bold ${
                        (audit.overallScore ?? 0) >= 70 ? 'bg-emerald-400/10 text-emerald-400' :
                        (audit.overallScore ?? 0) >= 40 ? 'bg-amber-400/10 text-amber-400' :
                        'bg-red-400/10 text-red-400'
                      }`}>
                        {audit.overallScore ?? '—'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {audit.shopName || audit.websiteUrl}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {audit.city ? `${audit.city} · ` : ''}{new Date(audit.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>W:{audit.websiteScore ?? '—'}</span>
                      <span>L:{audit.localSeoScore ?? '—'}</span>
                      <span>K:{audit.keywordScore ?? '—'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

// ─── Enhanced Placeholder Component ───
function EnhancedPlaceholder({
  icon,
  title,
  description,
  loading,
  canRun,
  onRun,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  loading: boolean;
  canRun: boolean;
  onRun: () => void;
}) {
  return (
    <div className="glass-card p-8 text-center space-y-4">
      <div className="mx-auto text-muted-foreground/30">{icon}</div>
      <div>
        <h3 className="text-sm font-bold text-foreground mb-1">{title}</h3>
        <p className="text-xs text-muted-foreground max-w-md mx-auto">{description}</p>
      </div>
      {loading ? (
        <div className="flex items-center justify-center gap-2 text-gold">
          <Loader2 size={16} className="animate-spin" />
          <span className="text-xs font-medium">Running AI analysis...</span>
        </div>
      ) : canRun ? (
        <Button
          onClick={onRun}
          className="h-9 px-5 text-xs gap-2 bg-gold text-black hover:bg-gold-light"
        >
          <Sparkles size={14} /> Run Enhanced Audit
        </Button>
      ) : (
        <p className="text-[10px] text-muted-foreground">
          Run a site audit first, then fill in Shop Name and City to enable this feature.
        </p>
      )}
    </div>
  );
}
