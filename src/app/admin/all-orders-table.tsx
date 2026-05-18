import { cacheTag } from "next/cache";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { StatusBadge } from "@/components/StatusBadge";

type OrderWithProfile = {
  id: string;
  created_at: string;
  location: string;
  status: string;
  grand_total: number;
  profile: { full_name: string } | null;
};

export default async function AllOrdersTable({ accessToken }: { accessToken: string }) {
  "use cache";
  cacheTag("admin-orders");

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    }
  );
  const { data: orders } = await supabase
    .from("work_orders")
    .select("*, profile:plumber_id(full_name)")
    .order("created_at", { ascending: false });

  if (!orders || orders.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
        <svg className="mx-auto mb-3 text-gray-300" xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
        <p className="text-gray-500">
          No hay órdenes de trabajo registradas.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-4 flex items-center gap-2">
        <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
          {orders.length} órdenes
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
            {orders.map((order: OrderWithProfile) => (
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
                  {order.status === "pending" ? (
                    <>
                      <Link
                        href={`/work-orders/${order.id}`}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                        Completar
                      </Link>
                      <span
                        className="ml-2 inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white opacity-50 pointer-events-none cursor-not-allowed"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                        Excel
                      </span>
                    </>
                  ) : (
                    <>
                      <Link
                        href={`/work-orders/${order.id}`}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                        Ver
                      </Link>
                      <a
                        href={`/api/export/${order.id}`}
                        className="ml-2 inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-green-700"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                        Excel
                      </a>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {orders.map((order: OrderWithProfile) => (
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
              {order.status === "pending" ? (
                <>
                  <Link
                    href={`/work-orders/${order.id}`}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    Completar
                  </Link>
                  <span
                    className="flex items-center justify-center rounded-lg bg-green-600 px-2.5 py-2.5 text-white opacity-50 pointer-events-none cursor-not-allowed"
                    title="Excel"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  </span>
                </>
              ) : (
                <>
                  <Link
                    href={`/work-orders/${order.id}`}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                    Ver
                  </Link>
                  <a
                    href={`/api/export/${order.id}`}
                    className="flex items-center justify-center rounded-lg bg-green-600 px-2.5 py-2.5 text-white transition hover:bg-green-700"
                    title="Excel"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  </a>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
