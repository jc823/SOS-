import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";

type Role = "user" | "admin" | "super_admin" | "customer";

interface AuthGuardProps {
  children: React.ReactNode;
  /** If provided, user must have one of these roles. super_admin always passes. */
  roles?: Role[];
  /** If true, user must have an active Pro or Agent subscription (admins bypass). */
  requiresPro?: boolean;
}

/**
 * AuthGuard — Wraps protected routes.
 *
 * Rules:
 *   - Not logged in              → /login
 *   - Wrong role                 → customer → /portal, others → /404
 *   - requiresPro + free user    → /pricing
 *   - super_admin                → always passes everything
 */
export default function AuthGuard({ children, roles, requiresPro }: AuthGuardProps) {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (loading) return;

    // Not authenticated → login
    if (!user) {
      navigate("/login");
      return;
    }

    // super_admin bypasses everything
    if (user.role === "super_admin") return;

    // Role check
    if (roles && !roles.includes(user.role as Role)) {
      if (user.role === "customer") {
        navigate("/portal");
      } else {
        navigate("/404");
      }
      return;
    }

    // Subscription check — admins bypass
    if (requiresPro && user.role !== "admin") {
      const status = user.subscriptionStatus ?? "free";
      if (status !== "pro" && status !== "agent") {
        navigate("/pricing");
        return;
      }
    }
  }, [user, loading, roles, requiresPro, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-gold/40 border-t-gold rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  if (roles && user.role !== "super_admin" && !roles.includes(user.role as Role)) return null;

  if (requiresPro && user.role !== "super_admin" && user.role !== "admin") {
    const status = user.subscriptionStatus ?? "free";
    if (status !== "pro" && status !== "agent") return null;
  }

  return <>{children}</>;
}
