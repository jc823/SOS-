/**
 * Enhanced SEO Audit UI Panels
 * Competitor Comparison, GBP Audit, Content Gap, Review Analysis, Citation Check
 */
import { CheckCircle2, XCircle, AlertTriangle, ExternalLink, Star, MapPin, Users, TrendingUp, FileText, Globe2, Building2 } from 'lucide-react';

// ─── Types ───

interface CompetitorData {
  url: string;
  name: string;
  score: number;
  title: string;
  metaDescription: string;
  h1Count: number;
  h2Count: number;
  imageCount: number;
  imagesWithAlt: number;
  internalLinkCount: number;
  hasSSL: boolean;
  hasMobileViewport: boolean;
  servicesFound: string[];
  wordCount: number;
}

interface CompetitorResult {
  shopData: CompetitorData;
  competitors: CompetitorData[];
  analysis: string;
  advantages: string[];
  disadvantages: string[];
  actionItems: string[];
}

interface GBPResult {
  shopName: string;
  city: string;
  hasGoogleMapsLink: boolean;
  hasAddress: boolean;
  hasPhone: boolean;
  hasHours: boolean;
  hasReviewWidget: boolean;
  hasLocalSchema: boolean;
  schemaDetails: any;
  score: number;
  recommendations: string[];
  analysis: string;
}

interface ContentGapResult {
  existingPages: Array<{ url: string; title: string; pageType: string }>;
  missingPages: Array<{ pageType: string; description: string; importance: string; estimatedImpact: string }>;
  score: number;
  totalExpected: number;
  totalFound: number;
  recommendations: string[];
}

interface ReviewResult {
  shopName: string;
  city: string;
  reviewMentions: Array<{ platform: string; found: boolean; details: string }>;
  estimatedRating: number | null;
  estimatedReviewCount: number | null;
  hasTestimonials: boolean;
  hasReviewSchema: boolean;
  score: number;
  recommendations: string[];
  analysis: string;
}

interface CitationResult {
  shopName: string;
  city: string;
  directoryLinks: Array<{ directory: string; found: boolean; url: string }>;
  socialProfiles: Array<{ platform: string; found: boolean; url: string }>;
  napConsistency: { hasName: boolean; hasAddress: boolean; hasPhone: boolean; consistent: boolean };
  score: number;
  recommendations: string[];
  analysis: string;
}

// ─── Shared Components ───

function SectionHeader({ icon, title, score, subtitle }: { icon: React.ReactNode; title: string; score?: number; subtitle?: string }) {
  const color = score !== undefined
    ? score >= 70 ? 'text-emerald-400' : score >= 40 ? 'text-amber-400' : 'text-red-400'
    : 'text-gold';
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <span className="text-gold">{icon}</span>
        <div>
          <h3 className="text-sm font-bold text-foreground">{title}</h3>
          {subtitle && <p className="text-[10px] text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      {score !== undefined && (
        <div className={`font-data text-2xl font-bold ${color}`}>{score}<span className="text-xs text-muted-foreground">/100</span></div>
      )}
    </div>
  );
}

function CheckItem({ passed, label, detail }: { passed: boolean; label: string; detail?: string }) {
  return (
    <div className="flex items-start gap-2 py-1.5">
      {passed ? <CheckCircle2 size={14} className="text-emerald-400 mt-0.5 shrink-0" /> : <XCircle size={14} className="text-red-400 mt-0.5 shrink-0" />}
      <div>
        <span className="text-xs font-medium text-foreground">{label}</span>
        {detail && <p className="text-[10px] text-muted-foreground mt-0.5">{detail}</p>}
      </div>
    </div>
  );
}

function RecommendationList({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <div className="mt-4 rounded-lg border border-amber-400/20 bg-amber-400/5 p-3 space-y-1.5">
      <h4 className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Recommendations</h4>
      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-2">
          <AlertTriangle size={10} className="text-amber-400 mt-1 shrink-0" />
          <span className="text-xs text-muted-foreground">{item}</span>
        </div>
      ))}
    </div>
  );
}

// ─── 1. Competitor Comparison Panel ───

