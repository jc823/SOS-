/*
 * Home — Scale Toolkit · SOS Assessment Tool
 * This is the main assessment entry page. Authenticated users can:
 * - Enter shop details and score all 30 subcategories
 * - Save assessments to the database
 * - Open customer-facing reports
 * - Navigate to dashboard for history/comparisons
 */
import { useAuth } from '@/_core/hooks/useAuth';
import { useState, useMemo, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RotateCcw, ChevronDown, ChevronUp, FileText, DollarSign, ExternalLink, Save, LayoutDashboard, LogOut, RefreshCcw, UserPlus, Mail, Send, CheckCircle2, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocation, Link } from 'wouter';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';
import { getLoginUrl } from '@/const';
import AssessmentHeader from '@/components/AssessmentHeader';
import ShopSelector from '@/components/ShopSelector';
import type { AssessmentMode } from '@/components/ShopSelector';
import OverallScore from '@/components/OverallScore';
import PillarCard from '@/components/PillarCard';
import ConsultationPillarCard from '@/components/ConsultationPillarCard';
import BottleneckPanel from '@/components/BottleneckPanel';
import ResultsSummary from '@/components/ResultsSummary';
import SeverityLegend from '@/components/SeverityLegend';
import ReportView from '@/components/ReportView';
import ConsultationReport from '@/components/ConsultationReport';
import ConsultationView from '@/components/ConsultationView';
import CalculationBoard from '@/components/CalculationBoard';
import PresenterMode from '@/components/PresenterMode';
import { PILLARS, computeSOS, computeScalingProbability, ALL_SUBCATEGORY_IDS } from '@/lib/sos-engine';
import type { MarketIntelligence } from '@/lib/sos-engine';
import { encodeReportURL } from '@/lib/report-url';
import { encodeConsultationURL } from '@/lib/consultation-url';
import type { SubcategoryInput, RevenueTier, ScalingProbability } from '@/lib/sos-engine';
import { createEmptyBusinessProfile } from '@shared/business-profile';
import type { BusinessProfile } from '@shared/business-profile';
import ThemeToggle from '@/components/ThemeToggle';

interface AssessmentMeta {
  shopName: string;
  assessorName: string;
  assessmentDate: string;
  notes: string;
  city: string;
  state: string;
}

function createEmptyInputs(): Record<string, SubcategoryInput> {
  const inputs: Record<string, SubcategoryInput> = {};
  for (const id of ALL_SUBCATEGORY_IDS) {
    inputs[id] = { score: 0, note: '' };
  }
  return inputs;
}

const TIER_OPTIONS: { value: RevenueTier; label: string }[] = [
  { value: '20-30', label: '$20k–$30k/mo' },
  { value: '30-40', label: '$30k–$40k/mo' },
  { value: '40-50', label: '$40k–$50k/mo' },
  { value: 'custom', label: 'Custom' },
];

