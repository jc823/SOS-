import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Store, LogOut, Loader2, ChevronLeft, ClipboardCheck, ShoppingCart,
  Users, Wrench, Plus, Trash2, ToggleLeft, ToggleRight,
  Clock, Package, ThumbsUp, ThumbsDown, ChevronDown,
} from "lucide-react";

type Tab = "checklist" | "techs" | "orders" | "permissions";

const PERMISSIONS_CONFIG = [
  { key: "view_checklist",        label: "View Checklist" },
  { key: "complete_checklist",    label: "Complete Checklist Items" },
  { key: "view_supply_orders",    label: "View Supply Orders" },
  { key: "create_supply_orders",  label: "Submit Supply Orders" },
  { key: "approve_supply_orders", label: "Approve/Reject Supply Orders" },
  { key: "view_own_stats",        label: "View Own Stats" },
  { key: "view_team_stats",       label: "View Team Stats" },
];

const DEFAULT_PERMISSIONS: Record<number, Record<string, boolean>> = {
  1: { view_checklist: true, complete_checklist: false, view_supply_orders: true, create_supply_orders: false, approve_supply_orders: false, view_own_stats: true, view_team_stats: false },
  2: { view_checklist: true, complete_checklist: true,  view_supply_orders: true, create_supply_orders: true,  approve_supply_orders: false, view_own_stats: true, view_team_stats: false },
  3: { view_checklist: true, complete_checklist: true,  view_supply_orders: true, create_supply_orders: true,  approve_supply_orders: true,  view_own_stats: true, view_team_stats: true  },
};

const LEVEL_LABEL: Record<number, string> = { 1: "Apprentice", 2: "Technician", 3: "Lead Tech" };

const STATUS_STYLES: Record<string, string> = {
  pending:   "text-amber-400 bg-amber-400/10 border-amber-400/20",
  approved:  "text-blue-400 bg-blue-400/10 border-blue-400/20",
  ordered:   "text-purple-400 bg-purple-400/10 border-purple-400/20",
  delivered: "text-green-400 bg-green-400/10 border-green-400/20",
  rejected:  "text-red-400 bg-red-400/10 border-red-400/20",
};

const DEFAULT_ITEMS = [
  { id: "1",  label: "Inspect vehicle for pre-existing damage",   category: "Pre-service" },
  { id: "2",  label: "Confirm service agreement with customer",    category: "Pre-service" },
  { id: "3",  label: "Set up work area and gather supplies",       category: "Setup" },
  { id: "4",  label: "Wash and decontaminate vehicle",             category: "Service" },
  { id: "5",  label: "Polish / correct paint as needed",           category: "Service" },
  { id: "6",  label: "Apply protection (ceramic / sealant / wax)", category: "Service" },
  { id: "7",  label: "Clean interior — vacuum, wipe down surfaces",category: "Service" },
  { id: "8",  label: "Final inspection walkthrough",               category: "Quality Check" },
  { id: "9",  label: "Photo documentation (before/after)",         category: "Quality Check" },
  { id: "10", label: "Clean up work area",                         category: "Wrap-up" },
];

