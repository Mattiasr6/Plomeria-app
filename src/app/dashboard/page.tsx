"use client";

import { useSupabase } from "@/components/SupabaseProvider";
import { AuthGuard } from "@/components/AuthGuard";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Plus, FileText, LogOut, Wrench, Shield } from "lucide-react";
import type { Database } from "@/lib/supabase/types";

type WorkOrder = Database["public"]["Tables"]["work_orders"]["Row"];

export default function DashboardPage() {
  const router = useRouter();
  const supabase = useSupabase();
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [userName, setUserName] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then((response) => {
      const user = response.data.user;
      if (user) {
        setUserName(user.user_metadata?.full_name || user.email || "");
      }
    });

    supabase
      .from("profiles")
      .select("role")
      .single()
      .then(({ data }) => {
        if (data?.role === "admin") setIsAdmin(true);
      });

    supabase
      .from("work_orders")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data) setOrders(data);
      });
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

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <header className="sticky top-0 z-10 border-b bg-white shadow-sm">
          <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              <Wrench className="text-blue-600" size={24} />
              <h1 className="text-lg font-bold text-gray-900">Plomería</h1>
            </div>
            <div className="flex items-center gap-3">
              {isAdmin && (
                <button
                  onClick={() => router.push("/admin")}
                  className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-blue-700"
                >
                  <Shield size={16} />
                  Panel Admin
                </button>
              )}
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

        <main className="mx-auto max-w-2xl px-4 py-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Órdenes de Trabajo
            </h2>
            <button
              onClick={() => router.push("/work-orders/new")}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              <Plus size={18} />
              Nueva
            </button>
          </div>

          {orders.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
              <FileText className="mx-auto mb-3 text-gray-300" size={48} />
              <p className="text-gray-500">
                No hay órdenes de trabajo aún.
              </p>
              <button
                onClick={() => router.push("/work-orders/new")}
                className="mt-4 text-sm font-medium text-blue-600 hover:underline"
              >
                Crear la primera orden
              </button>
            </div>
          ) : (
            <ul className="space-y-3">
              {orders.map((order) => (
                <li
                  key={order.id}
                  onClick={() => router.push(`/work-orders/${order.id}`)}
                  className="cursor-pointer rounded-2xl border bg-white p-4 shadow-sm transition hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-medium text-gray-900">
                        {order.location}
                      </h3>
                      <p className="mt-1 line-clamp-1 text-sm text-gray-500">
                        {order.description}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[order.status] || statusColors.pending}`}
                        >
                          {statusLabels[order.status] || order.status}
                        </span>
                        {order.sheet_number && (
                          <span className="text-xs text-gray-400">
                            Planilla #{order.sheet_number}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">
                        Bs. {order.grand_total.toFixed(2)}
                      </p>
                      <p className="mt-1 text-xs text-gray-400">
                        {new Date(order.created_at).toLocaleDateString("es-BO")}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </main>
      </div>
    </AuthGuard>
  );
}
