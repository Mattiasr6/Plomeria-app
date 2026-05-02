"use client";

import { AuthGuard } from "@/components/AuthGuard";
import { useSupabase } from "@/components/SupabaseProvider";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Eye, LayoutDashboard, LogOut, Shield, Wrench } from "lucide-react";

interface AdminWorkOrder {
  id: string;
  description: string;
  status: string;
  created_at: string;
  profiles: { full_name: string } | null;
}

export default function AdminPage() {
  const router = useRouter();
  const supabase = useSupabase();
  const [orders, setOrders] = useState<AdminWorkOrder[]>([]);
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (user) {
        setUserName(user.user_metadata?.full_name || user.email || "");
      }

      const { data } = await supabase
        .from("work_orders")
        .select("id, description, status, created_at, profiles!inner(full_name)")
        .order("created_at", { ascending: false });

      if (data) setOrders(data as unknown as AdminWorkOrder[]);
      setLoading(false);
    }
    load();
  }, [supabase]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  }

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    in_progress: "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800",
  };
  const statusLabels: Record<string, string> = {
    pending: "Pendiente",
    in_progress: "En progreso",
    completed: "Completado",
  };

  if (loading) {
    return (
      <AuthGuard>
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <header className="sticky top-0 z-10 border-b bg-white shadow-sm">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              <Shield className="text-blue-600" size={24} />
              <h1 className="text-lg font-bold text-gray-900">
                Panel de Administración
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push("/dashboard")}
                className="flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-600 transition hover:bg-gray-200"
              >
                <LayoutDashboard size={16} />
                Mi Dashboard
              </button>
              <span className="text-sm text-gray-500">{userName}</span>
              <button
                onClick={handleLogout}
                className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Todas las Órdenes de Trabajo
            </h2>
            <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
              {orders.length} órdenes
            </span>
          </div>

          {orders.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
              <Wrench className="mx-auto mb-3 text-gray-300" size={48} />
              <p className="text-gray-500">
                No hay órdenes de trabajo registradas.
              </p>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden overflow-hidden rounded-2xl border bg-white shadow-sm md:block">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-500">
                      <th className="px-5 py-3">Fecha</th>
                      <th className="px-5 py-3">Trabajador</th>
                      <th className="px-5 py-3">Tarea Realizada</th>
                      <th className="px-5 py-3">Estado</th>
                      <th className="px-5 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {orders.map((order) => (
                      <tr
                        key={order.id}
                        className="transition hover:bg-gray-50"
                      >
                        <td className="whitespace-nowrap px-5 py-4 text-gray-500">
                          {new Date(order.created_at).toLocaleDateString(
                            "es-BO"
                          )}
                        </td>
                        <td className="px-5 py-4 font-medium text-gray-900">
                          {order.profiles?.full_name || "—"}
                        </td>
                        <td className="max-w-xs truncate px-5 py-4 text-gray-600">
                          {order.description}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[order.status] || statusColors.pending}`}
                          >
                            {statusLabels[order.status] || order.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() =>
                              router.push(`/work-orders/${order.id}`)
                            }
                            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700"
                          >
                            <Eye size={14} />
                            Ver Orden
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="space-y-3 md:hidden">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="rounded-2xl border bg-white p-4 shadow-sm"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs text-gray-400">
                        {new Date(order.created_at).toLocaleDateString("es-BO")}
                      </span>
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[order.status] || statusColors.pending}`}
                      >
                        {statusLabels[order.status] || order.status}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-900">
                      {order.profiles?.full_name || "—"}
                    </p>
                    <p className="mt-1 line-clamp-2 text-sm text-gray-500">
                      {order.description}
                    </p>
                    <div className="mt-3">
                      <button
                        onClick={() =>
                          router.push(`/work-orders/${order.id}`)
                        }
                        className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
                      >
                        <Eye size={14} />
                        Ver Orden
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </main>
      </div>
    </AuthGuard>
  );
}
