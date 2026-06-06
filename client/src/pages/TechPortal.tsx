import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useBranding } from "@/contexts/BrandingContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ClipboardCheck, ShoppingCart, BarChart3, LogOut,
  Loader2, Plus, CheckCircle2, Circle, Send, Package,
  ChevronDown, ChevronUp, Trash2, ThumbsUp, ThumbsDown,
  ArrowLeft,
} from "lucide-react";

type Tab = "checklist" | "supplies" | "stats";

const LEVEL_LABEL: Record<number, string> = {
  1: "Level 1 — Apprentice",
  2: "Level 2 — Technician",
  3: "Level 3 — Lead Tech",
};

// Default checklist items until admin builds custom ones
const DEFAULT_ITEMS = [
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

export default function TechPortal() {
  const { user, logout, loading } = useAuth();
  const [, navigate] = useLocation();
  const branding = useBranding();

  const [tab, setTab] = useState<Tab>("checklist");
  const [checked, setChecked] = useState<Set<string>>(new Set());

  // Editable checklist state (admin only)
  const [editingChecklist, setEditingChecklist] = useState(false);
  const [editItems, setEditItems] = useState<Array<{id: string; label: string; category: string}>>([]);
  const [checklistName, setChecklistName] = useState("Daily Checklist");

  // Supply order state
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [orderNotes, setOrderNotes] = useState("");
  const [orderSuccess, setOrderSuccess] = useState(false);
  // catalog picker: { productId -> qty }
  const [cartQtys, setCartQtys] = useState<Record<number, number>>({});
  // custom items fallback
  const [customItems, setCustomItems] = useState<Array<{ name: string; qty: string; unit: string }>>([]);
  const [showCustom, setShowCustom] = useState(false);

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'shop_manager';
  const shopId = (user as any)?.shopId ?? null;

  // Load custom checklist template if one exists
  const checklistQuery = trpc.tech.getChecklistTemplate.useQuery(
    { shopId: shopId ?? 0 },
    { enabled: !!shopId }
  );
  const saveChecklist = trpc.tech.saveChecklistTemplate.useMutation({
    onSuccess: () => { checklistQuery.refetch(); setEditingChecklist(false); },
  });

  const activeItems = checklistQuery.data?.items as Array<{id: string; label: string; category: string}> | undefined;
  const checklistItems = activeItems?.length ? activeItems : DEFAULT_ITEMS;

  // Techs see their own orders; admins see all shop orders
  const myOrdersQuery   = trpc.tech.getMySupplyOrders.useQuery(undefined, { enabled: !loading && !!user && !isAdmin });
  const shopOrdersQuery = trpc.tech.getShopSupplyOrders.useQuery({}, { enabled: !loading && !!user && isAdmin });
  const supplyOrdersQuery = isAdmin ? shopOrdersQuery : myOrdersQuery;

  const catalogQuery = trpc.tech.getCatalog.useQuery(undefined, { enabled: !loading && !!user });

  const createOrder = trpc.tech.createSupplyOrder.useMutation({
    onSuccess: () => {
      setOrderSuccess(true);
      setCartQtys({});
      setCustomItems([]);
      setShowCustom(false);
      setOrderNotes("");
      setShowOrderForm(false);
      supplyOrdersQuery.refetch();
      setTimeout(() => setOrderSuccess(false), 3000);
    },
  });

  const updateStatus = trpc.tech.updateOrderStatus.useMutation({
    onSuccess: () => supplyOrdersQuery.refetch(),
  });

  if (loading) {
    return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center"><Loader2 size={24} className="animate-spin text-gold" /></div>;
  }
  if (!user) { navigate("/login"); return null; }

  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  const completedPct = Math.round((checked.size / checklistItems.length) * 100);
  const levelLabel = isAdmin ? "Manager View" : ((user as any).techLevel ? LEVEL_LABEL[(user as any).techLevel] ?? `Level ${(user as any).techLevel}` : "Team Member");
  const categories = [...new Set(checklistItems.map((i: any) => i.category))];

  function toggleItem(id: string) {
    setChecked(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function setCartQty(id: number, delta: number) {
    setCartQtys(prev => {
      const next = { ...prev };
      const newQty = (next[id] ?? 0) + delta;
      if (newQty <= 0) delete next[id];
      else next[id] = newQty;
      return next;
    });
  }

  function addCustomItem() {
    setCustomItems(prev => [...prev, { name: "", qty: "1", unit: "each" }]);
  }

  function updateCustomItem(i: number, field: string, value: string) {
    setCustomItems(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: value } : item));
  }

  function removeCustomItem(i: number) {
    setCustomItems(prev => prev.filter((_, idx) => idx !== i));
  }

  function submitOrder() {
    const catalog = catalogQuery.data ?? [];
    const catalogItems = Object.entries(cartQtys).map(([idStr, qty]) => {
      const product = catalog.find((p: any) => p.id === Number(idStr));
      return product ? { name: product.name, qty: String(qty), unit: product.unit ?? "each" } : null;
    }).filter(Boolean) as { name: string; qty: string; unit: string }[];

    const validCustom = customItems.filter(i => i.name.trim());
    const allItems = [...catalogItems, ...validCustom];
    if (!allItems.length) return;
    createOrder.mutate({ items: allItems, notes: orderNotes });
  }

  const cartCount = Object.values(cartQtys).reduce((a, b) => a + b, 0) + customItems.filter(i => i.name.trim()).length;

  const statusColors: Record<string, string> = {
    pending: "text-amber-400 bg-amber-400/10",
    approved: "text-blue-400 bg-blue-400/10",
    ordered: "text-purple-400 bg-purple-400/10",
    delivered: "text-green-400 bg-green-400/10",
    rejected: "text-red-400 bg-red-400/10",
  };

  // Group checklist by category

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header — branded */}
      <header className="border-b border-white/8 bg-black/40 backdrop-blur-xl sticky top-0 z-50"
        style={{ borderBottomColor: `${branding.brandColor}20` }}>
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {branding.logoUrl ? (
              <img src={branding.logoUrl} alt={branding.name} className="h-7 w-auto object-contain" />
            ) : (
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black"
                style={{ background: branding.brandColor, color: "#000" }}>
                {branding.name[0]}
              </div>
            )}
            <span className="text-sm font-bold">{branding.name}</span>
            <span className="text-[10px] px-2 py-0.5 rounded font-medium uppercase tracking-widest"
              style={{ background: `${branding.brandColor}20`, color: branding.brandColor }}>
              {levelLabel}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {isAdmin && (
              <button onClick={() => navigate("/")} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-white transition-colors">
                <ArrowLeft size={12} /> Hub
              </button>
            )}
            <button onClick={() => logout()} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-white transition-colors">
              <LogOut size={12} /> Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Welcome + date */}
        <div className="mb-6">
          <p className="text-xs uppercase tracking-widest mb-0.5" style={{ color: branding.brandColor }}>
            {today}
          </p>
          <h1 className="text-2xl font-black">Good {new Date().getHours() < 12 ? "morning" : "afternoon"}, {user.name?.split(" ")[0] ?? "Tech"}</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white/[0.03] border border-white/8 rounded-xl p-1 mb-6">
          {[
            { id: "checklist" as Tab, label: "Checklist", icon: <ClipboardCheck size={14} /> },
            { id: "supplies" as Tab, label: "Supplies", icon: <ShoppingCart size={14} /> },
            { id: "stats" as Tab, label: "My Stats", icon: <BarChart3 size={14} /> },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                tab === t.id ? "text-black" : "text-muted-foreground hover:text-white"
              }`}
              style={tab === t.id ? { background: branding.brandColor } : {}}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* ── Checklist Tab ── */}
        {tab === "checklist" && (
          <div className="space-y-4">
            {/* Admin edit mode */}
            {isAdmin && editingChecklist ? (
              <div className="bg-white/[0.03] border border-gold/20 rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold">Edit Checklist</h3>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setEditingChecklist(false)} className="h-7 text-xs border-white/10">Cancel</Button>
                    <Button size="sm" onClick={() => saveChecklist.mutate({ shopId, name: checklistName, items: editItems })}
                      disabled={saveChecklist.isPending} className="h-7 text-xs bg-gold text-black font-bold hover:bg-gold/90">
                      {saveChecklist.isPending ? "Saving…" : "Save"}
                    </Button>
                  </div>
                </div>
                <Input value={checklistName} onChange={e => setChecklistName(e.target.value)}
                  placeholder="Checklist name" className="bg-white/5 border-white/10 text-white h-9 text-sm" />
                {editItems.map((item, i) => (
                  <div key={item.id} className="flex gap-2 items-start">
                    <div className="flex-1 space-y-1.5">
                      <Input value={item.label} onChange={e => setEditItems(prev => prev.map((it, idx) => idx === i ? {...it, label: e.target.value} : it))}
                        placeholder="Task label" className="bg-white/5 border-white/10 text-white h-8 text-xs" />
                      <Input value={item.category} onChange={e => setEditItems(prev => prev.map((it, idx) => idx === i ? {...it, category: e.target.value} : it))}
                        placeholder="Category (e.g. Pre-service)" className="bg-white/5 border-white/10 text-white h-8 text-xs" />
                    </div>
                    <button onClick={() => setEditItems(prev => prev.filter((_, idx) => idx !== i))}
                      className="text-red-400/60 hover:text-red-400 mt-1"><Trash2 size={14} /></button>
                  </div>
                ))}
                <button onClick={() => setEditItems(prev => [...prev, {id: Date.now().toString(), label: "", category: "Service"}])}
                  className="text-xs font-medium flex items-center gap-1 hover:text-white transition-colors" style={{ color: branding.brandColor }}>
                  <Plus size={12} /> Add item
                </button>
              </div>
            ) : (
              <>
                {/* Progress */}
                <div className="bg-white/[0.03] border border-white/8 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-bold">Today's Progress</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono font-bold" style={{ color: branding.brandColor }}>
                        {checked.size}/{checklistItems.length}
                      </span>
                      {isAdmin && (
                        <button onClick={() => { setEditItems([...checklistItems]); setEditingChecklist(true); }}
                          className="text-[10px] text-muted-foreground hover:text-white border border-white/10 rounded px-2 py-0.5">
                          Edit
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${completedPct}%`, background: branding.brandColor }} />
                  </div>
                  {completedPct === 100 && (
                    <p className="text-xs mt-2 font-medium" style={{ color: branding.brandColor }}>
                      ✓ All tasks complete — great work!
                    </p>
                  )}
                </div>

                {/* Items grouped by category */}
                {categories.map(cat => {
                  const items = checklistItems.filter((i: any) => i.category === cat);
                  return (
                    <div key={cat} className="bg-white/[0.03] border border-white/8 rounded-xl overflow-hidden">
                      <div className="px-5 py-3 border-b border-white/5">
                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{cat}</h3>
                      </div>
                      <div className="divide-y divide-white/5">
                        {items.map((item: any) => {
                          const done = checked.has(item.id);
                          return (
                            <button key={item.id} onClick={() => toggleItem(item.id)}
                              className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-white/[0.02] transition-colors text-left">
                              {done
                                ? <CheckCircle2 size={18} style={{ color: branding.brandColor }} className="shrink-0" />
                                : <Circle size={18} className="text-white/20 shrink-0" />}
                              <span className={`text-sm transition-colors ${done ? "text-white/40 line-through" : "text-white/80"}`}>
                                {item.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        )}

        {/* ── Supplies Tab ── */}
        {tab === "supplies" && (
          <div className="space-y-4">
            {orderSuccess && (
              <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3 text-sm text-green-400">
                <CheckCircle2 size={16} /> Supply order submitted successfully!
              </div>
            )}

            {/* New order button */}
            <Button
              onClick={() => setShowOrderForm(!showOrderForm)}
              className="w-full h-11 font-bold gap-2"
              style={{ background: branding.brandColor, color: "#000" }}
            >
              {showOrderForm
                ? <><ChevronUp size={16} /> Cancel</>
                : <><Plus size={16} /> New Supply Order</>}
            </Button>

            {/* Order form — catalog picker */}
            {showOrderForm && (
              <div className="bg-white/[0.03] border border-white/8 rounded-xl p-5 space-y-5">
                <h3 className="text-sm font-bold">New Supply Request</h3>

                {catalogQuery.isLoading && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 size={14} className="animate-spin" /> Loading catalog…
                  </div>
                )}

                {!catalogQuery.isLoading && (catalogQuery.data ?? []).length === 0 && (
                  <p className="text-xs text-muted-foreground">No catalog items set up yet. Use the custom item section below.</p>
                )}

                {/* Catalog chips grouped by category */}
                {(() => {
                  const catalog = catalogQuery.data ?? [];
                  const cats = [...new Set(catalog.map((p: any) => p.category ?? "General"))];
                  return cats.map(cat => (
                    <div key={cat} className="space-y-2">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{cat}</p>
                      <div className="flex flex-wrap gap-2">
                        {catalog.filter((p: any) => (p.category ?? "General") === cat).map((product: any) => {
                          const qty = cartQtys[product.id] ?? 0;
                          const selected = qty > 0;
                          return (
                            <div key={product.id}
                              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                                selected
                                  ? "border-transparent text-black"
                                  : "border-white/10 text-white/70 hover:border-white/30 hover:text-white"
                              }`}
                              style={selected ? { background: branding.brandColor } : {}}>
                              <button onClick={() => setCartQty(product.id, -1)} className={`${selected ? "text-black/60 hover:text-black" : "hidden"}`}>
                                −
                              </button>
                              <button
                                onClick={() => setCartQty(product.id, 1)}
                                className="flex items-center gap-1"
                              >
                                {!selected && <Plus size={10} />}
                                {product.name}
                                {selected && <span className="font-bold ml-1">×{qty}</span>}
                              </button>
                              {selected && (
                                <button onClick={() => setCartQty(product.id, -qty)} className="text-black/60 hover:text-black ml-0.5">
                                  ✕
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ));
                })()}

                {/* Custom items */}
                <div className="space-y-2">
                  <button
                    onClick={() => { setShowCustom(v => !v); if (!showCustom && customItems.length === 0) addCustomItem(); }}
                    className="text-xs font-medium flex items-center gap-1 transition-colors hover:text-white"
                    style={{ color: branding.brandColor }}
                  >
                    <Plus size={12} /> {showCustom ? "Hide custom items" : "Add custom item"}
                  </button>
                  {showCustom && customItems.map((item, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-5">
                        <Input value={item.name} onChange={e => updateCustomItem(i, "name", e.target.value)}
                          placeholder="Item name" className="bg-white/5 border-white/10 text-white h-9 text-sm" />
                      </div>
                      <div className="col-span-2">
                        <Input value={item.qty} onChange={e => updateCustomItem(i, "qty", e.target.value)}
                          placeholder="Qty" type="number" min="1" className="bg-white/5 border-white/10 text-white h-9 text-sm" />
                      </div>
                      <div className="col-span-3">
                        <Input value={item.unit} onChange={e => updateCustomItem(i, "unit", e.target.value)}
                          placeholder="Unit" className="bg-white/5 border-white/10 text-white h-9 text-sm" />
                      </div>
                      <div className="col-span-2 flex justify-end">
                        <button onClick={() => removeCustomItem(i)} className="text-muted-foreground hover:text-red-400 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {showCustom && (
                    <button onClick={addCustomItem} className="text-xs text-muted-foreground hover:text-white flex items-center gap-1 transition-colors">
                      <Plus size={10} /> Add another
                    </button>
                  )}
                </div>

                {/* Notes */}
                <div>
                  <Label className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5 block">Notes (optional)</Label>
                  <Input value={orderNotes} onChange={e => setOrderNotes(e.target.value)}
                    placeholder="Any additional context..." className="bg-white/5 border-white/10 text-white h-9 text-sm" />
                </div>

                <Button onClick={submitOrder} disabled={createOrder.isPending || cartCount === 0}
                  className="w-full h-10 font-bold gap-2 disabled:opacity-40"
                  style={{ background: branding.brandColor, color: "#000" }}>
                  {createOrder.isPending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  Submit Order {cartCount > 0 && `(${cartCount} item${cartCount !== 1 ? "s" : ""})`}
                </Button>
              </div>
            )}

            {/* Orders list */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                {isAdmin ? "All Shop Orders" : "Your Orders"}
              </h3>
              {supplyOrdersQuery.isLoading && <div className="text-sm text-muted-foreground">Loading…</div>}
              {(supplyOrdersQuery.data ?? []).length === 0 && !supplyOrdersQuery.isLoading && (
                <div className="bg-white/[0.03] border border-white/8 rounded-xl px-5 py-8 text-center text-sm text-muted-foreground">
                  <Package size={24} className="mx-auto mb-2 opacity-30" />
                  No supply orders yet
                </div>
              )}
              {(supplyOrdersQuery.data ?? []).map((order: any) => (
                <div key={order.id} className="bg-white/[0.03] border border-white/8 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-medium uppercase ${statusColors[order.status] ?? "text-muted-foreground bg-white/5"}`}>
                      {order.status}
                    </span>
                  </div>
                  <ul className="space-y-1 mb-2">
                    {(Array.isArray(order.items) ? order.items : []).map((item: any, i: number) => (
                      <li key={i} className="text-sm text-white/70">
                        {item.qty} {item.unit} — {item.name}
                      </li>
                    ))}
                  </ul>
                  {order.notes && <p className="text-xs text-muted-foreground italic mb-2">"{order.notes}"</p>}
                  {/* Admin approve/reject buttons */}
                  {isAdmin && order.status === "pending" && (
                    <div className="flex gap-2 mt-2 pt-2 border-t border-white/5">
                      <button
                        onClick={() => updateStatus.mutate({ orderId: order.id, status: "approved" })}
                        disabled={updateStatus.isPending}
                        className="flex items-center gap-1.5 text-xs font-semibold text-green-400 hover:text-green-300 transition-colors disabled:opacity-40"
                      >
                        <ThumbsUp size={13} /> Approve
                      </button>
                      <button
                        onClick={() => updateStatus.mutate({ orderId: order.id, status: "rejected" })}
                        disabled={updateStatus.isPending}
                        className="flex items-center gap-1.5 text-xs font-semibold text-red-400 hover:text-red-300 transition-colors disabled:opacity-40"
                      >
                        <ThumbsDown size={13} /> Reject
                      </button>
                    </div>
                  )}
                  {isAdmin && order.status === "approved" && (
                    <div className="flex gap-2 mt-2 pt-2 border-t border-white/5">
                      <button
                        onClick={() => updateStatus.mutate({ orderId: order.id, status: "ordered" })}
                        disabled={updateStatus.isPending}
                        className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        Mark Ordered
                      </button>
                    </div>
                  )}
                  {isAdmin && order.status === "ordered" && (
                    <div className="flex gap-2 mt-2 pt-2 border-t border-white/5">
                      <button
                        onClick={() => updateStatus.mutate({ orderId: order.id, status: "delivered" })}
                        disabled={updateStatus.isPending}
                        className="text-xs font-semibold text-green-400 hover:text-green-300 transition-colors"
                      >
                        Mark Delivered
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Stats Tab ── */}
        {tab === "stats" && (
          <div className="space-y-4">
            <div className="bg-white/[0.03] border border-white/8 rounded-xl p-6 text-center">
              <BarChart3 size={28} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm font-bold mb-1">Performance stats coming soon</p>
              <p className="text-xs text-muted-foreground">Jobs completed, hours logged, and quality scores will appear here.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
