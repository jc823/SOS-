/*
 * AssessmentHeader — Internal tool metadata: shop selector, assessor, date, logo
 * Scale Detailing brand: black bg, gold accent, white text
 *
 * The shop name input has been replaced with a slot for the ShopSelector dropdown.
 */
import { ReactNode } from 'react';
// ShopLogoUpload shelved

interface AssessmentMeta {
  shopName: string;
  assessorName: string;
  assessmentDate: string;
  notes: string;
  city: string;
  state: string;
}

interface AssessmentHeaderProps {
  meta: AssessmentMeta;
  onChange: (meta: AssessmentMeta) => void;
  customerLogoUrl: string | null;
  onLogoChange: (url: string | null) => void;
  /** Slot for the ShopSelector component (replaces plain text input) */
  shopSelector?: ReactNode;
}

export default function AssessmentHeader({ meta, onChange, customerLogoUrl, onLogoChange, shopSelector }: AssessmentHeaderProps) {
  const update = (field: keyof AssessmentMeta, value: string) => {
    onChange({ ...meta, [field]: value });
  };

  return (
    <div className="glass-card p-4 sm:p-5 space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-1.5 h-6 rounded-full bg-gold" />
        <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
          Assessment Details
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Shop Selector (dropdown) or fallback text input */}
        <div className="sm:col-span-2 lg:col-span-1">
          {shopSelector ?? (
            <>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                Shop / Business Name *
              </label>
              <input
                type="text"
                value={meta.shopName}
                onChange={(e) => update('shopName', e.target.value)}
                placeholder="e.g. Elite Auto Spa"
                className="w-full rounded-md border border-border/50 bg-muted/20 px-3 py-2.5 text-sm font-medium text-foreground placeholder:text-muted-foreground/40 focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/20"
              />
            </>
          )}
        </div>

        {/* Assessor Name — auto-filled from logged-in user */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
            Assessed By
          </label>
          <div
            className="w-full rounded-md border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 text-sm font-medium text-foreground/80 cursor-default"
          >
            {meta.assessorName || <span className="text-muted-foreground/40 italic">Loading...</span>}
          </div>
        </div>

        {/* Date */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
            Assessment Date
          </label>
          <input
            type="date"
            value={meta.assessmentDate}
            onChange={(e) => update('assessmentDate', e.target.value)}
            className="w-full rounded-md border border-border/50 bg-muted/20 px-3 py-2.5 text-sm text-foreground focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/20 [color-scheme:dark]"
          />
        </div>

        {/* City */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
            City
          </label>
          <input
            type="text"
            value={meta.city || ''}
            onChange={(e) => update('city', e.target.value)}
            placeholder="e.g. Austin"
            className="w-full rounded-md border border-border/50 bg-muted/20 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/20"
          />
        </div>

        {/* State */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
            State
          </label>
          <input
            type="text"
            value={meta.state || ''}
            onChange={(e) => update('state', e.target.value)}
            placeholder="e.g. TX"
            className="w-full rounded-md border border-border/50 bg-muted/20 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/20"
          />
        </div>

        {/* Logo upload shelved */}
      </div>

      {/* Overall notes */}
      <div>
        <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
          Assessment Notes (optional)
        </label>
        <textarea
          value={meta.notes}
          onChange={(e) => update('notes', e.target.value)}
          placeholder="General observations about this shop..."
          rows={2}
          className="w-full rounded-md border border-border/50 bg-muted/20 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/20 resize-none"
        />
      </div>
    </div>
  );
}
