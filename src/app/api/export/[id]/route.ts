import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  generateWorkOrderExcel,
  type ExportOrder,
  type ExportItem,
} from "@/lib/export-excel";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const { data: order, error } = await supabase
    .from("work_orders")
    .select("*, work_order_items(*)")
    .eq("id", id)
    .single();

  if (error || !order) {
    return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
  }

  const isOwner = order.plumber_id === user.id;
  const isAdmin = currentProfile?.role === "admin";
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "No tienes permiso" }, { status: 403 });
  }

  const exportOrder: ExportOrder = {
    sheet_number: order.sheet_number,
    location: order.location,
    requested_by: order.requested_by,
    received_by: order.received_by,
    request_date: order.request_date,
    start_date: order.start_date,
    end_date: order.end_date,
    remit_number: order.remit_number,
    description: order.description,
    total_labor: order.total_labor,
    total_materials: order.total_materials,
    grand_total: order.grand_total,
    observations: order.observations,
    upds_responsible: order.upds_responsible,
    ramper_responsible: order.ramper_responsible,
  };

  const items = (order as Record<string, unknown>)
    .work_order_items as Array<{
    description: string;
    unit: string | null;
    quantity: number | null;
    unit_price: number | null;
    total: number | null;
    item_type: string;
  }>;

  const exportItems: ExportItem[] = items.map((item) => ({
    description: item.description,
    unit: item.unit,
    quantity: item.quantity,
    unit_price: item.unit_price,
    total: item.total,
    item_type: item.item_type,
  }));

  const blob = await generateWorkOrderExcel(exportOrder, exportItems);
  const buffer = await blob.arrayBuffer();

  const filename = order.sheet_number
    ? `planilla-${order.sheet_number}.xlsx`
    : `orden-${order.id.slice(0, 8)}.xlsx`;

  return new NextResponse(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
