/**
 * BrandingContext — loads shop branding when a shop user logs in.
 * Super admins and users without a shop see Scale Detailing defaults.
 */
import { createContext, useContext, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

export interface Branding {
  name: string;
  logoUrl: string | null;
  brandColor: string;      // primary color hex
  accentColor: string;     // accent color hex
  isCustom: boolean;       // true if shop has custom branding
}

const DEFAULTS: Branding = {
  name: "Scale Toolkit",
  logoUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663344377985/bstGyXVcPKnASnnU.png",
  brandColor: "#C9A84C",   // gold
  accentColor: "#A87C2A",
  isCustom: false,
};

const BrandingContext = createContext<Branding>(DEFAULTS);

export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const isShopUser = !loading && !!user && !!user.shopId && user.role !== "super_admin" && user.role !== "admin";

  const portalQuery = trpc.portal.myData.useQuery(undefined, {
    enabled: isShopUser,
    staleTime: 1000 * 60 * 5,
  });

  const shop = portalQuery.data?.shop;

  const branding: Branding = isShopUser && shop && (shop.brandColor || shop.brandName)
    ? {
        name: shop.brandName || shop.name,
        logoUrl: shop.logoUrl ?? null,
        brandColor: shop.brandColor || DEFAULTS.brandColor,
        accentColor: shop.brandAccentColor || DEFAULTS.accentColor,
        isCustom: true,
      }
    : DEFAULTS;

  // Apply brand colors as CSS variables
  useEffect(() => {
    document.documentElement.style.setProperty("--brand-color", branding.brandColor);
    document.documentElement.style.setProperty("--brand-accent", branding.accentColor);
    return () => {
      document.documentElement.style.setProperty("--brand-color", DEFAULTS.brandColor);
      document.documentElement.style.setProperty("--brand-accent", DEFAULTS.accentColor);
    };
  }, [branding.brandColor, branding.accentColor]);

  return (
    <BrandingContext.Provider value={branding}>
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding() {
  return useContext(BrandingContext);
}
