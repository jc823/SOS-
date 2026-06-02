import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";

type Role = "user" | "admin" | "super_admin" | "customer";

interface AuthGuardProps {
  children: React.ReactNode;
  /** If provided, user must have one of these roles. super_admin always passes. */
  roles?: Role[];
}

/**
 * AuthGuard — Wraps protected routes.
 *
 * Rules:
 *   - Not logged in              → redirect to /login
 *   - Logged in, wrong role      → customer → /portal, others → /404
 *   - super_admin                → always passes
 *   - No roles prop              → just requires login
 */
export default function AuthGuard({ children, roles }: AuthGuardProps) {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (loading) return;

    // Not authenticated → login
    if (!user) {
      navigate("/login");
      return;
    }

    // super_admin always gets through
    if (user.role === "super_admin") return;

    // Role check
    if (roles && !roles.includes(user.role as Role)) {
      if (user.role === "customer") {
        navigate("/portal");
      } else {
        navigate("/404");
      }
    }
  }, [user, loading, roles, navigate]);

  // Show nothing while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-gold/40 border-t-gold rounded-full animate-spin" />
      </div>
    );
  }

  // Not authenticated → render nothing (redirect fires in useEffect)
  if (!user) return null;

  // Wrong role → render nothing (redirect fires in useEffect)
  if (roles && user.role !== "super_admin" && !roles.includes(user.role as Role)) return null;

  return <>{children}</>;
}
