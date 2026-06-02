import * as React from "react";
import { cn } from "@/lib/utils";

// ─── Context ──────────────────────────────────────────────────────────────────
interface SidebarContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  isMobile: boolean;
  state: "expanded" | "collapsed";
  toggleSidebar: () => void;
}

const SidebarContext = React.createContext<SidebarContextValue>({
  open: true,
  setOpen: () => {},
  isMobile: false,
  state: "expanded",
  toggleSidebar: () => {},
});

export function useSidebar() {
  return React.useContext(SidebarContext);
}

// ─── Provider ─────────────────────────────────────────────────────────────────
interface SidebarProviderProps {
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function SidebarProvider({
  children,
  defaultOpen = true,
  className,
  style,
}: SidebarProviderProps) {
  const [open, setOpen] = React.useState(defaultOpen);
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const state: "expanded" | "collapsed" = open ? "expanded" : "collapsed";
  const toggleSidebar = () => setOpen(prev => !prev);

  return (
    <SidebarContext.Provider value={{ open, setOpen, isMobile, state, toggleSidebar }}>
      <div
        className={cn("flex min-h-screen w-full", className)}
        style={style}
      >
        {children}
      </div>
    </SidebarContext.Provider>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
interface SidebarProps extends React.HTMLAttributes<HTMLElement> {
  side?: "left" | "right";
  collapsible?: "offcanvas" | "icon" | "none";
  disableTransition?: boolean;
}

export function Sidebar({
  className,
  children,
  side = "left",
  collapsible: _collapsible,
  disableTransition: _disableTransition,
  ...props
}: SidebarProps) {
  const { open } = useSidebar();

  return (
    <aside
      data-state={open ? "expanded" : "collapsed"}
      className={cn(
        "flex h-screen flex-col border-r border-white/[0.06] bg-[#111113] transition-all duration-200",
        open ? "w-64" : "w-14",
        side === "right" && "order-last border-l border-r-0",
        className,
      )}
      {...props}
    >
      {children}
    </aside>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────
export function SidebarHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-4", className)} {...props} />;
}

export function SidebarContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex-1 overflow-auto px-2 py-2", className)} {...props} />;
}

export function SidebarFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("border-t border-white/[0.06] p-3", className)} {...props} />;
}

export function SidebarInset({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-1 flex-col overflow-hidden", className)} {...props} />;
}

export function SidebarMenu({ className, ...props }: React.HTMLAttributes<HTMLUListElement>) {
  return <ul className={cn("space-y-0.5", className)} {...props} />;
}

export function SidebarMenuItem({ className, ...props }: React.HTMLAttributes<HTMLLIElement>) {
  return <li className={cn("", className)} {...props} />;
}

interface SidebarMenuButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  isActive?: boolean;
  tooltip?: string;
}

export const SidebarMenuButton = React.forwardRef<HTMLButtonElement, SidebarMenuButtonProps>(
  ({ className, isActive, tooltip: _tooltip, asChild: _asChild, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
          "text-muted-foreground hover:text-foreground hover:bg-white/[0.04]",
          isActive && "bg-gold/10 text-gold hover:bg-gold/15 hover:text-gold",
          className,
        )}
        {...props}
      >
        {children}
      </button>
    );
  },
);
SidebarMenuButton.displayName = "SidebarMenuButton";

// ─── Trigger ──────────────────────────────────────────────────────────────────
interface SidebarTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

export function SidebarTrigger({ className, onClick, ...props }: SidebarTriggerProps) {
  const { open, setOpen } = useSidebar();

  return (
    <button
      onClick={(e) => {
        setOpen(!open);
        onClick?.(e);
      }}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors",
        className,
      )}
      {...props}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect width="18" height="18" x="3" y="3" rx="2" />
        <path d="M9 3v18" />
      </svg>
    </button>
  );
}
