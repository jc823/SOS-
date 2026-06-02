/*
 * SeverityLegend — Shows severity band definitions
 * Scale Detailing brand: black bg, gold accent, white text
 */

export default function SeverityLegend() {
  return (
    <div className="glass-card p-4">
      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
        Severity Bands
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Overall (0–100)</p>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#2ECC71]" />
              <span className="text-xs text-foreground">Green: 80–100</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#D4A843]" />
              <span className="text-xs text-foreground">Yellow: 60–79</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#E74C3C]" />
              <span className="text-xs text-foreground">Red: &lt; 60</span>
            </div>
          </div>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Per Pillar (0–25)</p>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#2ECC71]" />
              <span className="text-xs text-foreground">Green: 20–25</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#D4A843]" />
              <span className="text-xs text-foreground">Yellow: 15–19.9</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#E74C3C]" />
              <span className="text-xs text-foreground">Red: &lt; 15</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
