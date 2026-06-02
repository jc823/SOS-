import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Shield, Users, Store, LogOut, Loader2,
  ToggleLeft, ToggleRight, ChevronLeft,
} from "lucide-react";

type UserRole = "user" | "admin" | "super_admin" | "customer";

export default function AdminPanel() {
  const { user, logout, loading } = useAuth();
  const [, navigate] = useLocation();
  const [tab, setTab] = useState<"users" | "shops">("users");

  const canQuery = !loading && user?.role === "super_admin";

  const usersQuery = trpc.admin.listAllUsers.useQuery(undefined, { enabled: canQuery });
  const shopsQuery = trpc.admin.listAllShops.useQuery(undefined, { enabled: canQuery });

  const updateRole = trpc.admin.updateUserRole.useMutation({
    onSuccess: () => usersQuery.refetch(),
  });
  const assignShop = trpc.admin.assignShopToUser.useMutation({
    onSuccess: () => usersQuery.refetch(),
  });
  const unlockResults = trpc.admin.unlockShopResults.useMutation({
    onSuccess: () => shopsQuery.refetch(),
  });

  // ── Loading ──
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-gold" />
      </div>
    );
  }

  // ── Guard ──
  if (!user || user.role !== "super_admin") {
    navigate("/");
    return null;
  }

  const allUsers = usersQuery.data ?? [];
  const allShops = shopsQuery.data ?? [];

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
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-white transition-colors"
            >
              <ChevronLeft size={12} /> Back to Hub
            </button>
            <button
              onClick={() => logout()}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-white transition-colors"
            >
              <LogOut size={12} /> Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-10">
        {/* Page title */}
        <div className="mb-8">
          <h1 className="text-2xl font-black mb-1">Admin Panel</h1>
          <p className="text-sm text-muted-foreground">
            Manage users, roles, shop assignments, and result access.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {(["users", "shops"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                tab === t
                  ? "bg-gold text-black"
                  : "bg-white/5 text-muted-foreground hover:text-white hover:bg-white/8"
              }`}
            >
              {t === "users" ? (
                <><Users size={14} /> Users ({allUsers.length})</>
              ) : (
                <><Store size={14} /> Shops ({allShops.length})</>
              )}
            </button>
          ))}
        </div>

        {/* ── Users Table ── */}
        {tab === "users" && (
          <div className="bg-white/[0.03] border border-white/8 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/8 flex items-center justify-between">
              <h2 className="text-sm font-bold">All Users</h2>
              {usersQuery.isLoading && (
                <Loader2 size={14} className="animate-spin text-muted-foreground" />
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.02]">
                    <th className="text-left px-6 py-3 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
                      User
                    </th>
                    <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
                      Role
                    </th>
                    <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
                      Assigned Shop
                    </th>
                    <th className="px-4 py-3 w-16" />
                  </tr>
                </thead>
                <tbody>
                  {allUsers.map((u) => (
                    <tr
                      key={u.id}
                      className="border-b border-white/5 last:border-0 hover:bg-white/[0.015] transition-colors"
                    >
                      {/* Name + email */}
                      <td className="px-6 py-3">
                        <div className="font-medium">{u.name || u.username || "—"}</div>
                        <div className="text-[11px] text-muted-foreground">
                          {u.email ?? u.username}
                        </div>
                      </td>

                      {/* Role selector */}
                      <td className="px-4 py-3">
                        <select
                          value={u.role}
                          onChange={(e) => {
                            if (u.id !== user.id) {
                              updateRole.mutate({
                                userId: u.id,
                                role: e.target.value as UserRole,
                              });
                            }
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

                      {/* Shop assignment */}
                      <td className="px-4 py-3">
                        <select
                          value={u.shopId ?? ""}
                          onChange={(e) =>
                            assignShop.mutate({
                              userId: u.id,
                              shopId: e.target.value ? Number(e.target.value) : null,
                            })
                          }
                          disabled={assignShop.isPending}
                          className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-gold/50 disabled:opacity-40 cursor-pointer max-w-[200px] truncate"
                        >
                          <option value="">— No shop —</option>
                          {allShops.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* You tag */}
                      <td className="px-4 py-3 text-right">
                        {u.id === user.id && (
                          <span className="text-[10px] text-gold/60 font-medium">You</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {allUsers.length === 0 && !usersQuery.isLoading && (
                    <tr>
                      <td colSpan={4} className="px-6 py-10 text-center text-sm text-muted-foreground">
                        No users found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Shops Table ── */}
        {tab === "shops" && (
          <div className="bg-white/[0.03] border border-white/8 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/8 flex items-center justify-between">
              <h2 className="text-sm font-bold">All Shops</h2>
              {shopsQuery.isLoading && (
                <Loader2 size={14} className="animate-spin text-muted-foreground" />
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.02]">
                    <th className="text-left px-6 py-3 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
                      Shop
                    </th>
                    <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
                      Latest Score
                    </th>
                    <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
                      Assessments
                    </th>
                    <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
                      Results Access
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {allShops.map((s) => (
                    <tr
                      key={s.id}
                      className="border-b border-white/5 last:border-0 hover:bg-white/[0.015] transition-colors"
                    >
                      <td className="px-6 py-3">
                        <div className="font-medium">{s.name}</div>
                        <div className="text-[11px] text-muted-foreground">ID #{s.id}</div>
                      </td>
                      <td className="px-4 py-3 font-mono font-bold">
                        {s.latestOverallPercentage != null ? (
                          `${s.latestOverallPercentage}%`
                        ) : (
                          <span className="text-muted-foreground font-normal text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {s.assessmentCount ?? 0}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() =>
                            unlockResults.mutate({
                              shopId: s.id,
                              unlocked: !s.resultsUnlocked,
                            })
                          }
                          disabled={unlockResults.isPending}
                          className={`flex items-center gap-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
                            s.resultsUnlocked
                              ? "text-green-400 hover:text-green-300"
                              : "text-muted-foreground hover:text-white"
                          }`}
                        >
                          {s.resultsUnlocked ? (
                            <><ToggleRight size={20} /> Unlocked</>
                          ) : (
                            <><ToggleLeft size={20} /> Locked</>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {allShops.length === 0 && !shopsQuery.isLoading && (
                    <tr>
                      <td colSpan={4} className="px-6 py-10 text-center text-sm text-muted-foreground">
                        No shops found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
