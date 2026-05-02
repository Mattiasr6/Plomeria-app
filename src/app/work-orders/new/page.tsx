"use client";

import { AuthGuard } from "@/components/AuthGuard";
import { PhotoUpload } from "@/components/PhotoUpload";
import { useSupabase } from "@/components/SupabaseProvider";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Loader2,
  Wrench,
  Camera,
  Hammer,
} from "lucide-react";

interface LaborItem {
  description: string;
  unit: string;
  quantity: number | null;
  unit_price: number | null;
}

interface MaterialItem {
  description: string;
  unit: string;
  quantity: number | null;
  unit_price: number | null;
}

interface Photo {
  file: File;
  preview: string;
  type: "before" | "after";
  uploaded: boolean;
  url?: string;
}

export default function NewWorkOrderPage() {
  const router = useRouter();
  const supabase = useSupabase();

  const [saving, setSaving] = useState(false);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [laborItems, setLaborItems] = useState<LaborItem[]>([
    { description: "", unit: "pza", quantity: null, unit_price: null },
  ]);
  const [materialItems, setMaterialItems] = useState<MaterialItem[]>([]);
  const [error, setError] = useState("");

  // Main fields
  const [location, setLocation] = useState("");
  const [sheetNumber, setSheetNumber] = useState<number | null>(null);
  const [requestedBy, setRequestedBy] = useState("");
  const [receivedBy, setReceivedBy] = useState("");
  const [requestDate, setRequestDate] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [remitNumber, setRemitNumber] = useState("");
  const [description, setDescription] = useState("");
  const [observations, setObservations] = useState("");
  const [updsResponsible, setUpdsResponsible] = useState("");
  const [ramperResponsible, setRamperResponsible] = useState("");

  // Calculated totals
  const totalLabor = laborItems.reduce(
    (sum, item) => sum + (item.quantity || 0) * (item.unit_price || 0),
    0
  );
  const totalMaterials = materialItems.reduce(
    (sum, item) => sum + (item.quantity || 0) * (item.unit_price || 0),
    0
  );
  const grandTotal = totalLabor + totalMaterials;

  function addLaborItem() {
    setLaborItems([
      ...laborItems,
      { description: "", unit: "pza", quantity: null, unit_price: null },
    ]);
  }

  function removeLaborItem(index: number) {
    setLaborItems(laborItems.filter((_, i) => i !== index));
  }

  function updateLaborItem(
    index: number,
    field: keyof LaborItem,
    value: string | number | null
  ) {
    const items = [...laborItems];
    items[index] = { ...items[index], [field]: value };
    setLaborItems(items);
  }

  function addMaterialItem() {
    setMaterialItems([
      ...materialItems,
      { description: "", unit: "pza", quantity: null, unit_price: null },
    ]);
  }

  function removeMaterialItem(index: number) {
    setMaterialItems(materialItems.filter((_, i) => i !== index));
  }

  function updateMaterialItem(
    index: number,
    field: keyof MaterialItem,
    value: string | number | null
  ) {
    const items = [...materialItems];
    items[index] = { ...items[index], [field]: value };
    setMaterialItems(items);
  }

  async function uploadPhotos(): Promise<string[]> {
    const urls: string[] = [];
    for (const photo of photos) {
      const ext = photo.file.name.split(".").pop() || "jpg";
      const fileName = `${crypto.randomUUID()}.${ext}`;
      const filePath = `${photo.type === "before" ? "antes" : "despues"}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("work-photos")
        .upload(filePath, photo.file, {
          contentType: photo.file.type,
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("work-photos")
        .getPublicUrl(filePath);

      urls.push(urlData.publicUrl);
    }
    return urls;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      // 1. Create work order
      const { data: order, error: orderError } = await supabase
        .from("work_orders")
        .insert({
          plumber_id: user.id,
          sheet_number: sheetNumber,
          location,
          requested_by: requestedBy,
          received_by: receivedBy,
          request_date: requestDate || null,
          start_date: startDate || null,
          end_date: endDate || null,
          remit_number: remitNumber || null,
          description,
          total_labor: totalLabor,
          total_materials: totalMaterials,
          grand_total: grandTotal,
          observations: observations || null,
          upds_responsible: updsResponsible || null,
          ramper_responsible: ramperResponsible || null,
          status: "pending",
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // 2. Insert labor items
      const validLabor = laborItems.filter((item) => item.description.trim());
      if (validLabor.length > 0) {
        const { error: laborError } = await supabase
          .from("work_order_labor_items")
          .insert(
            validLabor.map((item) => ({
              work_order_id: order.id,
              description: item.description,
              unit: item.unit || "pza",
              quantity: item.quantity || 0,
              unit_price: item.unit_price || 0,
            }))
          );
        if (laborError) throw laborError;
      }

      // 3. Insert material items
      const validMaterials = materialItems.filter((item) => item.description.trim());
      if (validMaterials.length > 0) {
        const { error: materialError } = await supabase
          .from("work_order_material_items")
          .insert(
            validMaterials.map((item) => ({
              work_order_id: order.id,
              description: item.description,
              unit: item.unit || "pza",
              quantity: item.quantity || 0,
              unit_price: item.unit_price || 0,
            }))
          );
        if (materialError) throw materialError;
      }

      // 4. Upload photos & save URLs
      if (photos.length > 0) {
        const photoUrls = await uploadPhotos();
        const { error: photoError } = await supabase
          .from("work_order_photos")
          .insert(
            photos.map((photo, i) => ({
              work_order_id: order.id,
              photo_type: photo.type,
              url: photoUrls[i],
            }))
          );
        if (photoError) throw photoError;
      }

      router.push(`/work-orders/${order.id}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al guardar la orden"
      );
    } finally {
      setSaving(false);
    }
  }

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
            <Wrench className="text-blue-600" size={22} />
            <h1 className="text-lg font-bold text-gray-900">
              Nueva Orden de Trabajo
            </h1>
          </div>
        </header>

        <form
          onSubmit={handleSubmit}
          className="mx-auto max-w-2xl space-y-6 px-4 py-6 pb-24"
        >
          {/* === DATOS GENERALES === */}
          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-gray-900">
              Datos Generales
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  N° de Planilla
                </label>
                <input
                  type="number"
                  value={sheetNumber ?? ""}
                  onChange={(e) =>
                    setSheetNumber(e.target.value ? Number(e.target.value) : null)
                  }
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
                  placeholder="Ej: 30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Ubicación *
                </label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
                  placeholder="Ej: Universidad Privada Domingo Savio"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Solicitado por
                  </label>
                  <input
                    type="text"
                    value={requestedBy}
                    onChange={(e) => setRequestedBy(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
                    placeholder="Ej: Daniel Aranibar"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Recibido por
                  </label>
                  <input
                    type="text"
                    value={receivedBy}
                    onChange={(e) => setReceivedBy(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
                    placeholder="Ej: Dario Ramos"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Fecha solicitud
                  </label>
                  <input
                    type="date"
                    value={requestDate}
                    onChange={(e) => setRequestDate(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Fecha inicio
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Fecha fin
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  N° de Remito
                </label>
                <input
                  type="text"
                  value={remitNumber}
                  onChange={(e) => setRemitNumber(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
                  placeholder="Ej: 30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Descripción del trabajo a realizar *
                </label>
                <textarea
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
                  placeholder='Ej: Piso "A" bloque medio baño Damas'
                />
              </div>
            </div>
          </section>

          {/* === FOTOS === */}
          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <Camera className="text-blue-600" size={20} />
              <h2 className="text-base font-semibold text-gray-900">
                Fotos Antes / Después
              </h2>
            </div>
            <PhotoUpload photos={photos} onChange={setPhotos} />
          </section>

          {/* === MANO DE OBRA === */}
          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Hammer className="text-blue-600" size={20} />
                <h2 className="text-base font-semibold text-gray-900">
                  Detalle Mano de Obra
                </h2>
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

            {laborItems.length === 0 && (
              <p className="text-sm text-gray-400">
                Agrega items de mano de obra
              </p>
            )}

            <div className="space-y-3">
              {laborItems.map((item, i) => (
                <div key={i} className="rounded-xl border bg-gray-50 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500">
                      Item #{i + 1}
                    </span>
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
                      onChange={(e) =>
                        updateLaborItem(i, "description", e.target.value)
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      placeholder="Descripción (ej: limpieza de sifón)"
                    />
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-xs text-gray-500">
                          Unidad
                        </label>
                        <select
                          value={item.unit}
                          onChange={(e) =>
                            updateLaborItem(i, "unit", e.target.value)
                          }
                          className="w-full rounded-lg border border-gray-300 px-2 py-2 text-sm focus:border-blue-500 focus:outline-none"
                        >
                          <option value="pza">Pza</option>
                          <option value="m">Metro</option>
                          <option value="hr">Hora</option>
                          <option value="glb">Global</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500">
                          Cantidad
                        </label>
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={item.quantity ?? ""}
                          onChange={(e) =>
                            updateLaborItem(
                              i,
                              "quantity",
                              e.target.value ? Number(e.target.value) : null
                            )
                          }
                          className="w-full rounded-lg border border-gray-300 px-2 py-2 text-sm focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500">
                          P. Unit. (Bs.)
                        </label>
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={item.unit_price ?? ""}
                          onChange={(e) =>
                            updateLaborItem(
                              i,
                              "unit_price",
                              e.target.value ? Number(e.target.value) : null
                            )
                          }
                          className="w-full rounded-lg border border-gray-300 px-2 py-2 text-sm focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="text-right text-sm font-medium text-gray-700">
                      Total: Bs.{" "}
                      {(
                        (item.quantity || 0) * (item.unit_price || 0)
                      ).toFixed(2)}
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

          {/* === MATERIALES === */}
          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wrench className="text-blue-600" size={20} />
                <h2 className="text-base font-semibold text-gray-900">
                  Detalle Materiales
                </h2>
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

            {materialItems.length === 0 && (
              <p className="text-sm text-gray-400">
                Agrega materiales utilizados
              </p>
            )}

            <div className="space-y-3">
              {materialItems.map((item, i) => (
                <div key={i} className="rounded-xl border bg-gray-50 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500">
                      Material #{i + 1}
                    </span>
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
                      onChange={(e) =>
                        updateMaterialItem(i, "description", e.target.value)
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      placeholder="Descripción del material"
                    />
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-xs text-gray-500">
                          Unidad
                        </label>
                        <select
                          value={item.unit}
                          onChange={(e) =>
                            updateMaterialItem(i, "unit", e.target.value)
                          }
                          className="w-full rounded-lg border border-gray-300 px-2 py-2 text-sm focus:border-blue-500 focus:outline-none"
                        >
                          <option value="pza">Pza</option>
                          <option value="m">Metro</option>
                          <option value="hr">Hora</option>
                          <option value="glb">Global</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500">
                          Cantidad
                        </label>
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={item.quantity ?? ""}
                          onChange={(e) =>
                            updateMaterialItem(
                              i,
                              "quantity",
                              e.target.value ? Number(e.target.value) : null
                            )
                          }
                          className="w-full rounded-lg border border-gray-300 px-2 py-2 text-sm focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500">
                          P. Unit. (Bs.)
                        </label>
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={item.unit_price ?? ""}
                          onChange={(e) =>
                            updateMaterialItem(
                              i,
                              "unit_price",
                              e.target.value ? Number(e.target.value) : null
                            )
                          }
                          className="w-full rounded-lg border border-gray-300 px-2 py-2 text-sm focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="text-right text-sm font-medium text-gray-700">
                      Total: Bs.{" "}
                      {(
                        (item.quantity || 0) * (item.unit_price || 0)
                      ).toFixed(2)}
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

          {/* === TOTAL GLOBAL === */}
          <section className="rounded-2xl bg-blue-50 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900">
                Total Global
              </h2>
              <p className="text-2xl font-bold text-blue-700">
                Bs. {grandTotal.toFixed(2)}
              </p>
            </div>
            <div className="mt-2 flex justify-between text-sm text-gray-500">
              <span>Mano de obra: Bs. {totalLabor.toFixed(2)}</span>
              <span>Materiales: Bs. {totalMaterials.toFixed(2)}</span>
            </div>
          </section>

          {/* === OBSERVACIONES === */}
          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-base font-semibold text-gray-900">
              Observaciones
            </h2>
            <textarea
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
              placeholder="Notas adicionales..."
            />
          </section>

          {/* === RESPONSABLES === */}
          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-gray-900">
              Responsables
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Responsable UPDS
                </label>
                <input
                  type="text"
                  value={updsResponsible}
                  onChange={(e) => setUpdsResponsible(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
                  placeholder="Ej: Daniel Aranibar"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Responsable RAMPER
                </label>
                <input
                  type="text"
                  value={ramperResponsible}
                  onChange={(e) => setRamperResponsible(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
                  placeholder="Ej: Dario Ramos"
                />
              </div>
            </div>
          </section>

          {error && (
            <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* === BOTÓN GUARDAR (sticky bottom) === */}
          <div className="sticky bottom-0 -mx-4 border-t bg-white px-4 py-4 shadow-lg">
            <button
              type="submit"
              disabled={saving}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-base font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Guardando...
                </>
              ) : (
                <>
                  <Save size={20} />
                  Guardar Orden de Trabajo
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </AuthGuard>
  );
}
