// ─── Types ────────────────────────────────────────────────────────────────────

export type FacilityType = "mobile" | "home_garage" | "shared_space" | "dedicated_shop";
export type ServiceFocus =
  | "maintenance_wash"
  | "paint_correction"
  | "ceramic_coating"
  | "ppf"
  | "window_tint"
  | "wrap_vinyl"
  | "commercial_fleet";

export interface AdSpendByChannel {
  googleAds: number | null;
  facebookMeta: number | null;
}

export interface EmployeeRole {
  count: number;
  monthlyCost: number | null;
}

export interface EmployeeCountByRole {
  detailers: EmployeeRole;
  salesFrontDesk: EmployeeRole;
  managers: EmployeeRole;
  adminSupport: EmployeeRole;
  other: EmployeeRole;
}

export interface OnlinePresence {
  googleBusinessProfile: boolean;
  googleRating: number | null;
  website: boolean;
  activeSocialMedia: boolean;
  onlineBooking: boolean;
}

export interface BusinessProfile {
  adSpend: AdSpendByChannel;
  employees: EmployeeCountByRole;
  averageTicketSize: number | null;
  yearsInBusiness: number | null;
  facilityTypes: FacilityType[];
  serviceFocus: ServiceFocus[];
  repeatRate: number | null;
  repeatRateUnknown: boolean;
  onlinePresence: OnlinePresence;
}

// ─── Labels ───────────────────────────────────────────────────────────────────

export const FACILITY_TYPE_LABELS: Record<FacilityType, string> = {
  mobile: "Mobile",
  home_garage: "Home Garage",
  shared_space: "Shared Space",
  dedicated_shop: "Dedicated Shop",
};

export const SERVICE_FOCUS_LABELS: Record<ServiceFocus, string> = {
  maintenance_wash: "Maintenance Wash/Detail",
  paint_correction: "Paint Correction",
  ceramic_coating: "Ceramic Coating",
  ppf: "PPF",
  window_tint: "Window Tint",
  wrap_vinyl: "Wrap/Vinyl",
  commercial_fleet: "Commercial/Fleet",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getTotalAdSpend(adSpend: AdSpendByChannel): number {
  return (adSpend.googleAds ?? 0) + (adSpend.facebookMeta ?? 0);
}

export function getTotalEmployees(employees: EmployeeCountByRole): number {
  return (
    employees.detailers.count +
    employees.salesFrontDesk.count +
    employees.managers.count +
    employees.adminSupport.count +
    employees.other.count
  );
}

export function getTotalLaborCost(employees: EmployeeCountByRole): number {
  return (
    (employees.detailers.monthlyCost ?? 0) +
    (employees.salesFrontDesk.monthlyCost ?? 0) +
    (employees.managers.monthlyCost ?? 0) +
    (employees.adminSupport.monthlyCost ?? 0) +
    (employees.other.monthlyCost ?? 0)
  );
}

export function getOnlinePresenceScore(presence: OnlinePresence): number {
  let score = 0;
  if (presence.googleBusinessProfile) score += 25;
  if (presence.website) score += 25;
  if (presence.activeSocialMedia) score += 25;
  if (presence.onlineBooking) score += 25;
  return score;
}

export function createEmptyBusinessProfile(): BusinessProfile {
  return {
    adSpend: { googleAds: null, facebookMeta: null },
    employees: {
      detailers: { count: 0, monthlyCost: null },
      salesFrontDesk: { count: 0, monthlyCost: null },
      managers: { count: 0, monthlyCost: null },
      adminSupport: { count: 0, monthlyCost: null },
      other: { count: 0, monthlyCost: null },
    },
    averageTicketSize: null,
    yearsInBusiness: null,
    facilityTypes: [],
    serviceFocus: [],
    repeatRate: null,
    repeatRateUnknown: false,
    onlinePresence: {
      googleBusinessProfile: false,
      googleRating: null,
      website: false,
      activeSocialMedia: false,
      onlineBooking: false,
    },
  };
}
