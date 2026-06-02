/**
 * Ad Spend ROI Engine
 * Calculates expected leads, closes, and revenue from ad spend
 * based on CPL baselines by channel and service focus.
 */
import type { BusinessProfile } from "@shared/business-profile";

// ─── Types ─────────────────────────────────────────────────────────────────
export type EfficiencyRating = "excellent" | "good" | "fair" | "poor";

export interface ChannelROI {
  channel: string;
  channelLabel: string;
  monthlySpend: number;
  estimatedCPL: number;
  expectedLeads: number;
  expectedCloses: number;
  expectedRevenue: number;
  roi: number; // as integer percentage, e.g. 150 = 150%
  efficiency: EfficiencyRating;
}

export interface AdSpendAnalysis {
  totalMonthlySpend: number;
  channelBreakdowns: ChannelROI[];
  totalExpectedLeads: number;
  totalExpectedCloses: number;
  totalExpectedRevenue: number;
  blendedCloseRate: number; // percentage e.g. 15.5
  blendedCPL: number;
  revenuePerDollarSpent: number;
  overallROI: number; // integer percentage
  bestChannel: string | null;
  worstChannel: string | null;
  isOverspending: boolean;
  isUnderspending: boolean;
  recommendation: string;
}

// ─── CPL Baselines ─────────────────────────────────────────────────────────
const CPL_BASELINE = {
  google: { standard: [25, 45], premium: [75, 150] } as const,
  meta: { standard: [15, 30], premium: [50, 100] } as const,
};

function getCPL(channel: "google" | "meta", isHighEnd: boolean, adsScore: number): number {
  const range = isHighEnd ? CPL_BASELINE[channel].premium : CPL_BASELINE[channel].standard;
  const efficiency = Math.min(1, adsScore / 5);
  return Math.round(range[1] - (range[1] - range[0]) * efficiency);
}

// ─── Core calculation ───────────────────────────────────────────────────────
export function computeAdSpendROI(
  profile: Pick<BusinessProfile, "adSpend" | "serviceFocus" | "averageTicketSize">,
  adsScore: number,
  salesScore: number,
  avgTicketOverride?: number,
): AdSpendAnalysis {
  const isHighEnd =
    profile.serviceFocus?.some((s) =>
      ["ceramic_coating", "ppf", "window_tint", "wrap_vinyl"].includes(s),
    ) ?? false;

  const closeRate = Math.min(0.35, Math.max(0.1, (salesScore / 5) * 0.35));
  const avgTicket = avgTicketOverride ?? profile.averageTicketSize ?? 200;

  const googleSpend = profile.adSpend.googleAds ?? 0;
  const metaSpend = profile.adSpend.facebookMeta ?? 0;

  const channels: ChannelROI[] = [];

  if (googleSpend > 0) {
    const cpl = getCPL("google", isHighEnd, adsScore);
    const leads = googleSpend / cpl;
    const closes = leads * closeRate;
    const revenue = closes * avgTicket;
    const roi = googleSpend > 0 ? Math.round((revenue / googleSpend) * 100) : 0;
    channels.push({
      channel: "google",
      channelLabel: "Google Ads",
      monthlySpend: googleSpend,
      estimatedCPL: cpl,
      expectedLeads: leads,
      expectedCloses: closes,
      expectedRevenue: revenue,
      roi,
      efficiency: roi >= 300 ? "excellent" : roi >= 200 ? "good" : roi >= 100 ? "fair" : "poor",
    });
  }

  if (metaSpend > 0) {
    const cpl = getCPL("meta", isHighEnd, adsScore);
    const leads = metaSpend / cpl;
    const closes = leads * closeRate;
    const revenue = closes * avgTicket;
    const roi = metaSpend > 0 ? Math.round((revenue / metaSpend) * 100) : 0;
    channels.push({
      channel: "meta",
      channelLabel: "Meta/Facebook",
      monthlySpend: metaSpend,
      estimatedCPL: cpl,
      expectedLeads: leads,
      expectedCloses: closes,
      expectedRevenue: revenue,
      roi,
      efficiency: roi >= 300 ? "excellent" : roi >= 200 ? "good" : roi >= 100 ? "fair" : "poor",
    });
  }

  const totalSpend = googleSpend + metaSpend;
  const totalLeads = channels.reduce((s, c) => s + c.expectedLeads, 0);
  const totalCloses = channels.reduce((s, c) => s + c.expectedCloses, 0);
  const totalRevenue = channels.reduce((s, c) => s + c.expectedRevenue, 0);
  const overallROI = totalSpend > 0 ? Math.round((totalRevenue / totalSpend) * 100) : 0;
  const blendedCPL = totalLeads > 0 ? totalSpend / totalLeads : 0;
  const revenuePerDollarSpent = totalSpend > 0 ? totalRevenue / totalSpend : 0;
  const blendedCloseRate = parseFloat((closeRate * 100).toFixed(1));

  const sorted = [...channels].sort((a, b) => b.roi - a.roi);
  const bestChannel = sorted[0]?.channelLabel ?? null;
  const worstChannel = sorted.length > 1 ? sorted[sorted.length - 1]?.channelLabel ?? null : null;

  let recommendation = "Start with $500/mo on Google LSA to test your market.";
  if (totalSpend > 0 && overallROI < 100) {
    recommendation = "Your ad ROI is below target — improve your sales process before increasing spend.";
  } else if (totalSpend > 0 && overallROI >= 300) {
    recommendation = "Strong ROI — consider scaling your ad budget by 20-30% this quarter.";
  }

  return {
    totalMonthlySpend: totalSpend,
    channelBreakdowns: channels,
    totalExpectedLeads: totalLeads,
    totalExpectedCloses: totalCloses,
    totalExpectedRevenue: totalRevenue,
    blendedCloseRate,
    blendedCPL: Math.round(blendedCPL),
    revenuePerDollarSpent: Math.round(revenuePerDollarSpent * 100) / 100,
    overallROI,
    bestChannel,
    worstChannel,
    isOverspending: overallROI < 100 && totalSpend > 500,
    isUnderspending: overallROI > 300 && totalSpend < 2000,
    recommendation,
  };
}

// ─── Utilities ─────────────────────────────────────────────────────────────
export function getEfficiencyColor(efficiency: EfficiencyRating): string {
  switch (efficiency) {
    case "excellent": return "#27AE60";
    case "good": return "#2ECC71";
    case "fair": return "#F39C12";
    case "poor": return "#E74C3C";
  }
}
