import { ENV } from "./_core/env";

interface SellerAnalytics {
  name: string;
  totalRevenue: number;
  totalDeals: number;
  avgDealSize: number;
  currentWeekRevenue: number;
  currentMonthRevenue: number;
  bestWeekRevenue: number;
  activeSinceWeeks: number;
  bestDay: string;
  topSource: string;
  bestHour: string;
}

interface SellerForecast {
  seller: string;
  projectedWeekEndRevenue: number;
  projectedMonthEndRevenue: number;
  weeklyPacePercent: number;
  monthlyPacePercent: number;
}

interface ShopHealth {
  shopId: string;
  shopName: string;
  grade: string;
  revenue: number;
  daysSinceLastSale: number;
  healthScore: number;
  location?: string;
}

export interface SalesArenaOverview {
  generatedAt: string;
  summary: {
    totalAllTimeRevenue: number;
    totalAllTimeSales: number;
    currentMonthRevenue: number;
    currentMonthSales: number;
    currentWeekRevenue: number;
    currentWeekSales: number;
  };
  forecasts: {
    teamMonthlyTrend: string;
    teamWeeklyTrend: string;
    teamProjectedWeekEndRevenue: number;
    teamProjectedWeekEndDeals: number;
    teamProjectedMonthEndRevenue: number;
    teamProjectedMonthEndDeals: number;
    teamAvgWeeklyRevenue: number;
    teamAvgMonthlyRevenue: number;
    sellers: SellerForecast[];
  };
  repAnalytics: {
    teamTotals: {
      avgDealSize: number;
    };
    sellers: SellerAnalytics[];
  };
  shopHealth: ShopHealth[];
}

let lastSync: Date | null = null;
let cachedData: SalesArenaOverview | null = null;

export async function syncFromSalesArena(): Promise<{
  success: boolean;
  message: string;
  salesDataIds: number[];
  teamSnapshotIds: number[];
  errors: string[];
}> {
  if (!ENV.salesArenaApiUrl || !ENV.salesArenaApiKey) {
    return {
      success: false,
      message: "Sales Arena API not configured",
      salesDataIds: [],
      teamSnapshotIds: [],
      errors: ["API not configured"],
    };
  }

  try {
    const res = await fetch(`${ENV.salesArenaApiUrl}/api/data/overview`, {
      headers: { Authorization: `Bearer ${ENV.salesArenaApiKey}` },
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
      return {
        success: false,
        message: `API returned ${res.status}`,
        salesDataIds: [],
        teamSnapshotIds: [],
        errors: [`HTTP ${res.status}`],
      };
    }

    cachedData = (await res.json()) as SalesArenaOverview;
    lastSync = new Date();
    return {
      success: true,
      message: `Synced at ${lastSync.toISOString()}`,
      salesDataIds: [],
      teamSnapshotIds: [],
      errors: [],
    };
  } catch (err) {
    return {
      success: false,
      message: String(err),
      salesDataIds: [],
      teamSnapshotIds: [],
      errors: [String(err)],
    };
  }
}

export function getSalesArenaLiveData(): {
  data: SalesArenaOverview | null;
  lastSync: string | null;
} {
  return {
    data: cachedData,
    lastSync: lastSync?.toISOString() ?? null,
  };
}
