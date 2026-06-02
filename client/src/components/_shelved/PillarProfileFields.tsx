/**
 * PillarProfileFields — inline business profile fields embedded within each pillar card
 * Each pillar gets its own relevant subset of business data inputs.
 *
 * Mapping:
 * - services: Ticket Size by Tier, Service Focus, Facility Type
 * - sales: Customer Repeat Rate
 * - ads: Ad Spend by Channel, Online Presence
 * - team: Employee Count by Role
 */
import { Megaphone, Users, Receipt, Building2, Wrench, RefreshCcw, Globe, HelpCircle } from 'lucide-react';
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

interface ProfileFieldsProps {
  pillarId: string;
  profile: BusinessProfile;
  onChange: (profile: BusinessProfile) => void;
}

function fmt$(n: number | null): string {
  if (n === null || n === 0) return '$0';
  return `$${n.toLocaleString()}`;
}

export default function PillarProfileFields({ pillarId, profile, onChange }: ProfileFieldsProps) {
  switch (pillarId) {
    case 'services':
      return <ServicesFields profile={profile} onChange={onChange} />;
    case 'sales':
      return <SalesFields profile={profile} onChange={onChange} />;
    case 'ads':
      return <AdsFields profile={profile} onChange={onChange} />;
    case 'team':
      return <TeamFields profile={profile} onChange={onChange} />;
    default:
      return null;
  }
}

// ─── Services Pillar: Ticket Size, Service Focus, Facility Type ───

function ServicesFields({ profile, onChange }: { profile: BusinessProfile; onChange: (p: BusinessProfile) => void }) {
  return (
    <div className="space-y-4 pt-1">
      {/* Average Ticket Size */}
      <ProfileSection icon={<Receipt size={13} />} title="Average Ticket Size" subtitle={profile.averageTicketSize ? fmt$(profile.averageTicketSize) : undefined}>
        <DollarInput
          placeholder="e.g. 250"
          value={profile.averageTicketSize}
          onChange={(v) => onChange({ ...profile, averageTicketSize: v })}
        />
      </ProfileSection>

      {/* Service Focus */}
      <ProfileSection icon={<Wrench size={13} />} title="Service Focus" subtitle="Select all that apply">
        <div className="flex flex-wrap gap-1.5">
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
                  rounded-md border px-2.5 py-1.5 text-[11px] font-medium transition-all
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
      </ProfileSection>

      {/* Facility Type */}
      <ProfileSection icon={<Building2 size={13} />} title="Facility Type" subtitle="Select all that apply">
        <div className="flex flex-wrap gap-1.5">
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
                  rounded-md border px-3 py-1.5 text-[11px] font-medium transition-all
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
      </ProfileSection>
    </div>
  );
}

// ─── Sales Pillar: Customer Repeat Rate ───

function SalesFields({ profile, onChange }: { profile: BusinessProfile; onChange: (p: BusinessProfile) => void }) {
  return (
    <div className="pt-1">
      <ProfileSection
        icon={<RefreshCcw size={13} />}
        title="Customer Repeat Rate"
        subtitle={profile.repeatRateUnknown ? '⚠ Unknown' : profile.repeatRate !== null ? `${profile.repeatRate}%` : undefined}
      >
        <div className="flex items-center gap-3">
          <div className="max-w-[140px]">
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
              flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[11px] font-medium transition-all
              ${profile.repeatRateUnknown
                ? 'border-amber-500/50 bg-amber-500/10 text-amber-400'
                : 'border-white/[0.06] bg-white/[0.02] text-muted-foreground hover:border-amber-500/30'
              }
            `}
          >
            <HelpCircle size={11} />
            Don't Know
          </button>
        </div>
      </ProfileSection>
    </div>
  );
}

// ─── Ads Pillar: Ad Spend by Channel, Online Presence ───

function AdsFields({ profile, onChange }: { profile: BusinessProfile; onChange: (p: BusinessProfile) => void }) {
  const totalAdSpend = getTotalAdSpend(profile.adSpend);
  const onlineScore = getOnlinePresenceScore(profile.onlinePresence);

  return (
    <div className="space-y-4 pt-1">
      {/* Ad Spend by Channel */}
      <ProfileSection icon={<Megaphone size={13} />} title="Ad Spend by Channel" subtitle={totalAdSpend > 0 ? `Total: ${fmt$(totalAdSpend)}/mo` : undefined}>
        <div className="grid grid-cols-2 gap-2">
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
      </ProfileSection>

      {/* Online Presence */}
      <ProfileSection icon={<Globe size={13} />} title="Online Presence" subtitle={`Score: ${onlineScore}/100`}>
        <div className="space-y-2.5">
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
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-muted-foreground">Rating:</span>
                <div className="flex gap-0.5">
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
      </ProfileSection>
    </div>
  );
}

// ─── Team Pillar: Employee Count by Role ───

function TeamFields({ profile, onChange }: { profile: BusinessProfile; onChange: (p: BusinessProfile) => void }) {
  const totalEmployees = getTotalEmployees(profile.employees);

  return (
    <div className="pt-1">
      <ProfileSection icon={<Users size={13} />} title="Employees by Role" subtitle={totalEmployees > 0 ? `Total: ${totalEmployees}` : undefined}>
        <div className="space-y-1.5">
          {([
            ['detailers', 'Detailers'],
            ['salesFrontDesk', 'Sales / Front Desk'],
            ['managers', 'Manager(s)'],
            ['adminSupport', 'Admin / Support'],
            ['other', 'Other'],
          ] as const).map(([key, label]) => (
            <div key={key} className="grid grid-cols-[1fr_80px_120px] sm:grid-cols-[1fr_100px_160px] gap-2 items-center">
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
      </ProfileSection>
    </div>
  );
}

// ─── Shared Sub-components ───

function ProfileSection({ icon, title, subtitle, children }: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-gold/10 bg-gold/[0.02] p-3 space-y-2.5">
      <div className="flex items-center gap-2">
        <span className="text-gold/70">{icon}</span>
        <span className="text-[10px] font-bold text-gold/80 uppercase tracking-wider">{title}</span>
        {subtitle && <span className="text-[10px] text-gold/50 ml-auto">{subtitle}</span>}
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
      {label && <label className="text-[9px] text-muted-foreground/70">{label}</label>}
      <div className="relative">
        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground/50">$</span>
        <input
          type="number"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
          placeholder={placeholder || '0'}
          min={0}
          className="w-full rounded-md border border-border/30 bg-muted/15 pl-5 pr-2 py-1.5 text-[11px] font-data text-foreground focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/20 placeholder:text-muted-foreground/30"
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
        className="w-full rounded-md border border-border/30 bg-muted/15 px-2 py-1.5 text-[11px] font-data text-foreground focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/20 placeholder:text-muted-foreground/30 disabled:opacity-40"
      />
      {suffix && (
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-muted-foreground/50">{suffix}</span>
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
      className="flex items-center gap-2 group"
    >
      <div className={`
        w-7 h-4 rounded-full transition-colors relative
        ${checked ? 'bg-gold' : 'bg-muted/40 border border-border/40'}
      `}>
        <div className={`
          absolute top-0.5 w-3 h-3 rounded-full transition-all
          ${checked ? 'left-[calc(100%-14px)] bg-black' : 'left-0.5 bg-muted-foreground/60'}
        `} />
      </div>
      <span className={`text-[11px] transition-colors ${checked ? 'text-foreground' : 'text-muted-foreground'}`}>
        {label}
      </span>
    </button>
  );
}
