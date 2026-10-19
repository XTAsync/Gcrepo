import { redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

/**
 * Route guard for authenticated routes.
 * Redirects unauthenticated users to /login?redirect=<url>.
 */
export async function requireAuth({ location }: { location: { href: string } }) {
  if (typeof window === "undefined") return; // SSR safe
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      throw redirect({
        to: "/login",
        search: { redirect: location.href },
      });
    }
  } catch (err) {
    if (err && typeof err === "object" && "to" in err) {
      throw err;
    }
    throw redirect({
      to: "/login",
      search: { redirect: location.href },
    });
  }
}

/**
 * Route guard for admin routes.
 * Checks server-verified role via public.has_role() RPC.
 * Never trusts client storage or local profile role flags.
 */
export async function requireAdmin({ location }: { location: { href: string } }) {
  if (typeof window === "undefined") return; // SSR safe
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw redirect({
      to: "/login",
      search: { redirect: location.href },
    });
  }

  const { data: isAdmin, error } = await supabase.rpc("has_role", {
    _user_id: session.user.id,
    _role: "admin",
  });

  if (error || !isAdmin) {
    throw redirect({ to: "/home" });
  }
}
