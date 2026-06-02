/**
 * ShopSelector — Searchable dropdown for selecting existing shops or adding new ones.
 * Includes Examination Mode and Reassess Mode checkboxes.
 *
 * Scale Detailing brand: black bg, gold (#C8962E) accent, white text
 */
import { useState, useRef, useEffect, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { Search, Plus, Store, ChevronDown, X, ClipboardCheck, RefreshCcw } from 'lucide-react';

export type AssessmentMode = 'examination' | 'reassess' | null;

interface ShopData {
  id: number;
  name: string;
  logoUrl: string | null;
  latestAssessmentId: number | null;
  latestAssessmentDate: string | null;
  latestAssessorName: string | null;
  latestOverallPercentage: number | null;
  latestScalingProbability: number | null;
  latestRevenueTier: string | null;
  latestCustomTarget: number | null;
  latestCurrentRevenue: number | null;
  latestScores: any;
  latestBusinessProfile: any;
  assessmentCount: number;
}

interface ShopSelectorProps {
  onSelect: (shop: ShopData | null) => void;
  onNewShop: (name: string) => void;
  onModeChange: (mode: AssessmentMode) => void;
  assessmentMode: AssessmentMode;
  selectedShopName: string;
  disabled?: boolean;
}

export default function ShopSelector({
  onSelect,
  onNewShop,
  onModeChange,
  assessmentMode,
  selectedShopName,
  disabled = false,
}: ShopSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [showNewInput, setShowNewInput] = useState(false);
  const [newShopName, setNewShopName] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: shops, isLoading } = trpc.shops.listWithAssessments.useQuery();

  // Filter shops by search
  const filtered = useMemo(() => {
    if (!shops) return [];
    if (!search.trim()) return shops;
    const q = search.toLowerCase();
    return shops.filter((s: ShopData) => s.name.toLowerCase().includes(q));
  }, [shops, search]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setShowNewInput(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSelectShop = (shop: ShopData) => {
    onSelect(shop);
    setIsOpen(false);
    setSearch('');
    setShowNewInput(false);
    // Auto-suggest mode based on whether shop has previous assessments
    if (shop.latestAssessmentId) {
      onModeChange('reassess');
    } else {
      onModeChange('examination');
    }
  };

  const handleAddNew = () => {
    if (newShopName.trim()) {
      onNewShop(newShopName.trim());
      setIsOpen(false);
      setSearch('');
      setShowNewInput(false);
      setNewShopName('');
      onModeChange('examination');
    }
  };

  const handleClear = () => {
    onSelect(null);
    setSearch('');
    onModeChange(null);
  };

  return (
    <div className="space-y-3">
      {/* Shop Dropdown */}
      <div>
        <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
          Shop / Business Name *
        </label>
        <div ref={dropdownRef} className="relative">
          {/* Trigger */}
          <button
            type="button"
            onClick={() => !disabled && setIsOpen(!isOpen)}
            disabled={disabled}
            className={`
              w-full flex items-center justify-between rounded-md border px-3 py-2.5 text-sm text-left transition-all
              ${selectedShopName
                ? 'border-gold/40 bg-gold/5 text-foreground font-medium'
                : 'border-border/50 bg-muted/20 text-muted-foreground/40'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-gold/50 cursor-pointer'}
              focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/20
            `}
          >
            <span className="flex items-center gap-2 truncate">
              {selectedShopName ? (
                <>
                  <Store size={14} className="text-gold shrink-0" />
                  {selectedShopName}
                </>
              ) : (
                'Select or add a shop...'
              )}
            </span>
            <div className="flex items-center gap-1 shrink-0">
              {selectedShopName && !disabled && (
                <span
                  onClick={(e) => { e.stopPropagation(); handleClear(); }}
                  className="p-0.5 rounded hover:bg-muted/30 text-muted-foreground/50 hover:text-foreground cursor-pointer"
                >
                  <X size={14} />
                </span>
              )}
              <ChevronDown size={14} className={`text-muted-foreground/50 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>
          </button>

          {/* Dropdown Panel */}
          {isOpen && (
            <div className="absolute z-50 mt-1 w-full rounded-lg border border-border/40 bg-card shadow-xl overflow-hidden">
              {/* Search */}
              <div className="p-2 border-b border-white/[0.06]">
                <div className="relative">
                  <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search shops..."
                    autoFocus
                    className="w-full rounded-md border border-white/[0.06] bg-white/[0.02] pl-8 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/30 focus:border-gold/40 focus:outline-none"
                  />
                </div>
              </div>

              {/* Shop List */}
              <div className="max-h-56 overflow-y-auto">
                {isLoading ? (
                  <div className="px-3 py-4 text-center text-xs text-muted-foreground/50">Loading shops...</div>
                ) : filtered.length === 0 ? (
                  <div className="px-3 py-4 text-center text-xs text-muted-foreground/50">
                    {search ? 'No shops match your search' : 'No shops yet'}
                  </div>
                ) : (
                  filtered.map((shop: ShopData) => (
                    <button
                      key={shop.id}
                      type="button"
                      onClick={() => handleSelectShop(shop)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-gold/5 transition-colors border-b border-border/10 last:border-0"
                    >
                      <div className="w-8 h-8 rounded-md bg-muted/20 border border-border/20 flex items-center justify-center shrink-0 overflow-hidden">
                        {shop.logoUrl ? (
                          <img src={shop.logoUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Store size={14} className="text-muted-foreground/40" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-foreground truncate">{shop.name}</div>
                        <div className="text-[10px] text-muted-foreground/50">
                          {shop.assessmentCount > 0 ? (
                            <>
                              {shop.assessmentCount} assessment{shop.assessmentCount !== 1 ? 's' : ''}
                              {shop.latestAssessmentDate && ` · Last: ${shop.latestAssessmentDate}`}
                              {shop.latestOverallPercentage != null && (
                                <span className="text-gold ml-1">{shop.latestOverallPercentage.toFixed(0)}%</span>
                              )}
                            </>
                          ) : (
                            'No assessments yet'
                          )}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>

              {/* Add New Shop */}
              <div className="border-t border-white/[0.06] p-2">
                {showNewInput ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newShopName}
                      onChange={(e) => setNewShopName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddNew()}
                      placeholder="Enter new shop name..."
                      autoFocus
                      className="flex-1 rounded-md border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/30 focus:border-gold/40 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddNew}
                      disabled={!newShopName.trim()}
                      className="px-3 py-2 rounded-md bg-gold text-black text-xs font-bold hover:bg-gold/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowNewInput(false); setNewShopName(''); }}
                      className="p-2 rounded-md text-muted-foreground/50 hover:text-foreground hover:bg-muted/20 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowNewInput(true)}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-gold hover:bg-gold/5 transition-colors"
                  >
                    <Plus size={14} />
                    Add New Shop
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mode Checkboxes — only show when a shop is selected */}
      {selectedShopName && (
        <div className="flex items-center gap-4">
          <label
            className={`
              flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all text-xs font-medium
              ${assessmentMode === 'examination'
                ? 'border-gold bg-gold/10 text-gold'
                : 'border-white/[0.06] bg-white/[0.02] text-muted-foreground hover:border-gold/30 hover:text-foreground'
              }
            `}
          >
            <input
              type="radio"
              name="assessmentMode"
              checked={assessmentMode === 'examination'}
              onChange={() => onModeChange('examination')}
              className="sr-only"
            />
            <ClipboardCheck size={14} />
            Examination
            <span className="text-[9px] text-muted-foreground/50 ml-0.5">(Fresh Scores)</span>
          </label>

          <label
            className={`
              flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all text-xs font-medium
              ${assessmentMode === 'reassess'
                ? 'border-gold bg-gold/10 text-gold'
                : 'border-white/[0.06] bg-white/[0.02] text-muted-foreground hover:border-gold/30 hover:text-foreground'
              }
            `}
          >
            <input
              type="radio"
              name="assessmentMode"
              checked={assessmentMode === 'reassess'}
              onChange={() => onModeChange('reassess')}
              className="sr-only"
            />
            <RefreshCcw size={14} />
            Reassess
            <span className="text-[9px] text-muted-foreground/50 ml-0.5">(Compare Previous)</span>
          </label>
        </div>
      )}
    </div>
  );
}
