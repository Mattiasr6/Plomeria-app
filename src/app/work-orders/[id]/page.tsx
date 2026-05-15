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
  Plus,
  Trash2,
  Save,
  Loader2,
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

interface ItemRow {
  id: string;
  description: string;
  unit: string | null;
  quantity: number | null;
  unit_price: number | null;
  total: number | null;
  item_type: "labor" | "material";
}

interface Photo {
  id: string;
  photo_type: string;
  url: string;
}

interface ItemInput {
  description: string;
  unit: string;
  quantity: number | null;
  unit_price: number | null;
  item_type: "labor" | "material";
}

export default function WorkOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();

  const [order, setOrder] = useState<WorkOrder | null>(null);
  const [savedItems, setSavedItems] = useState<ItemRow[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);

  const [pendingLabor, setPendingLabor] = useState<ItemInput[]>([
    { description: "", unit: "pza", quantity: null, unit_price: null, item_type: "labor" },
  ]);
  const [pendingMaterials, setPendingMaterials] = useState<ItemInput[]>([]);
  const [savingCosts, setSavingCosts] = useState(false);
  const [costError, setCostError] = useState("");

  useEffect(() => {
    async function load() {
      const { data: orderData } = await supabase
        .from("work_orders")
        .select("*")
        .eq("id", id)
        .single();

      if (orderData) {
        setOrder(orderData);

        const { data: items } = await supabase
          .from("work_order_items")
          .select("*")
          .eq("work_order_id", id);
        if (items) setSavedItems(items);

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

  const totalLabor = pendingLabor.reduce(
    (sum, item) => sum + (item.quantity || 0) * (item.unit_price || 0), 0
  );
  const totalMaterials = pendingMaterials.reduce(
    (sum, item) => sum + (item.quantity || 0) * (item.unit_price || 0), 0
  );
  const grandTotal = totalLabor + totalMaterials;

  function addLaborItem() {
    setPendingLabor([
      ...pendingLabor,
      { description: "", unit: "pza", quantity: null, unit_price: null, item_type: "labor" },
    ]);
  }

  function removeLaborItem(index: number) {
    setPendingLabor(pendingLabor.filter((_, i) => i !== index));
  }

  function updateLaborItem(index: number, field: keyof ItemInput, value: string | number | null) {
    const items = [...pendingLabor];
    items[index] = { ...items[index], [field]: value };
    setPendingLabor(items);
  }

  function addMaterialItem() {
    setPendingMaterials([
      ...pendingMaterials,
      { description: "", unit: "pza", quantity: null, unit_price: null, item_type: "material" },
    ]);
  }

  function removeMaterialItem(index: number) {
    setPendingMaterials(pendingMaterials.filter((_, i) => i !== index));
  }

  function updateMaterialItem(index: number, field: keyof ItemInput, value: string | number | null) {
    const items = [...pendingMaterials];
    items[index] = { ...items[index], [field]: value };
    setPendingMaterials(items);
  }

  async function handleComplete() {
    setCostError("");
    setSavingCosts(true);

    try {
      const allItems = [
        ...pendingLabor.filter((i) => i.description.trim()),
        ...pendingMaterials.filter((i) => i.description.trim()),
      ];

      const { error: insertError } = await supabase
        .from("work_order_items")
        .insert(
          allItems.map((item) => ({
            work_order_id: id,
            description: item.description,
            unit: item.unit,
            quantity: item.quantity || 0,
            unit_price: item.unit_price || 0,
            item_type: item.item_type,
          }))
        );

      if (insertError) throw insertError;

      const { error: updateError } = await supabase
        .from("work_orders")
        .update({
          total_labor: totalLabor,
          total_materials: totalMaterials,
          grand_total: grandTotal,
          status: "completed",
        })
        .eq("id", id);

      if (updateError) throw updateError;

      router.refresh();
    } catch (err) {
      setCostError(
        err instanceof Error ? err.message : "Error al completar la orden"
      );
    } finally {
      setSavingCosts(false);
    }
  }

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
  const isCompleted = order.status === "completed";

  const statusLabels: Record<string, string> = {
    pending: "Pendiente",
    in_progress: "En progreso",
    completed: "Completado",
  };

  const GeneralInfo = () => (
    <section className="rounded-2xl bg-white p-5 shadow-sm">
      <h2 className="mb-3 text-base font-semibold text-gray-900">
        Datos Generales
      </h2>
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <MapPin className="mt-0.5 text-gray-400" size={18} />
          <div>
            <p className="text-sm text-gray-500">Ubicación</p>
            <p className="text-sm font-medium text-gray-900">{order.location}</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <FileText className="mt-0.5 text-gray-400" size={18} />
          <div>
            <p className="text-sm text-gray-500">Descripción</p>
            <p className="text-sm font-medium text-gray-900">{order.description}</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Calendar className="mt-0.5 text-gray-400" size={18} />
          <div className="grid grid-cols-3 gap-4">
            {order.request_date && (
              <div>
                <p className="text-xs text-gray-500">Solicitud</p>
                <p className="text-sm font-medium">{order.request_date}</p>
              </div>
            )}
            {order.start_date && (
              <div>
                <p className="text-xs text-gray-500">Inicio</p>
                <p className="text-sm font-medium">{order.start_date}</p>
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
              <p className="text-sm font-medium">{order.remit_number}</p>
            </div>
          </div>
        )}
        <div className="flex items-start gap-3">
          <User className="mt-0.5 text-gray-400" size={18} />
          <div className="grid grid-cols-2 gap-4">
            {order.requested_by && (
              <div>
                <p className="text-xs text-gray-500">Solicitado por</p>
                <p className="text-sm font-medium">{order.requested_by}</p>
              </div>
            )}
            {order.received_by && (
              <div>
                <p className="text-xs text-gray-500">Recibido por</p>
                <p className="text-sm font-medium">{order.received_by}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );

  const SavedLaborItems = () => {
    const labor = savedItems.filter((i) => i.item_type === "labor");
    if (labor.length === 0) return null;
    return (
      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <Hammer className="text-blue-600" size={20} />
          <h2 className="text-base font-semibold text-gray-900">Mano de Obra</h2>
        </div>
        <div className="divide-y">
          {labor.map((item) => (
            <div key={item.id} className="flex items-center justify-between py-2 text-sm">
              <div>
                <p className="font-medium text-gray-900">{item.description}</p>
                <p className="text-xs text-gray-400">
                  {item.quantity} {item.unit} x Bs. {Number(item.unit_price).toFixed(2)}
                </p>
              </div>
              <p className="font-semibold text-gray-900">Bs. {Number(item.total).toFixed(2)}</p>
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between border-t pt-2 text-sm font-semibold text-gray-900">
          <span>Total Mano de Obra</span>
          <span>Bs. {order.total_labor.toFixed(2)}</span>
        </div>
      </section>
    );
  };

  const SavedMaterialItems = () => {
    const materials = savedItems.filter((i) => i.item_type === "material");
    if (materials.length === 0) return null;
    return (
      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <Wrench className="text-blue-600" size={20} />
          <h2 className="text-base font-semibold text-gray-900">Materiales</h2>
        </div>
        <div className="divide-y">
          {materials.map((item) => (
            <div key={item.id} className="flex items-center justify-between py-2 text-sm">
              <div>
                <p className="font-medium text-gray-900">{item.description}</p>
                <p className="text-xs text-gray-400">
                  {item.quantity} {item.unit} x Bs. {Number(item.unit_price).toFixed(2)}
                </p>
              </div>
              <p className="font-semibold text-gray-900">Bs. {Number(item.total).toFixed(2)}</p>
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between border-t pt-2 text-sm font-semibold text-gray-900">
          <span>Total Materiales</span>
          <span>Bs. {order.total_materials.toFixed(2)}</span>
        </div>
      </section>
    );
  };

  const LaborForm = () => (
    <section className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Hammer className="text-blue-600" size={20} />
          <h2 className="text-base font-semibold text-gray-900">Detalle Mano de Obra</h2>
        </div>
        <button
          type="button"
          onClick={addLaborItem}
          className="flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-600 transition hover:bg-blue-100"
        >
          <Plus size={16} />
          Agregar
        </button>
      </div>
      {pendingLabor.length === 0 && (
        <p className="text-sm text-gray-400">Agrega items de mano de obra</p>
      )}
      <div className="space-y-3">
        {pendingLabor.map((item, i) => (
          <div key={i} className="rounded-xl border bg-gray-50 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500">Item #{i + 1}</span>
              <button
                type="button"
                onClick={() => removeLaborItem(i)}
                className="text-gray-400 hover:text-red-500"
              >
                <Trash2 size={16} />
              </button>
            </div>
            <div className="space-y-2">
              <input
                type="text"
                value={item.description}
                onChange={(e) => updateLaborItem(i, "description", e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                placeholder="Descripción (ej: limpieza de sifón)"
              />
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs text-gray-500">Unidad</label>
                  <select
                    value={item.unit}
                    onChange={(e) => updateLaborItem(i, "unit", e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-2 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  >
                    <option value="pza">Pza</option>
                    <option value="m">Metro</option>
                    <option value="hr">Hora</option>
                    <option value="glb">Global</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500">Cantidad</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={item.quantity ?? ""}
                    onChange={(e) =>
                      updateLaborItem(i, "quantity", e.target.value ? Number(e.target.value) : null)
                    }
                    className="w-full rounded-lg border border-gray-300 px-2 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500">P. Unit. (Bs.)</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={item.unit_price ?? ""}
                    onChange={(e) =>
                      updateLaborItem(i, "unit_price", e.target.value ? Number(e.target.value) : null)
                    }
                    className="w-full rounded-lg border border-gray-300 px-2 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
              <div className="text-right text-sm font-medium text-gray-700">
                Total: Bs. {((item.quantity || 0) * (item.unit_price || 0)).toFixed(2)}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 border-t pt-3 text-right">
        <span className="text-sm font-semibold text-gray-900">
          Total Mano de Obra: Bs. {totalLabor.toFixed(2)}
        </span>
      </div>
    </section>
  );

  const MaterialForm = () => (
    <section className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wrench className="text-blue-600" size={20} />
          <h2 className="text-base font-semibold text-gray-900">Detalle Materiales</h2>
        </div>
        <button
          type="button"
          onClick={addMaterialItem}
          className="flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-600 transition hover:bg-blue-100"
        >
          <Plus size={16} />
          Agregar
        </button>
      </div>
      {pendingMaterials.length === 0 && (
        <p className="text-sm text-gray-400">Agrega materiales utilizados</p>
      )}
      <div className="space-y-3">
        {pendingMaterials.map((item, i) => (
          <div key={i} className="rounded-xl border bg-gray-50 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500">Material #{i + 1}</span>
              <button
                type="button"
                onClick={() => removeMaterialItem(i)}
                className="text-gray-400 hover:text-red-500"
              >
                <Trash2 size={16} />
              </button>
            </div>
            <div className="space-y-2">
              <input
                type="text"
                value={item.description}
                onChange={(e) => updateMaterialItem(i, "description", e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                placeholder="Descripción del material"
              />
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs text-gray-500">Unidad</label>
                  <select
                    value={item.unit}
                    onChange={(e) => updateMaterialItem(i, "unit", e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-2 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  >
                    <option value="pza">Pza</option>
                    <option value="m">Metro</option>
                    <option value="hr">Hora</option>
                    <option value="glb">Global</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500">Cantidad</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={item.quantity ?? ""}
                    onChange={(e) =>
                      updateMaterialItem(i, "quantity", e.target.value ? Number(e.target.value) : null)
                    }
                    className="w-full rounded-lg border border-gray-300 px-2 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500">P. Unit. (Bs.)</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={item.unit_price ?? ""}
                    onChange={(e) =>
                      updateMaterialItem(i, "unit_price", e.target.value ? Number(e.target.value) : null)
                    }
                    className="w-full rounded-lg border border-gray-300 px-2 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
              <div className="text-right text-sm font-medium text-gray-700">
                Total: Bs. {((item.quantity || 0) * (item.unit_price || 0)).toFixed(2)}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 border-t pt-3 text-right">
        <span className="text-sm font-semibold text-gray-900">
          Total Materiales: Bs. {totalMaterials.toFixed(2)}
        </span>
      </div>
    </section>
  );

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
              {isCompleted ? "Orden de Trabajo" : "Completar Orden"}
            </h1>
          </div>
        </header>

        <main className="mx-auto max-w-2xl space-y-4 px-4 py-6 pb-24">
          <div className="flex items-center justify-between">
            <StatusBadge status={order.status} />
            {order.sheet_number && (
              <span className="text-sm text-gray-400">Planilla #{order.sheet_number}</span>
            )}
          </div>

          <GeneralInfo />

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
                        <img
                          src={photo.url}
                          alt="Antes"
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
                        <img
                          src={photo.url}
                          alt="Después"
                          className="h-full w-full object-cover"
                        />
                      </a>
                    ))}
                  </div>
                </div>
              )}
                  <div>
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
                          <img src={photo.url} alt="Antes" className="h-full w-full object-cover" />
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
                          <img src={photo.url} alt="Después" className="h-full w-full object-cover" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {isCompleted ? (
            <>
              <SavedLaborItems />
              <SavedMaterialItems />

              <section className="rounded-2xl bg-blue-50 p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold text-gray-900">Total Global</h2>
                  <p className="text-2xl font-bold text-blue-700">
                    Bs. {order.grand_total.toFixed(2)}
                  </p>
                </div>
              </section>

              {order.observations && (
                <section className="rounded-2xl bg-white p-5 shadow-sm">
                  <h2 className="mb-2 text-base font-semibold text-gray-900">Observaciones</h2>
                  <p className="whitespace-pre-wrap text-sm text-gray-700">{order.observations}</p>
                </section>
              )}

              {(order.upds_responsible || order.ramper_responsible) && (
                <section className="rounded-2xl bg-white p-5 shadow-sm">
                  <div className="mb-3 flex items-center gap-2">
                    <Building2 className="text-blue-600" size={20} />
                    <h2 className="text-base font-semibold text-gray-900">Responsables</h2>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {order.upds_responsible && (
                      <div>
                        <p className="text-xs text-gray-500">Responsable UPDS</p>
                        <p className="text-sm font-medium text-gray-900">{order.upds_responsible}</p>
                      </div>
                    )}
                    {order.ramper_responsible && (
                      <div>
                        <p className="text-xs text-gray-500">Responsable RAMPER</p>
                        <p className="text-sm font-medium text-gray-900">{order.ramper_responsible}</p>
                      </div>
                    )}
                  </div>
                </section>
              )}

              <p className="text-center text-xs text-gray-400">
                Creado el {new Date(order.created_at).toLocaleString("es-BO")}
              </p>
            </>
          ) : (
            <>
              <LaborForm />
              <MaterialForm />

              <section className="rounded-2xl bg-blue-50 p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold text-gray-900">Total Global</h2>
                  <p className="text-2xl font-bold text-blue-700">
                    Bs. {grandTotal.toFixed(2)}
                  </p>
                </div>
                <div className="mt-2 flex justify-between text-sm text-gray-500">
                  <span>Mano de obra: Bs. {totalLabor.toFixed(2)}</span>
                  <span>Materiales: Bs. {totalMaterials.toFixed(2)}</span>
                </div>
              </section>

              {order.observations && (
                <section className="rounded-2xl bg-white p-5 shadow-sm">
                  <h2 className="mb-2 text-base font-semibold text-gray-900">Observaciones</h2>
                  <p className="whitespace-pre-wrap text-sm text-gray-700">{order.observations}</p>
                </section>
              )}

              {costError && (
                <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{costError}</div>
              )}

              <div className="sticky bottom-0 -mx-4 border-t bg-white px-4 py-4 shadow-lg">
                <button
                  type="button"
                  onClick={handleComplete}
                  disabled={savingCosts}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-base font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
                >
                  {savingCosts ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save size={20} />
                      Guardar y Completar Orden
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </main>
      </div>
    </AuthGuard>
  );
}
