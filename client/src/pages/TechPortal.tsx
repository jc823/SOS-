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
  ChevronDown, ChevronUp, Trash2,
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

  // Supply order state
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [orderItems, setOrderItems] = useState([{ name: "", qty: "1", unit: "units", notes: "" }]);
  const [orderNotes, setOrderNotes] = useState("");
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  const supplyOrdersQuery = trpc.tech.getMySupplyOrders.useQuery(undefined, {
    enabled: !loading && !!user,
  });
  const createOrder = trpc.tech.createSupplyOrder.useMutation({
    onSuccess: () => {
      setOrderSuccess(true);
      setOrderItems([{ name: "", qty: "1", unit: "units", notes: "" }]);
      setOrderNotes("");
      setShowOrderForm(false);
      supplyOrdersQuery.refetch();
      setTimeout(() => setOrderSuccess(false), 3000);
    },
  });

  if (loading) {
    return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center"><Loader2 size={24} className="animate-spin text-gold" /></div>;
  }
  if (!user) { navigate("/login"); return null; }

  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  const completedPct = Math.round((checked.size / DEFAULT_ITEMS.length) * 100);
  const levelLabel = user.techLevel ? LEVEL_LABEL[user.techLevel] ?? `Level ${user.techLevel}` : "Team Member";

  function toggleItem(id: string) {
    setChecked(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function addOrderItem() {
    setOrderItems(prev => [...prev, { name: "", qty: "1", unit: "units", notes: "" }]);
  }

  function removeOrderItem(i: number) {
    setOrderItems(prev => prev.filter((_, idx) => idx !== i));
  }

  function updateOrderItem(i: number, field: string, value: string) {
    setOrderItems(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: value } : item));
  }

  function submitOrder() {
    const validItems = orderItems.filter(i => i.name.trim());
    if (!validItems.length) return;
    createOrder.mutate({ items: validItems, notes: orderNotes });
  }

  const statusColors: Record<string, string> = {
    pending: "text-amber-400 bg-amber-400/10",
    approved: "text-blue-400 bg-blue-400/10",
    ordered: "text-purple-400 bg-purple-400/10",
    delivered: "text-green-400 bg-green-400/10",
    rejected: "text-red-400 bg-red-400/10",
  };

  // Group checklist by category
  const categories = [...new Set(DEFAULT_ITEMS.map(i => i.category))];

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
          <button onClick={() => logout()} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-white transition-colors">
            <LogOut size={12} /> Sign out
          </button>
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
            {/* Progress */}
            <div className="bg-white/[0.03] border border-white/8 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold">Today's Progress</span>
                <span className="text-sm font-mono font-bold" style={{ color: branding.brandColor }}>
                  {checked.size}/{DEFAULT_ITEMS.length}
                </span>
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
              const items = DEFAULT_ITEMS.filter(i => i.category === cat);
              return (
                <div key={cat} className="bg-white/[0.03] border border-white/8 rounded-xl overflow-hidden">
                  <div className="px-5 py-3 border-b border-white/5">
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{cat}</h3>
                  </div>
                  <div className="divide-y divide-white/5">
                    {items.map(item => {
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
              {showOrderForm ? <><ChevronUp size={16} /> Cancel</> : <><Plus size={16} /> New Supply Order</>}
            </Button>

            {/* Order form */}
            {showOrderForm && (
              <div className="bg-white/[0.03] border border-white/8 rounded-xl p-5 space-y-4">
                <h3 className="text-sm font-bold">New Supply Request</h3>
                {orderItems.map((item, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 items-start">
                    <div className="col-span-5">
                      <Input value={item.name} onChange={e => updateOrderItem(i, "name", e.target.value)}
                        placeholder="Item name" className="bg-white/5 border-white/10 text-white h-9 text-sm" />
                    </div>
                    <div className="col-span-2">
                      <Input value={item.qty} onChange={e => updateOrderItem(i, "qty", e.target.value)}
                        placeholder="Qty" type="number" className="bg-white/5 border-white/10 text-white h-9 text-sm" />
                    </div>
                    <div className="col-span-3">
                      <Input value={item.unit} onChange={e => updateOrderItem(i, "unit", e.target.value)}
                        placeholder="Unit" className="bg-white/5 border-white/10 text-white h-9 text-sm" />
                    </div>
                    <div className="col-span-2 flex justify-end pt-1">
                      <button onClick={() => removeOrderItem(i)} className="text-muted-foreground hover:text-red-400 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
                <button onClick={addOrderItem} className="text-xs font-medium flex items-center gap-1 hover:text-white transition-colors"
                  style={{ color: branding.brandColor }}>
                  <Plus size={12} /> Add another item
                </button>
                <div>
                  <Label className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5 block">Notes (optional)</Label>
                  <Input value={orderNotes} onChange={e => setOrderNotes(e.target.value)}
                    placeholder="Any additional context..." className="bg-white/5 border-white/10 text-white h-9 text-sm" />
                </div>
                <Button onClick={submitOrder} disabled={createOrder.isPending || !orderItems.some(i => i.name.trim())}
                  className="w-full h-10 font-bold gap-2 disabled:opacity-40"
                  style={{ background: branding.brandColor, color: "#000" }}>
                  {createOrder.isPending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  Submit Order
                </Button>
              </div>
            )}

            {/* Past orders */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Your Orders</h3>
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
                  <ul className="space-y-1">
                    {(Array.isArray(order.items) ? order.items : []).map((item: any, i: number) => (
                      <li key={i} className="text-sm text-white/70">
                        {item.qty} {item.unit} — {item.name}
                      </li>
                    ))}
                  </ul>
                  {order.notes && <p className="text-xs text-muted-foreground mt-2 italic">"{order.notes}"</p>}
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
