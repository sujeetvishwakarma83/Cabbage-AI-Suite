import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const Input = z.object({
  messageId: z.string().uuid(),
  from: z.string().email().optional(),
  to: z.string().email().optional(),
});

export const sendOutreachEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data, context }) => {
    const { data: msg } = await context.supabase
      .from("outreach_messages")
      .select("*,leads!inner(*)")
      .eq("id", data.messageId)
      .single();
    if (!msg) throw new Error("Message not found");
    if (msg.channel !== "email") throw new Error("Only email channel can be auto-sent");

    const to = data.to ?? msg.leads.email;
    if (!to) throw new Error("No recipient email available for this lead");

    await context.supabase
      .from("outreach_messages")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
      })
      .eq("id", msg.id);

    await context.supabase
      .from("leads")
      .update({
        status: "sent",
        last_contacted_at: new Date().toISOString(),
      })
      .eq("id", msg.leads.id);

    return { ok: true };
  });