export function CompetitorPanel({ data }: { data: CompetitorResult }) {
  const shop = data.shopData;
  const allEntries = [shop, ...data.competitors];
  const maxScore = Math.max(...allEntries.map(e => e.score));

  return (
    <div className="space-y-4">
      <SectionHeader icon={<Users size={16} />} title="Competitor Comparison" score={shop.score} subtitle={`vs. ${data.competitors.length} competitors`} />

      {/* Comparison Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left p-3 text-muted-foreground font-medium">Site</th>
                <th className="text-center p-3 text-muted-foreground font-medium">Score</th>
                <th className="text-center p-3 text-muted-foreground font-medium hidden sm:table-cell">Words</th>
                <th className="text-center p-3 text-muted-foreground font-medium hidden sm:table-cell">Images</th>
                <th className="text-center p-3 text-muted-foreground font-medium hidden md:table-cell">Links</th>
                <th className="text-center p-3 text-muted-foreground font-medium">SSL</th>
                <th className="text-center p-3 text-muted-foreground font-medium">Mobile</th>
                <th className="text-center p-3 text-muted-foreground font-medium hidden md:table-cell">Services</th>
              </tr>
            </thead>
            <tbody>
              {allEntries.map((entry, i) => {
                const isShop = i === 0;
                const scoreColor = entry.score >= 70 ? 'text-emerald-400' : entry.score >= 40 ? 'text-amber-400' : 'text-red-400';
                return (
                  <tr key={i} className={`border-b border-border/10 ${isShop ? 'bg-gold/5' : 'hover:bg-white/[0.04]'}`}>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {isShop && <span className="text-[8px] bg-gold/20 text-gold px-1 py-0.5 rounded font-bold">YOU</span>}
                        {entry.score === maxScore && !isShop && <span className="text-[8px] bg-emerald-400/20 text-emerald-400 px-1 py-0.5 rounded font-bold">#1</span>}
                        <span className={`font-medium truncate max-w-[120px] ${isShop ? 'text-gold' : 'text-foreground'}`}>{entry.name || entry.url}</span>
                      </div>
                    </td>
                    <td className={`p-3 text-center font-data font-bold ${scoreColor}`}>{entry.score}</td>
                    <td className="p-3 text-center text-muted-foreground hidden sm:table-cell">{entry.wordCount.toLocaleString()}</td>
                    <td className="p-3 text-center text-muted-foreground hidden sm:table-cell">{entry.imageCount} ({entry.imagesWithAlt} alt)</td>
                    <td className="p-3 text-center text-muted-foreground hidden md:table-cell">{entry.internalLinkCount}</td>
                    <td className="p-3 text-center">{entry.hasSSL ? <CheckCircle2 size={12} className="text-emerald-400 mx-auto" /> : <XCircle size={12} className="text-red-400 mx-auto" />}</td>
                    <td className="p-3 text-center">{entry.hasMobileViewport ? <CheckCircle2 size={12} className="text-emerald-400 mx-auto" /> : <XCircle size={12} className="text-red-400 mx-auto" />}</td>
                    <td className="p-3 text-center text-muted-foreground hidden md:table-cell">{entry.servicesFound.length}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Advantages & Disadvantages */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {data.advantages.length > 0 && (
          <div className="rounded-lg border border-emerald-400/20 bg-emerald-400/5 p-3 space-y-1.5">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Your Advantages</h4>
            {data.advantages.map((a, i) => (
              <div key={i} className="flex items-start gap-2">
                <CheckCircle2 size={10} className="text-emerald-400 mt-1 shrink-0" />
                <span className="text-xs text-muted-foreground">{a}</span>
              </div>
            ))}
          </div>
        )}
        {data.disadvantages.length > 0 && (
          <div className="rounded-lg border border-red-400/20 bg-red-400/5 p-3 space-y-1.5">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-red-400">Competitor Advantages</h4>
            {data.disadvantages.map((d, i) => (
              <div key={i} className="flex items-start gap-2">
                <XCircle size={10} className="text-red-400 mt-1 shrink-0" />
                <span className="text-xs text-muted-foreground">{d}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Items */}
      {data.actionItems.length > 0 && (
        <div className="rounded-lg border border-gold/20 bg-gold/5 p-3 space-y-1.5">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-gold">Priority Actions</h4>
          {data.actionItems.map((item, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-[10px] font-data font-bold text-gold mt-0.5">{i + 1}.</span>
              <span className="text-xs text-muted-foreground">{item}</span>
            </div>
          ))}
        </div>
      )}

      {/* LLM Analysis */}
      {data.analysis && (
        <div className="rounded-lg border border-border/20 bg-muted/10 p-3">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">AI Analysis</h4>
          <p className="text-xs text-muted-foreground whitespace-pre-line">{data.analysis}</p>
        </div>
      )}
    </div>
  );
}

// ─── 2. GBP Audit Panel ───

export function GBPPanel({ data }: { data: GBPResult }) {
  return (
    <div className="space-y-4">
      <SectionHeader icon={<MapPin size={16} />} title="Google Business Profile Audit" score={data.score} subtitle={`${data.shopName} — ${data.city}`} />

      <div className="glass-card p-4 space-y-2">
        <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Website Signals Detected</h4>
        <CheckItem passed={data.hasGoogleMapsLink} label="Google Maps / Directions Link" detail="Link to Google Maps or directions found on website" />
        <CheckItem passed={data.hasAddress} label="Physical Address Displayed" detail="Street address visible on website" />
        <CheckItem passed={data.hasPhone} label="Phone Number Displayed" detail="Phone number found on website" />
        <CheckItem passed={data.hasHours} label="Business Hours Listed" detail="Operating hours mentioned on website" />
        <CheckItem passed={data.hasReviewWidget} label="Review Widget / Testimonials" detail="Google reviews or testimonials displayed" />
        <CheckItem passed={data.hasLocalSchema} label="Local Business Schema Markup" detail="Structured data for local business found in page source" />
      </div>

      {data.schemaDetails && Object.keys(data.schemaDetails).length > 0 && (
        <div className="rounded-lg border border-border/20 bg-muted/10 p-3">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Schema Details Found</h4>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(data.schemaDetails).map(([key, val]) => (
              <div key={key} className="text-xs">
                <span className="text-muted-foreground">{key}: </span>
                <span className="text-foreground font-medium">{String(val)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <RecommendationList items={data.recommendations} />

      {data.analysis && (
        <div className="rounded-lg border border-border/20 bg-muted/10 p-3">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">AI Analysis</h4>
          <p className="text-xs text-muted-foreground whitespace-pre-line">{data.analysis}</p>
        </div>
      )}
    </div>
  );
}

// ─── 3. Content Gap Panel ───

export function ContentGapPanel({ data }: { data: ContentGapResult }) {
  const importanceColor = (imp: string) => {
    if (imp === 'critical') return 'text-red-400 bg-red-400/10';
    if (imp === 'high') return 'text-amber-400 bg-amber-400/10';
    return 'text-blue-400 bg-blue-400/10';
  };

  return (
    <div className="space-y-4">
      <SectionHeader icon={<FileText size={16} />} title="Content Gap Analysis" score={data.score} subtitle={`${data.totalFound} of ${data.totalExpected} expected pages found`} />

      {/* Progress bar */}
      <div className="rounded-lg border border-border/20 bg-card p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground">Content Coverage</span>
          <span className="text-xs font-data font-bold text-foreground">{data.totalFound}/{data.totalExpected}</span>
        </div>
        <div className="h-3 rounded-full bg-muted/20 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-gold to-gold-light transition-all duration-500"
            style={{ width: `${(data.totalFound / data.totalExpected) * 100}%` }}
          />
        </div>
      </div>

      {/* Existing Pages */}
      {data.existingPages.length > 0 && (
        <div className="rounded-xl border border-emerald-400/20 bg-card p-4 space-y-2">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Pages Found ({data.existingPages.length})</h4>
          {data.existingPages.map((page, i) => (
            <div key={i} className="flex items-center gap-2 py-1">
              <CheckCircle2 size={12} className="text-emerald-400 shrink-0" />
              <span className="text-xs font-medium text-foreground">{page.pageType}</span>
              <a href={page.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-gold hover:underline flex items-center gap-0.5 ml-auto">
                View <ExternalLink size={8} />
              </a>
            </div>
          ))}
        </div>
      )}

      {/* Missing Pages */}
      {data.missingPages.length > 0 && (
        <div className="rounded-xl border border-red-400/20 bg-card p-4 space-y-2">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-red-400">Missing Pages ({data.missingPages.length})</h4>
          {data.missingPages.map((page, i) => (
            <div key={i} className="flex items-start gap-2 py-1.5 border-b border-border/10 last:border-0">
              <XCircle size={12} className="text-red-400 mt-0.5 shrink-0" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-foreground">{page.pageType}</span>
                  <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded ${importanceColor(page.importance)}`}>
                    {page.importance}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">{page.description}</p>
                {page.estimatedImpact && (
                  <p className="text-[10px] text-gold mt-0.5">Impact: {page.estimatedImpact}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <RecommendationList items={data.recommendations} />
    </div>
  );
}

// ─── 4. Review & Reputation Panel ───

export function ReviewPanel({ data }: { data: ReviewResult }) {
  return (
    <div className="space-y-4">
      <SectionHeader icon={<Star size={16} />} title="Review & Reputation Analysis" score={data.score} subtitle={`${data.shopName} — ${data.city}`} />

      {/* Review Presence */}
      <div className="glass-card p-4 space-y-2">
        <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Review Platform Presence</h4>
        {data.reviewMentions.map((mention, i) => (
          <div key={i} className="flex items-center justify-between py-1.5 border-b border-border/10 last:border-0">
            <div className="flex items-center gap-2">
              {mention.found ? <CheckCircle2 size={12} className="text-emerald-400" /> : <XCircle size={12} className="text-red-400" />}
              <span className="text-xs font-medium text-foreground">{mention.platform}</span>
            </div>
            <span className="text-[10px] text-muted-foreground">{mention.details}</span>
          </div>
        ))}
      </div>

      {/* Review Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-lg border border-border/20 bg-card p-3 text-center">
          <div className="font-data text-xl font-bold text-foreground">
            {data.estimatedRating ? data.estimatedRating.toFixed(1) : '—'}
          </div>
          <span className="text-[10px] text-muted-foreground">Est. Rating</span>
        </div>
        <div className="rounded-lg border border-border/20 bg-card p-3 text-center">
          <div className="font-data text-xl font-bold text-foreground">
            {data.estimatedReviewCount ?? '—'}
          </div>
          <span className="text-[10px] text-muted-foreground">Est. Reviews</span>
        </div>
        <div className="rounded-lg border border-border/20 bg-card p-3 text-center">
          <div className="font-data text-xl font-bold text-foreground">
            {data.hasTestimonials ? <CheckCircle2 size={20} className="text-emerald-400 mx-auto" /> : <XCircle size={20} className="text-red-400 mx-auto" />}
          </div>
          <span className="text-[10px] text-muted-foreground">Testimonials</span>
        </div>
        <div className="rounded-lg border border-border/20 bg-card p-3 text-center">
          <div className="font-data text-xl font-bold text-foreground">
            {data.hasReviewSchema ? <CheckCircle2 size={20} className="text-emerald-400 mx-auto" /> : <XCircle size={20} className="text-red-400 mx-auto" />}
          </div>
          <span className="text-[10px] text-muted-foreground">Review Schema</span>
        </div>
      </div>

      <RecommendationList items={data.recommendations} />

      {data.analysis && (
        <div className="rounded-lg border border-border/20 bg-muted/10 p-3">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">AI Analysis</h4>
          <p className="text-xs text-muted-foreground whitespace-pre-line">{data.analysis}</p>
        </div>
      )}
    </div>
  );
}

// ─── 5. Citation & Directory Panel ───

export function CitationPanel({ data }: { data: CitationResult }) {
  return (
    <div className="space-y-4">
      <SectionHeader icon={<Building2 size={16} />} title="Citation & Directory Check" score={data.score} subtitle={`${data.shopName} — ${data.city}`} />

      {/* NAP Consistency */}
      <div className="glass-card p-4">
        <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">NAP Consistency (Name, Address, Phone)</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <CheckItem passed={data.napConsistency.hasName} label="Business Name" />
          <CheckItem passed={data.napConsistency.hasAddress} label="Address" />
          <CheckItem passed={data.napConsistency.hasPhone} label="Phone" />
          <CheckItem passed={data.napConsistency.consistent} label="Consistent" />
        </div>
      </div>

      {/* Directory Listings */}
      <div className="glass-card p-4 space-y-2">
        <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
          Directory Listings ({data.directoryLinks.filter(d => d.found).length}/{data.directoryLinks.length})
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {data.directoryLinks.map((dir, i) => (
            <div key={i} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-white/[0.04]">
              <div className="flex items-center gap-2">
                {dir.found ? <CheckCircle2 size={12} className="text-emerald-400" /> : <XCircle size={12} className="text-red-400" />}
                <span className="text-xs font-medium text-foreground">{dir.directory}</span>
              </div>
              {dir.found && dir.url && (
                <a href={dir.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-gold hover:underline flex items-center gap-0.5">
                  Link <ExternalLink size={8} />
                </a>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Social Profiles */}
      <div className="glass-card p-4 space-y-2">
        <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
          Social Profiles ({data.socialProfiles.filter(s => s.found).length}/{data.socialProfiles.length})
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {data.socialProfiles.map((social, i) => (
            <div key={i} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-white/[0.04]">
              <div className="flex items-center gap-2">
                {social.found ? <CheckCircle2 size={12} className="text-emerald-400" /> : <XCircle size={12} className="text-red-400" />}
                <span className="text-xs font-medium text-foreground">{social.platform}</span>
              </div>
              {social.found && social.url && (
                <a href={social.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-gold hover:underline flex items-center gap-0.5">
                  Link <ExternalLink size={8} />
                </a>
              )}
            </div>
          ))}
        </div>
      </div>

      <RecommendationList items={data.recommendations} />

      {data.analysis && (
        <div className="rounded-lg border border-border/20 bg-muted/10 p-3">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">AI Analysis</h4>
          <p className="text-xs text-muted-foreground whitespace-pre-line">{data.analysis}</p>
        </div>
      )}
    </div>
  );
}
