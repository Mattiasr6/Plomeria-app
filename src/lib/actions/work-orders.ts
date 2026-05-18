"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { revalidateTag } from "next/cache";

const CACHE_PROFILE = "minutes";

export async function startOrder(id: string) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const { error } = await supabase
    .from("work_orders")
    .update({ status: "in_progress" })
    .eq("id", id)
    .eq("plumber_id", user.id);

  if (error) throw new Error(error.message);

  revalidateTag("work-orders", CACHE_PROFILE);
}
