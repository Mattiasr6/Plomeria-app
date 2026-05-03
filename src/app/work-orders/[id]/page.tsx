"use client";

import Image from "next/image";
import { AuthGuard } from "@/components/AuthGuard";
import { createClient } from "@/lib/supabase/client";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Camera,
  Hammer,
  Wrench,
  MapPin,
  Calendar,
  FileText,
  User,
  Building2,
} from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";

interface WorkOrder {
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
}

interface LaborItem {
  id: string;
  description: string;
  unit: string | null;
  quantity: number | null;
  unit_price: number | null;
  total: number | null;
}

interface MaterialItem {
  id: string;
  description: string;
  unit: string | null;
  quantity: number | null;
  unit_price: number | null;
  total: number | null;
}

interface Photo {
  id: string;
  photo_type: string;
  url: string;
}

export default function WorkOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();

  const [order, setOrder] = useState<WorkOrder | null>(null);
  const [laborItems, setLaborItems] = useState<LaborItem[]>([]);
  const [materialItems, setMaterialItems] = useState<MaterialItem[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: orderData } = await supabase
        .from("work_orders")
        .select("*")
        .eq("id", id)
        .single();

      if (orderData) {
        setOrder(orderData);

        const { data: labor } = await supabase
          .from("work_order_labor_items")
          .select("*")
          .eq("work_order_id", id);
        if (labor) setLaborItems(labor);

        const { data: materials } = await supabase
          .from("work_order_material_items")
          .select("*")
          .eq("work_order_id", id);
        if (materials) setMaterialItems(materials);

        const { data: photoData } = await supabase
          .from("work_order_photos")
          .select("*")
          .eq("work_order_id", id);
        if (photoData) setPhotos(photoData);
      }

      setLoading(false);
    }
    load();
  }, [id, supabase]);

  if (loading) {
    return (
      <AuthGuard>
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      </AuthGuard>
    );
  }

  if (!order) {
    return (
      <AuthGuard>
        <div className="flex min-h-screen items-center justify-center p-4">
          <p className="text-gray-500">Orden no encontrada</p>
        </div>
      </AuthGuard>
    );
  }

  const beforePhotos = photos.filter((p) => p.photo_type === "before");
  const afterPhotos = photos.filter((p) => p.photo_type === "after");

  const statusLabels: Record<string, string> = {
    pending: "Pendiente",
    in_progress: "En progreso",
    completed: "Completado",
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <header className="sticky top-0 z-10 border-b bg-white shadow-sm">
          <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
            <button
              onClick={() => router.back()}
              className="rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
            >
              <ArrowLeft size={22} />
            </button>
            <FileText className="text-blue-600" size={22} />
            <h1 className="text-lg font-bold text-gray-900">
              Orden de Trabajo
            </h1>
          </div>
        </header>

        <main className="mx-auto max-w-2xl space-y-4 px-4 py-6 pb-24">
          {/* Status */}
          <div className="flex items-center justify-between">
            <StatusBadge status={order.status} />
            {order.sheet_number && (
              <span className="text-sm text-gray-400">
                Planilla #{order.sheet_number}
              </span>
            )}
          </div>

          {/* Datos Generales */}
          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-base font-semibold text-gray-900">
              Datos Generales
            </h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 text-gray-400" size={18} />
                <div>
                  <p className="text-sm text-gray-500">Ubicación</p>
                  <p className="text-sm font-medium text-gray-900">
                    {order.location}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <FileText className="mt-0.5 text-gray-400" size={18} />
                <div>
                  <p className="text-sm text-gray-500">Descripción</p>
                  <p className="text-sm font-medium text-gray-900">
                    {order.description}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="mt-0.5 text-gray-400" size={18} />
                <div className="grid grid-cols-3 gap-4">
                  {order.request_date && (
                    <div>
                      <p className="text-xs text-gray-500">Solicitud</p>
                      <p className="text-sm font-medium">
                        {order.request_date}
                      </p>
                    </div>
                  )}
                  {order.start_date && (
                    <div>
                      <p className="text-xs text-gray-500">Inicio</p>
                      <p className="text-sm font-medium">
                        {order.start_date}
                      </p>
                    </div>
                  )}
                  {order.end_date && (
                    <div>
                      <p className="text-xs text-gray-500">Fin</p>
                      <p className="text-sm font-medium">{order.end_date}</p>
                    </div>
                  )}
                </div>
              </div>
              {order.remit_number && (
                <div className="flex items-start gap-3">
                  <FileText className="mt-0.5 text-gray-400" size={18} />
                  <div>
                    <p className="text-sm text-gray-500">Remito N°</p>
                    <p className="text-sm font-medium">
                      {order.remit_number}
                    </p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3">
                <User className="mt-0.5 text-gray-400" size={18} />
                <div className="grid grid-cols-2 gap-4">
                  {order.requested_by && (
                    <div>
                      <p className="text-xs text-gray-500">Solicitado por</p>
                      <p className="text-sm font-medium">
                        {order.requested_by}
                      </p>
                    </div>
                  )}
                  {order.received_by && (
                    <div>
                      <p className="text-xs text-gray-500">Recibido por</p>
                      <p className="text-sm font-medium">
                        {order.received_by}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Fotos */}
          {(beforePhotos.length > 0 || afterPhotos.length > 0) && (
            <section className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <Camera className="text-blue-600" size={20} />
                <h2 className="text-base font-semibold text-gray-900">Fotos</h2>
              </div>
              {beforePhotos.length > 0 && (
                <div className="mb-3">
                  <p className="mb-2 text-xs font-medium text-gray-500">Antes</p>
                  <div className="flex flex-wrap gap-2">
                    {beforePhotos.map((photo) => (
                      <a
                        key={photo.id}
                        href={photo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block h-24 w-24 overflow-hidden rounded-lg border"
                      >
                        <Image
                          src={photo.url}
                          alt={`Foto antes del trabajo - ${order.location}`}
                          width={96}
                          height={96}
                          className="h-full w-full object-cover"
                        />
                      </a>
                    ))}
                  </div>
                </div>
              )}
              {afterPhotos.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-medium text-gray-500">Después</p>
                  <div className="flex flex-wrap gap-2">
                    {afterPhotos.map((photo) => (
                      <a
                        key={photo.id}
                        href={photo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block h-24 w-24 overflow-hidden rounded-lg border"
                      >
                        <Image
                          src={photo.url}
                          alt={`Foto después del trabajo - ${order.location}`}
                          width={96}
                          height={96}
                          className="h-full w-full object-cover"
                        />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Mano de Obra */}
          {laborItems.length > 0 && (
            <section className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <Hammer className="text-blue-600" size={20} />
                <h2 className="text-base font-semibold text-gray-900">
                  Mano de Obra
                </h2>
              </div>
              <div className="divide-y">
                {laborItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between py-2 text-sm"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {item.description}
                      </p>
                      <p className="text-xs text-gray-400">
                        {item.quantity} {item.unit} x Bs.{" "}
                        {Number(item.unit_price).toFixed(2)}
                      </p>
                    </div>
                    <p className="font-semibold text-gray-900">
                      Bs. {Number(item.total).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-2 flex justify-between border-t pt-2 text-sm font-semibold text-gray-900">
                <span>Total Mano de Obra</span>
                <span>Bs. {order.total_labor.toFixed(2)}</span>
              </div>
            </section>
          )}

          {/* Materiales */}
          {materialItems.length > 0 && (
            <section className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <Wrench className="text-blue-600" size={20} />
                <h2 className="text-base font-semibold text-gray-900">
                  Materiales
                </h2>
              </div>
              <div className="divide-y">
                {materialItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between py-2 text-sm"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {item.description}
                      </p>
                      <p className="text-xs text-gray-400">
                        {item.quantity} {item.unit} x Bs.{" "}
                        {Number(item.unit_price).toFixed(2)}
                      </p>
                    </div>
                    <p className="font-semibold text-gray-900">
                      Bs. {Number(item.total).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-2 flex justify-between border-t pt-2 text-sm font-semibold text-gray-900">
                <span>Total Materiales</span>
                <span>Bs. {order.total_materials.toFixed(2)}</span>
              </div>
            </section>
          )}

          {/* Total Global */}
          <section className="rounded-2xl bg-blue-50 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900">
                Total Global
              </h2>
              <p className="text-2xl font-bold text-blue-700">
                Bs. {order.grand_total.toFixed(2)}
              </p>
            </div>
          </section>

          {/* Observaciones */}
          {order.observations && (
            <section className="rounded-2xl bg-white p-5 shadow-sm">
              <h2 className="mb-2 text-base font-semibold text-gray-900">
                Observaciones
              </h2>
              <p className="whitespace-pre-wrap text-sm text-gray-700">
                {order.observations}
              </p>
            </section>
          )}

          {/* Responsables */}
          {(order.upds_responsible || order.ramper_responsible) && (
            <section className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <Building2 className="text-blue-600" size={20} />
                <h2 className="text-base font-semibold text-gray-900">
                  Responsables
                </h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {order.upds_responsible && (
                  <div>
                    <p className="text-xs text-gray-500">
                      Responsable UPDS
                    </p>
                    <p className="text-sm font-medium text-gray-900">
                      {order.upds_responsible}
                    </p>
                  </div>
                )}
                {order.ramper_responsible && (
                  <div>
                    <p className="text-xs text-gray-500">
                      Responsable RAMPER
                    </p>
                    <p className="text-sm font-medium text-gray-900">
                      {order.ramper_responsible}
                    </p>
                  </div>
                )}
              </div>
            </section>
          )}

          <p className="text-center text-xs text-gray-400">
            Creado el{" "}
            {new Date(order.created_at).toLocaleString("es-BO")}
          </p>
        </main>
      </div>
    </AuthGuard>
  );
}
