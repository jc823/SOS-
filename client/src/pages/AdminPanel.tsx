import React, { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Shield, Users, Store, LogOut, Loader2, ToggleLeft, ToggleRight,
  ChevronLeft, Link2, Plus, Trash2, CheckCircle2, Copy, Ticket,
  Brain, AlertTriangle, RefreshCw, TrendingUp, Settings, BarChart3,
  UserCog, Mail, Calendar, Hash, Wrench, Palette, ShoppingCart, ClipboardList,
  Phone, MapPin, NotebookText, ChevronDown, UserPlus, Building2,
} from "lucide-react";

type UserRole = "user" | "admin" | "super_admin" | "customer" | "shop_manager";
type Tab = "overview" | "users" | "shops" | "invites" | "settings" | "ai";

const PERMISSIONS_CONFIG = [
  { key: "view_checklist",       label: "View Checklist" },
  { key: "complete_checklist",   label: "Complete Checklist Items" },
  { key: "view_supply_orders",   label: "View Supply Orders" },
  { key: "create_supply_orders", label: "Submit Supply Orders" },
  { key: "approve_supply_orders",label: "Approve/Reject Supply Orders" },
  { key: "view_own_stats",       label: "View Own Stats" },
  { key: "view_team_stats",      label: "View Team Stats" },
];

const DEFAULT_PERMISSIONS: Record<number, Record<string, boolean>> = {
  1: { view_checklist: true,  complete_checklist: false, view_supply_orders: true,  create_supply_orders: false, approve_supply_orders: false, view_own_stats: true,  view_team_stats: false },
  2: { view_checklist: true,  complete_checklist: true,  view_supply_orders: true,  create_supply_orders: true,  approve_supply_orders: false, view_own_stats: true,  view_team_stats: false },
  3: { view_checklist: true,  complete_checklist: true,  view_supply_orders: true,  create_supply_orders: true,  approve_supply_orders: true,  view_own_stats: true,  view_team_stats: true  },
};

const ROLE_BADGE: Record<string, string> = {
  super_admin: "bg-gold/10 text-gold border-gold/20",
  admin:       "bg-blue-500/10 text-blue-400 border-blue-400/20",
  customer:    "bg-purple-500/10 text-purple-400 border-purple-400/20",
  user:        "bg-white/5 text-muted-foreground border-white/10",
};

