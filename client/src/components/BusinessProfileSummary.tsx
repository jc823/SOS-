/**
 * BusinessProfileSummary — read-only display of business profile data in reports
 * Shows a condensed, visually rich summary of the 8 data points
 */
import { motion } from 'framer-motion';
import { Megaphone, Users, Receipt, Clock, Building2, Wrench, RefreshCcw, Globe, AlertTriangle } from 'lucide-react';
import type { BusinessProfile } from '@shared/business-profile';
import {
  FACILITY_TYPE_LABELS,
  SERVICE_FOCUS_LABELS,
  getTotalAdSpend,
  getTotalEmployees,
  getTotalLaborCost,
  getOnlinePresenceScore,
} from '@shared/business-profile';

interface Props {
  profile: BusinessProfile;
}

function fmt$(n: number | null | undefined): string {
  if (!n) return '$0';
  return `$${n.toLocaleString()}`;
}

export default function BusinessProfileSummary({ profile }: Props) {
  const totalAdSpend = getTotalAdSpend(profile.adSpend);
  const totalEmployees = getTotalEmployees(profile.employees);
  const totalLaborCost = getTotalLaborCost(profile.employees);
  const avgTicket = profile.averageTicketSize;
  const onlineScore = getOnlinePresenceScore(profile.onlinePresence);

  // Check if profile has any meaningful data
  const hasData = totalAdSpend > 0 ||
    totalEmployees > 0 ||
    avgTicket !== null ||
    profile.yearsInBusiness !== null ||
    profile.facilityTypes.length > 0 ||
    profile.serviceFocus.length > 0 ||
    profile.repeatRate !== null ||
    profile.repeatRateUnknown ||
    profile.onlinePresence.googleBusinessProfile ||
    profile.onlinePresence.website ||
    profile.onlinePresence.activeSocialMedia ||
    profile.onlinePresence.onlineBooking;

  if (!hasData) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-4"
    >
      {/* Section Header */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center">
          <Building2 size={16} className="text-gold" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Business Profile</h3>
          <p className="text-[10px] text-muted-foreground">Snapshot of shop operations at time of assessment</p>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {totalAdSpend > 0 && (
          <KPICard icon={<Megaphone size={14} />} label="Monthly Ad Spend" value={fmt$(totalAdSpend)} color="text-blue-400" />
        )}
        {totalEmployees > 0 && (
          <KPICard
            icon={<Users size={14} />}
            label="Total Employees"
            value={`${totalEmployees}`}
            sub={totalLaborCost !== null ? `${fmt$(totalLaborCost)}/mo labor` : undefined}
            color="text-purple-400"
          />
        )}
        {avgTicket !== null && (
          <KPICard icon={<Receipt size={14} />} label="Avg Ticket Size" value={fmt$(avgTicket)} color="text-emerald-400" />
        )}
        {profile.yearsInBusiness !== null && (
          <KPICard
            icon={<Clock size={14} />}
            label="Years in Business"
            value={`${profile.yearsInBusiness}`}
            sub={profile.yearsInBusiness < 2 ? 'Startup phase' : profile.yearsInBusiness >= 10 ? 'Established' : 'Growing'}
            color="text-amber-400"
          />
        )}
      </div>

      {/* Detail Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Ad Spend Breakdown */}
        {totalAdSpend > 0 && (
          <DetailCard icon={<Megaphone size={14} />} title="Ad Spend Breakdown">
            <div className="space-y-1.5">
              {([
                ['Google Ads', profile.adSpend.googleAds],
                ['Meta (Facebook + Instagram)', profile.adSpend.facebookMeta],
              ] as [string, number | null][]).filter(([, v]) => v && v > 0).map(([label, value]) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">{label}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1 rounded-full bg-muted/20 overflow-hidden">
                      <div className="h-full rounded-full bg-blue-400/60" style={{ width: `${Math.min(100, ((value || 0) / totalAdSpend) * 100)}%` }} />
                    </div>
                    <span className="text-[10px] font-data text-foreground">{fmt$(value)}</span>
                  </div>
                </div>
              ))}
            </div>
          </DetailCard>
        )}

        {/* Employee Breakdown */}
        {totalEmployees > 0 && (
          <DetailCard icon={<Users size={14} />} title="Team Composition">
            <div className="space-y-1.5">
              {([
                ['Detailers', profile.employees.detailers],
                ['Sales/Front Desk', profile.employees.salesFrontDesk],
                ['Managers', profile.employees.managers],
                ['Admin/Support', profile.employees.adminSupport],
                ['Other', profile.employees.other],
              ] as [string, { count: number; monthlyCost: number | null }][]).filter(([, r]) => r.count > 0).map(([label, role]) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">{label}</span>
                  <span className="text-[10px] font-data text-foreground">
                    {role.count}{role.monthlyCost !== null ? ` · ${fmt$(role.monthlyCost)}/mo` : ''}
                  </span>
                </div>
              ))}
            </div>
          </DetailCard>
        )}

        {/* Average Ticket Size */}
        {avgTicket !== null && (
          <DetailCard icon={<Receipt size={14} />} title="Average Ticket Size">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">Avg. per service</span>
              <span className="text-sm font-data font-bold text-gold">{fmt$(avgTicket)}</span>
            </div>
          </DetailCard>
        )}

        {/* Online Presence */}
        {(profile.onlinePresence.googleBusinessProfile || profile.onlinePresence.website || profile.onlinePresence.activeSocialMedia || profile.onlinePresence.onlineBooking) && (
          <DetailCard icon={<Globe size={14} />} title={`Online Presence · ${onlineScore}/100`}>
            <div className="space-y-1.5">
              <PresenceRow label="Google Business Profile" active={profile.onlinePresence.googleBusinessProfile} extra={profile.onlinePresence.googleRating ? `${profile.onlinePresence.googleRating}★` : undefined} />
              <PresenceRow label="Website" active={profile.onlinePresence.website} />
              <PresenceRow label="Active Social Media" active={profile.onlinePresence.activeSocialMedia} />
              <PresenceRow label="Online Booking" active={profile.onlinePresence.onlineBooking} />
            </div>
          </DetailCard>
        )}
      </div>

      {/* Tags Row: Facility Type + Service Focus + Repeat Rate */}
      <div className="flex flex-wrap gap-3">
        {profile.facilityTypes.length > 0 && (
          <div className="flex items-center gap-1.5">
            <Building2 size={12} className="text-gold/60" />
            {profile.facilityTypes.map(f => (
              <span key={f} className="text-[10px] px-2 py-0.5 rounded-full bg-gold/10 text-gold border border-gold/20">
                {FACILITY_TYPE_LABELS[f]}
              </span>
            ))}
          </div>
        )}
        {profile.serviceFocus.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <Wrench size={12} className="text-gold/60" />
            {profile.serviceFocus.map(s => (
              <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-muted/20 text-muted-foreground border border-border/20">
                {SERVICE_FOCUS_LABELS[s]}
              </span>
            ))}
          </div>
        )}
        {(profile.repeatRate !== null || profile.repeatRateUnknown) && (
          <div className="flex items-center gap-1.5">
            <RefreshCcw size={12} className={profile.repeatRateUnknown ? 'text-amber-400' : 'text-gold/60'} />
            {profile.repeatRateUnknown ? (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                <AlertTriangle size={10} /> Repeat rate unknown
              </span>
            ) : (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold/10 text-gold border border-gold/20">
                {profile.repeatRate}% repeat rate
              </span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Sub-components ───

function KPICard({ icon, label, value, sub, color }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  color: string;
}) {
  return (
    <div className="rounded-lg border border-border/20 bg-white/[0.02] p-3">
      <div className="flex items-center gap-1.5 mb-1">
        <span className={color}>{icon}</span>
        <span className="text-[9px] uppercase tracking-wider text-muted-foreground/50">{label}</span>
      </div>
      <p className="font-data text-lg font-bold text-foreground">{value}</p>
      {sub && <p className="text-[9px] text-muted-foreground/40 mt-0.5">{sub}</p>}
    </div>
  );
}

function DetailCard({ icon, title, children }: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border/20 bg-white/[0.02] p-3 space-y-2">
      <div className="flex items-center gap-1.5">
        <span className="text-gold">{icon}</span>
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{title}</span>
      </div>
      {children}
    </div>
  );
}

function PresenceRow({ label, active, extra }: { label: string; active: boolean; extra?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[10px] text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1.5">
        {extra && <span className="text-[10px] font-data text-gold">{extra}</span>}
        <span className={`text-[10px] font-bold ${active ? 'text-[#2ECC71]' : 'text-[#E74C3C]'}`}>
          {active ? 'Yes' : 'No'}
        </span>
      </div>
    </div>
  );
}
