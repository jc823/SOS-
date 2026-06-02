import { trpc } from "@/lib/trpc";
import { useEffect } from "react";

export function useAuth() {
  const { data: user, isLoading, refetch } = trpc.auth.me.useQuery(undefined, {
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 min
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      window.location.href = "/login";
    },
  });

  return {
    user: user ?? null,
    loading: isLoading,
    isAuthenticated: !!user,
    logout: () => logoutMutation.mutate(),
    refetch,
  };
}