export default function ShopManagerPanel() {
  const { user, logout, loading } = useAuth();
  const [, navigate] = useLocation();
  const [tab, setTab]                   = useState<Tab>("checklist");
  const [selectedShopId, setSelectedShopId] = useState<number | null>(null);
  const [shopPickerOpen, setShopPickerOpen] = useState(false);

  // Checklist edit state
  const [editingChecklist, setEditingChecklist] = useState(false);
  const [checklistName, setChecklistName]       = useState("Daily Checklist");
  const [editItems, setEditItems]               = useState<Array<{ id: string; label: string; category: string; requiredLevel?: number }>>([]);

  // Level permissions local state (keyed by level)
  const [localPerms, setLocalPerms] = useState<Record<number, Record<string, boolean>>>({});

  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

  // Admins can browse all shops; shop_manager is locked to their assigned shop
  const managedShopsQuery = trpc.tech.listManagedShops.useQuery(undefined, {
    enabled: !loading && isAdmin,
    onSuccess: (shops: any[]) => {
      if (!selectedShopId && shops.length > 0) setSelectedShopId(shops[0].id);
    },
  });

  if (loading) {
    return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center"><Loader2 size={24} className="animate-spin text-gold" /></div>;
  }
  if (!user || !["shop_manager", "admin", "super_admin"].includes(user.role)) {
    navigate("/"); return null;
  }

  // Resolve active shopId
  const activeShopId: number | null = isAdmin ? selectedShopId : ((user as any).shopId ?? null);
  const allShops = (managedShopsQuery.data ?? []) as any[];
  const activeShop = isAdmin ? allShops.find((s: any) => s.id === activeShopId) : null;

  // If shop_manager has no shop assigned
  if (!isAdmin && !activeShopId) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-center px-6">
        <div>
          <Store size={32} className="text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Your account isn't linked to a shop yet.</p>
          <p className="text-xs text-muted-foreground mt-1">Ask an admin to assign you to a shop.</p>
          <Button onClick={() => navigate("/")} className="mt-4 h-8 text-xs">← Back to Hub</Button>
        </div>
      </div>
    );
  }

  // If admin but no shops exist yet
  if (isAdmin && !managedShopsQuery.isLoading && allShops.length === 0) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-center px-6">
        <div>
          <Store size={32} className="text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No shops have been created yet.</p>
          <Button onClick={() => navigate("/")} className="mt-4 h-8 text-xs">← Back to Hub</Button>
        </div>
      </div>
    );
  }

  // Show spinner while admin waits for shop list
  if (isAdmin && (managedShopsQuery.isLoading || !activeShopId)) {
    return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center"><Loader2 size={24} className="animate-spin text-gold" /></div>;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="border-b border-white/8 bg-black/40 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Store size={16} className="text-gold" />
            <span className="text-sm font-bold">Shop Operations</span>
            <span className="text-[10px] bg-gold/10 text-gold border border-gold/20 px-2 py-0.5 rounded font-medium uppercase tracking-widest">
              {isAdmin ? (user.role === "super_admin" ? "Super Admin" : "Admin") : "Manager"}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => navigate("/")} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-white transition-colors">
              <ChevronLeft size={12} /> Hub
            </button>
            <span className="text-[11px] text-muted-foreground hidden sm:block">{(user as any).name || (user as any).username}</span>
            <button onClick={() => logout()} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-white transition-colors">
              <LogOut size={12} /> Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">

        {/* Shop Switcher — admin/super_admin only */}
        {isAdmin && (
          <div className="relative">
            <button
              onClick={() => setShopPickerOpen(prev => !prev)}
              className="flex items-center gap-3 bg-white/[0.03] border border-white/10 hover:border-gold/30 rounded-xl px-5 py-3.5 transition-colors w-full sm:w-auto"
            >
              <Store size={16} className="text-gold shrink-0" />
              <div className="flex-1 text-left">
                <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium">Managing Shop</p>
                <p className="text-sm font-bold mt-0.5">{activeShop?.name ?? "Select a shop"}</p>
              </div>
              <ChevronDown size={14} className={`text-muted-foreground transition-transform shrink-0 ${shopPickerOpen ? "rotate-180" : ""}`} />
            </button>

            {shopPickerOpen && allShops.length > 1 && (
              <div className="absolute top-full left-0 mt-1 w-full sm:w-72 bg-[#111] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
                {allShops.map((s: any) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setSelectedShopId(s.id);
                      setShopPickerOpen(false);
                      setEditingChecklist(false);
                      setLocalPerms({});
                    }}
                    className={`w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-white/5 transition-colors ${s.id === activeShopId ? "text-gold" : "text-white"}`}
                  >
                    <span>{s.name}</span>
                    {s.id === activeShopId && <span className="text-[10px] text-gold">Current</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tabs */}
        <ShopContent
          key={activeShopId!}
          shopId={activeShopId!}
          tab={tab}
          setTab={setTab}
          editingChecklist={editingChecklist}
          setEditingChecklist={setEditingChecklist}
          checklistName={checklistName}
          setChecklistName={setChecklistName}
          editItems={editItems}
          setEditItems={setEditItems}
          localPerms={localPerms}
          setLocalPerms={setLocalPerms}
        />
      </div>
    </div>
  );
}

// ─── ShopContent — all tabs for a given shopId ───────────────────────────────
function ShopContent({
  shopId, tab, setTab,
  editingChecklist, setEditingChecklist,
  checklistName, setChecklistName,
  editItems, setEditItems,
  localPerms, setLocalPerms,
}: {
  shopId: number;
  tab: Tab; setTab: (t: Tab) => void;
  editingChecklist: boolean; setEditingChecklist: (v: boolean) => void;
  checklistName: string; setChecklistName: (v: string) => void;
  editItems: Array<{ id: string; label: string; category: string; requiredLevel?: number }>;
  setEditItems: (v: any) => void;
  localPerms: Record<number, Record<string, boolean>>;
  setLocalPerms: (v: any) => void;
}) {
  const checklistQuery = trpc.tech.getChecklistTemplate.useQuery({ shopId });
  const techsQuery     = trpc.tech.getShopTechs.useQuery({ shopId });
  const ordersQuery    = trpc.tech.getShopSupplyOrders.useQuery();
  const permQuery      = trpc.admin.getLevelPermissions.useQuery({ shopId });

  const saveChecklist = trpc.tech.saveChecklistTemplate.useMutation({
    onSuccess: () => { checklistQuery.refetch(); setEditingChecklist(false); },
  });
  const updateStatus = trpc.tech.updateOrderStatus.useMutation({ onSuccess: () => ordersQuery.refetch() });
  const upsertPerms  = trpc.admin.upsertLevelPermissions.useMutation({ onSuccess: () => permQuery.refetch() });

  const activeItems    = checklistQuery.data?.items as typeof DEFAULT_ITEMS | undefined;
  const checklistItems = activeItems?.length ? activeItems : DEFAULT_ITEMS;
  const allOrders      = (ordersQuery.data ?? []) as any[];
  const pendingOrders  = allOrders.filter(o => o.status === "pending");
  const otherOrders    = allOrders.filter(o => o.status !== "pending");
  const allTechs       = (techsQuery.data ?? []) as any[];

  const TABS = [
    { id: "checklist"   as Tab, label: "Checklist",     icon: <ClipboardCheck size={14} /> },
    { id: "techs"       as Tab, label: `Team (${allTechs.length})`, icon: <Users size={14} /> },
    { id: "orders"      as Tab, label: `Orders${pendingOrders.length ? ` (${pendingOrders.length})` : ""}`, icon: <ShoppingCart size={14} /> },
    { id: "permissions" as Tab, label: "Level Access",  icon: <Wrench size={14} /> },
  ];

  function startEditing() {
    setEditItems(checklistItems.map((i: any) => ({ ...i })));
    setChecklistName((checklistQuery.data as any)?.name ?? "Daily Checklist");
    setEditingChecklist(true);
  }

  function addItem() {
    setEditItems((prev: any[]) => [...prev, { id: `new_${Date.now()}`, label: "", category: "Service" }]);
  }

  function removeItem(id: string) {
    setEditItems((prev: any[]) => prev.filter((i: any) => i.id !== id));
  }

  function updateItem(id: string, field: string, value: string | number | undefined) {
    setEditItems((prev: any[]) => prev.map((i: any) => i.id === id ? { ...i, [field]: value } : i));
  }

  function getPerms(level: number): Record<string, boolean> {
    if (localPerms[level]) return localPerms[level];
    const fromServer = permQuery.data?.find((p: any) => p.level === level)?.permissions;
    return (fromServer as Record<string, boolean>) ?? DEFAULT_PERMISSIONS[level] ?? {};
  }

  function togglePerm(level: number, key: string) {
    setLocalPerms((prev: any) => ({ ...prev, [level]: { ...getPerms(level), [key]: !getPerms(level)[key] } }));
  }

  return (
    <>
      {/* Tab bar */}
      <div className="flex gap-1 flex-wrap bg-white/[0.02] border border-white/8 rounded-xl p-1">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all flex-1 justify-center sm:flex-none ${
              tab === t.id ? "bg-gold text-black shadow-sm" : "text-muted-foreground hover:text-white hover:bg-white/5"
            }`}
          >
            {t.icon} <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* ── Checklist ── */}
      {tab === "checklist" && (
        <div className="space-y-4">
          {editingChecklist ? (
            <div className="bg-white/[0.03] border border-gold/20 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold">Edit Daily Checklist</h2>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setEditingChecklist(false)} className="h-7 text-xs border-white/10">Cancel</Button>
                  <Button size="sm" onClick={() => saveChecklist.mutate({ shopId, name: checklistName, items: editItems })}
                    disabled={saveChecklist.isPending} className="h-7 text-xs bg-gold text-black font-bold hover:bg-gold/90">
                    {saveChecklist.isPending ? <Loader2 size={12} className="animate-spin" /> : "Save"}
                  </Button>
                </div>
              </div>
              <Input value={checklistName} onChange={e => setChecklistName(e.target.value)}
                placeholder="Checklist name" className="bg-white/5 border-white/10 text-white h-9 text-sm" />
              <div className="space-y-2">
                {editItems.map((item: any) => (
                  <div key={item.id} className="flex gap-2 items-start">
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                      <Input placeholder="Task description" value={item.label}
                        onChange={e => updateItem(item.id, "label", e.target.value)}
                        className="bg-white/5 border-white/10 text-white h-8 text-xs" />
                      <Input placeholder="Category (e.g. Service)" value={item.category}
                        onChange={e => updateItem(item.id, "category", e.target.value)}
                        className="bg-white/5 border-white/10 text-white h-8 text-xs" />
                      <select value={item.requiredLevel ?? ""}
                        onChange={e => updateItem(item.id, "requiredLevel", e.target.value ? Number(e.target.value) : undefined)}
                        className="bg-white/5 border border-white/10 rounded-md px-2 h-8 text-xs text-white focus:outline-none focus:border-gold/50">
                        <option value="">All levels</option>
                        <option value="1">Level 1+ (Apprentice)</option>
                        <option value="2">Level 2+ (Technician)</option>
                        <option value="3">Level 3 (Lead Tech)</option>
                      </select>
                    </div>
                    <button onClick={() => removeItem(item.id)} className="text-red-400/60 hover:text-red-400 mt-1.5 transition-colors shrink-0">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
              <Button size="sm" variant="outline" onClick={addItem} className="h-7 text-xs border-white/10 border-dashed w-full">
                <Plus size={12} className="mr-1" /> Add Item
              </Button>
            </div>
          ) : (
            <div className="bg-white/[0.03] border border-white/8 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold">{(checklistQuery.data as any)?.name ?? "Daily Checklist"}</h2>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{checklistItems.length} items</p>
                </div>
                <Button size="sm" onClick={startEditing} className="h-7 px-3 text-xs bg-gold text-black font-bold hover:bg-gold/90">
                  Edit Checklist
                </Button>
              </div>
              <div className="divide-y divide-white/5">
                {checklistItems.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between px-5 py-3">
                    <p className="text-xs text-white/90">{item.label}</p>
                    <p className="text-[10px] text-muted-foreground">{item.category}{item.requiredLevel ? ` · L${item.requiredLevel}+` : ""}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Techs ── */}
      {tab === "techs" && (
        <div className="bg-white/[0.03] border border-white/8 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
            <h2 className="text-sm font-bold">Team Members</h2>
            {techsQuery.isLoading && <Loader2 size={14} className="animate-spin text-muted-foreground" />}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02]">
                  <th className="text-left px-5 py-3 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Name</th>
                  <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Role</th>
                  <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Level</th>
                  <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Email</th>
                </tr>
              </thead>
              <tbody>
                {allTechs.map((tech: any) => (
                  <tr key={tech.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.015] transition-colors">
                    <td className="px-5 py-3">
                      <p className="text-xs font-medium">{tech.name || tech.username}</p>
                      <p className="text-[10px] text-muted-foreground">{tech.username}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] border px-2 py-0.5 rounded font-medium bg-white/5 text-white/60 border-white/10">{tech.role}</span>
                    </td>
                    <td className="px-4 py-3">
                      {tech.techLevel ? (
                        <span className="text-[10px] border px-2 py-0.5 rounded font-medium bg-gold/10 text-gold border-gold/20">
                          L{tech.techLevel} — {LEVEL_LABEL[tech.techLevel] ?? "Unknown"}
                        </span>
                      ) : <span className="text-[10px] text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-3 text-[11px] text-muted-foreground">{tech.email ?? "—"}</td>
                  </tr>
                ))}
                {allTechs.length === 0 && !techsQuery.isLoading && (
                  <tr><td colSpan={4} className="px-5 py-10 text-center text-sm text-muted-foreground">No team members assigned to this shop yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Orders ── */}
      {tab === "orders" && (
        <div className="space-y-4">
          <div className="bg-white/[0.03] border border-white/8 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/5 flex items-center gap-2">
              <Clock size={13} className="text-amber-400" />
              <h2 className="text-sm font-bold">Pending Approval ({pendingOrders.length})</h2>
            </div>
            {pendingOrders.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-muted-foreground">No pending orders.</p>
            ) : (
              <div className="divide-y divide-white/5">
                {pendingOrders.map((order: any) => (
                  <div key={order.id} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Package size={13} className="text-gold" />
                          <span className="text-xs font-semibold">Order #{order.id}</span>
                          <span className="text-[10px] text-muted-foreground">· {new Date(order.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="space-y-0.5 pl-5">
                          {(order.items as any[]).map((item: any, i: number) => (
                            <p key={i} className="text-[11px] text-white/70">
                              {item.qty} {item.unit} — {item.name}{item.notes ? ` (${item.notes})` : ""}
                            </p>
                          ))}
                        </div>
                        {order.notes && <p className="text-[11px] text-muted-foreground pl-5 mt-1">Note: {order.notes}</p>}
                      </div>
                      <div className="flex gap-3 shrink-0">
                        <button onClick={() => updateStatus.mutate({ orderId: order.id, status: "approved" })}
                          disabled={updateStatus.isPending}
                          className="flex items-center gap-1 text-xs font-semibold text-green-400 hover:text-green-300 disabled:opacity-50 transition-colors">
                          <ThumbsUp size={14} /> Approve
                        </button>
                        <button onClick={() => updateStatus.mutate({ orderId: order.id, status: "rejected" })}
                          disabled={updateStatus.isPending}
                          className="flex items-center gap-1 text-xs font-semibold text-red-400 hover:text-red-300 disabled:opacity-50 transition-colors">
                          <ThumbsDown size={14} /> Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {otherOrders.length > 0 && (
            <div className="bg-white/[0.03] border border-white/8 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-white/5">
                <h2 className="text-sm font-bold">Order History ({otherOrders.length})</h2>
              </div>
              <div className="divide-y divide-white/5">
                {otherOrders.map((order: any) => (
                  <div key={order.id} className="px-5 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Package size={13} className="text-muted-foreground" />
                      <div>
                        <p className="text-xs font-medium">Order #{order.id}</p>
                        <p className="text-[10px] text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()} · {(order.items as any[]).length} item(s)</p>
                      </div>
                    </div>
                    <span className={`text-[10px] border px-2 py-0.5 rounded font-medium ${STATUS_STYLES[order.status] ?? ""}`}>
                      {order.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Level Permissions ── */}
      {tab === "permissions" && (
        <div className="space-y-4">
          <div>
            <h2 className="text-sm font-bold mb-1">Tech Level Access Control</h2>
            <p className="text-xs text-muted-foreground">Configure what each tech level can access in the portal for this shop.</p>
          </div>
          {[1, 2, 3].map(level => (
            <div key={level} className="bg-white/[0.03] border border-white/8 rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between">
                <span className="text-xs font-bold">Level {level} — {LEVEL_LABEL[level]}</span>
                <Button onClick={() => upsertPerms.mutate({ shopId, level, permissions: getPerms(level) })}
                  disabled={upsertPerms.isPending}
                  className="h-7 px-3 text-[10px] bg-gold text-black font-bold hover:bg-gold/90">
                  Save Level {level}
                </Button>
              </div>
              <div className="divide-y divide-white/5">
                {PERMISSIONS_CONFIG.map(p => (
                  <div key={p.key} className="flex items-center justify-between px-5 py-2.5">
                    <span className="text-xs text-white/80">{p.label}</span>
                    <button onClick={() => togglePerm(level, p.key)}
                      className={`flex items-center gap-1.5 text-xs font-semibold transition-colors ${getPerms(level)[p.key] ? "text-green-400" : "text-muted-foreground"}`}>
                      {getPerms(level)[p.key] ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