export default function AdminPanel() {
  const { user, logout, loading } = useAuth();
  const [, navigate] = useLocation();
  const [tab, setTab] = useState<Tab>("overview");

  // Invite state
  const [newRole, setNewRole]   = useState<UserRole>("customer");
  const [newShopId, setNewShopId] = useState("");
  const [newExpiry, setNewExpiry] = useState("30");
  const [copied, setCopied]     = useState<string | null>(null);

  // Create user state
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [cuName, setCuName]       = useState("");
  const [cuEmail, setCuEmail]     = useState("");
  const [cuUsername, setCuUsername] = useState("");
  const [cuPassword, setCuPassword] = useState("");
  const [cuRole, setCuRole]       = useState<UserRole>("customer");
  const [cuShopId, setCuShopId]   = useState("");
  const [cuError, setCuError]     = useState("");

  const canQuery = !loading && user?.role === "super_admin";

  const usersQuery    = trpc.admin.listAllUsers.useQuery(undefined,    { enabled: canQuery });
  const shopsQuery    = trpc.admin.listAllShops.useQuery(undefined,    { enabled: canQuery });
  const invitesQuery  = trpc.invites.list.useQuery(undefined,          { enabled: canQuery });
  const statsQuery    = trpc.admin.getStats.useQuery(undefined,        { enabled: canQuery });
  const settingsQuery = trpc.admin.getSettings.useQuery(undefined,     { enabled: canQuery });
  const aiInsightsQuery = trpc.admin.getAIInsights.useQuery(undefined, { enabled: canQuery && tab === "ai" });

  const updateRole         = trpc.admin.updateUserRole.useMutation({ onSuccess: () => usersQuery.refetch() });
  const updateSubscription = trpc.admin.updateUserSubscription.useMutation({ onSuccess: () => usersQuery.refetch() });
  const updateTechLevel    = trpc.admin.updateUserTechLevel.useMutation({ onSuccess: () => usersQuery.refetch() });
  const updateBranding     = trpc.admin.updateShopBranding.useMutation({ onSuccess: () => shopsQuery.refetch() });
  const upsertPermissions  = trpc.admin.upsertLevelPermissions.useMutation();
  const assignShop     = trpc.admin.assignShopToUser.useMutation({ onSuccess: () => { usersQuery.refetch(); shopsQuery.refetch(); } });
  const unlockResults  = trpc.admin.unlockShopResults.useMutation({ onSuccess: () => shopsQuery.refetch() });
  const createInvite   = trpc.invites.create.useMutation({ onSuccess: () => invitesQuery.refetch() });
  const deleteInvite   = trpc.invites.delete.useMutation({ onSuccess: () => invitesQuery.refetch() });
  const runLearning    = trpc.admin.runLearningAnalysis.useMutation({ onSuccess: () => aiInsightsQuery.refetch() });
  const updateSetting  = trpc.admin.updateSetting.useMutation({ onSuccess: () => settingsQuery.refetch() });
  const createShopMut  = trpc.admin.createShop.useMutation({ onSuccess: () => shopsQuery.refetch() });
  const updateShop     = trpc.admin.updateShop.useMutation({ onSuccess: () => shopsQuery.refetch() });
  const deleteShop     = trpc.admin.deleteShop.useMutation({ onSuccess: () => shopsQuery.refetch() });
  const createUser     = trpc.admin.createUser.useMutation({
    onSuccess: () => {
      usersQuery.refetch();
      setShowCreateUser(false);
      setCuName(""); setCuEmail(""); setCuUsername(""); setCuPassword(""); setCuRole("customer"); setCuShopId(""); setCuError("");
    },
    onError: (err) => setCuError(err.message),
  });
  const deleteUser = trpc.admin.deleteUser.useMutation({ onSuccess: () => usersQuery.refetch() });

  if (loading) {
    return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center"><Loader2 size={24} className="animate-spin text-gold" /></div>;
  }
  if (!user || user.role !== "super_admin") { navigate("/"); return null; }

  const allUsers   = usersQuery.data  ?? [];
  const allShops   = shopsQuery.data  ?? [];
  const allInvites = invitesQuery.data ?? [];
  const stats      = statsQuery.data;
  const allSettings = settingsQuery.data ?? [];
  const aiInsights  = aiInsightsQuery.data;
  const highRisk    = aiInsights?.highRiskShops ?? [];
  const patterns    = aiInsights?.recentPatterns ?? [];
  const origin      = window.location.origin;

  function copyInviteLink(code: string) {
    navigator.clipboard.writeText(`${origin}/register?code=${code}`);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  }

  const TABS = [
    { id: "overview" as Tab, label: "Overview",  icon: <BarChart3 size={14} /> },
    { id: "users"    as Tab, label: `Users (${allUsers.length})`,   icon: <Users size={14} /> },
    { id: "shops"    as Tab, label: `Shops (${allShops.length})`,   icon: <Store size={14} /> },
    { id: "invites"  as Tab, label: `Invites (${allInvites.length})`, icon: <Ticket size={14} /> },
    { id: "settings" as Tab, label: "Settings",  icon: <Settings size={14} /> },
    { id: "ai"       as Tab, label: "AI Insights", icon: <Brain size={14} /> },
  ];

  // Group settings by category
  const settingsByCategory = allSettings.reduce((acc, s) => {
    if (!acc[s.category]) acc[s.category] = [];
    acc[s.category].push(s);
    return acc;
  }, {} as Record<string, typeof allSettings>);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="border-b border-white/8 bg-black/40 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield size={16} className="text-gold" />
            <span className="text-sm font-bold">Admin Panel</span>
            <span className="text-[10px] bg-gold/10 text-gold border border-gold/20 px-2 py-0.5 rounded font-medium uppercase tracking-widest">Super Admin</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => navigate("/")} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-white transition-colors">
              <ChevronLeft size={12} /> Hub
            </button>
            <span className="text-[11px] text-muted-foreground hidden sm:block">{user.name || user.username}</span>
            <button onClick={() => logout()} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-white transition-colors">
              <LogOut size={12} /> Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Tab nav */}
        <div className="flex gap-1 flex-wrap mb-8 bg-white/[0.02] border border-white/8 rounded-xl p-1">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all flex-1 justify-center sm:flex-none sm:justify-start ${
                tab === t.id ? "bg-gold text-black shadow-sm" : "text-muted-foreground hover:text-white hover:bg-white/5"
              }`}
            >
              {t.icon} <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>

        {/* ── Overview ── */}
        {tab === "overview" && (
          <div className="space-y-6">
            <div>
              <h1 className="text-xl font-black mb-1">Admin Overview</h1>
              <p className="text-sm text-muted-foreground">System health and key metrics at a glance.</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Total Users",       value: allUsers.length,              icon: <Users size={16} className="text-gold" /> },
                { label: "Active Shops",      value: allShops.length,              icon: <Store size={16} className="text-blue-400" /> },
                { label: "Invite Codes",      value: allInvites.filter(i => !i.usedAt).length, icon: <Ticket size={16} className="text-purple-400" /> },
                { label: "Assessments",       value: stats?.totalPredictions ?? "—", icon: <BarChart3 size={16} className="text-emerald-400" /> },
              ].map(card => (
                <div key={card.label} className="bg-white/[0.03] border border-white/8 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-2">{card.icon}<span className="text-xs text-muted-foreground uppercase tracking-wider">{card.label}</span></div>
                  <div className="text-3xl font-black">{card.value}</div>
                </div>
              ))}
            </div>

            {/* Quick actions */}
            <div className="bg-white/[0.03] border border-white/8 rounded-xl p-6">
              <h2 className="text-sm font-bold mb-4">Quick Actions</h2>
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => setTab("invites")} variant="outline" className="text-xs border-white/10 hover:border-gold/40 gap-2">
                  <Plus size={13} /> Generate Invite Code
                </Button>
                <Button onClick={() => setTab("users")} variant="outline" className="text-xs border-white/10 hover:border-gold/40 gap-2">
                  <UserCog size={13} /> Manage Users
                </Button>
                <Button onClick={() => setTab("shops")} variant="outline" className="text-xs border-white/10 hover:border-gold/40 gap-2">
                  <Store size={13} /> Unlock Shop Results
                </Button>
                <Button onClick={() => setTab("settings")} variant="outline" className="text-xs border-white/10 hover:border-gold/40 gap-2">
                  <Settings size={13} /> App Settings
                </Button>
              </div>
            </div>

            {/* Users summary */}
            <div className="bg-white/[0.03] border border-white/8 rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-white/8">
                <h2 className="text-sm font-bold">Recent Users</h2>
              </div>
              <div className="divide-y divide-white/5">
                {allUsers.slice(0, 5).map(u => (
                  <div key={u.id} className="px-6 py-3 flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium">{u.name || u.username}</span>
                      <span className="text-xs text-muted-foreground ml-2">{u.email}</span>
                    </div>
                    <span className={`text-[10px] border px-2 py-0.5 rounded font-medium ${ROLE_BADGE[u.role] ?? ROLE_BADGE.user}`}>{u.role}</span>
                  </div>
                ))}
              </div>
              {allUsers.length > 5 && (
                <div className="px-6 py-3 border-t border-white/5">
                  <button onClick={() => setTab("users")} className="text-xs text-gold hover:underline">View all {allUsers.length} users →</button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Users ── */}
        {tab === "users" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-black mb-1">User Management</h1>
                <p className="text-sm text-muted-foreground">Add users directly — no invite codes needed.</p>
              </div>
              <Button
                onClick={() => setShowCreateUser(v => !v)}
                className="bg-gold text-black font-bold hover:bg-gold/90 h-9 px-4 text-xs gap-1.5"
              >
                <Plus size={13} /> Add User
              </Button>
            </div>

            {/* Create user form */}
            {showCreateUser && (
              <div className="bg-white/[0.03] border border-gold/20 rounded-xl p-6">
                <h2 className="text-sm font-bold mb-4">Create New User</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <Label className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5 block">Full Name *</Label>
                    <Input value={cuName} onChange={e => setCuName(e.target.value)} placeholder="Jane Smith" className="bg-white/5 border-white/10 text-white h-10" />
                  </div>
                  <div>
                    <Label className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5 block">Email</Label>
                    <Input type="email" value={cuEmail} onChange={e => setCuEmail(e.target.value)} placeholder="jane@shop.com" className="bg-white/5 border-white/10 text-white h-10" />
                  </div>
                  <div>
                    <Label className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5 block">Username *</Label>
                    <Input value={cuUsername} onChange={e => setCuUsername(e.target.value)} placeholder="janesmith" className="bg-white/5 border-white/10 text-white h-10" />
                  </div>
                  <div>
                    <Label className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5 block">Password *</Label>
                    <Input type="text" value={cuPassword} onChange={e => setCuPassword(e.target.value)} placeholder="Min 6 characters" className="bg-white/5 border-white/10 text-white h-10" />
                  </div>
                  <div>
                    <Label className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5 block">Role</Label>
                    <select value={cuRole} onChange={e => setCuRole(e.target.value as UserRole)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gold/50 h-10">
                      <option value="customer">customer</option>
                      <option value="user">user (tech)</option>
                      <option value="shop_manager">shop_manager</option>
                      <option value="admin">admin</option>
                      <option value="super_admin">super_admin</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5 block">Assign Shop (optional)</Label>
                    <select value={cuShopId} onChange={e => setCuShopId(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gold/50 h-10">
                      <option value="">— No shop yet —</option>
                      {allShops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                </div>
                {cuError && <p className="text-xs text-red-400 mb-3">{cuError}</p>}
                <div className="flex gap-3">
                  <Button
                    onClick={() => {
                      setCuError("");
                      if (!cuName || !cuUsername || !cuPassword) { setCuError("Name, username and password are required"); return; }
                      createUser.mutate({ name: cuName, email: cuEmail || undefined, username: cuUsername, password: cuPassword, role: cuRole, shopId: cuShopId ? Number(cuShopId) : undefined });
                    }}
                    disabled={createUser.isPending}
                    className="bg-gold text-black font-bold hover:bg-gold/90 h-9 px-5 text-xs"
                  >
                    {createUser.isPending ? <><Loader2 size={12} className="animate-spin mr-1.5" /> Creating…</> : "Create User"}
                  </Button>
                  <Button variant="outline" onClick={() => setShowCreateUser(false)} className="h-9 px-5 text-xs border-white/10">Cancel</Button>
                </div>
              </div>
            )}

            {/* Users table */}
            <div className="bg-white/[0.03] border border-white/8 rounded-xl overflow-hidden">
              {usersQuery.isLoading && <div className="px-6 py-4 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 size={14} className="animate-spin" /> Loading…</div>}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/[0.02]">
                      <th className="text-left px-6 py-3 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">User</th>
                      <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Role</th>
                      <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Plan</th>
                    <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Tech Level</th>
                    <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Assigned Shop</th>
                      <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Joined</th>
                      <th className="px-4 py-3 w-16" />
                    </tr>
                  </thead>
                  <tbody>
                    {allUsers.map(u => (
                      <tr key={u.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.015] transition-colors">
                        <td className="px-6 py-3">
                          <div className="font-medium">{u.name || u.username || "—"}</div>
                          <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <Mail size={10} /> {u.email ?? u.username ?? "—"}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={u.role}
                            onChange={e => { if (u.id !== user.id) updateRole.mutate({ userId: u.id, role: e.target.value as UserRole }); }}
                            disabled={u.id === user.id || updateRole.isPending}
                            className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-gold/50 disabled:opacity-40 cursor-pointer"
                          >
                            <option value="user">user (tech)</option>
                            <option value="shop_manager">shop_manager</option>
                            <option value="admin">admin</option>
                            <option value="super_admin">super_admin</option>
                            <option value="customer">customer</option>
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={u.subscriptionStatus ?? "free"}
                            onChange={e => updateSubscription.mutate({ userId: u.id, subscriptionStatus: e.target.value as "free" | "pro" | "agent" })}
                            disabled={updateSubscription.isPending}
                            className={`bg-white/5 border rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-gold/50 disabled:opacity-40 cursor-pointer ${
                              (u.subscriptionStatus === "pro" || u.subscriptionStatus === "agent") ? "text-gold border-gold/30" : "text-muted-foreground border-white/10"
                            }`}
                          >
                            <option value="free">free</option>
                            <option value="pro">pro</option>
                            <option value="agent">agent</option>
                          </select>
                        </td>
                        {/* Tech Level */}
                        <td className="px-4 py-3">
                          <select
                            value={(u as any).techLevel ?? ""}
                            onChange={e => updateTechLevel.mutate({ userId: u.id, techLevel: e.target.value ? Number(e.target.value) : null })}
                            disabled={updateTechLevel.isPending}
                            className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-gold/50 disabled:opacity-40 cursor-pointer"
                          >
                            <option value="">— None —</option>
                            <option value="1">Level 1</option>
                            <option value="2">Level 2</option>
                            <option value="3">Level 3</option>
                          </select>
                        </td>
                        {/* Shop assignment */}
                        <td className="px-4 py-3">
                          <select
                            value={u.shopId ?? ""}
                            onChange={e => assignShop.mutate({ userId: u.id, shopId: e.target.value ? Number(e.target.value) : null })}
                            disabled={assignShop.isPending}
                            className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-gold/50 disabled:opacity-40 cursor-pointer max-w-[180px]"
                          >
                            <option value="">— No shop —</option>
                            {allShops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                          </select>
                        </td>
                        <td className="px-4 py-3 text-[11px] text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar size={10} />
                            {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {u.id === user.id
                            ? <span className="text-[10px] text-gold/60 font-medium">You</span>
                            : <button
                                onClick={() => { if (confirm(`Delete ${u.name || u.username}?`)) deleteUser.mutate({ userId: u.id }); }}
                                disabled={deleteUser.isPending}
                                className="text-muted-foreground hover:text-red-400 transition-colors disabled:opacity-40"
                                title="Delete user"
                              >
                                <Trash2 size={14} />
                              </button>
                          }
                        </td>
                      </tr>
                    ))}
                    {allUsers.length === 0 && !usersQuery.isLoading && (
                      <tr><td colSpan={5} className="px-6 py-10 text-center text-sm text-muted-foreground">No users yet — add one above.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── Shops ── */}
        {tab === "shops" && (
          <ShopsTab
            allShops={allShops}
            allUsers={allUsers}
            isLoading={shopsQuery.isLoading}
            createShopMut={createShopMut}
            onUpdateShop={(shopId, data) => updateShop.mutate({ shopId, ...data })}
            onDeleteShop={(shopId) => deleteShop.mutate({ shopId })}
            onUnlock={(shopId, unlocked) => unlockResults.mutate({ shopId, unlocked })}
            onSaveBranding={(shopId, data) => updateBranding.mutate({ shopId, ...data })}
            onAssignUser={(userId, shopId) => assignShop.mutate({ userId, shopId })}
            isMutating={updateShop.isPending || deleteShop.isPending || unlockResults.isPending || updateBranding.isPending || assignShop.isPending}
          />
        )}

        {/* ── Invites ── */}
        {tab === "invites" && (
          <div className="space-y-4">
            <div>
              <h1 className="text-xl font-black mb-1">Invite Codes</h1>
              <p className="text-sm text-muted-foreground">Generate single-use registration links for clients and staff.</p>
            </div>

            {/* Create */}
            <div className="bg-white/[0.03] border border-white/8 rounded-xl p-6">
              <h2 className="text-sm font-bold mb-4 flex items-center gap-2"><Plus size={14} className="text-gold" /> Generate New Code</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                <div>
                  <Label className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5 block">Role</Label>
                  <select value={newRole} onChange={e => setNewRole(e.target.value as UserRole)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gold/50">
                    <option value="customer">customer</option>
                    <option value="user">user (tech)</option>
                    <option value="shop_manager">shop_manager</option>
                    <option value="admin">admin</option>
                    <option value="super_admin">super_admin</option>
                  </select>
                </div>
                {(newRole === "customer" || newRole === "shop_manager" || newRole === "user") && (
                  <div>
                    <Label className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5 block">
                      {newRole === "customer" ? "Link to Shop (optional)" : "Assign to Shop"}
                    </Label>
                    <select value={newShopId} onChange={e => setNewShopId(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gold/50">
                      <option value="">— No shop yet —</option>
                      {allShops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                )}
                <div>
                  <Label className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5 block">Expires in (days)</Label>
                  <Input type="number" value={newExpiry} onChange={e => setNewExpiry(e.target.value)} placeholder="30"
                    className="bg-white/5 border-white/10 text-white h-10" />
                </div>
              </div>
              <Button onClick={() => createInvite.mutate({ role: newRole, shopId: (newRole === "customer" || newRole === "shop_manager" || newRole === "user") && newShopId ? Number(newShopId) : undefined, expiresInDays: newExpiry ? Number(newExpiry) : 30 })}
                disabled={createInvite.isPending} className="bg-gold text-black font-bold hover:bg-gold/90 h-10 px-6">
                {createInvite.isPending ? <Loader2 size={14} className="animate-spin mr-2" /> : <Plus size={14} className="mr-2" />}
                Generate Code
              </Button>
              {createInvite.data && (
                <div className="mt-4 flex items-center gap-3 bg-white/5 border border-gold/20 rounded-xl px-4 py-3">
                  <Ticket size={16} className="text-gold shrink-0" />
                  <code className="text-sm text-gold font-mono flex-1 truncate">{createInvite.data.code}</code>
                  <button onClick={() => copyInviteLink(createInvite.data!.code)}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-white transition-colors shrink-0">
                    {copied === createInvite.data.code ? <CheckCircle2 size={14} className="text-green-400" /> : <Copy size={14} />}
                    {copied === createInvite.data.code ? "Copied!" : "Copy link"}
                  </button>
                </div>
              )}
            </div>

            {/* List */}
            <div className="bg-white/[0.03] border border-white/8 rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-white/8 flex items-center justify-between">
                <h2 className="text-sm font-bold">All Codes ({allInvites.length})</h2>
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
                      <th className="px-4 py-3 w-20" />
                    </tr>
                  </thead>
                  <tbody>
                    {allInvites.map(inv => {
                      const isUsed = !!inv.usedAt;
                      const isExpired = inv.expiresAt ? new Date(inv.expiresAt) < new Date() : false;
                      return (
                        <tr key={inv.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.015] transition-colors">
                          <td className="px-6 py-3 font-mono text-xs text-gold/80 max-w-[180px] truncate">{inv.code}</td>
                          <td className="px-4 py-3"><span className={`text-[10px] border px-2 py-0.5 rounded font-medium ${ROLE_BADGE[inv.role] ?? ROLE_BADGE.user}`}>{inv.role}</span></td>
                          <td className="px-4 py-3">
                            {isUsed ? <span className="text-[10px] bg-green-500/10 text-green-400 px-2 py-0.5 rounded font-medium">Used</span>
                            : isExpired ? <span className="text-[10px] bg-red-500/10 text-red-400 px-2 py-0.5 rounded font-medium">Expired</span>
                            : <span className="text-[10px] bg-gold/10 text-gold px-2 py-0.5 rounded font-medium">Active</span>}
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">{inv.expiresAt ? new Date(inv.expiresAt).toLocaleDateString() : "Never"}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2 justify-end">
                              {!isUsed && (
                                <button onClick={() => copyInviteLink(inv.code)} className="text-muted-foreground hover:text-white transition-colors" title="Copy link">
                                  {copied === inv.code ? <CheckCircle2 size={14} className="text-green-400" /> : <Link2 size={14} />}
                                </button>
                              )}
                              <button onClick={() => deleteInvite.mutate({ id: inv.id })} disabled={deleteInvite.isPending}
                                className="text-muted-foreground hover:text-red-400 transition-colors disabled:opacity-40" title="Delete">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {allInvites.length === 0 && !invitesQuery.isLoading && (
                      <tr><td colSpan={5} className="px-6 py-10 text-center text-sm text-muted-foreground">No invite codes yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── Settings ── */}
        {tab === "settings" && (
          <div className="space-y-6">
            <div>
              <h1 className="text-xl font-black mb-1">App Settings</h1>
              <p className="text-sm text-muted-foreground">Control feature access, branding, and system behavior.</p>
            </div>

            {settingsQuery.isLoading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 size={14} className="animate-spin" /> Loading settings…
              </div>
            )}

            {Object.entries(settingsByCategory).map(([category, catSettings]) => (
              <div key={category} className="bg-white/[0.03] border border-white/8 rounded-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-white/8">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground capitalize">{category}</h2>
                </div>
                <div className="divide-y divide-white/5">
                  {catSettings.map(s => {
                    const isBool = s.value === "true" || s.value === "false";
                    const boolVal = s.value === "true";
                    return (
                      <div key={s.key} className="px-6 py-4 flex items-center justify-between gap-6">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{s.label}</p>
                          {s.description && <p className="text-[11px] text-muted-foreground mt-0.5">{s.description}</p>}
                        </div>
                        <div className="shrink-0">
                          {isBool ? (
                            <button
                              onClick={() => updateSetting.mutate({ key: s.key, value: boolVal ? "false" : "true" })}
                              disabled={updateSetting.isPending}
                              className={`flex items-center gap-1.5 text-sm font-semibold transition-colors disabled:opacity-50 ${boolVal ? "text-green-400 hover:text-green-300" : "text-muted-foreground hover:text-white"}`}
                            >
                              {boolVal ? <><ToggleRight size={24} /> On</> : <><ToggleLeft size={24} /> Off</>}
                            </button>
                          ) : (
                            <input
                              defaultValue={s.value}
                              onBlur={e => { if (e.target.value !== s.value) updateSetting.mutate({ key: s.key, value: e.target.value }); }}
                              className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-gold/50 w-52"
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── AI Insights ── */}
        {tab === "ai" && (
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-xl font-black mb-1">AI Insights</h1>
                <p className="text-sm text-muted-foreground">Prediction engine output, high-risk shops, and learning patterns.</p>
              </div>
              <Button onClick={() => runLearning.mutate()} disabled={runLearning.isPending}
                className="shrink-0 bg-gold text-black font-bold hover:bg-gold/90 h-9 px-4 text-xs">
                {runLearning.isPending ? <><Loader2 size={12} className="animate-spin mr-1.5" /> Analyzing…</> : <><RefreshCw size={12} className="mr-1.5" /> Run Learning Analysis</>}
              </Button>
            </div>
            {runLearning.isSuccess && <p className="text-xs text-green-400 flex items-center gap-1.5"><CheckCircle2 size={12} /> Analysis complete.</p>}

            {/* High risk */}
            <div className="bg-white/[0.03] border border-white/8 rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-white/8">
                <h2 className="text-sm font-bold flex items-center gap-2"><AlertTriangle size={14} className="text-amber-400" /> High-Risk Shops ({highRisk.length})</h2>
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
                      const revGap = pred?.revenueProjection ? (pred.revenueProjection.projectedIfAllFixed ?? 0) - (pred.revenueProjection.current ?? 0) : null;
                      return (
                        <tr key={item.assessmentId} className="border-b border-white/5 last:border-0 hover:bg-white/[0.015]">
                          <td className="px-6 py-3"><div className="font-medium">{item.shopName}</div><div className="text-[11px] text-muted-foreground">{item.assessmentDate}</div></td>
                          <td className="px-4 py-3 font-mono font-bold">{item.overallPercentage}%</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-semibold ${riskLevel === "high" ? "text-red-400" : riskLevel === "medium" ? "text-amber-400" : "text-muted-foreground"}`}>
                              {riskLevel} {riskScore != null ? `(${Math.round(riskScore * 100)}%)` : ""}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono">{revGap != null ? `$${revGap.toLocaleString()}/mo` : "—"}</td>
                          <td className="px-4 py-3 text-xs text-muted-foreground max-w-xs truncate">{riskFactor}</td>
                        </tr>
                      );
                    })}
                    {highRisk.length === 0 && !aiInsightsQuery.isLoading && (
                      <tr><td colSpan={5} className="px-6 py-10 text-center text-sm text-muted-foreground">No high-risk shops yet — predictions generate automatically after each assessment.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Patterns */}
            <div className="bg-white/[0.03] border border-white/8 rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-white/8">
                <h2 className="text-sm font-bold flex items-center gap-2"><TrendingUp size={14} className="text-gold" /> Pattern Findings ({patterns.length})</h2>
              </div>
              <div className="divide-y divide-white/5">
                {patterns.map((p: any) => (
                  <div key={p.id} className="px-6 py-4 flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-xs font-medium text-white/90 mb-1">{p.description ?? "Pattern finding"}</p>
                      {p.pillarId && <span className="text-[10px] bg-gold/10 text-gold px-2 py-0.5 rounded font-medium">{p.pillarId}</span>}
                    </div>
                    <div className="text-right shrink-0">
                      {p.confidence != null && <p className="text-xs font-mono text-gold">{Math.round(p.confidence * 100)}% confidence</p>}
                      {p.sampleSize != null && <p className="text-[10px] text-muted-foreground">{p.sampleSize} shops</p>}
                    </div>
                  </div>
                ))}
                {patterns.length === 0 && (
                  <div className="px-6 py-8 text-center text-sm text-muted-foreground">No patterns yet — run the learning analysis after logging outcomes.</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

// ─── Shops CRM Tab ────────────────────────────────────────────────────────────
function ShopsTab({
  allShops, allUsers, isLoading,
  createShopMut, onUpdateShop, onDeleteShop,
  onUnlock, onSaveBranding, onAssignUser, isMutating,
}: {
  allShops: any[];
  allUsers: any[];
  isLoading: boolean;
  createShopMut: ReturnType<typeof trpc.admin.createShop.useMutation>;
  onUpdateShop: (shopId: number, data: any) => void;
  onDeleteShop: (shopId: number) => void;
  onUnlock: (shopId: number, unlocked: boolean) => void;
  onSaveBranding: (shopId: number, data: any) => void;
  onAssignUser: (userId: number, shopId: number | null) => void;
  isMutating: boolean;
}) {
  const [showCreate, setShowCreate] = useState(false);
  const [expandedShop, setExpandedShop] = useState<number | null>(null);
  const [activeShopTab, setActiveShopTab] = useState<Record<number, string>>({});

  // Create form state
  const [csName, setCsName]   = useState("");
  const [csLoc, setCsLoc]     = useState("");
  const [csCName, setCsCName] = useState("");
  const [csCEmail, setCsCEmail] = useState("");
  const [csCPhone, setCsCPhone] = useState("");
  const [csNotes, setCsNotes] = useState("");

  function resetForm() {
    setCsName(""); setCsLoc(""); setCsCName(""); setCsCEmail(""); setCsCPhone(""); setCsNotes("");
  }

  function submitCreate() {
    if (!csName.trim()) return;
    createShopMut.mutate(
      { name: csName, location: csLoc || undefined, contactName: csCName || undefined, contactEmail: csCEmail || undefined, contactPhone: csCPhone || undefined, notes: csNotes || undefined },
      {
        onSuccess: () => { resetForm(); setShowCreate(false); },
      }
    );
  }

  function shopTab(shopId: number) { return activeShopTab[shopId] ?? "profile"; }
  function setShopTab(shopId: number, t: string) { setActiveShopTab(prev => ({ ...prev, [shopId]: t })); }

  const shopUsers = (shopId: number) => allUsers.filter((u: any) => u.shopId === shopId);
  const unassignedUsers = allUsers.filter((u: any) => !u.shopId && u.role !== "super_admin");

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black mb-1">Shops</h1>
          <p className="text-sm text-muted-foreground">Each shop is a profile — manage contacts, team, checklist, and access.</p>
        </div>
        <div className="flex items-center gap-3">
          {isLoading && <Loader2 size={14} className="animate-spin text-muted-foreground" />}
          <Button onClick={() => setShowCreate(v => !v)} className="bg-gold text-black font-bold hover:bg-gold/90 h-9 px-4 text-xs gap-1.5">
            <Plus size={13} /> Add Shop
          </Button>
        </div>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="bg-white/[0.03] border border-gold/20 rounded-xl p-6 space-y-4">
          <h2 className="text-sm font-bold flex items-center gap-2"><Building2 size={14} className="text-gold" /> New Shop</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1 block">Shop Name *</Label>
              <Input value={csName} onChange={e => setCsName(e.target.value)} placeholder="Obsidian Detailing" className="bg-white/5 border-white/10 text-white h-9 text-sm" />
            </div>
            <div>
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1 block">Location</Label>
              <Input value={csLoc} onChange={e => setCsLoc(e.target.value)} placeholder="City, State" className="bg-white/5 border-white/10 text-white h-9 text-sm" />
            </div>
            <div>
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1 block">Contact Name</Label>
              <Input value={csCName} onChange={e => setCsCName(e.target.value)} placeholder="Owner name" className="bg-white/5 border-white/10 text-white h-9 text-sm" />
            </div>
            <div>
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1 block">Contact Email</Label>
              <Input type="email" value={csCEmail} onChange={e => setCsCEmail(e.target.value)} placeholder="owner@shop.com" className="bg-white/5 border-white/10 text-white h-9 text-sm" />
            </div>
            <div>
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1 block">Contact Phone</Label>
              <Input value={csCPhone} onChange={e => setCsCPhone(e.target.value)} placeholder="(555) 000-0000" className="bg-white/5 border-white/10 text-white h-9 text-sm" />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1 block">Notes</Label>
              <Input value={csNotes} onChange={e => setCsNotes(e.target.value)} placeholder="Internal notes…" className="bg-white/5 border-white/10 text-white h-9 text-sm" />
            </div>
          </div>
          {createShopMut.isError && (
            <p className="text-xs text-red-400 flex items-center gap-1">Error: {createShopMut.error?.message ?? "Failed to create shop"}</p>
          )}
          <div className="flex gap-3">
            <Button onClick={submitCreate} disabled={!csName.trim() || createShopMut.isPending} className="bg-gold text-black font-bold hover:bg-gold/90 h-9 px-5 text-xs">
              {createShopMut.isPending ? <><Loader2 size={12} className="animate-spin mr-1.5" /> Creating…</> : "Create Shop"}
            </Button>
            <Button variant="outline" onClick={() => { setShowCreate(false); resetForm(); createShopMut.reset(); }} className="h-9 px-5 text-xs border-white/10">Cancel</Button>
          </div>
        </div>
      )}

      {/* Shop profiles */}
      {allShops.length === 0 && !isLoading && (
        <div className="bg-white/[0.03] border border-white/8 rounded-xl px-6 py-16 text-center">
          <Building2 size={32} className="text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No shops yet. Add one above to get started.</p>
        </div>
      )}

      {allShops.map(shop => {
        const isOpen = expandedShop === shop.id;
        const members = shopUsers(shop.id);
        const currentTab = shopTab(shop.id);

        return (
          <div key={shop.id} className="bg-white/[0.03] border border-white/8 rounded-xl overflow-hidden">
            {/* Shop header row */}
            <button
              onClick={() => setExpandedShop(isOpen ? null : shop.id)}
              className="w-full flex items-center gap-4 px-6 py-4 hover:bg-white/[0.02] transition-colors text-left"
            >
              <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0" style={{ background: (shop as any).brandColor ? `${(shop as any).brandColor}22` : undefined }}>
                {shop.logoUrl ? <img src={shop.logoUrl} className="h-6 w-auto object-contain" alt="" /> : <Store size={16} className="text-gold" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold truncate">{shop.name}</span>
                  {shop.resultsUnlocked && <span className="text-[9px] bg-green-500/10 text-green-400 border border-green-400/20 px-1.5 py-0.5 rounded font-medium">Portal On</span>}
                </div>
                <div className="flex items-center gap-3 mt-0.5 text-[11px] text-muted-foreground">
                  {(shop as any).location && <span className="flex items-center gap-1"><MapPin size={9} />{(shop as any).location}</span>}
                  {(shop as any).contactEmail && <span className="flex items-center gap-1"><Mail size={9} />{(shop as any).contactEmail}</span>}
                  <span className="flex items-center gap-1"><Users size={9} />{members.length} members</span>
                  <span className="flex items-center gap-1"><BarChart3 size={9} />{shop.assessmentCount ?? 0} assessments</span>
                  {shop.latestOverallPercentage != null && <span className="font-mono text-gold">{shop.latestOverallPercentage}%</span>}
                </div>
              </div>
              <ChevronDown size={14} className={`text-muted-foreground transition-transform shrink-0 ${isOpen ? "rotate-180" : ""}`} />
            </button>

            {/* Expanded content */}
            {isOpen && (
              <div className="border-t border-white/8">
                {/* Inner tab bar */}
                <div className="flex gap-1 p-2 bg-white/[0.01] border-b border-white/5">
                  {["profile", "team", "checklist", "permissions", "branding"].map(t => (
                    <button key={t} onClick={() => setShopTab(shop.id, t)}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold capitalize transition-all ${currentTab === t ? "bg-gold text-black" : "text-muted-foreground hover:text-white hover:bg-white/5"}`}>
                      {t}
                    </button>
                  ))}
                  <div className="flex-1" />
                  <button
                    onClick={() => { if (confirm(`Delete "${shop.name}"? This cannot be undone.`)) onDeleteShop(shop.id); }}
                    className="px-2 py-1.5 text-red-400/60 hover:text-red-400 transition-colors text-[11px] flex items-center gap-1"
                  >
                    <Trash2 size={11} /> Delete
                  </button>
                </div>

                {/* ── Profile ── */}
                {currentTab === "profile" && (
                  <ShopProfileEditor shop={shop} onSave={(data) => onUpdateShop(shop.id, data)} saving={isMutating} />
                )}

                {/* ── Team ── */}
                {currentTab === "team" && (
                  <div className="p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold">Team Members ({members.length})</h3>
                    </div>

                    {/* Current members */}
                    {members.length > 0 ? (
                      <div className="border border-white/8 rounded-xl divide-y divide-white/5">
                        {members.map((u: any) => (
                          <div key={u.id} className="flex items-center justify-between px-4 py-2.5">
                            <div>
                              <p className="text-xs font-medium">{u.name || u.username}</p>
                              <p className="text-[10px] text-muted-foreground">{u.email ?? u.username} · {u.role}{u.techLevel ? ` · L${u.techLevel}` : ""}</p>
                            </div>
                            <button
                              onClick={() => onAssignUser(u.id, null)}
                              disabled={isMutating}
                              className="text-[10px] text-muted-foreground hover:text-red-400 transition-colors disabled:opacity-40"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">No team members yet.</p>
                    )}

                    {/* Add from unassigned */}
                    {unassignedUsers.length > 0 && (
                      <div>
                        <Label className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5 block flex items-center gap-1.5"><UserPlus size={10} /> Add Existing User</Label>
                        <div className="flex gap-2">
                          <select
                            id={`add-user-${shop.id}`}
                            defaultValue=""
                            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gold/50"
                          >
                            <option value="">— Select user —</option>
                            {unassignedUsers.map((u: any) => (
                              <option key={u.id} value={u.id}>{u.name || u.username} ({u.role})</option>
                            ))}
                          </select>
                          <Button
                            onClick={() => {
                              const sel = document.getElementById(`add-user-${shop.id}`) as HTMLSelectElement;
                              if (sel?.value) onAssignUser(Number(sel.value), shop.id);
                            }}
                            disabled={isMutating}
                            className="bg-gold text-black font-bold hover:bg-gold/90 h-9 px-4 text-xs"
                          >
                            Add
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Checklist ── */}
                {currentTab === "checklist" && (
                  <div className="p-5">
                    <ChecklistEditor shop={shop} />
                  </div>
                )}

                {/* ── Permissions ── */}
                {currentTab === "permissions" && (
                  <div className="p-5">
                    <LevelPermissionsEditor shopId={shop.id} />
                  </div>
                )}

                {/* ── Branding ── */}
                {currentTab === "branding" && (
                  <div className="p-5">
                    <BrandingEditor shop={shop} onSave={(data) => onSaveBranding(shop.id, data)} saving={isMutating} />
                  </div>
                )}

                {/* Portal access toggle — always visible at bottom */}
                <div className="px-5 py-3 border-t border-white/5 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Customer portal access</span>
                  <button
                    onClick={() => onUnlock(shop.id, !shop.resultsUnlocked)}
                    disabled={isMutating}
                    className={`flex items-center gap-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${shop.resultsUnlocked ? "text-green-400 hover:text-green-300" : "text-muted-foreground hover:text-white"}`}
                  >
                    {shop.resultsUnlocked ? <><ToggleRight size={20} /> Unlocked</> : <><ToggleLeft size={20} /> Locked</>}
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Shop Profile Editor ───────────────────────────────────────────────────────
function ShopProfileEditor({ shop, onSave, saving }: { shop: any; onSave: (data: any) => void; saving: boolean }) {
  const [name, setName]     = useState(shop.name ?? "");
  const [loc, setLoc]       = useState(shop.location ?? "");
  const [cName, setCName]   = useState(shop.contactName ?? "");
  const [cEmail, setCEmail] = useState(shop.contactEmail ?? "");
  const [cPhone, setCPhone] = useState(shop.contactPhone ?? "");
  const [notes, setNotes]   = useState(shop.notes ?? "");

  return (
    <div className="p-5 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <Label className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1 block">Shop Name</Label>
          <Input value={name} onChange={e => setName(e.target.value)} className="bg-white/5 border-white/10 text-white h-9 text-sm" />
        </div>
        <div>
          <Label className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1 block flex items-center gap-1"><MapPin size={9} /> Location</Label>
          <Input value={loc} onChange={e => setLoc(e.target.value)} placeholder="City, State" className="bg-white/5 border-white/10 text-white h-9 text-sm" />
        </div>
        <div>
          <Label className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1 block flex items-center gap-1"><UserCog size={9} /> Contact Name</Label>
          <Input value={cName} onChange={e => setCName(e.target.value)} placeholder="Owner / manager name" className="bg-white/5 border-white/10 text-white h-9 text-sm" />
        </div>
        <div>
          <Label className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1 block flex items-center gap-1"><Mail size={9} /> Contact Email</Label>
          <Input type="email" value={cEmail} onChange={e => setCEmail(e.target.value)} placeholder="owner@shop.com" className="bg-white/5 border-white/10 text-white h-9 text-sm" />
        </div>
        <div>
          <Label className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1 block flex items-center gap-1"><Phone size={9} /> Contact Phone</Label>
          <Input value={cPhone} onChange={e => setCPhone(e.target.value)} placeholder="(555) 000-0000" className="bg-white/5 border-white/10 text-white h-9 text-sm" />
        </div>
        <div className="sm:col-span-2">
          <Label className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1 block flex items-center gap-1"><NotebookText size={9} /> Notes</Label>
          <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Internal notes…" className="bg-white/5 border-white/10 text-white h-9 text-sm" />
        </div>
      </div>
      <Button onClick={() => onSave({ name: name || undefined, location: loc || undefined, contactName: cName || undefined, contactEmail: cEmail || undefined, contactPhone: cPhone || undefined, notes: notes || undefined })}
        disabled={saving} className="bg-gold text-black font-bold hover:bg-gold/90 h-9 px-5 text-xs">
        {saving ? <Loader2 size={12} className="animate-spin mr-1.5" /> : null} Save Profile
      </Button>
    </div>
  );
}

function BrandingEditor({ shop, onSave, saving }: { shop: any; onSave: (d: any) => void; saving: boolean }) {
  const [open, setOpen] = useState(false);
  const [brandName, setBrandName]   = useState((shop as any).brandName ?? "");
  const [brandColor, setBrandColor] = useState((shop as any).brandColor ?? "#C9A84C");
  const [accentColor, setAccentColor] = useState((shop as any).brandAccentColor ?? "#A87C2A");
  const [logoUrl, setLogoUrl]       = useState(shop.logoUrl ?? "");

  return (
    <div className="border border-white/8 rounded-xl overflow-hidden">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors">
        <div className="flex items-center gap-2">
          {logoUrl ? <img src={logoUrl} className="h-5 w-auto object-contain" alt="" /> : <div className="w-5 h-5 rounded" style={{ background: brandColor }} />}
          <span className="text-sm font-medium">{shop.name}</span>
          {(shop as any).brandColor && <span className="text-[10px] text-gold">Branded</span>}
        </div>
        <ChevronLeft size={14} className={`text-muted-foreground transition-transform ${open ? "-rotate-90" : "rotate-180"}`} />
      </button>
      {open && (
        <div className="border-t border-white/8 p-4 grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Label className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1 block">Company Display Name</Label>
            <Input value={brandName} onChange={e => setBrandName(e.target.value)} placeholder={shop.name} className="bg-white/5 border-white/10 text-white h-9 text-sm" />
          </div>
          <div className="col-span-2">
            <Label className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1 block">Logo URL</Label>
            <Input value={logoUrl} onChange={e => setLogoUrl(e.target.value)} placeholder="https://..." className="bg-white/5 border-white/10 text-white h-9 text-sm" />
          </div>
          <div>
            <Label className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1 block">Primary Color</Label>
            <div className="flex gap-2 items-center">
              <input type="color" value={brandColor} onChange={e => setBrandColor(e.target.value)} className="w-9 h-9 rounded cursor-pointer bg-transparent border-0" />
              <Input value={brandColor} onChange={e => setBrandColor(e.target.value)} className="bg-white/5 border-white/10 text-white h-9 text-sm flex-1" />
            </div>
          </div>
          <div>
            <Label className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1 block">Accent Color</Label>
            <div className="flex gap-2 items-center">
              <input type="color" value={accentColor} onChange={e => setAccentColor(e.target.value)} className="w-9 h-9 rounded cursor-pointer bg-transparent border-0" />
              <Input value={accentColor} onChange={e => setAccentColor(e.target.value)} className="bg-white/5 border-white/10 text-white h-9 text-sm flex-1" />
            </div>
          </div>
          <div className="col-span-2">
            <Button onClick={() => onSave({ brandName: brandName || undefined, brandColor, brandAccentColor: accentColor, logoUrl: logoUrl || undefined })}
              disabled={saving} className="bg-gold text-black font-bold hover:bg-gold/90 h-9 px-5 text-xs">
              {saving ? <Loader2 size={12} className="animate-spin mr-1" /> : null}
              Save Branding
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function LevelPermissionsEditor({ shopId }: { shopId: number }) {
  const utils = trpc.useUtils();
  const permQuery = trpc.admin.getLevelPermissions.useQuery({ shopId });
  const upsert = trpc.admin.upsertLevelPermissions.useMutation({ onSuccess: () => permQuery.refetch() });
  const [localPerms, setLocalPerms] = useState<Record<number, Record<string, boolean>>>({});

  const getPerms = (level: number): Record<string, boolean> => {
    if (localPerms[level]) return localPerms[level];
    const fromServer = permQuery.data?.find(p => p.level === level)?.permissions;
    return fromServer ?? DEFAULT_PERMISSIONS[level] ?? {};
  };

  function toggle(level: number, key: string) {
    const current = getPerms(level);
    const updated = { ...current, [key]: !current[key] };
    setLocalPerms(prev => ({ ...prev, [level]: updated }));
  }

  function save(level: number) {
    upsert.mutate({ shopId, level, permissions: getPerms(level) });
  }

  return (
    <div className="space-y-4">
      {[1, 2, 3].map(level => (
        <div key={level} className="border border-white/8 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
            <span className="text-xs font-bold">
              Level {level} — {level === 1 ? "Apprentice" : level === 2 ? "Technician" : "Lead Tech"}
            </span>
            <Button onClick={() => save(level)} disabled={upsert.isPending} className="h-7 px-3 text-[10px] bg-gold text-black font-bold hover:bg-gold/90">
              Save Level {level}
            </Button>
          </div>
          <div className="divide-y divide-white/5">
            {PERMISSIONS_CONFIG.map(p => (
              <div key={p.key} className="flex items-center justify-between px-4 py-2.5">
                <span className="text-xs text-white/80">{p.label}</span>
                <button onClick={() => toggle(level, p.key)}
                  className={`flex items-center gap-1.5 text-xs font-semibold transition-colors ${getPerms(level)[p.key] ? "text-green-400" : "text-muted-foreground"}`}>
                  {getPerms(level)[p.key] ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Checklist Template Editor ─────────────────────────────────────────────────
const CHECKLIST_DEFAULT_ITEMS = [
  { id: "1", label: "Inspect vehicle for pre-existing damage", category: "Pre-service" },
  { id: "2", label: "Confirm service agreement with customer", category: "Pre-service" },
  { id: "3", label: "Set up work area and gather supplies", category: "Setup" },
  { id: "4", label: "Wash and decontaminate vehicle", category: "Service" },
  { id: "5", label: "Polish / correct paint as needed", category: "Service" },
  { id: "6", label: "Apply protection (ceramic / sealant / wax)", category: "Service" },
  { id: "7", label: "Clean interior — vacuum, wipe down surfaces", category: "Service" },
  { id: "8", label: "Final inspection walkthrough", category: "Quality Check" },
  { id: "9", label: "Photo documentation (before/after)", category: "Quality Check" },
  { id: "10", label: "Clean up work area", category: "Wrap-up" },
];

function ChecklistEditor({ shop }: { shop: { id: number; name: string } }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("Daily Checklist");
  const [items, setItems] = useState<Array<{ id: string; label: string; category: string; requiredLevel?: number }>>([]);

  const query = trpc.tech.getChecklistTemplate.useQuery({ shopId: shop.id });
  const save  = trpc.tech.saveChecklistTemplate.useMutation({ onSuccess: () => { query.refetch(); setEditing(false); } });

  const activeItems = (query.data?.items as typeof CHECKLIST_DEFAULT_ITEMS | undefined);
  const displayItems = activeItems?.length ? activeItems : CHECKLIST_DEFAULT_ITEMS;

  function startEditing() {
    setItems(displayItems.map(i => ({ ...i })));
    setName((query.data as any)?.name ?? "Daily Checklist");
    setEditing(true);
  }

  function addItem() {
    setItems(prev => [...prev, { id: `new_${Date.now()}`, label: "", category: "Service" }]);
  }

  function removeItem(id: string) {
    setItems(prev => prev.filter(i => i.id !== id));
  }

  function updateItem(id: string, field: string, value: string | number | undefined) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i));
  }

  return (
    <div className="border border-white/8 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
        <div>
          <span className="text-xs font-bold">{shop.name}</span>
          <span className="text-[10px] text-muted-foreground ml-2">· {displayItems.length} items</span>
        </div>
        {!editing ? (
          <Button size="sm" onClick={startEditing} className="h-7 px-3 text-[10px] bg-gold text-black font-bold hover:bg-gold/90">
            Edit
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setEditing(false)} className="h-7 text-[10px] border-white/10">Cancel</Button>
            <Button size="sm" onClick={() => save.mutate({ shopId: shop.id, name, items })} disabled={save.isPending}
              className="h-7 px-3 text-[10px] bg-gold text-black font-bold hover:bg-gold/90">
              {save.isPending ? <Loader2 size={10} className="animate-spin" /> : "Save"}
            </Button>
          </div>
        )}
      </div>

      {editing ? (
        <div className="p-4 space-y-3">
          <Input value={name} onChange={e => setName(e.target.value)}
            placeholder="Checklist name" className="bg-white/5 border-white/10 text-white h-8 text-xs" />
          <div className="space-y-2">
            {items.map(item => (
              <div key={item.id} className="flex gap-2 items-center">
                <div className="flex-1 grid grid-cols-3 gap-1.5">
                  <Input
                    placeholder="Task description"
                    value={item.label}
                    onChange={e => updateItem(item.id, "label", e.target.value)}
                    className="bg-white/5 border-white/10 text-white h-7 text-xs col-span-1"
                  />
                  <Input
                    placeholder="Category"
                    value={item.category}
                    onChange={e => updateItem(item.id, "category", e.target.value)}
                    className="bg-white/5 border-white/10 text-white h-7 text-xs"
                  />
                  <select
                    value={item.requiredLevel ?? ""}
                    onChange={e => updateItem(item.id, "requiredLevel", e.target.value ? Number(e.target.value) : undefined)}
                    className="bg-white/5 border border-white/10 rounded-md px-2 h-7 text-xs text-white focus:outline-none focus:border-gold/50"
                  >
                    <option value="">All levels</option>
                    <option value="1">Level 1+ (Apprentice)</option>
                    <option value="2">Level 2+ (Technician)</option>
                    <option value="3">Level 3 (Lead Tech)</option>
                  </select>
                </div>
                <button onClick={() => removeItem(item.id)} className="text-red-400/60 hover:text-red-400 transition-colors shrink-0">
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
          <Button size="sm" variant="outline" onClick={addItem} className="h-7 text-[10px] border-white/10 border-dashed w-full">
            <Plus size={11} className="mr-1" /> Add Item
          </Button>
        </div>
      ) : (
        <div className="divide-y divide-white/5 max-h-48 overflow-y-auto">
          {displayItems.map(item => (
            <div key={item.id} className="flex items-center justify-between px-4 py-2">
              <span className="text-xs text-white/80">{item.label}</span>
              <span className="text-[10px] text-muted-foreground">{item.category}{(item as any).requiredLevel ? ` · L${(item as any).requiredLevel}+` : ""}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
