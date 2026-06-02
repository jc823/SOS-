import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Shield, Users, Store, LogOut, Loader2,
  ToggleLeft, ToggleRight, ChevronLeft, Link2,
  Plus, Trash2, CheckCircle2, Copy, Ticket,
  Brain, AlertTriangle, RefreshCw, TrendingUp,
} from "lucide-react";

type UserRole = "user" | "admin" | "super_admin" | "customer";
type Tab = "users" | "shops" | "invites" | "ai";

const ROLE_COLORS: Record<string, string> = {
  super_admin: "text-gold",
  admin:       "text-blue-400",
  customer:    "text-purple-400",
  user:        "text-muted-foreground",
};

export default function AdminPanel() {
  const { user, logout, loading } = useAuth();
  const [, navigate] = useLocation();
  const [tab, setTab] = useState<Tab>("users");

  // Invite creation state
  const [newRole, setNewRole] = useState<UserRole>("customer");
  const [newShopId, setNewShopId] = useState<string>("");
  const [newExpiry, setNewExpiry] = useState<string>("30");
  const [copied, setCopied] = useState<string | null>(null);

  const canQuery = !loading && user?.role === "super_admin";

  const usersQuery  = trpc.admin.listAllUsers.useQuery(undefined, { enabled: canQuery });
  const shopsQuery  = trpc.admin.listAllShops.useQuery(undefined, { enabled: canQuery });
  const invitesQuery    = trpc.invites.list.useQuery(undefined, { enabled: canQuery });
  const aiInsightsQuery = trpc.admin.getAIInsights.useQuery(undefined, { enabled: canQuery && tab === "ai" });

  const updateRole          = trpc.admin.updateUserRole.useMutation({ onSuccess: () => usersQuery.refetch() });
  const assignShop          = trpc.admin.assignShopToUser.useMutation({ onSuccess: () => usersQuery.refetch() });
  const unlockResults       = trpc.admin.unlockShopResults.useMutation({ onSuccess: () => shopsQuery.refetch() });
  const createInvite        = trpc.invites.create.useMutation({ onSuccess: () => invitesQuery.refetch() });
  const deleteInvite        = trpc.invites.delete.useMutation({ onSuccess: () => invitesQuery.refetch() });
  const runLearning         = trpc.admin.runLearningAnalysis.useMutation({ onSuccess: () => aiInsightsQuery.refetch() });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-gold" />
      </div>
    );
  }

  if (!user || user.role !== "super_admin") {
    navigate("/");
    return null;
  }

  const allUsers  = usersQuery.data  ?? [];
  const allShops  = shopsQuery.data  ?? [];
  const allInvites = invitesQuery.data ?? [];

  const origin = window.location.origin;

  function copyInviteLink(code: string) {
    const url = `${origin}/register?code=${code}`;
    navigator.clipboard.writeText(url);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  }

  function handleCreateInvite() {
    createInvite.mutate({
      role: newRole,
      shopId: newRole === "customer" && newShopId ? Number(newShopId) : undefined,
      expiresInDays: newExpiry ? Number(newExpiry) : 30,
    });
  }

  const aiInsights   = aiInsightsQuery.data;
  const highRisk     = aiInsights?.highRiskShops ?? [];
  const patterns     = aiInsights?.recentPatterns ?? [];

  const TABS: { id: Tab; label: string; icon: React.ReactNode; count: number }[] = [
    { id: "users",   label: "Users",   icon: <Users size={14} />,  count: allUsers.length },
    { id: "shops",   label: "Shops",   icon: <Store size={14} />,  count: allShops.length },
    { id: "invites", label: "Invites", icon: <Ticket size={14} />, count: allInvites.length },
    { id: "ai",      label: "AI Insights", icon: <Brain size={14} />, count: highRisk.length },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="border-b border-white/8 bg-black/40 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield size={16} className="text-gold" />
            <span className="text-sm font-bold">Admin Panel</span>
            <span className="text-[10px] bg-gold/10 text-gold px-2 py-0.5 rounded font-medium uppercase tracking-widest">
              Super Admin
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => navigate("/")} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-white transition-colors">
              <ChevronLeft size={12} /> Back to Hub
            </button>
            <button onClick={() => logout()} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-white transition-colors">
              <LogOut size={12} /> Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-black mb-1">Admin Panel</h1>
          <p className="text-sm text-muted-foreground">Manage users, shops, access control, and invite codes.</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                tab === t.id
                  ? "bg-gold text-black"
                  : "bg-white/5 text-muted-foreground hover:text-white hover:bg-white/8"
              }`}
            >
              {t.icon} {t.label} ({t.count})
            </button>
          ))}
        </div>

        {/* ── Users Tab ── */}
        {tab === "users" && (
          <div className="bg-white/[0.03] border border-white/8 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/8 flex items-center justify-between">
              <h2 className="text-sm font-bold">All Users</h2>
              {usersQuery.isLoading && <Loader2 size={14} className="animate-spin text-muted-foreground" />}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.02]">
                    <th className="text-left px-6 py-3 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">User</th>
                    <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Role</th>
                    <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Assigned Shop</th>
                    <th className="px-4 py-3 w-16" />
                  </tr>
                </thead>
                <tbody>
                  {allUsers.map((u) => (
                    <tr key={u.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.015] transition-colors">
                      <td className="px-6 py-3">
                        <div className="font-medium">{u.name || u.username || "—"}</div>
                        <div className="text-[11px] text-muted-foreground">{u.email ?? u.username}</div>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={u.role}
                          onChange={(e) => {
                            if (u.id !== user.id) updateRole.mutate({ userId: u.id, role: e.target.value as UserRole });
                          }}
                          disabled={u.id === user.id || updateRole.isPending}
                          className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-gold/50 disabled:opacity-40 cursor-pointer"
                        >
                          <option value="user">user</option>
                          <option value="admin">admin</option>
                          <option value="super_admin">super_admin</option>
                          <option value="customer">customer</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={u.shopId ?? ""}
                          onChange={(e) => assignShop.mutate({ userId: u.id, shopId: e.target.value ? Number(e.target.value) : null })}
                          disabled={assignShop.isPending}
                          className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-gold/50 disabled:opacity-40 cursor-pointer max-w-[200px]"
                        >
                          <option value="">— No shop —</option>
                          {allShops.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {u.id === user.id && <span className="text-[10px] text-gold/60 font-medium">You</span>}
                      </td>
                    </tr>
                  ))}
                  {allUsers.length === 0 && !usersQuery.isLoading && (
                    <tr><td colSpan={4} className="px-6 py-10 text-center text-sm text-muted-foreground">No users found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Shops Tab ── */}
        {tab === "shops" && (
          <div className="bg-white/[0.03] border border-white/8 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/8 flex items-center justify-between">
              <h2 className="text-sm font-bold">All Shops</h2>
              {shopsQuery.isLoading && <Loader2 size={14} className="animate-spin text-muted-foreground" />}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.02]">
                    <th className="text-left px-6 py-3 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Shop</th>
                    <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Latest Score</th>
                    <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Assessments</th>
                    <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Results Access</th>
                  </tr>
                </thead>
                <tbody>
                  {allShops.map((s) => (
                    <tr key={s.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.015] transition-colors">
                      <td className="px-6 py-3">
                        <div className="font-medium">{s.name}</div>
                        <div className="text-[11px] text-muted-foreground">ID #{s.id}</div>
                      </td>
                      <td className="px-4 py-3 font-mono font-bold">
                        {s.latestOverallPercentage != null
                          ? `${s.latestOverallPercentage}%`
                          : <span className="text-muted-foreground font-normal text-xs">—</span>}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{s.assessmentCount ?? 0}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => unlockResults.mutate({ shopId: s.id, unlocked: !s.resultsUnlocked })}
                          disabled={unlockResults.isPending}
                          className={`flex items-center gap-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
                            s.resultsUnlocked ? "text-green-400 hover:text-green-300" : "text-muted-foreground hover:text-white"
                          }`}
                        >
                          {s.resultsUnlocked ? <><ToggleRight size={20} /> Unlocked</> : <><ToggleLeft size={20} /> Locked</>}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {allShops.length === 0 && !shopsQuery.isLoading && (
                    <tr><td colSpan={4} className="px-6 py-10 text-center text-sm text-muted-foreground">No shops found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Invites Tab ── */}
        {tab === "invites" && (
          <div className="space-y-4">

            {/* Create new invite */}
            <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-6">
              <h2 className="text-sm font-bold mb-4 flex items-center gap-2">
                <Plus size={14} className="text-gold" /> Generate Invite Code
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                <div>
                  <Label className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5 block">Role</Label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as UserRole)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gold/50"
                  >
                    <option value="customer">customer</option>
                    <option value="user">user</option>
                    <option value="admin">admin</option>
                    <option value="super_admin">super_admin</option>
                  </select>
                </div>
                {newRole === "customer" && (
                  <div>
                    <Label className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5 block">Link to Shop (optional)</Label>
                    <select
                      value={newShopId}
                      onChange={(e) => setNewShopId(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gold/50"
                    >
                      <option value="">— No shop yet —</option>
                      {allShops.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                )}
                <div>
                  <Label className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5 block">Expires in (days)</Label>
                  <Input
                    type="number"
                    value={newExpiry}
                    onChange={(e) => setNewExpiry(e.target.value)}
                    placeholder="30"
                    className="bg-white/5 border-white/10 text-white h-10"
                  />
                </div>
              </div>
              <Button
                onClick={handleCreateInvite}
                disabled={createInvite.isPending}
                className="bg-gold text-black font-bold hover:bg-gold/90 h-10 px-6"
              >
                {createInvite.isPending ? <Loader2 size={14} className="animate-spin mr-2" /> : <Plus size={14} className="mr-2" />}
                Generate Code
              </Button>

              {/* Newly created code */}
              {createInvite.data && (
                <div className="mt-4 flex items-center gap-3 bg-white/5 border border-gold/20 rounded-xl px-4 py-3">
                  <Ticket size={16} className="text-gold shrink-0" />
                  <code className="text-sm text-gold font-mono flex-1 truncate">{createInvite.data.code}</code>
                  <button
                    onClick={() => copyInviteLink(createInvite.data!.code)}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-white transition-colors shrink-0"
                  >
                    {copied === createInvite.data.code ? <CheckCircle2 size={14} className="text-green-400" /> : <Copy size={14} />}
                    {copied === createInvite.data.code ? "Copied!" : "Copy link"}
                  </button>
                </div>
              )}
            </div>

            {/* Existing invites */}
            <div className="bg-white/[0.03] border border-white/8 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-white/8 flex items-center justify-between">
                <h2 className="text-sm font-bold">All Invite Codes ({allInvites.length})</h2>
                {invitesQuery.isLoading && <Loader2 size={14} className="animate-spin text-muted-foreground" />}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/[0.02]">
                      <th className="text-left px-6 py-3 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Code</th>
                      <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Role</th>
                      <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Status</th>
                      <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Expires</th>
                      <th className="px-4 py-3 w-24" />
                    </tr>
                  </thead>
                  <tbody>
                    {allInvites.map((inv) => {
                      const isUsed = !!inv.usedAt;
                      const isExpired = inv.expiresAt ? new Date(inv.expiresAt) < new Date() : false;
                      return (
                        <tr key={inv.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.015] transition-colors">
                          <td className="px-6 py-3 font-mono text-xs text-gold/80 truncate max-w-[180px]">
                            {inv.code}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-medium ${ROLE_COLORS[inv.role] ?? "text-muted-foreground"}`}>
                              {inv.role}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {isUsed ? (
                              <span className="text-[10px] bg-green-500/10 text-green-400 px-2 py-0.5 rounded font-medium">Used</span>
                            ) : isExpired ? (
                              <span className="text-[10px] bg-red-500/10 text-red-400 px-2 py-0.5 rounded font-medium">Expired</span>
                            ) : (
                              <span className="text-[10px] bg-gold/10 text-gold px-2 py-0.5 rounded font-medium">Active</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            {inv.expiresAt ? new Date(inv.expiresAt).toLocaleDateString() : "Never"}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2 justify-end">
                              {!isUsed && (
                                <button
                                  onClick={() => copyInviteLink(inv.code)}
                                  className="text-muted-foreground hover:text-white transition-colors"
                                  title="Copy invite link"
                                >
                                  {copied === inv.code
                                    ? <CheckCircle2 size={14} className="text-green-400" />
                                    : <Link2 size={14} />}
                                </button>
                              )}
                              <button
                                onClick={() => deleteInvite.mutate({ id: inv.id })}
                                disabled={deleteInvite.isPending}
                                className="text-muted-foreground hover:text-red-400 transition-colors disabled:opacity-40"
                                title="Delete invite"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {allInvites.length === 0 && !invitesQuery.isLoading && (
                      <tr>
                        <td colSpan={5} className="px-6 py-10 text-center text-sm text-muted-foreground">
                          No invite codes yet — generate one above.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        {/* ── AI Insights Tab ── */}
        {tab === "ai" && (
          <div className="space-y-4">

            {/* Run Learning Analysis */}
            <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-sm font-bold mb-1 flex items-center gap-2">
                    <Brain size={14} className="text-gold" /> Learning Engine
                  </h2>
                  <p className="text-xs text-muted-foreground max-w-lg">
                    Analyzes all assessments with logged outcomes to find patterns — which score improvements correlate with real revenue growth. Results feed back into future predictions.
                  </p>
                </div>
                <Button
                  onClick={() => runLearning.mutate()}
                  disabled={runLearning.isPending}
                  className="shrink-0 bg-gold text-black font-bold hover:bg-gold/90 h-9 px-4 text-xs"
                >
                  {runLearning.isPending
                    ? <><Loader2 size={12} className="animate-spin mr-1.5" /> Analyzing…</>
                    : <><RefreshCw size={12} className="mr-1.5" /> Run Analysis</>}
                </Button>
              </div>
              {runLearning.isSuccess && (
                <p className="text-xs text-green-400 mt-3 flex items-center gap-1.5">
                  <CheckCircle2 size={12} /> Analysis complete — patterns saved.
                </p>
              )}
            </div>

            {/* High Risk Shops */}
            <div className="bg-white/[0.03] border border-white/8 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-white/8 flex items-center justify-between">
                <h2 className="text-sm font-bold flex items-center gap-2">
                  <AlertTriangle size={14} className="text-amber-400" />
                  High-Risk Shops ({highRisk.length})
                </h2>
                {aiInsightsQuery.isLoading && <Loader2 size={14} className="animate-spin text-muted-foreground" />}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/[0.02]">
                      <th className="text-left px-6 py-3 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Shop</th>
                      <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Score</th>
                      <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Risk</th>
                      <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Rev Gap</th>
                      <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Primary Risk Factor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {highRisk.map((item: any) => {
                      let pred: any = null;
                      try { pred = item.predictions ? JSON.parse(item.predictions) : null; } catch {}
                      const riskLevel = pred?.riskScore?.level ?? "—";
                      const riskScore = pred?.riskScore?.score ?? null;
                      const riskFactor = pred?.riskScore?.primaryRiskFactor ?? "—";
                      const revGap = pred?.revenueProjection
                        ? (pred.revenueProjection.projectedIfAllFixed ?? 0) - (pred.revenueProjection.current ?? 0)
                        : null;
                      return (
                        <tr key={item.assessmentId} className="border-b border-white/5 last:border-0 hover:bg-white/[0.015]">
                          <td className="px-6 py-3">
                            <div className="font-medium">{item.shopName}</div>
                            <div className="text-[11px] text-muted-foreground">{item.assessmentDate}</div>
                          </td>
                          <td className="px-4 py-3 font-mono font-bold">{item.overallPercentage}%</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-semibold ${
                              riskLevel === "high" ? "text-red-400" :
                              riskLevel === "medium" ? "text-amber-400" : "text-muted-foreground"
                            }`}>
                              {riskLevel} {riskScore != null ? `(${Math.round(riskScore * 100)}%)` : ""}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono">
                            {revGap != null ? `$${revGap.toLocaleString()}/mo` : "—"}
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground max-w-xs truncate">{riskFactor}</td>
                        </tr>
                      );
                    })}
                    {highRisk.length === 0 && !aiInsightsQuery.isLoading && (
                      <tr><td colSpan={5} className="px-6 py-10 text-center text-sm text-muted-foreground">
                        No high-risk shops yet — predictions are generated automatically after each assessment.
                      </td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent Pattern Findings */}
            <div className="bg-white/[0.03] border border-white/8 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-white/8">
                <h2 className="text-sm font-bold flex items-center gap-2">
                  <TrendingUp size={14} className="text-gold" />
                  Recent Pattern Findings ({patterns.length})
                </h2>
              </div>
              <div className="divide-y divide-white/5">
                {patterns.map((p: any) => (
                  <div key={p.id} className="px-6 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="text-xs font-medium text-white/90 mb-1">{p.description ?? "Pattern finding"}</p>
                        {p.pillarId && (
                          <span className="text-[10px] bg-gold/10 text-gold px-2 py-0.5 rounded font-medium">{p.pillarId}</span>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        {p.confidence != null && (
                          <p className="text-xs font-mono text-gold">{Math.round(p.confidence * 100)}% confidence</p>
                        )}
                        {p.sampleSize != null && (
                          <p className="text-[10px] text-muted-foreground">{p.sampleSize} shops</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {patterns.length === 0 && (
                  <div className="px-6 py-8 text-center text-sm text-muted-foreground">
                    No patterns yet — run the learning analysis after logging outcomes on a few assessments.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
