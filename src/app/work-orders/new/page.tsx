"use client";

import { AuthGuard } from "@/components/AuthGuard";
import { PhotoUpload } from "@/components/PhotoUpload";
import { ItemsSection } from "@/components/ItemsSection";
import { useSupabase } from "@/components/SupabaseProvider";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { revalidateAll } from "@/lib/actions/revalidate";
import {
  ArrowLeft,
  Save,
  Loader2,
  Wrench,
  Camera,
} from "lucide-react";

interface Photo {
  file: File;
  preview: string;
  type: "before" | "after";
  uploaded: boolean;
  url?: string;
}

const defaultLaborItem: LaborItem = {
  description: "",
  unit: "pza",
  quantity: null,
  unit_price: null,
};

const defaultMaterialItem: MaterialItem = {
  description: "",
  unit: "pza",
  quantity: null,
  unit_price: null,
};

export default function NewWorkOrderPage() {
  const router = useRouter();
  const supabase = useSupabase();

  const [saving, setSaving] = useState(false);
  const [photos, setPhotos] = useState<Photo[]>([]);

  const [error, setError] = useState("");

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

      const { data: order, error: rpcError } = await supabase.rpc(
        "create_work_order_transaction",
        {
          p_sheet_number: sheetNumber,
          p_location: location,
          p_requested_by: requestedBy || null,
          p_received_by: receivedBy || null,
          p_request_date: requestDate || null,
          p_start_date: startDate || null,
          p_end_date: endDate || null,
          p_remit_number: remitNumber || null,
          p_description: description,
          p_observations: observations || null,
          p_upds_responsible: updsResponsible || null,
          p_ramper_responsible: ramperResponsible || null,
          p_total_labor: 0,
          p_total_materials: 0,
          p_grand_total: 0,
          p_items: [],
          p_status: "pending",
        }
      );

      if (rpcError) throw rpcError;
      const orderId = order?.id || order;
      if (photos.length > 0) {
        const photoUrls = await uploadPhotos();
        const { error: photoError } = await supabase
          .from("work_order_photos")
          .insert(
            photos.map((photo, i) => ({
              work_order_id: orderId,
              photo_type: photo.type,
              url: photoUrls[i],
            }))
          );
        if (photoError) throw photoError;
      }


      router.push(`/work-orders/${orderId}`);
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
                    setSheetNumber(
                      e.target.value ? Number(e.target.value) : null
                    )
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

          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <Camera className="text-blue-600" size={20} />
              <h2 className="text-base font-semibold text-gray-900">
                Fotos Antes / Después
              </h2>
            </div>
            <PhotoUpload photos={photos} onChange={setPhotos} />
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
            <div role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

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
