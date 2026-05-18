import { notFound } from "next/navigation";
import { cacheTag } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { WorkOrderDetailClient } from "./work-order-detail-client";

type WorkOrder = {
  id: string;
  sheet_number: number | null;
  location: string;
  requested_by: string | null;
  received_by: string | null;
  request_date: string | null;
  start_date: string | null;
  end_date: string | null;
  remit_number: string | null;
  description: string;
  total_labor: number;
  total_materials: number;
  grand_total: number;
  observations: string | null;
  upds_responsible: string | null;
  ramper_responsible: string | null;
  status: string;
  created_at: string;
};

type ItemRow = {
  id: string;
  description: string;
  unit: string | null;
  quantity: number | null;
  unit_price: number | null;
  total: number | null;
  item_type: "labor" | "material";
};

type Photo = {
  id: string;
  photo_type: string;
  url: string;
};

export type WorkOrderDetailData = {
  order: WorkOrder | null;
  items: ItemRow[];
  photos: Photo[];
};

async function getWorkOrderData(id: string, accessToken: string): Promise<WorkOrderDetailData> {
  "use cache";
  cacheTag(`work-order-${id}`);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    }
  );

  const [orderResult, itemsResult, photosResult] = await Promise.all([
    supabase.from("work_orders").select("*").eq("id", id).single(),
    supabase.from("work_order_items").select("*").eq("work_order_id", id),
    supabase.from("work_order_photos").select("*").eq("work_order_id", id),
  ]);

  return {
    order: (orderResult.data as WorkOrder | null) ?? null,
    items: (itemsResult.data as ItemRow[]) ?? [],
    photos: (photosResult.data as Photo[]) ?? [],
  };
}

export default async function WorkOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: { session } } = await supabase.auth.getSession();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user?.id ?? "")
    .maybeSingle();

  const data = await getWorkOrderData(id, session?.access_token ?? "");

  if (!data.order) notFound();

  return (
    <WorkOrderDetailClient
      id={id}
      initialData={data}
      userRole={(profile?.role as "worker" | "admin") ?? "worker"}
    />
  );
}
