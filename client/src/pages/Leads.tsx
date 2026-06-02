/**
 * Leads — Admin Lead Management Page
 *
 * Shows all leads captured from the public self-assessment.
 * Admins can view contact info, scores, and update lead status.
 */
import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import {
  Phone, Mail, Building2, BarChart3, ChevronDown, Loader2,
  Users, TrendingUp, PhoneCall, CheckCircle2, XCircle, RefreshCw
} from 'lucide-react';

type LeadStatus = 'new' | 'contacted' | 'converted' | 'closed';

const STATUS_CONFIG: Record<LeadStatus, { label: string; color: string; bg: string; border: string }> = {
  new: { label: 'New', color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/30' },
  contacted: { label: 'Contacted', color: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/30' },
  converted: { label: 'Converted', color: 'text-green-400', bg: 'bg-green-400/10', border: 'border-green-400/30' },
  closed: { label: 'Closed', color: 'text-muted-foreground', bg: 'bg-muted/10', border: 'border-border/30' },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status as LeadStatus] ?? STATUS_CONFIG.new;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${cfg.color} ${cfg.bg} ${cfg.border}`}>
      {cfg.label}
    </span>
  );
}

function ScoreBar({ pct }: { pct: number | null }) {
  if (pct === null) return <span className="text-xs text-muted-foreground/40">—</span>;
  const color = pct >= 70 ? '#22c55e' : pct >= 50 ? '#eab308' : pct >= 30 ? '#f97316' : '#ef4444';
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 rounded-full bg-muted/20 overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="font-data text-xs font-bold" style={{ color }}>{pct.toFixed(0)}%</span>
    </div>
  );
}

interface Lead {
  id: number;
  name: string;
  email: string;
  phone: string;
  shopName: string | null;
  overallPercentage: number | null;
  status: string;
  notes: string | null;
  source: string;
  createdAt: Date | string;
}

function LeadRow({ lead, onStatusChange }: { lead: Lead; onStatusChange: (id: number, status: LeadStatus, notes?: string) => void }) {
  const [open, setOpen] = useState(false);
  const [editNotes, setEditNotes] = useState(lead.notes || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async (status: LeadStatus) => {
    setSaving(true);
    await onStatusChange(lead.id, status, editNotes);
    setSaving(false);
    setOpen(false);
  };

  const date = new Date(lead.createdAt).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });

  return (
    <div className="rounded-xl border border-border/20 bg-card/50 overflow-hidden">
      {/* Main row */}
      <div className="flex items-center gap-3 p-3 sm:p-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-foreground">{lead.name}</span>
            {lead.shopName && (
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Building2 size={10} /> {lead.shopName}
              </span>
            )}
            <StatusBadge status={lead.status} />
          </div>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <a href={`mailto:${lead.email}`} className="text-xs text-muted-foreground hover:text-gold flex items-center gap-1">
              <Mail size={11} /> {lead.email}
            </a>
            <a href={`tel:${lead.phone}`} className="text-xs text-muted-foreground hover:text-gold flex items-center gap-1">
              <Phone size={11} /> {lead.phone}
            </a>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-4">
          <ScoreBar pct={lead.overallPercentage} />
          <span className="text-[10px] text-muted-foreground/60 whitespace-nowrap">{date}</span>
        </div>
        <button
          onClick={() => setOpen(!open)}
          className="ml-2 p-1.5 rounded-lg border border-border/30 hover:border-gold/40 hover:text-gold text-muted-foreground transition-colors"
        >
          <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Expanded panel */}
      {open && (
        <div className="border-t border-border/20 p-4 space-y-4 bg-white/[0.01]">
          <div className="sm:hidden flex items-center gap-4">
            <ScoreBar pct={lead.overallPercentage} />
            <span className="text-[10px] text-muted-foreground/60">{date}</span>
          </div>

          {/* Notes */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Notes</label>
            <textarea
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              rows={3}
              placeholder="Add notes about this lead..."
              className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/20 resize-none"
            />
          </div>

          {/* Status actions */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-2">Update Status</label>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(STATUS_CONFIG) as LeadStatus[]).map((s) => {
                const cfg = STATUS_CONFIG[s];
                const isCurrent = lead.status === s;
                return (
                  <button
                    key={s}
                    onClick={() => handleSave(s)}
                    disabled={saving || isCurrent}
                    className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all disabled:opacity-50 ${
                      isCurrent
                        ? `${cfg.color} ${cfg.bg} ${cfg.border}`
                        : 'border-border/30 text-muted-foreground hover:border-gold/40 hover:text-foreground'
                    }`}
                  >
                    {saving && isCurrent ? <Loader2 size={12} className="animate-spin" /> : null}
                    {cfg.label}
                    {isCurrent && <CheckCircle2 size={12} />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Leads() {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all');

  const { data: leads, isLoading, refetch } = trpc.leads.list.useQuery();
  const { data: stats } = trpc.leads.stats.useQuery();
  const updateStatus = trpc.leads.updateStatus.useMutation({
    onSuccess: () => refetch(),
  });

  const handleStatusChange = async (id: number, status: LeadStatus, notes?: string) => {
    await updateStatus.mutateAsync({ id, status, notes });
  };

  const filtered = (leads ?? []).filter((l: Lead) => statusFilter === 'all' || l.status === statusFilter);

  const statCards = [
    { label: 'Total Leads', value: stats?.total ?? 0, icon: Users, color: 'text-foreground' },
    { label: 'New', value: stats?.byStatus?.new ?? 0, icon: BarChart3, color: 'text-blue-400' },
    { label: 'Contacted', value: stats?.byStatus?.contacted ?? 0, icon: PhoneCall, color: 'text-yellow-400' },
    { label: 'Converted', value: stats?.byStatus?.converted ?? 0, icon: TrendingUp, color: 'text-green-400' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl tracking-wider text-foreground">LEADS</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Self-assessment submissions from potential clients
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="h-8 gap-1.5 border-border/40 text-muted-foreground hover:text-foreground"
          >
            <RefreshCw size={13} /> Refresh
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {statCards.map((s) => (
            <div key={s.label} className="glass-card p-4">
              <div className="flex items-center gap-2 mb-1">
                <s.icon size={14} className={s.color} />
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">{s.label}</span>
              </div>
              <p className={`font-data text-2xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          {(['all', 'new', 'contacted', 'converted', 'closed'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all capitalize ${
                statusFilter === f
                  ? 'border-gold/50 bg-gold/10 text-gold'
                  : 'border-border/30 text-muted-foreground hover:border-gold/30 hover:text-foreground'
              }`}
            >
              {f === 'all' ? `All (${leads?.length ?? 0})` : `${f} (${(leads ?? []).filter((l: Lead) => l.status === f).length})`}
            </button>
          ))}
        </div>

        {/* Leads list */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="animate-spin text-gold" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <XCircle size={32} className="text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm font-semibold text-foreground">No leads yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              {statusFilter === 'all'
                ? 'Share the self-assessment link to start capturing leads.'
                : `No leads with status "${statusFilter}".`}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((lead: Lead) => (
              <LeadRow key={lead.id} lead={lead} onStatusChange={handleStatusChange} />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
