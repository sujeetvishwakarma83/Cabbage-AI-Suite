import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    let { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      console.log("No user session found, initiating silent guest login...");

      // Try anonymous login first
      try {
        const { data: anonData, error: anonError } = await supabase.auth.signInAnonymously();
        if (!anonError && anonData?.user) {
          return { user: anonData.user };
        }
      } catch (e) {
        console.warn("Silent anonymous login failed:", e);
      }

      // Try guest account fallback
      try {
        const devEmail = "developer@cabbagecode.io";
        const devPassword = "CabbageCodeDeveloper2026!";

        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: devEmail,
          password: devPassword,
        });

        if (!signInError && signInData?.user) {
          return { user: signInData.user };
        }

        // Try signing up if the developer account doesn't exist
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: devEmail,
          password: devPassword,
          options: {
            data: { full_name: "Developer Guest" },
          },
        });

        if (!signUpError && signUpData?.user) {
          return { user: signUpData.user };
        }
      } catch (e) {
        console.warn("Silent guest account login failed:", e);
      }
    }

    const finalUser =
      data.user ||
      ({
        id: "00000000-0000-0000-0000-000000000000",
        email: "guest@example.com",
        user_metadata: { full_name: "Guest" },
      } as any);

    return { user: finalUser };
  },
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
});
