/*
 * AssessmentDetail — View a saved assessment's full report
 * Loads data from DB, computes results, shows the report view
 * Also allows logging outcomes for the learning engine
 * Enhanced: Shows ReassessmentComparison panel when a previous assessment exists
 */
import { useAuth } from '@/_core/hooks/useAuth';
import { useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { getLoginUrl } from '@/const';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ExternalLink, CheckCircle2, XCircle, AlertCircle, RefreshCcw, Printer, Download, Radar, Mail, Send, Copy, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import ReportView from '@/components/ReportView';
import ConsultationReport from '@/components/ConsultationReport';
import CalculationBoard from '@/components/CalculationBoard';
import ReassessmentComparison from '@/components/ReassessmentComparison';
import { computeSOS, computeScalingProbability, ALL_SUBCATEGORY_IDS } from '@/lib/sos-engine';
import { generateReportPDF } from '@/lib/generate-pdf';
import { encodeReportURL } from '@/lib/report-url';
import { encodeConsultationURL } from '@/lib/consultation-url';
import type { SubcategoryInput, RevenueTier } from '@/lib/sos-engine';

export default function AssessmentDetail() {
  const { user, loading, isAuthenticated } = useAuth();
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const assessmentId = Number(params.id);

  const detailQuery = trpc.assessments.getById.useQuery({ id: assessmentId }, { enabled: isAuthenticated && !!assessmentId });
  const logOutcome = trpc.outcomes.create.useMutation();

  const [showCalculation, setShowCalculation] = useState(false);
  const [showOutcomeForm, setShowOutcomeForm] = useState(false);
  const [outcomeHit, setOutcomeHit] = useState<'yes' | 'no' | 'partial' | null>(null);
  const [actualRevenue, setActualRevenue] = useState<number>(0);
  const [outcomeNotes, setOutcomeNotes] = useState('');
  const [activeTier, setActiveTier] = useState<RevenueTier | null>(null);
  const [activeCustomTarget, setActiveCustomTarget] = useState<number | undefined>(undefined);
  const [activeGoalRevenue, setActiveGoalRevenue] = useState<number | undefined>(undefined);

  // Send to Customer Portal state
  const [showSendPanel, setShowSendPanel] = useState(false);
  const [custEmail, setCustEmail] = useState('');
  const [custName, setCustName] = useState('');
  const [custSendResult, setCustSendResult] = useState<{ status: string; message: string; portalUrl: string | null; username: string | null; password: string | null } | null>(null);
  const sendToCustomerMut = trpc.assessments.sendToCustomer.useMutation();

  // Delete assessment (admin only)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const deleteAssessmentMut = trpc.assessments.delete.useMutation({
    onSuccess: () => {
      toast.success('Assessment deleted');
      navigate('/dashboard');
    },
    onError: (err) => toast.error(err.message),
  });

  // Get the assessment data first, then conditionally fetch previous
  const assessment = detailQuery.data ? (detailQuery.data as any).assessment : null;
  const shopName = detailQuery.data ? (detailQuery.data as any).shopName : null;
  const shopLogoUrl = detailQuery.data ? (detailQuery.data as any).shopLogoUrl : null;

  // Fetch previous assessment for comparison (only when we have the current assessment)
  const previousQuery = trpc.assessments.getPrevious.useQuery(
    { assessmentId, shopId: assessment?.shopId ?? 0 },
    { enabled: isAuthenticated && !!assessment?.shopId }
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  if (detailQuery.isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!detailQuery.data || !assessment) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-sm text-muted-foreground">Assessment not found</p>
          <Button onClick={() => navigate('/dashboard')} variant="outline" className="h-8 text-xs gap-1.5 border-gold/40 text-gold">
            <ArrowLeft size={14} /> Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // Reconstruct inputs from saved scores JSON
  const savedScores = (assessment.scores || {}) as Record<string, { score: number; note: string }>;
  const inputs: Record<string, SubcategoryInput> = {};
  for (const id of ALL_SUBCATEGORY_IDS) {
    const s = savedScores[id];
    inputs[id] = { score: s?.score ?? 0, note: s?.note ?? '' };
  }

  const result = computeSOS(inputs);
  const effectiveTier = activeTier ?? (assessment.revenueTier || '20-30') as RevenueTier;
  const effectiveCustomTarget = activeTier === 'custom'
    ? (activeCustomTarget ?? assessment.customTarget ?? 60000)
    : assessment.customTarget ?? undefined;
  const probability = computeScalingProbability(
    result,
    effectiveTier,
    effectiveTier === 'custom' ? effectiveCustomTarget : undefined
  );

  const meta = {
    shopName: shopName || 'Unknown Shop',
    assessorName: assessment.assessorName,
    assessmentDate: assessment.assessmentDate,
    notes: assessment.notes || '',
  };

  const isConsultation = assessment.assessmentType === 'consultation';

  const handleOpenCustomerReport = () => {
    const encoded = encodeReportURL(
      meta,
      inputs,
      (assessment.revenueTier || '20-30') as RevenueTier,
      assessment.customTarget ?? undefined,
      shopLogoUrl ?? null,
      assessment.currentRevenue ?? null,
      assessment.goalRevenue ?? null,
      assessment.businessProfile ?? null
    );
    const url = `${window.location.origin}/report?d=${encoded}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleOpenConsultationReport = () => {
    const encoded = encodeConsultationURL(
      meta,
      inputs,
      (assessment.revenueTier || '20-30') as RevenueTier,
      assessment.customTarget ?? undefined,
      shopLogoUrl ?? null,
      assessment.currentRevenue ?? null,
      assessment.goalRevenue ?? null,
      assessment.businessProfile ?? null
    );
    const url = `${window.location.origin}/consultation?d=${encoded}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleCopyConsultationLink = () => {
    const encoded = encodeConsultationURL(
      meta,
      inputs,
      (assessment.revenueTier || '20-30') as RevenueTier,
      assessment.customTarget ?? undefined,
      shopLogoUrl ?? null,
      assessment.currentRevenue ?? null,
      assessment.goalRevenue ?? null,
      assessment.businessProfile ?? null
    );
    const url = `${window.location.origin}/consultation?d=${encoded}`;
    navigator.clipboard.writeText(url).then(() => {
      toast.success('Consultation link copied!');
    }).catch(() => {
      toast.error('Failed to copy link');
    });
  };

  const handleLogOutcome = async () => {
    if (outcomeHit === null) return;
    try {
      await logOutcome.mutateAsync({
        assessmentId,
        shopId: assessment.shopId,
        hitTarget: outcomeHit,
        actualRevenue: actualRevenue > 0 ? actualRevenue : undefined,
        notes: outcomeNotes || undefined,
      });
      toast.success('Outcome logged! The learning engine will use this data to improve predictions.');
      setShowOutcomeForm(false);
    } catch (err) {
      toast.error('Failed to log outcome');
    }
  };

  // Previous assessment data for comparison
  const previousAssessment = previousQuery.data;

  return (
    <div className="min-h-screen bg-background">
      {/* Top action bar */}
      <div className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="container flex items-center justify-between h-12">
          <Button onClick={() => navigate('/dashboard')} variant="ghost" size="sm" className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-foreground">
            <ArrowLeft size={14} /> Dashboard
          </Button>
          <div className="flex items-center gap-2">
            <Button onClick={handleOpenCustomerReport} variant="outline" size="sm" className="h-8 text-xs gap-1.5 border-gold/40 text-gold hover:bg-gold/10">
              <ExternalLink size={14} /> Customer Report
            </Button>
            <Button onClick={handleCopyConsultationLink} variant="outline" size="sm" className="h-8 text-xs gap-1.5 border-blue-500/40 text-blue-400 hover:bg-blue-500/10">
              <Copy size={14} /> Consultation Link
            </Button>
            <Button
              onClick={() => {
                const reassessData = {
                  shopName: shopName || '',
                  shopId: assessment.shopId,
                  previousAssessmentId: assessmentId,
                  previousScores: savedScores,
                  revenueTier: assessment.revenueTier,
                  customTarget: assessment.customTarget,
                  previousProbability: assessment.scalingProbability,
                  previousRevenueTier: probability.tierLabel,
                };
                const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(reassessData))));
                navigate(`/?reassess=${encoded}`);
              }}
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1.5 border-gold/40 text-gold hover:bg-gold/10"
            >
              <RefreshCcw size={14} /> Reassess Shop
            </Button>
            <Button onClick={() => setShowCalculation(true)} variant="outline" size="sm" className="h-8 text-xs gap-1.5 border-gold/40 text-gold hover:bg-gold/10">
              <Radar size={14} /> Replay Analysis
            </Button>
            <Button onClick={() => setShowOutcomeForm(!showOutcomeForm)} variant="outline" size="sm" className="h-8 text-xs gap-1.5 border-border/40 text-muted-foreground hover:text-foreground">
              <CheckCircle2 size={14} /> Log Outcome
            </Button>
            <Button onClick={() => setShowSendPanel(!showSendPanel)} variant="outline" size="sm" className="h-8 text-xs gap-1.5 border-blue-500/40 text-blue-400 hover:bg-blue-500/10">
              <Mail size={14} /> Send to Customer
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={async () => {
                try {
                  await generateReportPDF(result, savedScores, {
                    shopName: shopName || '',
                    assessorName: assessment.assessorName,
                    assessmentDate: assessment.assessmentDate || new Date().toISOString().slice(0, 10),
                    notes: assessment.notes || '',
                  }, probability!, shopLogoUrl);
                } catch (err) {
                  console.error('PDF generation failed:', err);
                  toast.error('Failed to generate PDF');
                }
              }}
              disabled={!probability}
              className="h-8 text-xs gap-1.5 bg-gold text-black hover:bg-gold-light print:hidden disabled:opacity-60"
            >
              <Download size={14} /> Download PDF
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.print()} className="h-8 text-xs gap-1.5 border-gold/40 text-gold hover:bg-gold/10 print:hidden">
              <Printer size={14} /> Print
            </Button>
            {user?.role === 'admin' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
                className="h-8 text-xs gap-1.5 border-red-500/40 text-red-400 hover:bg-red-500/10"
              >
                <Trash2 size={14} /> Delete
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog (admin only) */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border/40 rounded-xl p-6 max-w-sm w-full mx-4 space-y-4">
            <h3 className="text-lg font-bold text-foreground">Delete Assessment?</h3>
            <p className="text-sm text-muted-foreground">
              This will permanently delete the assessment for <span className="font-semibold text-foreground">{shopName}</span>. This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteConfirm(false)}
                className="h-9 px-4 text-sm"
              >
                Cancel
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => {
                  deleteAssessmentMut.mutate({ id: assessmentId });
                  setShowDeleteConfirm(false);
                }}
                disabled={deleteAssessmentMut.isPending}
                className="h-9 px-4 text-sm bg-red-600 hover:bg-red-700 text-white"
              >
                {deleteAssessmentMut.isPending ? 'Deleting...' : 'Delete Permanently'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Outcome Form */}
      {showOutcomeForm && (
        <div className="border-b border-gold/20 bg-gold/5">
          <div className="container py-4 space-y-3">
            <h3 className="text-sm font-bold text-foreground">Log Outcome for {shopName}</h3>
            <p className="text-xs text-muted-foreground">Did this shop hit their revenue target? This data helps the algorithm learn.</p>
            <div className="flex gap-2">
              <button
                onClick={() => setOutcomeHit('yes')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-semibold transition-all ${
                  outcomeHit === 'yes' ? 'border-[#2ECC71] bg-[#2ECC71]/10 text-[#2ECC71]' : 'border-border/30 text-muted-foreground hover:border-[#2ECC71]/30'
                }`}
              >
                <CheckCircle2 size={14} /> Hit Target
              </button>
              <button
                onClick={() => setOutcomeHit('partial')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-semibold transition-all ${
                  outcomeHit === 'partial' ? 'border-[#D4A843] bg-[#D4A843]/10 text-[#D4A843]' : 'border-border/30 text-muted-foreground hover:border-[#D4A843]/30'
                }`}
              >
                <AlertCircle size={14} /> Partial
              </button>
              <button
                onClick={() => setOutcomeHit('no')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-semibold transition-all ${
                  outcomeHit === 'no' ? 'border-[#E74C3C] bg-[#E74C3C]/10 text-[#E74C3C]' : 'border-border/30 text-muted-foreground hover:border-[#E74C3C]/30'
                }`}
              >
                <XCircle size={14} /> Missed Target
              </button>
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-[10px] text-muted-foreground block mb-1">Actual Monthly Revenue ($)</label>
                <input
                  type="number"
                  value={actualRevenue || ''}
                  onChange={(e) => setActualRevenue(Number(e.target.value))}
                  placeholder="e.g. 28000"
                  className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm font-data text-foreground focus:border-gold/50 focus:outline-none"
                />
              </div>
              <div className="flex-1">
                <label className="text-[10px] text-muted-foreground block mb-1">Notes (optional)</label>
                <input
                  type="text"
                  value={outcomeNotes}
                  onChange={(e) => setOutcomeNotes(e.target.value)}
                  placeholder="Any context..."
                  className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-foreground focus:border-gold/50 focus:outline-none"
                />
              </div>
            </div>
            <Button
              onClick={handleLogOutcome}
              disabled={outcomeHit === null || logOutcome.isPending}
              className="h-9 text-xs bg-gold text-black hover:bg-gold-light disabled:opacity-40"
            >
              {logOutcome.isPending ? 'Saving...' : 'Save Outcome'}
            </Button>
          </div>
        </div>
      )}

      {/* Send to Customer Panel */}
      {showSendPanel && assessment && (
        <div className="border-b border-blue-500/20 bg-blue-500/[0.03]">
          <div className="container py-4 space-y-3">
            <div className="flex items-center gap-2">
              <Mail size={16} className="text-blue-400" />
              <h3 className="text-sm font-bold text-foreground">Send to Customer Portal</h3>
            </div>
            {!custSendResult ? (
              <>
                <p className="text-xs text-muted-foreground">
                  Enter the shop owner's email to create their portal account. They'll be able to log in and view this assessment.
                </p>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="text-[10px] text-muted-foreground block mb-1">Customer Email *</label>
                    <input
                      type="email"
                      value={custEmail}
                      onChange={(e) => setCustEmail(e.target.value)}
                      placeholder="owner@theirshop.com"
                      className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-foreground focus:border-blue-500/50 focus:outline-none"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] text-muted-foreground block mb-1">Customer Name (optional)</label>
                    <input
                      type="text"
                      value={custName}
                      onChange={(e) => setCustName(e.target.value)}
                      placeholder="John Smith"
                      className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-foreground focus:border-blue-500/50 focus:outline-none"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={async () => {
                      if (!custEmail.trim()) return;
                      try {
                        const res = await sendToCustomerMut.mutateAsync({
                          assessmentId,
                          shopId: assessment.shopId,
                          customerEmail: custEmail.trim(),
                          customerName: custName.trim() || custEmail.split('@')[0],
                          origin: window.location.origin,
                        });
                        setCustSendResult(res);
                        if (res.status === 'created') toast.success('Customer portal access created!');
                        else if (res.status === 'existing') toast.info(res.message);
                        else toast.error(res.message);
                      } catch (err) {
                        toast.error('Failed to send to customer');
                      }
                    }}
                    disabled={!custEmail.trim() || sendToCustomerMut.isPending}
                    className="h-9 text-xs bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 gap-1.5"
                  >
                    <Send size={12} /> {sendToCustomerMut.isPending ? 'Creating...' : 'Create Portal Access'}
                  </Button>
                  <Button onClick={() => setShowSendPanel(false)} variant="ghost" size="sm" className="h-9 text-xs text-muted-foreground">
                    Cancel
                  </Button>
                </div>
              </>
            ) : (
              <div className="space-y-3">
                {custSendResult.status === 'created' ? (
                  <div className="rounded-lg border border-[#2ECC71]/20 bg-[#2ECC71]/[0.05] p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 size={16} className="text-[#2ECC71]" />
                      <span className="text-sm font-bold text-[#2ECC71]">Portal Access Created</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">{custSendResult.message}</p>
                    <div className="rounded-lg border border-border/20 bg-muted/10 p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground/40">Login URL</span>
                        <button
                          onClick={() => { navigator.clipboard.writeText(custSendResult.portalUrl || ''); toast.success('Copied!'); }}
                          className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1"
                        >
                          <Copy size={10} /> Copy
                        </button>
                      </div>
                      <p className="font-data text-xs text-foreground break-all">{custSendResult.portalUrl}</p>
                      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/10">
                        <div>
                          <span className="text-[10px] uppercase tracking-wider text-muted-foreground/40 block">Username</span>
                          <p className="font-data text-xs text-foreground">{custSendResult.username}</p>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase tracking-wider text-muted-foreground/40 block">Temp Password</span>
                          <p className="font-data text-xs text-foreground">{custSendResult.password}</p>
                        </div>
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground/50 mt-2 italic">
                      Share these credentials with the shop owner.
                    </p>
                  </div>
                ) : custSendResult.status === 'existing' ? (
                  <div className="rounded-lg border border-gold/20 bg-gold/[0.05] p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle2 size={16} className="text-gold" />
                      <span className="text-sm font-bold text-gold">Already Has Access</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{custSendResult.message}</p>
                  </div>
                ) : (
                  <div className="rounded-lg border border-red-500/20 bg-red-500/[0.05] p-4">
                    <p className="text-xs text-red-400">{custSendResult.message}</p>
                  </div>
                )}
                <Button onClick={() => { setCustSendResult(null); setCustEmail(''); setCustName(''); setShowSendPanel(false); }} variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground">
                  Done
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Calculation Board Replay */}
      {showCalculation ? (
        <div className="fixed inset-0 z-[100]">
          <CalculationBoard
            result={result}
            probability={probability}
            inputs={inputs}
            shopName={shopName || 'Unknown Shop'}
            onComplete={() => setShowCalculation(false)}
          />
        </div>
      ) : isConsultation ? (
        /* Consultation-type assessments render the sales presentation */
        <ConsultationReport
          result={result}
          inputs={inputs}
          meta={meta}
          probability={probability}
          customerLogoUrl={shopLogoUrl ?? null}
          revenueTier={effectiveTier}
          customTarget={effectiveCustomTarget}
          currentRevenue={assessment.currentRevenue ?? undefined}
          goalRevenue={activeGoalRevenue ?? assessment.goalRevenue ?? undefined}
          businessProfile={assessment.businessProfile ?? null}
          onTierChange={(tier, ct) => { setActiveTier(tier); if (tier === 'custom' && ct !== undefined) setActiveCustomTarget(ct); }}
          onGoalRevenueChange={(val) => setActiveGoalRevenue(val)}
        />
      ) : (
        <>
          {/* Reassessment Comparison Panel — shows when previous assessment exists */}
          {previousAssessment && (
            <div className="container py-4">
              <ReassessmentComparison
                current={{
                  result,
                  probability: probability.overall,
                  date: assessment.assessmentDate,
                }}
                previous={previousAssessment}
              />
            </div>
          )}

          <ReportView
            result={result}
            inputs={inputs}
            meta={meta}
            probability={probability}
            onBack={() => navigate('/dashboard')}
            hideActionBar={true}
            customerLogoUrl={shopLogoUrl ?? null}
            revenueTier={effectiveTier}
            customTarget={effectiveCustomTarget}
            onTierChange={(tier, ct) => { setActiveTier(tier); if (tier === 'custom' && ct !== undefined) setActiveCustomTarget(ct); }}
            onReplayAnimation={() => setShowCalculation(true)}
            currentRevenue={assessment.currentRevenue ?? undefined}
            goalRevenue={assessment.goalRevenue ?? undefined}
            businessProfile={assessment.businessProfile ?? null}
            isReassessment={!!previousAssessment}
            previousInputs={previousAssessment ? Object.fromEntries(
              Object.entries(previousAssessment.scores || {}).map(([id, s]: [string, any]) => [id, { score: s?.score ?? 0, note: s?.note ?? '' }])
            ) : null}
            previousDate={previousAssessment?.assessmentDate || null}
            previousRevenue={null}
            previousBusinessProfile={null}
          />
        </>
      )}
    </div>
  );
}
