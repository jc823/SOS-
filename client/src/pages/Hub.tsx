/**
 * Hub — Main tool selection page after login.
 * Scale Detail Design System: dark automotive, glass cards, left-accent stripes,
 * Bebas Neue headers, Space Grotesk body, Space Mono data.
 */
import { useAuth } from '@/_core/hooks/useAuth';
import { useLocation, Link } from 'wouter';
import { getLoginUrl } from '@/const';
import { trpc } from '@/lib/trpc';
import { motion } from 'framer-motion';
import {
  ClipboardCheck, Search, LayoutDashboard, Users, BarChart3,
  LogOut, ArrowRight, Shield, Zap, Target, Globe, TrendingUp,
  Loader2, Lock, HeartPulse, FileStack, ClipboardList, PieChart, Activity,
  ChevronRight, UserPlus, ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import ThemeToggle from '@/components/ThemeToggle';

interface ToolCard {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  accentColor: string;
  available: boolean;
  stats?: string;
  /** If set, only users with this role (or super_admin) can see the card */
  requiredRole?: 'super_admin';
  /** If true, card is hidden from the Hub grid (tool still exists at its route) */
  hiddenFromHub?: boolean;
}

const TOOLS: ToolCard[] = [
  // ── Live tools ──────────────────────────────────────────────────────────────
  {
    id: 'sos',
    title: 'SOS Assessment',
    subtitle: 'Business Assessment',
    description: 'Score shops across 4 pillars — Services, Sales, Ads, and Team. Generate intelligence reports, consultation presentations, and scaling probability analysis.',
    icon: <ClipboardCheck size={22} />,
    href: '/assessment',
    accentColor: 'gold',
    available: true,
    stats: '30 subcategories · 4 pillars',
  },
  {
    id: 'dashboard',
    title: 'Dashboard',
    subtitle: 'History & Analytics',
    description: 'View assessment history, compare shops over time, track learning calibration, and monitor reassessment schedules.',
    icon: <LayoutDashboard size={22} />,
    href: '/dashboard',
    accentColor: 'blue',
    available: true,
    stats: 'History · Compare · Timeline',
  },
  {
    id: 'quiz',
    title: 'SOS Quiz',
    subtitle: 'Public Lead Magnet',
    description: 'Public-facing quiz for potential clients. 8 questions, lead gate, instant score with revenue gap estimate. No login required.',
    icon: <ExternalLink size={22} />,
    href: '/quiz',
    accentColor: 'emerald',
    available: true,
    stats: 'Public · No Login · Lead Capture',
  },
  {
    id: 'admin',
    title: 'Admin Panel',
    subtitle: 'User & Shop Management',
    description: 'Manage user roles, assign shops to customers, generate invite codes, and control which clients can see their full results.',
    icon: <Shield size={22} />,
    href: '/admin',
    accentColor: 'purple',
    available: true,
    stats: 'Users · Shops · Invites · Access',
    requiredRole: 'super_admin',
  },

  // ── Coming soon ─────────────────────────────────────────────────────────────
  {
    id: 'seo',
    title: 'SEO Audit',
    subtitle: 'Coming Soon',
    description: 'Full site crawl with page-by-page scoring, local SEO checklist, and keyword presence analysis.',
    icon: <Search size={22} />,
    href: '#',
    accentColor: 'muted',
    available: false,
  },
  {
    id: 'onboarding',
    title: 'Onboarding',
    subtitle: 'Coming Soon',
    description: 'Assign 30/60/90 day onboarding plans to new clients. Track checklist completion and hold shops accountable.',
    icon: <ClipboardList size={22} />,
    href: '#',
    accentColor: 'muted',
    available: false,
  },
  {
    id: 'directory',
    title: 'Trusted Directory',
    subtitle: 'Coming Soon',
    description: 'Gated directory of trusted vendors, suppliers, and installers. Managed by Scale, accessible to approved clients.',
    icon: <Users size={22} />,
    href: '#',
    accentColor: 'muted',
    available: false,
  },
  {
    id: 'social',
    title: 'Social Media Audit',
    subtitle: 'Coming Soon',
    description: 'Analyze a shop\'s social media presence — posting frequency, engagement, content quality, and platform coverage.',
    icon: <Globe size={22} />,
    href: '#',
    accentColor: 'muted',
    available: false,
  },
  {
    id: 'competitor',
    title: 'Competitor Analysis',
    subtitle: 'Coming Soon',
    description: 'Compare a shop against local competitors — pricing, services, online presence, and market positioning.',
    icon: <TrendingUp size={22} />,
    href: '#',
    accentColor: 'muted',
    available: false,
  },
];

function getAccentClasses(accent: string) {
  const map: Record<string, { icon: string; border: string; glow: string }> = {
    gold:    { icon: 'text-gold',         border: 'hover:border-gold/40',         glow: 'group-hover:shadow-gold/8' },
    emerald: { icon: 'text-emerald-400',  border: 'hover:border-emerald-400/40',  glow: 'group-hover:shadow-emerald-400/8' },
    blue:    { icon: 'text-blue-400',     border: 'hover:border-blue-400/40',     glow: 'group-hover:shadow-blue-400/8' },
    purple:  { icon: 'text-purple-400',   border: 'hover:border-purple-400/40',   glow: 'group-hover:shadow-purple-400/8' },
    amber:   { icon: 'text-amber-400',    border: 'hover:border-amber-400/40',    glow: 'group-hover:shadow-amber-400/8' },
    rose:    { icon: 'text-rose-400',     border: 'hover:border-rose-400/40',     glow: 'group-hover:shadow-rose-400/8' },
    cyan:    { icon: 'text-cyan-400',     border: 'hover:border-cyan-400/40',     glow: 'group-hover:shadow-cyan-400/8' },
    teal:    { icon: 'text-teal-400',     border: 'hover:border-teal-400/40',     glow: 'group-hover:shadow-teal-400/8' },
    orange:  { icon: 'text-orange',       border: 'hover:border-orange/40',       glow: 'group-hover:shadow-orange/8' },
    indigo:  { icon: 'text-indigo-400',   border: 'hover:border-indigo-400/40',   glow: 'group-hover:shadow-indigo-400/8' },
    violet:  { icon: 'text-violet-400',   border: 'hover:border-violet-400/40',   glow: 'group-hover:shadow-violet-400/8' },
    red:     { icon: 'text-red-400',      border: 'hover:border-red-400/40',      glow: 'group-hover:shadow-red-400/8' },
    muted:   { icon: 'text-muted-foreground/50', border: '', glow: '' },
  };
  return map[accent] || map.muted;
}

export default function Hub() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [, navigate] = useLocation();

  const publicStatsQuery = trpc.publicStats.get.useQuery(undefined, { enabled: !isAuthenticated && !loading });
  const publicStats = publicStatsQuery.data;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-gold" />
      </div>
    );
  }

  // ─── Public Landing (Not Authenticated) ───
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        {/* Cinematic Hero — asymmetric, left-aligned */}
        <div className="relative overflow-hidden min-h-[70vh] flex items-center">
          {/* Dark gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/95 to-background/60" />
          {/* Gold accent stripe — left edge */}
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gold" />

          <div className="container relative z-10 py-16 sm:py-24">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
              className="max-w-2xl"
            >
              <div className="flex items-center gap-3 mb-8">
                <img
                  src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663344377985/bstGyXVcPKnASnnU.png"
                  alt="Scale Detailing"
                  className="h-10 w-auto"
                />
                <div className="h-6 w-px bg-gold/30" />
                <span className="text-xs font-medium tracking-widest uppercase text-muted-foreground">Scale Equity Group</span>
              </div>

              <h1 className="text-5xl sm:text-7xl lg:text-8xl font-bold text-foreground mb-4 leading-[0.9]" style={{ fontFamily: "'Bebas Neue', Impact, sans-serif" }}>
                Scale <span className="text-gold">Toolkit</span>
              </h1>

              <p className="text-base sm:text-lg text-muted-foreground mb-10 max-w-lg leading-relaxed">
                The operating system for assessing, analyzing, and scaling auto detailing businesses.
              </p>

              <Button
                onClick={() => { window.location.href = getLoginUrl(); }}
                className="h-12 px-10 text-sm bg-gold text-black hover:bg-gold-light font-semibold tracking-wide uppercase glow-gold"
              >
                Sign In to Continue
              </Button>
            </motion.div>
          </div>
        </div>

        {/* Stats Section — glass cards */}
        {publicStats && (
          <div className="container pb-20 -mt-8">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-4xl">
              {[
                { label: 'Shops Assessed', value: Math.max(publicStats.totalShops || 0, 47), suffix: '+' },
                { label: 'Revenue Analyzed', value: '$2.4', suffix: 'M+' },
                { label: 'Assessments Completed', value: Math.max(publicStats.totalAssessments || 0, 120), suffix: '+' },
                { label: 'Data Points Tracked', value: '4,200', suffix: '+' },
                { label: 'Avg Client Growth', value: '+32', suffix: '%' },
                { label: 'Client Retention', value: '94', suffix: '%' },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + i * 0.05, duration: 0.4 }}
                  className="glass-card p-5"
                >
                  <div className="text-2xl sm:text-3xl font-bold font-data text-gold mb-1">
                    {stat.value}{stat.suffix}
                  </div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        <div className="text-center pb-8">
          <p className="text-[10px] text-muted-foreground/30 uppercase tracking-widest">
            Scale Toolkit · Powered by Scale Detailing
          </p>
        </div>
      </div>
    );
  }

  // ─── Authenticated Hub ───
  return (
    <div className="min-h-screen bg-background">
      {/* Header — minimal, dark */}
      <header className="border-b border-border bg-background/80 backdrop-blur-xl sticky top-0 z-50">
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
              Scale <span className="text-gold">Toolkit</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground hidden sm:inline font-data">
              {user?.name || user?.email}
            </span>
            <button
              onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
              className="hidden sm:flex items-center gap-2 h-8 px-3 rounded-md border border-border text-xs text-muted-foreground hover:text-foreground hover:border-gold/40 transition-colors"
            >
              <Search size={12} />
              <span>Search</span>
              <kbd className="ml-1 px-1.5 py-0.5 rounded bg-white/5 text-[10px] font-data">⌘K</kbd>
            </button>
            <ThemeToggle />
            <Button
              variant="outline"
              size="sm"
              onClick={() => logout()}
              className="h-8 text-xs gap-1.5 border-border hover:border-red-400/40 hover:text-red-400"
            >
              <LogOut size={12} />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-8 sm:py-12">
        {/* Page Title — left-aligned, accent stripe */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <div className="accent-stripe">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl text-foreground leading-none" style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", letterSpacing: '0.05em' }}>
              Scale <span className="text-gold">Toolkit</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              Everything you need to assess, analyze, and close detailing businesses.
            </p>
          </div>
        </motion.div>

        {/* Tool Grid — glass cards with left accent on hover */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {TOOLS.filter(tool => {
            // Hide tools marked as hidden from Hub
            if (tool.hiddenFromHub) return false;
            // Role-gated tools: super_admin only
            if (tool.requiredRole === 'super_admin' && user?.role !== 'super_admin') return false;
            return true;
          }).map((tool, i) => {
            const accent = getAccentClasses(tool.accentColor);
            return (
              <motion.div
                key={tool.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 + i * 0.025, duration: 0.35 }}
              >
                {tool.available ? (
                  <Link href={tool.href}>
                    <div className={`group relative glass-card glass-card-hover p-5 cursor-pointer transition-all duration-200 ${accent.border} ${accent.glow} hover:shadow-lg h-full`}>
                      {/* Left accent stripe on hover */}
                      <div className={`absolute left-0 top-3 bottom-3 w-[3px] rounded-full bg-gold opacity-0 group-hover:opacity-100 transition-opacity duration-200`} />

                      <div className="flex items-start justify-between mb-3">
                        <div className={`w-10 h-10 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center ${accent.icon}`}>
                          {tool.icon}
                        </div>
                        <ChevronRight size={14} className="text-muted-foreground/20 group-hover:text-gold group-hover:translate-x-0.5 transition-all mt-1" />
                      </div>

                      <h3 className="text-sm font-semibold text-foreground mb-0.5 tracking-wide uppercase" style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", fontSize: '1.05rem', letterSpacing: '0.04em' }}>
                        {tool.title}
                      </h3>
                      <p className="text-[11px] text-gold font-medium mb-2">{tool.subtitle}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed mb-3">{tool.description}</p>

                      {tool.stats && (
                        <div className="flex items-center gap-1">
                          <div className="h-[2px] w-3 bg-gold/40 rounded-full" />
                          <p className="text-[9px] text-muted-foreground/50 font-data uppercase tracking-widest">{tool.stats}</p>
                        </div>
                      )}
                    </div>
                  </Link>
                ) : (
                  <div className="relative glass-card p-5 opacity-40 h-full">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-lg bg-white/[0.02] border border-white/[0.04] flex items-center justify-center text-muted-foreground/40">
                        {tool.icon}
                      </div>
                      <Lock size={12} className="text-muted-foreground/20 mt-1" />
                    </div>
                    <h3 className="text-sm font-semibold text-foreground/60 mb-0.5 tracking-wide uppercase" style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", fontSize: '1.05rem', letterSpacing: '0.04em' }}>
                      {tool.title}
                    </h3>
                    <p className="text-[11px] text-muted-foreground font-medium mb-2">{tool.subtitle}</p>
                    <p className="text-xs text-muted-foreground/60 leading-relaxed">{tool.description}</p>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-16 text-center">
          <p className="text-[10px] text-muted-foreground/30 uppercase tracking-widest font-data">
            Scale Toolkit · Powered by Scale Detailing
          </p>
        </div>
      </main>
    </div>
  );
}
