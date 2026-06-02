export function DashboardLayoutSkeleton() {
  return (
    <div className="flex h-screen w-full animate-pulse bg-background">
      <div className="w-64 border-r border-white/5 bg-card" />
      <div className="flex-1 p-6 space-y-4">
        <div className="h-8 w-48 rounded-md bg-white/5" />
        <div className="h-4 w-full rounded-md bg-white/5" />
        <div className="h-4 w-3/4 rounded-md bg-white/5" />
      </div>
    </div>
  );
}
