import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { TRPCClientError } from "@trpc/client";
import { useCallback, useEffect, useMemo } from "react";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  // Login is started via startLogin() in the effect below, only when we actually
  // navigate — never during render. startLogin() mints a one-time nonce + writes
  // the state cookie, so calling it per render would overwrite the cookie and
  // desync it from an in-flight login's `state`.
  const { redirectOnUnauthenticated = false, redirectPath } = options ?? {};
  const utils = trpc.useUtils();

  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      utils.auth.me.setData(undefined, null);
    },
  });

  const logout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (error: unknown) {
      if (
        error instanceof TRPCClientError &&
        error.data?.code === "UNAUTHORIZED"
      ) {
        return;
      }
      throw error;
    } finally {
      // Clear the Preview auto-login token mirrored into sessionStorage, so
      // header-based sessions (Safari ITP / WebView) are logged out too. The
      // backend cookie is cleared by the logout mutation.
      try {
        sessionStorage.removeItem("manus-cookie");
      } catch {}

      // Clear persisted user info from localStorage so a refresh after logout
      // does not restore stale identity data.
      try {
        localStorage.removeItem("manus-runtime-user-info");
      } catch {}

      // Wipe the auth query cache immediately so every consumer sees null user.
      utils.auth.me.setData(undefined, null);
      await utils.auth.me.invalidate();

      // Replace the current history entry with the current URL so the browser
      // Back button cannot restore the authenticated dashboard after logout.
      // We also push a second entry so that pressing Back from the landing page
      // lands on this replaced (neutral) entry rather than the previous page.
      try {
        if (typeof window !== "undefined") {
          window.history.replaceState({ loggedOut: true }, "", window.location.pathname);
        }
      } catch {}
    }
  }, [logoutMutation, utils]);

  const state = useMemo(() => {
    const userData = meQuery.data ?? null;
    // Keep localStorage in sync: write when authenticated, clear when not.
    try {
      if (userData) {
        localStorage.setItem("manus-runtime-user-info", JSON.stringify(userData));
      } else {
        localStorage.removeItem("manus-runtime-user-info");
      }
    } catch {}
    return {
      user: userData,
      loading: meQuery.isLoading || logoutMutation.isPending,
      error: meQuery.error ?? logoutMutation.error ?? null,
      isAuthenticated: Boolean(userData),
    };
  }, [
    meQuery.data,
    meQuery.error,
    meQuery.isLoading,
    logoutMutation.error,
    logoutMutation.isPending,
  ]);

  useEffect(() => {
    if (!redirectOnUnauthenticated) return;
    if (meQuery.isLoading || logoutMutation.isPending) return;
    if (state.user) return;
    if (typeof window === "undefined") return;
    if (redirectPath && window.location.pathname === redirectPath) return;

    // Navigate at this moment only. startLogin() mints the nonce + cookie itself.
    if (redirectPath) {
      window.location.href = redirectPath;
    } else {
      startLogin();
    }
  }, [
    redirectOnUnauthenticated,
    redirectPath,
    logoutMutation.isPending,
    meQuery.isLoading,
    state.user,
  ]);

  return {
    ...state,
    refresh: () => meQuery.refetch(),
    logout,
  };
}
