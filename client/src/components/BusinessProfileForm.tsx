/**
 * BusinessProfileForm — collapsible form section for capturing business data points
 * 8 sections: Ad Spend, Employees, Ticket Size, Years in Business,
 * Facility Type, Service Focus, Repeat Rate, Online Presence
 */
import { useState } from 'react';
import { ChevronDown, ChevronUp, Megaphone, Users, Receipt, Clock, Building2, Wrench, RefreshCcw, Globe, HelpCircle } from 'lucide-react';
import type {
  BusinessProfile,
  FacilityType,
  ServiceFocus,
} from '@shared/business-profile';
import {
  FACILITY_TYPE_LABELS,
  SERVICE_FOCUS_LABELS,
  getTotalAdSpend,
  getTotalEmployees,
  getOnlinePresenceScore,
} from '@shared/business-profile';

interface Props {
  profile: BusinessProfile;
  onChange: (profile: BusinessProfile) => void;
}

function fmt$(n: number | null): string {
  if (n === null || n === 0) return '$0';
  return `$${n.toLocaleString()}`;
}

export default function BusinessProfileForm({ profile, onChange }: Props) {
  const [expanded, setExpanded] = useState(true);

  const totalAdSpend = getTotalAdSpend(profile.adSpend);
  const totalEmployees = getTotalEmployees(profile.employees);
  const avgTicket = profile.averageTicketSize;
  const onlineScore = getOnlinePresenceScore(profile.onlinePresence);

  // Quick summary chips
  const chips: string[] = [];
  if (totalAdSpend > 0) chips.push(`${fmt$(totalAdSpend)}/mo ads`);
  if (totalEmployees > 0) chips.push(`${totalEmployees} employees`);
  if (avgTicket) chips.push(`${fmt$(avgTicket)} avg ticket`);
  if (profile.yearsInBusiness) chips.push(`${profile.yearsInBusiness}yr`);
  if (profile.facilityTypes.length > 0) chips.push(profile.facilityTypes.map(f => FACILITY_TYPE_LABELS[f]).join(', '));

  return (
    <div className="glass-card overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-white/[0.04] transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <Building2 size={16} className="text-gold" />
          <h3 className="text-sm font-bold text-foreground">Business Profile</h3>
          {chips.length > 0 && !expanded && (
            <div className="flex items-center gap-1.5 ml-2">
              {chips.slice(0, 3).map((chip, i) => (
                <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-gold/10 text-gold border border-gold/20">
                  {chip}
                </span>
              ))}
              {chips.length > 3 && (
                <span className="text-[10px] text-muted-foreground">+{chips.length - 3} more</span>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground">Enriches reports & cost analysis</span>
          {expanded ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
        </div>
      </button>

      {expanded && (
        <div className="px-4 sm:px-5 pb-5 space-y-5">
          {/* ─── 1. Ad Spend by Channel ─── */}
          <Section icon={<Megaphone size={14} />} title="Ad Spend by Channel" subtitle={totalAdSpend > 0 ? `Total: ${fmt$(totalAdSpend)}/mo` : undefined}>
            <div className="grid grid-cols-2 gap-3">
              {([
                ['googleAds', 'Google Ads'],
                ['facebookMeta', 'Meta (Facebook + Instagram)'],
              ] as const).map(([key, label]) => (
                <DollarInput
                  key={key}
                  label={label}
                  value={profile.adSpend[key]}
                  onChange={(v) => onChange({ ...profile, adSpend: { ...profile.adSpend, [key]: v } })}
                />
              ))}
            </div>
          </Section>

          {/* ─── 2. Employee Count by Role ─── */}
          <Section icon={<Users size={14} />} title="Employees by Role" subtitle={totalEmployees > 0 ? `Total: ${totalEmployees}` : undefined}>
            <div className="space-y-2">
              {([
                ['detailers', 'Detailers'],
                ['salesFrontDesk', 'Sales / Front Desk'],
                ['managers', 'Manager(s)'],
                ['adminSupport', 'Admin / Support'],
                ['other', 'Other'],
              ] as const).map(([key, label]) => (
                <div key={key} className="grid grid-cols-[1fr_100px_140px] sm:grid-cols-[1fr_120px_180px] gap-2 items-center">
                  <span className="text-xs text-muted-foreground">{label}</span>
                  <NumberInput
                    placeholder="Count"
                    value={profile.employees[key].count || null}
                    onChange={(v) => onChange({
                      ...profile,
                      employees: {
                        ...profile.employees,
                        [key]: { ...profile.employees[key], count: v || 0 },
                      },
                    })}
                    min={0}
                  />
                  <DollarInput
                    label=""
                    placeholder="Mo. cost (opt)"
                    value={profile.employees[key].monthlyCost}
                    onChange={(v) => onChange({
                      ...profile,
                      employees: {
                        ...profile.employees,
                        [key]: { ...profile.employees[key], monthlyCost: v },
                      },
                    })}
                    compact
                  />
                </div>
              ))}
            </div>
          </Section>

          {/* ─── 3. Average Ticket Size ─── */}
          <Section icon={<Receipt size={14} />} title="Average Ticket Size" subtitle={avgTicket ? fmt$(avgTicket) : undefined}>
            <div className="max-w-[200px]">
              <DollarInput
                label=""
                placeholder="e.g. 250"
                value={profile.averageTicketSize}
                onChange={(v) => onChange({ ...profile, averageTicketSize: v })}
              />
            </div>
          </Section>

          {/* ─── 4. Years in Business ─── */}
          <Section icon={<Clock size={14} />} title="Years in Business">
            <div className="max-w-[200px]">
              <NumberInput
                placeholder="e.g. 3"
                value={profile.yearsInBusiness}
                onChange={(v) => onChange({ ...profile, yearsInBusiness: v })}
                min={0}
                suffix="years"
              />
            </div>
          </Section>

          {/* ─── 5. Facility Type (multi-select) ─── */}
          <Section icon={<Building2 size={14} />} title="Facility Type" subtitle="Select all that apply">
            <div className="flex flex-wrap gap-2">
              {(Object.entries(FACILITY_TYPE_LABELS) as [FacilityType, string][]).map(([key, label]) => {
                const selected = profile.facilityTypes.includes(key);
                return (
                  <button
                    key={key}
                    onClick={() => {
                      const next = selected
                        ? profile.facilityTypes.filter(f => f !== key)
                        : [...profile.facilityTypes, key];
                      onChange({ ...profile, facilityTypes: next });
                    }}
                    className={`
                      rounded-lg border px-4 py-2 text-sm font-medium transition-all
                      ${selected
                        ? 'border-gold bg-gold/10 text-gold'
                        : 'border-white/[0.06] bg-white/[0.02] text-muted-foreground hover:border-gold/30 hover:text-foreground'
                      }
                    `}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </Section>

          {/* ─── 6. Service Focus (multi-select) ─── */}
          <Section icon={<Wrench size={14} />} title="Service Focus" subtitle="Select all that apply">
            <div className="flex flex-wrap gap-2">
              {(Object.entries(SERVICE_FOCUS_LABELS) as [ServiceFocus, string][]).map(([key, label]) => {
                const selected = profile.serviceFocus.includes(key);
                return (
                  <button
                    key={key}
                    onClick={() => {
                      const next = selected
                        ? profile.serviceFocus.filter(f => f !== key)
                        : [...profile.serviceFocus, key];
                      onChange({ ...profile, serviceFocus: next });
                    }}
                    className={`
                      rounded-lg border px-3 py-2 text-xs font-medium transition-all
                      ${selected
                        ? 'border-gold bg-gold/10 text-gold'
                        : 'border-white/[0.06] bg-white/[0.02] text-muted-foreground hover:border-gold/30 hover:text-foreground'
                      }
                    `}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </Section>

          {/* ─── 7. Customer Repeat Rate ─── */}
          <Section icon={<RefreshCcw size={14} />} title="Customer Repeat Rate" subtitle={profile.repeatRateUnknown ? "⚠ Unknown — flagged as weakness" : profile.repeatRate !== null ? `${profile.repeatRate}%` : undefined}>
            <div className="flex items-center gap-3">
              <div className="max-w-[160px]">
                <NumberInput
                  placeholder="e.g. 40"
                  value={profile.repeatRateUnknown ? null : profile.repeatRate}
                  onChange={(v) => onChange({ ...profile, repeatRate: v, repeatRateUnknown: false })}
                  min={0}
                  max={100}
                  suffix="%"
                  disabled={profile.repeatRateUnknown}
                />
              </div>
              <button
                onClick={() => onChange({ ...profile, repeatRateUnknown: !profile.repeatRateUnknown, repeatRate: null })}
                className={`
                  flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-all
                  ${profile.repeatRateUnknown
                    ? 'border-amber-500/50 bg-amber-500/10 text-amber-400'
                    : 'border-white/[0.06] bg-white/[0.02] text-muted-foreground hover:border-amber-500/30'
                  }
                `}
              >
                <HelpCircle size={12} />
                Don't Know
              </button>
            </div>
          </Section>

          {/* ─── 8. Online Presence ─── */}
          <Section icon={<Globe size={14} />} title="Online Presence" subtitle={`Score: ${onlineScore}/100`}>
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <Toggle
                  label="Google Business Profile"
                  checked={profile.onlinePresence.googleBusinessProfile}
                  onChange={(v) => onChange({
                    ...profile,
                    onlinePresence: {
                      ...profile.onlinePresence,
                      googleBusinessProfile: v,
                      googleRating: v ? profile.onlinePresence.googleRating : null,
                    },
                  })}
                />
                {profile.onlinePresence.googleBusinessProfile && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground">Rating:</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => onChange({
                            ...profile,
                            onlinePresence: { ...profile.onlinePresence, googleRating: star },
                          })}
                          className={`text-sm transition-colors ${
                            (profile.onlinePresence.googleRating || 0) >= star
                              ? 'text-gold'
                              : 'text-muted-foreground/30'
                          }`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <Toggle
                label="Website"
                checked={profile.onlinePresence.website}
                onChange={(v) => onChange({ ...profile, onlinePresence: { ...profile.onlinePresence, website: v } })}
              />
              <Toggle
                label="Active Social Media"
                checked={profile.onlinePresence.activeSocialMedia}
                onChange={(v) => onChange({ ...profile, onlinePresence: { ...profile.onlinePresence, activeSocialMedia: v } })}
              />
              <Toggle
                label="Online Booking System"
                checked={profile.onlinePresence.onlineBooking}
                onChange={(v) => onChange({ ...profile, onlinePresence: { ...profile.onlinePresence, onlineBooking: v } })}
              />
            </div>
          </Section>
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ───

function Section({ icon, title, subtitle, children }: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2">
        <span className="text-gold">{icon}</span>
        <span className="text-xs font-bold text-foreground uppercase tracking-wider">{title}</span>
        {subtitle && <span className="text-[10px] text-gold ml-auto">{subtitle}</span>}
      </div>
      {children}
    </div>
  );
}

function DollarInput({ label, value, onChange, placeholder, compact }: {
  label?: string;
  value: number | null;
  onChange: (v: number | null) => void;
  placeholder?: string;
  compact?: boolean;
}) {
  return (
    <div className={compact ? '' : 'space-y-1'}>
      {label && <label className="text-[10px] text-muted-foreground">{label}</label>}
      <div className="relative">
        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
        <input
          type="number"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
          placeholder={placeholder || '0'}
          min={0}
          className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] pl-6 pr-3 py-2 text-xs font-data text-foreground focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/20 placeholder:text-muted-foreground/40"
        />
      </div>
    </div>
  );
}

function NumberInput({ value, onChange, placeholder, min, max, suffix, disabled }: {
  value: number | null;
  onChange: (v: number | null) => void;
  placeholder?: string;
  min?: number;
  max?: number;
  suffix?: string;
  disabled?: boolean;
}) {
  return (
    <div className="relative">
      <input
        type="number"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
        placeholder={placeholder || '0'}
        min={min}
        max={max}
        disabled={disabled}
        className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs font-data text-foreground focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/20 placeholder:text-muted-foreground/40 disabled:opacity-40"
      />
      {suffix && (
        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">{suffix}</span>
      )}
    </div>
  );
}

function Toggle({ label, checked, onChange }: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="flex items-center gap-2.5 group"
    >
      <div className={`
        w-8 h-4.5 rounded-full transition-colors relative
        ${checked ? 'bg-gold' : 'bg-muted/40 border border-border/40'}
      `}>
        <div className={`
          absolute top-0.5 w-3.5 h-3.5 rounded-full transition-all
          ${checked ? 'left-[calc(100%-16px)] bg-black' : 'left-0.5 bg-muted-foreground/60'}
        `} />
      </div>
      <span className={`text-xs transition-colors ${checked ? 'text-foreground' : 'text-muted-foreground'}`}>
        {label}
      </span>
    </button>
  );
}
