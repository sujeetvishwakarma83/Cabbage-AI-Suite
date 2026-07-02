import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — CabbageCode" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({ full_name: "", company: "", signature: "" });

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data } = await supabase.from("profiles").select("*").eq("id", u.user.id).single();
      if (data)
        setProfile({
          full_name: data.full_name ?? "",
          company: data.company ?? "",
          signature: data.signature ?? "",
        });
    })();
  }, []);

  async function save() {
    setLoading(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { error } = await supabase.from("profiles").update(profile).eq("id", u.user.id);
    setLoading(false);
    if (error) toast.error(error.message);
    else toast.success("Profile saved");
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Used to personalize AI-generated outreach.
        </p>
      </div>
      <div className="glass rounded-2xl p-6 space-y-4">
        <div>
          <Label>Full name</Label>
          <Input
            value={profile.full_name}
            onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
          />
        </div>
        <div>
          <Label>Company</Label>
          <Input
            value={profile.company}
            onChange={(e) => setProfile({ ...profile, company: e.target.value })}
          />
        </div>
        <div>
          <Label>Email signature</Label>
          <Textarea
            rows={5}
            value={profile.signature}
            onChange={(e) => setProfile({ ...profile, signature: e.target.value })}
            placeholder={"Jane Designer\nCabbageCode Studio\nhello@cabbagecode.io"}
          />
        </div>
        <Button onClick={save} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
        </Button>
      </div>
    </div>
  );
}
