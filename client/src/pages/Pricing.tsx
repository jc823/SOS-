import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Zap, Lock, ArrowRight, Loader2 } from "lucide-react";

const FREE_FEATURES = [
  "SOS Quiz — instant score",
  "Revenue gap estimate",
  "Pillar breakdown",
];

const PRO_FEATURES = [
  "Full SOS Assessment tool",
  "Assessment history & dashboard",
  "Customer portal for your clients",
  "AI business coach per client",
  "Invite codes for clients",
  "AI-powered predictions & risk scores",
  "Admin control panel",
  "Unlimited assessments",
];

const AGENT_FEATURES = [
  "Everything in Pro",
  "AI agents suite",
  "Automated outreach",
  "Revenue growth automation",
];

export default function Pricing() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const origin = window.location.origin;

  const checkoutMutation = trpc.billing.createCheckoutSession.useMutation({
    onSuccess: (data) => {
      if (data.url) window.location.href = data.url;
    },
    onError: (err) => alert(err.message),
  });

  function handleGetPro() {
    if (!isAuthenticated) {
      navigate("/register?plan=pro");
      return;
    }
    checkoutMutation.mutate({
      plan: "pro",
      successUrl: `${origin}/billing/success`,
      cancelUrl: `${origin}/pricing`,
    });
  }

  const currentStatus = user?.subscriptionStatus ?? "free";
  const isPro = currentStatus === "pro" || currentStatus === "agent";

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="border-b border-white/8 bg-black/40 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={() => navigate("/")} className="text-sm text-muted-foreground hover:text-white transition-colors">
            ← Back
          </button>
          {isAuthenticated && (
            <button onClick={() => navigate("/")} className="text-xs text-muted-foreground hover:text-white transition-colors">
              Go to Hub
            </button>
          )}
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-16">
        {/* Hero */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 text-[11px] font-medium tracking-widest uppercase text-gold/60 mb-4">
            <Zap size={11} /> Scale Toolkit
          </div>
          <h1 className="text-4xl sm:text-5xl font-black mb-4 leading-tight">
            Simple, transparent pricing
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Start free with the SOS Quiz. Upgrade to access the full toolkit and start scaling your clients.
          </p>
        </div>

        {/* Pricing cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto">

          {/* Free */}
          <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-6 flex flex-col">
            <div className="mb-6">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Free</p>
              <div className="text-4xl font-black mb-1">$0</div>
              <p className="text-xs text-muted-foreground">Forever free</p>
            </div>
            <ul className="space-y-2.5 flex-1 mb-6">
              {FREE_FEATURES.map(f => (
                <li key={f} className="flex items-start gap-2 text-sm text-white/70">
                  <CheckCircle2 size={14} className="text-muted-foreground shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>
            <Button
              onClick={() => navigate("/quiz")}
              variant="outline"
              className="w-full border-white/10 hover:border-white/30 text-sm"
            >
              Take the Free Quiz
            </Button>
          </div>

          {/* Pro */}
          <div className="bg-white/[0.03] border border-gold/30 rounded-2xl p-6 flex flex-col relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="bg-gold text-black text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                Most Popular
              </span>
            </div>
            <div className="mb-6">
              <p className="text-xs font-bold uppercase tracking-widest text-gold mb-2">Pro</p>
              <div className="flex items-end gap-1 mb-1">
                <span className="text-4xl font-black">$159</span>
                <span className="text-muted-foreground text-sm mb-1">/mo per seat</span>
              </div>
              <p className="text-xs text-muted-foreground">Full toolkit access</p>
            </div>
            <ul className="space-y-2.5 flex-1 mb-6">
              {PRO_FEATURES.map(f => (
                <li key={f} className="flex items-start gap-2 text-sm text-white/80">
                  <CheckCircle2 size={14} className="text-gold shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>
            {isPro ? (
              <Button className="w-full bg-green-600 text-white font-bold cursor-default text-sm" disabled>
                ✓ Current Plan
              </Button>
            ) : (
              <Button
                onClick={handleGetPro}
                disabled={checkoutMutation.isPending}
                className="w-full bg-gold text-black font-bold hover:bg-gold/90 text-sm"
              >
                {checkoutMutation.isPending
                  ? <><Loader2 size={14} className="animate-spin mr-2" /> Loading…</>
                  : <>Get Pro <ArrowRight size={14} className="ml-1.5" /></>}
              </Button>
            )}
          </div>

          {/* Agents — coming soon */}
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 flex flex-col opacity-70">
            <div className="mb-6">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Agents</p>
              <div className="text-4xl font-black mb-1">TBD</div>
              <p className="text-xs text-muted-foreground">Coming soon</p>
            </div>
            <ul className="space-y-2.5 flex-1 mb-6">
              {AGENT_FEATURES.map(f => (
                <li key={f} className="flex items-start gap-2 text-sm text-white/50">
                  <CheckCircle2 size={14} className="text-muted-foreground/40 shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>
            <Button disabled className="w-full border border-white/10 text-muted-foreground text-sm" variant="outline">
              <Lock size={13} className="mr-2" /> Coming Soon
            </Button>
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto mt-16 space-y-4">
          <h2 className="text-lg font-black text-center mb-6">Common questions</h2>
          {[
            { q: "Can I cancel anytime?", a: "Yes. Cancel from your billing portal — you keep access until the end of your billing period." },
            { q: "What's a seat?", a: "One seat = one admin/consultant login. Your clients don't count as seats — you can give unlimited clients portal access." },
            { q: "Is there a free trial?", a: "The SOS Quiz is free forever. Pro is $175/mo — no trial, but cancel anytime." },
            { q: "What payment methods do you accept?", a: "All major credit and debit cards via Stripe. Secure, encrypted, no card data touches our servers." },
          ].map(({ q, a }) => (
            <div key={q} className="bg-white/[0.03] border border-white/8 rounded-xl p-5">
              <p className="text-sm font-bold mb-1.5">{q}</p>
              <p className="text-sm text-muted-foreground">{a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
