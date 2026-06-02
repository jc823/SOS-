/*
 * Report Page — Customer-facing dashboard at /report?d=<encoded>
 * Shows the supercomputer calculation board first, then reveals the report.
 * Supports interactive revenue tier toggling on the report.
 * Results locking: customers whose shop has resultsUnlocked=false see a blur overlay.
 */
import { useMemo, useState, useCallback } from 'react';
import { useSearch } from 'wouter';
import { decodeReportURL } from '@/lib/report-url';
import { computeSOS, computeScalingProbability } from '@/lib/sos-engine';
import type { RevenueTier } from '@/lib/sos-engine';
import ReportView from '@/components/ReportView';
import CalculationBoard from '@/components/CalculationBoard';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { BOOKING_URL } from '@/const';
import { Lock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Report() {
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const encodedData = params.get('d');
  const [showCalculation, setShowCalculation] = useState(true);

  // Results locking — only applies to customers
  const { user } = useAuth();
  const isCustomer = user?.role === 'customer';
  const portalQuery = trpc.portal.myData.useQuery(undefined, {
    enabled: isCustomer,
    retry: false,
  });
  const resultsLocked = isCustomer && portalQuery.data?.shop?.resultsUnlocked === false;

  const decoded = useMemo(() => {
    if (!encodedData) return null;
    return decodeReportURL(encodedData);
  }, [encodedData]);

  // Interactive revenue tier state — initialized from URL data
  const [activeTier, setActiveTier] = useState<RevenueTier | null>(null);
  const [activeCustomTarget, setActiveCustomTarget] = useState<number | undefined>(undefined);

  // Effective tier: user-selected or from URL
  const effectiveTier = activeTier ?? decoded?.revenueTier ?? '20-30';
  const effectiveCustomTarget = activeTier === 'custom'
    ? (activeCustomTarget ?? decoded?.customTarget ?? 60000)
    : decoded?.customTarget;

  const result = useMemo(() => {
    if (!decoded) return null;
    return computeSOS(decoded.inputs);
  }, [decoded]);

  const probability = useMemo(() => {
    if (!result || !decoded) return null;
    return computeScalingProbability(
      result,
      effectiveTier,
      effectiveTier === 'custom' ? effectiveCustomTarget : undefined
    );
  }, [result, decoded, effectiveTier, effectiveCustomTarget]);

  const handleTierChange = useCallback((tier: RevenueTier, customTarget?: number) => {
    setActiveTier(tier);
    if (tier === 'custom' && customTarget !== undefined) {
      setActiveCustomTarget(customTarget);
    }
  }, []);

  const handleReplayAnimation = useCallback(() => {
    setShowCalculation(true);
  }, []);

  if (!decoded || !result || !probability) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md px-6">
          <img
            src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663344377985/bstGyXVcPKnASnnU.png"
            alt="Scale Detailing"
            className="h-12 w-auto mx-auto opacity-60 mb-4"
          />
          <h1 className="text-xl font-bold text-foreground">Report Not Found</h1>
          <p className="text-sm text-muted-foreground">
            This report link is invalid or has expired. Please contact your Scale Detailing consultant for a new link.
          </p>
        </div>
      </div>
    );
  }

  // Show calculation board animation first
  if (showCalculation) {
    return (
      <CalculationBoard
        result={result}
        probability={probability}
        inputs={decoded.inputs}
        shopName={decoded.meta.shopName}
        onComplete={() => setShowCalculation(false)}
      />
    );
  }

  return (
    <div className="relative">
      {/* Results locked overlay for customers */}
      {resultsLocked && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md px-4">
          <Lock size={36} className="text-gold mb-4" />
          <h2 className="text-2xl font-black text-white mb-2 text-center">
            Your Full Report Is Locked
          </h2>
          <p className="text-sm text-white/60 mb-8 text-center max-w-sm">
            Book a strategy call with your Scale Detailing consultant to unlock
            your complete SOS assessment, action plan, and 90-day growth roadmap.
          </p>
          <Button
            className="h-12 px-8 bg-gold text-black font-bold hover:bg-gold/90"
            onClick={() => window.open(BOOKING_URL, '_blank')}
          >
            Book Your Unlock Call <ArrowRight size={16} className="ml-2" />
          </Button>
        </div>
      )}

      <ReportView
        result={result}
        inputs={decoded.inputs}
        meta={decoded.meta}
        probability={probability}
        isCustomerView={true}
        customerLogoUrl={decoded.logoUrl}
        revenueTier={effectiveTier}
        customTarget={effectiveCustomTarget}
        onTierChange={handleTierChange}
        onReplayAnimation={handleReplayAnimation}
        currentRevenue={decoded.currentRevenue}
        goalRevenue={decoded.goalRevenue}
        businessProfile={decoded.businessProfile}
      />
    </div>
  );
}
