import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Shield,
  LogOut,
  FileText,
  Plus,
  User,
  Eye,
  Download,
  LayoutDashboard,
} from "lucide-react";
import { cacheLife, cacheTag } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { logout } from "@/lib/actions/auth";
import { OrderListSkeleton } from "@/components/OrderListSkeleton";
import { StatusBadge } from "@/components/StatusBadge";
import type { Database } from "@/lib/supabase/types";

import { AuthGuard } from "@/components/AuthGuard";
import { useSupabase } from "@/components/SupabaseProvider";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Download, Edit3, Eye, LayoutDashboard, LogOut, Shield, Wrench } from "lucide-react";
import { generateWorkOrderExcel } from "@/lib/export-excel";

type OrderWithProfile = WorkOrder & {
  profile: { full_name: string } | null;
};

export default async function AdminPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/dashboard");

  async function handleExport(id: string) {
    setExportingId(id);
    try {
      const { data: order } = await supabase
        .from("work_orders")
        .select("*")
        .eq("id", id)
        .single();

      if (!order) throw new Error("Orden no encontrada");

      const { data: items } = await supabase
        .from("work_order_items")
        .select("description, unit, quantity, unit_price, total")
        .eq("work_order_id", id);

      const blob = await generateWorkOrderExcel(order, items || []);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Planilla_${order.sheet_number || order.id.slice(0, 8)}.xlsx`;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setExportingId(null);
    }
  }

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
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-10 border-b bg-white shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Shield className="text-indigo-600" size={24} />
            <h1 className="text-lg font-bold text-gray-900">
              Panel de Administración
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-600 transition hover:bg-gray-200"
            >
              <LayoutDashboard size={16} />
              Mi Dashboard
            </Link>
            <span className="text-sm text-gray-500">
              {profile?.full_name || user.email}
            </span>
            <form action={logout}>
              <button
                type="submit"
                className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
              >
                <LogOut size={20} />
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            Todas las Órdenes de Trabajo
          </h2>
          <Link
            href="/work-orders/new"
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            <Plus size={18} />
            Nueva
          </Link>
        </div>



  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    }
  );

  const { data: orders } = await supabase
    .from("work_orders")
    .select("*, profile:plumber_id(full_name)")
    .order("created_at", { ascending: false });

  if (!orders || orders.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
        <FileText className="mx-auto mb-3 text-gray-300" size={48} />
        <p className="text-gray-500">
          No hay órdenes de trabajo registradas.
        </p>
      </div>
    );
  }

  const items = orders as unknown as OrderWithProfile[];

  return (
    <>
      <div className="mb-4 flex items-center gap-2">
        <span className="rounded-full bg-indigo-100 px-3 py-1 text-sm font-medium text-indigo-700">
          {items.length} órdenes
        </span>
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-2xl border bg-white shadow-sm md:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-500">
              <th className="px-5 py-3">Fecha</th>
              <th className="px-5 py-3">Trabajador</th>
              <th className="px-5 py-3">Ubicación</th>
              <th className="px-5 py-3">Estado</th>
              <th className="px-5 py-3">Total</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map((order) => (
              <tr key={order.id} className="transition hover:bg-gray-50">
                <td className="whitespace-nowrap px-5 py-4 text-gray-500">
                  {new Date(order.created_at).toLocaleDateString("es-BO")}
                </td>
                <td className="px-5 py-4 font-medium text-gray-900">
                  {order.profile?.full_name || "—"}
                </td>
                <td className="max-w-xs truncate px-5 py-4 text-gray-600">
                  {order.location}
                </td>
                <td className="px-5 py-4">
                  <StatusBadge status={order.status} />
                </td>
                <td className="px-5 py-4 font-medium text-gray-900">
                  Bs. {order.grand_total.toFixed(2)}
                </td>
                <td className="whitespace-nowrap px-5 py-4 text-right">
                  <Link
                    href={`/work-orders/${order.id}`}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700"
                  >
                    <Eye size={14} />
                    Ver
                  </Link>
                  <a
                    href={`/api/export/${order.id}`}
                    className="ml-2 inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-green-700"
                  >
                    <Download size={14} />
                    Excel
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {items.map((order) => (
          <div
            key={order.id}
            className="rounded-2xl border bg-white p-4 shadow-sm"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs text-gray-400">
                {new Date(order.created_at).toLocaleDateString("es-BO")}
              </span>
              <StatusBadge status={order.status} />
            </div>
            <p className="text-sm font-medium text-gray-900">
              {order.profile?.full_name || "—"}
            </p>
            <p className="mt-1 line-clamp-2 text-sm text-gray-500">
              {order.location}
            </p>
            <p className="mt-1 text-sm font-semibold text-gray-900">
              Bs. {order.grand_total.toFixed(2)}
            </p>
            <div className="mt-3 flex gap-2">
              <Link
                href={`/work-orders/${order.id}`}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
              >
                <Eye size={14} />
                Ver
              </Link>
              <a
                href={`/api/export/${order.id}`}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-green-700"
              >
                <Download size={14} />
                Excel
              </a>
            </div>
          </div>
        ))}
      </div>
    </>
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
                        <td className="whitespace-nowrap px-5 py-4 text-right">
                          {order.status === "pending" ? (
                            <button
                              onClick={() =>
                                router.push(`/work-orders/${order.id}`)
                              }
                              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700"
                            >
                              <Edit3 size={14} />
                              Completar
                            </button>
                          ) : (
                            <button
                              onClick={() =>
                                router.push(`/work-orders/${order.id}`)
                              }
                              className="inline-flex items-center gap-1.5 rounded-lg bg-gray-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-gray-600"
                            >
                              <Eye size={14} />
                              Ver
                            </button>
                          )}
                          <button
                            onClick={() => handleExport(order.id)}
                            disabled={exportingId === order.id}
                            className="ml-2 inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-green-700 disabled:opacity-50"
                          >
                            <Download size={14} />
                            {exportingId === order.id ? "..." : "Excel"}
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
                    <div className="mt-3 flex gap-2">
                      {order.status === "pending" ? (
                        <button
                          onClick={() =>
                            router.push(`/work-orders/${order.id}`)
                          }
                          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
                        >
                          <Edit3 size={14} />
                          Completar
                        </button>
                      ) : (
                        <button
                          onClick={() =>
                            router.push(`/work-orders/${order.id}`)
                          }
                          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-gray-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-gray-600"
                        >
                          <Eye size={14} />
                          Ver
                        </button>
                      )}
                      <button
                        onClick={() => handleExport(order.id)}
                        disabled={exportingId === order.id}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-green-700 disabled:opacity-50"
                      >
                        <Download size={14} />
                        {exportingId === order.id ? "..." : "Excel"}
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
