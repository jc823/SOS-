import { useEffect } from "react";
import { useLocation } from "wouter";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";

export default function BillingSuccess() {
  const [, navigate] = useLocation();
  // Refetch auth so the new subscription status loads
  const utils = trpc.useUtils();
  useEffect(() => {
    utils.auth.me.invalidate();
    utils.billing.getStatus.invalidate();
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={32} className="text-green-400" />
        </div>
        <h1 className="text-2xl font-black mb-3">You're in. Welcome to Pro.</h1>
        <p className="text-muted-foreground mb-8">
          Your subscription is active. You now have full access to the Scale Toolkit.
        </p>
        <Button
          onClick={() => navigate("/")}
          className="bg-gold text-black font-bold hover:bg-gold/90 h-11 px-8"
        >
          Go to Hub →
        </Button>
      </div>
    </div>
  );
}