export default function Home() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [, navigate] = useLocation();

  // Redirect customer-role users to their portal
  useEffect(() => {
    if (user?.role === 'customer') {
      navigate('/portal');
    }
  }, [user, navigate]);

  const [inputs, setInputs] = useState<Record<string, SubcategoryInput>>(createEmptyInputs);
  const [allExpanded, setAllExpanded] = useState(true);
  const [touchedIds, setTouchedIds] = useState<Set<string>>(new Set());
  const [showReport, setShowReport] = useState(false);
  const [revenueTier, setRevenueTier] = useState<RevenueTier>('20-30');
  const [customTarget, setCustomTarget] = useState<number>(60000); // kept for backward compat with saved data
  const [currentRevenue, setCurrentRevenue] = useState<number | null>(null); // Shop's current monthly revenue
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile>(createEmptyBusinessProfile);
  const [saving, setSaving] = useState(false);
  const [showCalculation, setShowCalculation] = useState(false);
  const [customerLogoUrl, setCustomerLogoUrl] = useState<string | null>(null);
  const [meta, setMeta] = useState<AssessmentMeta>({
    shopName: '',
    assessorName: user?.name || '',
    assessmentDate: new Date().toISOString().slice(0, 10),
    notes: '',
    city: '',
    state: '',
  });

  const createAssessment = trpc.assessments.create.useMutation();
  const generateActionPlan = trpc.actionPlan.generate.useMutation();
  const uploadLogoMutation = trpc.shops.uploadLogo.useMutation();
  const sendToCustomer = trpc.assessments.sendToCustomer.useMutation();

  // Send to Customer Portal state
  const [showSendToCustomer, setShowSendToCustomer] = useState(false);
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [sendResult, setSendResult] = useState<{ status: string; message: string; portalUrl: string | null; username: string | null; password: string | null } | null>(null);
  const [savedAssessmentId, setSavedAssessmentId] = useState<number | null>(null);
  const [savedShopId, setSavedShopId] = useState<number | null>(null);

  // ─── Reassessment Mode ───
  const [isReassessment, setIsReassessment] = useState(false);
  const [reassessShopId, setReassessShopId] = useState<number | null>(null);
  const [previousScores, setPreviousScores] = useState<Record<string, { score: number; note: string }> | null>(null);
  const [previousAssessmentId, setPreviousAssessmentId] = useState<number | null>(null);
  const [actualRevenue, setActualRevenue] = useState<number | null>(null); // Actual monthly revenue at time of reassessment
  const [previousProbability, setPreviousProbability] = useState<number | null>(null); // Previous scaling probability
  const [previousRevenueTier, setPreviousRevenueTier] = useState<string | null>(null); // Previous revenue tier label
  const [profilePreFilled, setProfilePreFilled] = useState(false); // Whether business profile was pre-filled

  // ─── Market Intelligence ───
  const [marketData, setMarketData] = useState<MarketIntelligence | null>(null);
  const [marketLoading, setMarketLoading] = useState(false);
  const marketAnalyze = trpc.market.analyze.useMutation();

  // ─── Shop Selector State ───
  const [selectedShopId, setSelectedShopId] = useState<number | null>(null);
  const [assessmentMode, setAssessmentMode] = useState<AssessmentMode>(null);
  const [toolMode, setToolMode] = useState<'assessment' | 'consultation'>('assessment');
  const [showPresenter, setShowPresenter] = useState(false);

  // Auto-fill assessor name when user data loads
  useEffect(() => {
    if (user?.name && !meta.assessorName) {
      setMeta(prev => ({ ...prev, assessorName: user.name || '' }));
    }
  }, [user?.name]);

  // ─── Shop Selection Handler ───
  const handleShopSelect = useCallback((shop: any | null) => {
    if (!shop) {
      // Cleared selection
      setSelectedShopId(null);
      setMeta(prev => ({ ...prev, shopName: '' }));
      setIsReassessment(false);
      setPreviousScores(null);
      setPreviousAssessmentId(null);
      setReassessShopId(null);
      setProfilePreFilled(false);
      setBusinessProfile(createEmptyBusinessProfile());
      setCurrentRevenue(null);
      setCustomerLogoUrl(null);
      return;
    }
    setSelectedShopId(shop.id);
    setMeta(prev => ({ ...prev, shopName: shop.name }));
    setCustomerLogoUrl(shop.logoUrl || null);

    // Pre-fill from latest assessment data
    if (shop.latestAssessmentId) {
      setReassessShopId(shop.id);
      setPreviousAssessmentId(shop.latestAssessmentId);
      if (shop.latestCurrentRevenue) setCurrentRevenue(shop.latestCurrentRevenue);
      if (shop.latestRevenueTier) setRevenueTier(shop.latestRevenueTier as RevenueTier);
      if (shop.latestCustomTarget) setCustomTarget(shop.latestCustomTarget);

      // Pre-fill scores for reassessment mode
      const scores = typeof shop.latestScores === 'string'
        ? JSON.parse(shop.latestScores)
        : shop.latestScores;
      if (scores) {
        setPreviousScores(scores);
      }

      // Pre-fill business profile
      const bp = typeof shop.latestBusinessProfile === 'string'
        ? JSON.parse(shop.latestBusinessProfile)
        : shop.latestBusinessProfile;
      if (bp) {
        setBusinessProfile(bp);
        setProfilePreFilled(true);
      }
    }
  }, []);

  const handleNewShop = useCallback((name: string) => {
    setSelectedShopId(null);
    setMeta(prev => ({ ...prev, shopName: name }));
    setIsReassessment(false);
    setPreviousScores(null);
    setPreviousAssessmentId(null);
    setReassessShopId(null);
    setProfilePreFilled(false);
    setBusinessProfile(createEmptyBusinessProfile());
    setCurrentRevenue(null);
    setCustomerLogoUrl(null);
  }, []);

  const handleModeChange = useCallback((mode: AssessmentMode) => {
    setAssessmentMode(mode);
    if (mode === 'examination') {
      // Fresh scores — clear previous score data but keep shop info & business profile
      setIsReassessment(false);
      setPreviousScores(null);
      setInputs(createEmptyInputs());
      setTouchedIds(new Set());
    } else if (mode === 'reassess') {
      // Reassess — show previous scores as reference
      setIsReassessment(true);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reassessParam = params.get('reassess');
    if (reassessParam) {
      try {
        const data = JSON.parse(decodeURIComponent(escape(atob(reassessParam))));
        setIsReassessment(true);
        setPreviousScores(data.previousScores || null);
        setPreviousAssessmentId(data.previousAssessmentId || null);
        setMeta(prev => ({
          ...prev,
          shopName: data.shopName || '',
          assessmentDate: new Date().toISOString().slice(0, 10),
        }));
        if (data.revenueTier) setRevenueTier(data.revenueTier as RevenueTier);
        if (data.customTarget) setCustomTarget(data.customTarget);
        if (data.previousProbability) setPreviousProbability(data.previousProbability);
        if (data.previousRevenueTier) setPreviousRevenueTier(data.previousRevenueTier);
        if (data.shopId) setReassessShopId(data.shopId);
        // Clear the URL param without reload
        window.history.replaceState({}, '', '/');
      } catch (e) {
        console.error('Failed to parse reassessment data:', e);
      }
    }
  }, []);

  // Fetch previous business profile when reassessing a shop
  const previousProfileQuery = trpc.shops.getLatestBusinessProfile.useQuery(
    { shopId: reassessShopId! },
    { enabled: isReassessment && reassessShopId !== null }
  );

  // Pre-fill business profile from previous assessment
  useEffect(() => {
    if (
      previousProfileQuery.data?.businessProfile &&
      isReassessment &&
      !profilePreFilled
    ) {
      const prev = previousProfileQuery.data.businessProfile as BusinessProfile;
      setBusinessProfile(prev);
      setProfilePreFilled(true);
      toast.info('Business profile pre-filled from previous assessment', {
        description: `Data from ${previousProfileQuery.data.fromAssessmentDate || 'previous visit'} — review and update as needed.`,
        duration: 5000,
      });
    }
  }, [previousProfileQuery.data, isReassessment, profilePreFilled]);

  const result = useMemo(() => computeSOS(inputs), [inputs]);
  const hasScores = useMemo(() => touchedIds.size > 0, [touchedIds]);

  // Derive goal revenue from the selected tier (midpoint of range) or custom amount
  const tierGoalRevenue = useMemo(() => {
    switch (revenueTier) {
      case '20-30': return 25000;
      case '30-40': return 35000;
      case '40-50': return 45000;
      case 'custom': return customTarget;
      default: return 35000;
    }
  }, [revenueTier, customTarget]);

  // goalRevenue derived from tier or custom amount
  const goalRevenue = tierGoalRevenue;

  // Compute total ad spend from business profile
  const totalAdSpend = useMemo(() => {
    const as = businessProfile.adSpend;
    return (as.googleAds || 0) + (as.facebookMeta || 0);
  }, [businessProfile.adSpend]);

  // Auto-fetch market intelligence when city/state changes
  useEffect(() => {
    const city = meta.city?.trim();
    const state = meta.state?.trim();
    if (city && state && city.length >= 2 && state.length >= 2) {
      // Debounce: only fetch if we don't already have data for this city/state
      if (marketData?.city === city && marketData?.state === state) return;
      setMarketLoading(true);
      const timer = setTimeout(() => {
        marketAnalyze.mutateAsync({ city, state })
          .then((data) => {
            setMarketData(data as MarketIntelligence);
            setMarketLoading(false);
          })
          .catch(() => {
            setMarketLoading(false);
          });
      }, 1500); // 1.5s debounce
      return () => clearTimeout(timer);
    } else {
      setMarketData(null);
    }
  }, [meta.city, meta.state]);

  const probability: ScalingProbability | null = useMemo(() => {
    if (!hasScores) return null;
    return computeScalingProbability(
      result, revenueTier, revenueTier === 'custom' ? customTarget : undefined,
      totalAdSpend, inputs, marketData
    );
  }, [result, hasScores, revenueTier, customTarget, totalAdSpend, inputs, marketData]);

  const handleInputChange = useCallback((subId: string, score: number, note: string) => {
    setTouchedIds(prev => {
      const next = new Set(prev);
      next.add(subId);
      return next;
    });
    setInputs(prev => ({
      ...prev,
      [subId]: { score, note },
    }));
  }, []);

  const handleReset = useCallback(() => {
    setInputs(createEmptyInputs());
    setTouchedIds(new Set());
    setMeta({ shopName: '', assessorName: user?.name || '', assessmentDate: new Date().toISOString().slice(0, 10), notes: '', city: '', state: '' });
    setShowReport(false);
    setRevenueTier('20-30');
    setCustomTarget(60000);
    setCurrentRevenue(null);
    setBusinessProfile(createEmptyBusinessProfile());
    setIsReassessment(false);
    setReassessShopId(null);
    setPreviousScores(null);
    setPreviousAssessmentId(null);
    setProfilePreFilled(false);
    setActualRevenue(null);
    setPreviousProbability(null);
    setPreviousRevenueTier(null);
    setShowSendToCustomer(false);
    setSendResult(null);
    setCustomerEmail('');
    setCustomerName('');
    setSavedAssessmentId(null);
    setSavedShopId(null);
    setSelectedShopId(null);
    setAssessmentMode(null);
    setToolMode('assessment');
  }, [user]);

  const canGenerateReport = hasScores && meta.shopName.trim().length > 0 && meta.assessorName.trim().length > 0;

  const handleSaveAssessment = useCallback(async () => {
    if (!canGenerateReport || !probability) return;
    setSaving(true);
    try {
      const res = await createAssessment.mutateAsync({
        shopName: meta.shopName,
        assessorName: meta.assessorName,
        assessmentDate: meta.assessmentDate,
        revenueTier,
        customTarget: revenueTier === 'custom' ? customTarget : undefined,
        notes: meta.notes || undefined,
        scores: inputs,
        overallPercentage: result.percentage,
        overallBand: result.band,
        scalingProbability: probability.overall,
        pillarResults: result.pillars,
        bottlenecks: result.bottlenecks,
        topLeveragePriorities: result.topLeveragePriorities,
        currentRevenue: currentRevenue ?? undefined,
        goalRevenue: goalRevenue ?? undefined,
        businessProfile,
        previousAssessmentId: previousAssessmentId ?? undefined,
        actualRevenue: actualRevenue ?? undefined,
      });
      // Upload pending logo if one was selected
      const pendingLogo = (window as any).__pendingLogoUpload;
      if (pendingLogo && res.shopId) {
        try {
          const logoResult = await uploadLogoMutation.mutateAsync({
            shopId: res.shopId,
            imageData: pendingLogo.imageData,
            mimeType: pendingLogo.mimeType,
            fileName: pendingLogo.fileName,
          });
          setCustomerLogoUrl(logoResult.logoUrl);
          (window as any).__pendingLogoUpload = null;
        } catch (logoErr) {
          console.error('Logo upload failed:', logoErr);
          toast.error('Logo upload failed, but assessment was saved');
        }
      }

      setSavedAssessmentId(res.id);
      setSavedShopId(res.shopId);
      setShowSendToCustomer(true); // Show send-to-customer panel after save
      toast.success(`Assessment saved for "${meta.shopName}"`, {
        description: `ID: ${res.id} — Send to customer or view in Dashboard.`,
        action: { label: 'Dashboard', onClick: () => navigate('/dashboard') },
      });
      // Show calculation board animation after successful save
      setShowCalculation(true);
    } catch (err) {
      toast.error('Failed to save assessment');
      console.error(err);
    } finally {
      setSaving(false);
    }
  }, [canGenerateReport, probability, meta, inputs, result, revenueTier, customTarget, createAssessment, navigate]);

  const handleOpenCustomerReport = useCallback(() => {
    const encoded = encodeReportURL(meta, inputs, revenueTier, revenueTier === 'custom' ? customTarget : undefined, customerLogoUrl, currentRevenue, goalRevenue, businessProfile);
    const url = `${window.location.origin}/report?d=${encoded}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }, [meta, inputs, revenueTier, customTarget, currentRevenue, goalRevenue, businessProfile]);

  const handleOpenConsultation = useCallback(() => {
    const encoded = encodeConsultationURL(meta, inputs, revenueTier, revenueTier === 'custom' ? customTarget : undefined, customerLogoUrl, currentRevenue, goalRevenue, businessProfile);
    const url = `${window.location.origin}/consultation?d=${encoded}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }, [meta, inputs, revenueTier, customTarget, customerLogoUrl, currentRevenue, goalRevenue, businessProfile]);

  const handleCopyConsultationLink = useCallback(() => {
    const encoded = encodeConsultationURL(meta, inputs, revenueTier, revenueTier === 'custom' ? customTarget : undefined, customerLogoUrl, currentRevenue, goalRevenue, businessProfile);
    const url = `${window.location.origin}/consultation?d=${encoded}`;
    navigator.clipboard.writeText(url).then(() => {
      toast.success('Consultation link copied to clipboard!');
    }).catch(() => {
      toast.error('Failed to copy link');
    });
  }, [meta, inputs, revenueTier, customTarget, customerLogoUrl, currentRevenue, goalRevenue, businessProfile]);

  const handleSendToCustomer = useCallback(async () => {
    if (!savedAssessmentId || !savedShopId || !customerEmail.trim()) return;
    try {
      const result = await sendToCustomer.mutateAsync({
        assessmentId: savedAssessmentId,
        shopId: savedShopId,
        customerEmail: customerEmail.trim(),
        customerName: customerName.trim() || customerEmail.split('@')[0],
        origin: window.location.origin,
      });
      setSendResult(result);
      if (result.status === 'created') {
        toast.success('Customer portal access created!', {
          description: `${customerEmail} can now log in to view their report.`,
        });
      } else if (result.status === 'existing') {
        toast.info('Customer already has access', {
          description: result.message,
        });
      } else {
        toast.error(result.message);
      }
    } catch (err) {
      toast.error('Failed to send to customer');
      console.error(err);
    }
  }, [savedAssessmentId, savedShopId, customerEmail, customerName, sendToCustomer]);

  const notes = useMemo(() => {
    const n: Record<string, string> = {};
    for (const [id, input] of Object.entries(inputs)) {
      if (input.note) n[id] = input.note;
    }
    return n;
  }, [inputs]);

  const scoredCount = touchedIds.size;
  const perfectCount = useMemo(
    () => Object.entries(inputs).filter(([id]) => touchedIds.has(id) && inputs[id].score === 5).length,
    [inputs, touchedIds]
  );
  const criticalCount = useMemo(
    () => Object.entries(inputs).filter(([id]) => touchedIds.has(id) && inputs[id].score <= 1).length,
    [inputs, touchedIds]
  );

  // Show login screen if not authenticated
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-6 max-w-md px-6">
          <img
            src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663344377985/bstGyXVcPKnASnnU.png"
            alt="Scale Detailing"
            className="h-16 w-auto mx-auto"
          />
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Scale Toolkit</h1>
            <p className="text-sm text-muted-foreground">SOS Assessment — Internal Tool</p>
          </div>
          <Button
            onClick={() => { window.location.href = getLoginUrl(); }}
            className="bg-gold text-black hover:bg-gold-light px-8 h-11"
          >
            Sign In to Continue
          </Button>
        </div>
      </div>
    );
  }

  // Presenter Mode — full-screen dramatic scoring presentation
  if (showPresenter) {
    return (
      <PresenterMode
        inputs={inputs}
        onInputChange={handleInputChange}
        revenueTier={revenueTier}
        customTarget={revenueTier === 'custom' ? customTarget : undefined}
        shopName={meta.shopName || 'Shop Assessment'}
        onExit={() => setShowPresenter(false)}
      />
    );
  }

  // Calculation Board (plays after save, before report)
  if (showCalculation && probability) {
    return (
      <CalculationBoard
        result={result}
        probability={probability}
        inputs={inputs}
        shopName={meta.shopName}
        onComplete={() => {
          setShowCalculation(false);
          setShowReport(true);
        }}
      />
    );
  }

  // Report View — use ConsultationReport for consultation mode, ReportView for assessment mode
  if (showReport && probability) {
    if (toolMode === 'consultation') {
      return (
        <ConsultationReport
          result={result}
          inputs={inputs}
          meta={meta}
          probability={probability}
          onBack={() => setShowReport(false)}
          onShareLink={handleOpenConsultation}
          onCopyLink={handleCopyConsultationLink}
          customerLogoUrl={customerLogoUrl}
          revenueTier={revenueTier}
          customTarget={revenueTier === 'custom' ? customTarget : undefined}
          currentRevenue={currentRevenue ?? undefined}
          goalRevenue={goalRevenue ?? undefined}
          businessProfile={businessProfile}
        />
      );
    }
    return (
      <ReportView
        result={result}
        inputs={inputs}
        meta={meta}
        probability={probability}
        onBack={() => setShowReport(false)}
        customerLogoUrl={customerLogoUrl}
        currentRevenue={currentRevenue ?? undefined}
        goalRevenue={goalRevenue ?? undefined}
        businessProfile={businessProfile}
        revenueTier={revenueTier}
        customTarget={revenueTier === 'custom' ? customTarget : undefined}
        isReassessment={isReassessment}
        previousInputs={previousScores ? Object.fromEntries(
          Object.entries(previousScores).map(([id, s]) => [id, { score: s.score, note: s.note || '' }])
        ) : null}
        previousDate={previousProfileQuery.data?.fromAssessmentDate || null}
        previousRevenue={null}
        previousBusinessProfile={(previousProfileQuery.data?.businessProfile as import('@shared/business-profile').BusinessProfile) || null}
      />
    );
  }

  // Consultation Mode — full-screen wizard (completely different layout from standard mode)
  if (toolMode === 'consultation' && !showReport && !showCalculation) {
    return (
      <ConsultationView
        inputs={inputs}
        onInputChange={handleInputChange}
        revenueTier={revenueTier}
        customTarget={revenueTier === 'custom' ? customTarget : undefined}
        onGenerateReport={async () => {
          // In consultation mode, auto-save to database then show report
          const hasAnyScores = Object.values(inputs).some(i => i.score > 0);
          if (hasAnyScores) {
            // Auto-save consultation to database
            if (probability && meta.shopName.trim() && meta.assessorName.trim()) {
              try {
                const res = await createAssessment.mutateAsync({
                  shopName: meta.shopName,
                  assessorName: meta.assessorName,
                  assessmentType: 'consultation',
                  assessmentDate: meta.assessmentDate,
                  revenueTier,
                  customTarget: revenueTier === 'custom' ? customTarget : undefined,
                  notes: meta.notes || undefined,
                  scores: inputs,
                  overallPercentage: result.percentage,
                  overallBand: result.band,
                  scalingProbability: probability.overall,
                  pillarResults: result.pillars,
                  bottlenecks: result.bottlenecks,
                  topLeveragePriorities: result.topLeveragePriorities,
                  currentRevenue: currentRevenue ?? undefined,
                  goalRevenue: goalRevenue ?? undefined,
                  businessProfile,
                });
                setSavedAssessmentId(res.id);
                setSavedShopId(res.shopId);
                toast.success(`Consultation saved for "${meta.shopName}"`);
              } catch (err) {
                console.error('Auto-save consultation failed:', err);
                // Still show the report even if save fails
              }
            }
            if (probability) {
              setShowReport(true);
            } else {
              setShowCalculation(true);
            }
          }
        }}
        onBack={() => setToolMode('assessment')}
        onReset={handleReset}
        meta={meta}
        onMetaChange={setMeta}
        onRevenueChange={(rev, tier, custom) => {
          setCurrentRevenue(rev);
          setRevenueTier(tier);
          if (custom !== undefined) setCustomTarget(custom);
        }}
        currentRevenue={currentRevenue}
        goalRevenue={goalRevenue}
      />
    );
  }

  // Assessment Entry View (standard mode)
  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="container flex items-center justify-between h-12 sm:h-14">
          <div className="flex items-center gap-1 sm:gap-2.5">
            <Link href="/">
              <img
                src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663344377985/bstGyXVcPKnASnnU.png"
                alt="Scale Detailing"
                className="h-5 sm:h-7 w-auto shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
              />
            </Link>
            <div className="h-5 w-px bg-border/40 hidden sm:block" />
            <span className="hidden md:inline text-sm tracking-wider text-foreground" style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", letterSpacing: '0.08em' }}>
              Scale <span className="text-gold">{toolMode === 'consultation' ? 'Consultation' : 'Toolkit'}</span>
            </span>
            {/* Assessment / Consultation Mode Toggle — visible on all screens */}
            <button
              onClick={() => setToolMode(toolMode === 'assessment' ? 'consultation' : 'assessment')}
              className={`
                relative flex items-center h-7 w-[120px] sm:w-[180px] rounded-full border transition-all text-[8px] sm:text-[10px] font-bold uppercase tracking-wider shrink-0
                ${toolMode === 'consultation'
                  ? 'border-blue-500/40 bg-blue-500/10'
                  : 'border-border/40 bg-muted/10'
                }
              `}
            >
              <span className={`flex-1 text-center z-10 transition-colors ${toolMode === 'assessment' ? 'text-gold' : 'text-muted-foreground/50'}`}>
                <span className="sm:hidden">Assess</span>
                <span className="hidden sm:inline">Assessment</span>
              </span>
              <span className={`flex-1 text-center z-10 transition-colors ${toolMode === 'consultation' ? 'text-blue-400' : 'text-muted-foreground/50'}`}>
                <span className="sm:hidden">Consult</span>
                <span className="hidden sm:inline">Consultation</span>
              </span>
              <div
                className={`absolute top-0.5 h-[calc(100%-4px)] w-[calc(50%-2px)] rounded-full transition-all duration-300 ${
                  toolMode === 'consultation'
                    ? 'left-[calc(50%+1px)] bg-blue-500/20'
                    : 'left-0.5 bg-gold/20'
                }`}
              />
            </button>
          </div>
          <div className="flex items-center gap-1 sm:gap-3">
            {hasScores && (
              <span className="font-data text-sm sm:text-lg font-bold text-gold">
                {result.percentage.toFixed(0)}%
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="h-7 sm:h-8 text-xs gap-1.5 text-muted-foreground hover:text-foreground px-1.5 sm:px-3"
            >
              <LayoutDashboard size={14} />
              <span className="hidden md:inline">Dashboard</span>
            </Button>
            {user?.role === 'admin' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/invites')}
                className="hidden sm:flex h-8 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
              >
                <UserPlus size={14} />
                <span className="hidden md:inline">Invites</span>
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="h-7 sm:h-8 text-xs gap-1 border-border/40 hover:border-gold/40 hover:text-gold px-1.5 sm:px-3"
            >
              <RotateCcw size={12} />
              <span className="hidden sm:inline">Reset</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => logout()}
              className="h-7 sm:h-8 text-xs gap-1.5 text-muted-foreground hover:text-destructive px-1.5 sm:px-3"
            >
              <LogOut size={14} />
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Reassessment Banner — Enhanced */}
        {isReassessment && previousScores && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <div className="rounded-xl border-2 border-gold/40 bg-gold/5 p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-3">
                <RefreshCcw size={16} className="text-gold" />
                <h3 className="text-sm font-bold text-gold">Reassessment Mode</h3>
                {previousAssessmentId && (
                  <span className="text-[9px] font-data text-muted-foreground/40 ml-auto">Previous: #{previousAssessmentId}</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                You're reassessing <span className="font-semibold text-foreground">{meta.shopName}</span>.
                Previous scores are shown as reference badges next to each input — score up or down from there.
              </p>
              {/* Actual Revenue Input */}
              <div className="rounded-lg border border-gold/20 bg-gold/[0.03] p-3 sm:p-4 mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign size={14} className="text-gold" />
                  <label className="text-xs font-bold text-foreground">What was their actual monthly revenue?</label>
                  <span className="text-[9px] text-muted-foreground/50 ml-auto">Used to validate our prediction model</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative flex-1 max-w-xs">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground/40 font-mono">$</span>
                    <input
                      type="number"
                      value={actualRevenue ?? ''}
                      onChange={(e) => setActualRevenue(e.target.value ? Number(e.target.value) : null)}
                      placeholder="e.g. 28000"
                      step={1000}
                      min={0}
                      className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] pl-7 pr-3 py-2.5 text-sm font-data text-foreground focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/20"
                    />
                  </div>
                  <span className="text-xs text-muted-foreground/40">/month</span>
                </div>
                {actualRevenue && previousProbability && (
                  <div className="mt-2 text-[10px] text-muted-foreground/60">
                    We predicted <span className="font-data font-bold text-gold">{previousProbability.toFixed(0)}%</span> chance to hit{' '}
                    <span className="font-data font-bold text-foreground">{previousRevenueTier || 'target'}</span>.
                    Actual: <span className="font-data font-bold text-foreground">${actualRevenue.toLocaleString()}/mo</span>
                  </div>
                )}
              </div>

              {/* Pre-filled business profile indicator */}
              {profilePreFilled && (
                <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 mb-3">
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                  <p className="text-xs text-emerald-400">
                    Business profile data pre-filled from previous assessment{previousProfileQuery.data?.fromAssessmentDate ? ` (${previousProfileQuery.data.fromAssessmentDate})` : ''}. Review and update any changes.
                  </p>
                </div>
              )}

              {/* Previous assessment quick stats */}
              {(() => {
                const prevInputs: Record<string, SubcategoryInput> = {};
                for (const id of ALL_SUBCATEGORY_IDS) {
                  prevInputs[id] = { score: previousScores[id]?.score ?? 0, note: '' };
                }
                const prevResult = computeSOS(prevInputs);
                const prevProb = computeScalingProbability(prevResult, revenueTier, undefined, totalAdSpend, prevInputs);
                const scoredPrev = Object.values(previousScores).filter(s => s.score > 0).length;
                const criticalPrev = Object.values(previousScores).filter(s => s.score <= 1).length;
                return (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="rounded-lg border border-border/20 bg-muted/10 p-2.5 text-center">
                      <p className="text-[8px] uppercase tracking-wider text-muted-foreground/40 mb-0.5">Previous Score</p>
                      <p className="font-data text-base font-bold" style={{ color: prevResult.band === 'green' ? '#2ECC71' : prevResult.band === 'yellow' ? '#D4A843' : '#E74C3C' }}>
                        {prevResult.percentage.toFixed(0)}%
                      </p>
                    </div>
                    <div className="rounded-lg border border-border/20 bg-muted/10 p-2.5 text-center">
                      <p className="text-[8px] uppercase tracking-wider text-muted-foreground/40 mb-0.5">Prev Probability</p>
                      <p className="font-data text-base font-bold text-gold">{prevProb.overall.toFixed(0)}%</p>
                    </div>
                    <div className="rounded-lg border border-border/20 bg-muted/10 p-2.5 text-center">
                      <p className="text-[8px] uppercase tracking-wider text-muted-foreground/40 mb-0.5">Areas Scored</p>
                      <p className="font-data text-base font-bold text-foreground">{scoredPrev}/{ALL_SUBCATEGORY_IDS.length}</p>
                    </div>
                    <div className="rounded-lg border border-border/20 bg-muted/10 p-2.5 text-center">
                      <p className="text-[8px] uppercase tracking-wider text-muted-foreground/40 mb-0.5">Critical Areas</p>
                      <p className="font-data text-base font-bold" style={{ color: criticalPrev > 0 ? '#E74C3C' : '#2ECC71' }}>{criticalPrev}</p>
                    </div>
                  </div>
                );
              })()}
            </div>
          </motion.div>
        )}

        {/* Assessment Details */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <AssessmentHeader
            meta={meta}
            onChange={setMeta}
            customerLogoUrl={customerLogoUrl}
            onLogoChange={setCustomerLogoUrl}
            shopSelector={
              <ShopSelector
                onSelect={handleShopSelect}
                onNewShop={handleNewShop}
                onModeChange={handleModeChange}
                assessmentMode={assessmentMode}
                selectedShopName={meta.shopName}
              />
            }
          />
        </motion.div>

        {/* Revenue & Goal Section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.03 }}>
          <div className="glass-card p-4 sm:p-5 space-y-4">
            {/* Current Revenue Input */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <DollarSign size={16} className="text-gold" />
                <h3 className="text-sm tracking-wide uppercase text-foreground" style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", letterSpacing: '0.04em' }}>Revenue</h3>
                <span className="text-[10px] text-muted-foreground ml-auto">Powers the cost-of-inaction analysis</span>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground/50 mb-1.5 block">Current Monthly Revenue</label>
                <div className="relative max-w-sm">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground/40 font-mono">$</span>
                  <input
                    type="number"
                    value={currentRevenue ?? ''}
                    onChange={(e) => setCurrentRevenue(e.target.value ? Number(e.target.value) : null)}
                    placeholder="e.g. 18000"
                    step={1000}
                    min={0}
                    className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] pl-7 pr-3 py-2.5 text-sm font-data text-foreground focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/20"
                  />
                </div>
              </div>
            </div>

            {/* Revenue Goal Tier Buttons */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground/40">Revenue Goal</span>
                <span className="text-[9px] text-muted-foreground/30 ml-auto">Select the target revenue tier</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {TIER_OPTIONS.map((tier) => (
                  <button
                    key={tier.value}
                    onClick={() => setRevenueTier(tier.value)}
                    className={`rounded-lg border px-3 py-2.5 text-center transition-all ${
                      revenueTier === tier.value
                        ? 'border-gold bg-gold/10 text-gold'
                        : 'border-white/[0.08] bg-white/[0.03] text-muted-foreground hover:border-gold/30 hover:text-foreground'
                    }`}
                  >
                    <span className="text-xs font-semibold">{tier.label}</span>
                  </button>
                ))}
              </div>
              {revenueTier === 'custom' && (
                <div className="mt-2 flex items-center gap-3">
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground/50 shrink-0">Target $/mo</label>
                  <div className="relative flex-1 max-w-xs">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground/40 font-mono">$</span>
                    <input
                      type="number"
                      value={customTarget}
                      onChange={(e) => setCustomTarget(Math.max(10000, Number(e.target.value)))}
                      step={5000}
                      min={10000}
                      className="w-full rounded-lg border border-gold/30 bg-gold/[0.03] pl-7 pr-3 py-2 text-sm font-data text-foreground focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/20"
                    />
                  </div>
                </div>
              )}
              {currentRevenue && currentRevenue > 0 && (
                <div className="mt-2 rounded-lg border border-gold/15 bg-gold/[0.03] px-3 py-2">
                  <p className="text-[10px] text-muted-foreground/60">
                    Revenue gap: <span className="font-data font-bold text-gold">${(tierGoalRevenue - currentRevenue > 0 ? tierGoalRevenue - currentRevenue : 0).toLocaleString()}/mo</span>
                    {tierGoalRevenue - currentRevenue > 0 && (
                      <>{' · '}That's <span className="font-data font-bold text-foreground">${((tierGoalRevenue - currentRevenue) * 12).toLocaleString()}/yr</span> in unrealized revenue</>
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Years in Business — quick field before scoring (hidden in consultation mode) */}
        {toolMode !== 'consultation' && <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.04 }}>
          <div className="glass-card p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-gold"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></span>
                <span className="text-xs tracking-wide text-foreground uppercase" style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", letterSpacing: '0.04em' }}>Years in Business</span>
              </div>
              <div className="max-w-[140px]">
                <div className="relative">
                  <input
                    type="number"
                    value={businessProfile.yearsInBusiness ?? ''}
                    onChange={(e) => setBusinessProfile({ ...businessProfile, yearsInBusiness: e.target.value ? Number(e.target.value) : null })}
                    placeholder="e.g. 3"
                    min={0}
                    className="w-full rounded-md border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs font-data text-foreground focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/20 placeholder:text-muted-foreground/40"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">years</span>
                </div>
              </div>
              {businessProfile.yearsInBusiness !== null && (
                <span className="text-[10px] text-muted-foreground">
                  {businessProfile.yearsInBusiness < 2 ? 'Startup phase' : businessProfile.yearsInBusiness >= 10 ? 'Established' : 'Growing'}
                </span>
              )}
            </div>
          </div>
        </motion.div>}

        {/* Hero / Overall Score + Probability */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.05 }}>
          <OverallScore result={hasScores ? result : null} probability={probability} />
        </motion.div>

        {/* Controls row */}
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg tracking-wide uppercase text-foreground" style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", letterSpacing: '0.04em' }}>
            {toolMode === 'consultation' ? 'Quick Assessment' : 'Pillar Assessment'}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setAllExpanded(!allExpanded)}
            className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
          >
            {allExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {allExpanded ? 'Collapse' : 'Expand'}
          </Button>
        </div>

        {/* Consultation Mode Tip */}
        {toolMode === 'consultation' && (
          <div className="rounded-xl border border-blue-500/15 bg-blue-500/[0.03] px-4 py-3">
            <p className="text-xs text-blue-400/80">
              <span className="font-bold">Consultation Mode</span> — Simplified scoring for live sales calls. Rate each area as Needs Work, Okay, or Strong. The system handles the detailed analysis.
            </p>
          </div>
        )}

        {/* Pillar Cards */}
        <div className={toolMode === 'consultation' ? 'space-y-4' : 'space-y-3'}>
          {PILLARS.map((pillar, i) => (
            <motion.div
              key={pillar.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.06, duration: 0.4 }}
            >
              {toolMode === 'consultation' ? (
                <ConsultationPillarCard
                  pillar={pillar}
                  pillarResult={hasScores ? result.pillars.find(p => p.id === pillar.id) || null : null}
                  inputs={inputs}
                  onScoreChange={handleInputChange}
                  defaultExpanded={allExpanded}
                  allExpanded={allExpanded}
                />
              ) : (
                <PillarCard
                  pillar={pillar}
                  pillarResult={hasScores ? result.pillars.find(p => p.id === pillar.id) || null : null}
                  inputs={inputs}
                  onScoreChange={handleInputChange}
                  defaultExpanded={allExpanded}
                  allExpanded={allExpanded}
                  previousScores={isReassessment ? previousScores : null}
                  businessProfile={businessProfile}
                  onBusinessProfileChange={setBusinessProfile}
                />
              )}
            </motion.div>
          ))}
        </div>

        {/* Generate Report CTA */}
        {hasScores && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="glass-card border-gold/30 p-4 sm:p-5"
          >
            <div className="space-y-3">
              <div>
                <h3 className="text-sm tracking-wide uppercase text-foreground" style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", letterSpacing: '0.04em' }}>Ready to generate the report?</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {canGenerateReport
                    ? `${scoredCount} of ${ALL_SUBCATEGORY_IDS.length} subcategories scored for "${meta.shopName}"`
                    : 'Fill in the shop name and assessor name above, then score at least one subcategory.'
                  }
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  onClick={handleSaveAssessment}
                  disabled={!canGenerateReport || saving}
                  className="h-10 px-5 text-sm gap-2 bg-gold text-black hover:bg-gold-light disabled:opacity-40 flex-1 sm:flex-none"
                >
                  <Save size={16} />
                  {saving ? 'Saving...' : 'Save Assessment'}
                </Button>
                <Button
                  onClick={() => setShowCalculation(true)}
                  disabled={!canGenerateReport}
                  variant="outline"
                  className="h-10 px-5 text-sm gap-2 border-gold/40 text-gold hover:bg-gold/10 disabled:opacity-40 flex-1 sm:flex-none"
                >
                  <FileText size={16} />
                  Preview Report
                </Button>
                <Button
                  onClick={handleOpenCustomerReport}
                  disabled={!canGenerateReport}
                  variant="outline"
                  className="h-10 px-5 text-sm gap-2 border-border/40 text-muted-foreground hover:text-foreground hover:border-gold/30 disabled:opacity-40 flex-1 sm:flex-none"
                >
                  <ExternalLink size={16} />
                  Customer Report
                </Button>
              </div>
              <Button
                onClick={() => setShowPresenter(true)}
                variant="outline"
                className="h-9 w-full text-xs gap-1.5 border-purple-500/30 text-purple-400 hover:bg-purple-500/10 hover:border-purple-500/50"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg>
                Launch Presenter Mode
              </Button>
            </div>
          </motion.div>
        )}

        {/* ═══ Send to Customer Portal ═══ */}
        {showSendToCustomer && savedAssessmentId && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="rounded-xl border-2 border-blue-500/20 bg-blue-500/[0.03] p-4 sm:p-5"
          >
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Mail size={16} className="text-blue-400" />
                <h3 className="text-sm font-bold text-foreground">Send to Customer Portal</h3>
                <span className="text-[9px] text-muted-foreground/50 ml-auto">Creates portal access for the shop owner</span>
              </div>

              {!sendResult ? (
                <>
                  <p className="text-xs text-muted-foreground">
                    Enter the shop owner's email to create their portal account. They'll be able to log in and view their assessment report.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] uppercase tracking-wider text-muted-foreground/40 mb-1 block">Customer Email *</label>
                      <input
                        type="email"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        placeholder="owner@theirshop.com"
                        className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-sm text-foreground focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/20"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-wider text-muted-foreground/40 mb-1 block">Customer Name (optional)</label>
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="John Smith"
                        className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-sm text-foreground focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/20"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSendToCustomer}
                      disabled={!customerEmail.trim() || sendToCustomer.isPending}
                      className="h-9 px-4 text-sm gap-2 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40"
                    >
                      <Send size={14} />
                      {sendToCustomer.isPending ? 'Creating Access...' : 'Create Portal Access'}
                    </Button>
                    <Button
                      onClick={() => setShowSendToCustomer(false)}
                      variant="ghost"
                      size="sm"
                      className="h-9 text-xs text-muted-foreground"
                    >
                      Skip
                    </Button>
                  </div>
                </>
              ) : (
                <div className="space-y-3">
                  {sendResult.status === 'created' ? (
                    <div className="rounded-lg border border-[#2ECC71]/20 bg-[#2ECC71]/[0.05] p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 size={16} className="text-[#2ECC71]" />
                        <span className="text-sm font-bold text-[#2ECC71]">Portal Access Created</span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-3">{sendResult.message}</p>
                      <div className="rounded-lg border border-border/20 bg-muted/10 p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase tracking-wider text-muted-foreground/40">Login URL</span>
                          <button
                            onClick={() => { navigator.clipboard.writeText(sendResult.portalUrl || ''); toast.success('Copied!'); }}
                            className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1"
                          >
                            <Copy size={10} /> Copy
                          </button>
                        </div>
                        <p className="font-data text-xs text-foreground break-all">{sendResult.portalUrl}</p>
                        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/10">
                          <div>
                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground/40 block">Username</span>
                            <p className="font-data text-xs text-foreground">{sendResult.username}</p>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground/40 block">Temp Password</span>
                            <p className="font-data text-xs text-foreground">{sendResult.password}</p>
                          </div>
                        </div>
                      </div>
                      <p className="text-[10px] text-muted-foreground/50 mt-2 italic">
                        Share these credentials with the shop owner. They can change their password after first login.
                      </p>
                    </div>
                  ) : sendResult.status === 'existing' ? (
                    <div className="rounded-lg border border-gold/20 bg-gold/[0.05] p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle2 size={16} className="text-gold" />
                        <span className="text-sm font-bold text-gold">Already Has Access</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{sendResult.message}</p>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-red-500/20 bg-red-500/[0.05] p-4">
                      <p className="text-xs text-red-400">{sendResult.message}</p>
                    </div>
                  )}
                  <Button
                    onClick={() => { setSendResult(null); setCustomerEmail(''); setCustomerName(''); setShowSendToCustomer(false); }}
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs text-muted-foreground"
                  >
                    Done
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Results Section — inline preview (hidden in consultation mode) */}
        {hasScores && toolMode !== 'consultation' && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-5 sm:space-y-6 pt-2 sm:pt-4"
          >
            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
              <span className="text-xs font-bold uppercase tracking-widest text-gold">Live Preview</span>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
              <div className="lg:col-span-2">
                <BottleneckPanel result={result} notes={notes} />
              </div>
              <div className="space-y-4">
                <SeverityLegend />
                <div className="glass-card p-4 space-y-3">
                  <h4 className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Quick Stats</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Subcategories scored</span>
                      <span className="font-data text-xs font-bold text-foreground">{scoredCount} / {ALL_SUBCATEGORY_IDS.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Perfect scores (5/5)</span>
                      <span className="font-data text-xs font-bold text-[#2ECC71]">{perfectCount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Critical scores (0–1)</span>
                      <span className="font-data text-xs font-bold text-[#E74C3C]">{criticalCount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Gap to perfect</span>
                      <span className="font-data text-xs font-bold text-[#D4A843]">{(100 - result.percentage).toFixed(0)}%</span>
                    </div>
                    {probability && (
                      <div className="flex items-center justify-between pt-1 border-t border-white/[0.06]">
                        <span className="text-xs text-muted-foreground">Scaling probability</span>
                        <span className="font-data text-xs font-bold text-gold">{probability.overall.toFixed(0)}%</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <ResultsSummary result={result} inputs={inputs} />
          </motion.div>
        )}

        {/* Footer */}
        <footer className="pt-6 sm:pt-8 pb-4 sm:pb-6 text-center">
          <img
            src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663344377985/bstGyXVcPKnASnnU.png"
            alt="Scale Detailing"
            className="h-5 w-auto mx-auto opacity-30 mb-2"
          />
          <p className="text-[9px] sm:text-[10px] text-muted-foreground/50 uppercase tracking-widest" style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", letterSpacing: '0.1em' }}>
            Scale Toolkit · SOS Assessment · Powered by Scale Detailing
          </p>
        </footer>
      </main>
    </div>
  );
}
