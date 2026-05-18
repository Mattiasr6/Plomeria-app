import { cacheTag } from "next/cache";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { StatusBadge } from "@/components/StatusBadge";
import { startOrder } from "@/lib/actions/work-orders";

type WorkOrder = {
  id: string;
  location: string;
  description: string;
  status: string;
  sheet_number: number | null;
  grand_total?: number;
  created_at: string;
};

export default async function WorkOrderList({ accessToken, userId }: { accessToken: string; userId: string }) {
  "use cache";
  cacheTag("work-orders");

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
    .select("*")
    .eq("plumber_id", userId)
    .order("created_at", { ascending: false });

  if (!orders || orders.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
        <svg className="mx-auto mb-3 text-gray-300" xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
        <p className="text-gray-500">No hay órdenes de trabajo aún.</p>
        <Link
          href="/work-orders/new"
          className="mt-4 inline-block text-sm font-medium text-blue-600 hover:underline"
        >
          Crear la primera orden
        </Link>
      </div>
    );
  }

  const pending = orders.filter((o) => o.status === "pending");
  const inProgress = orders.filter((o) => o.status === "in_progress");
  const completed = orders.filter((o) => o.status === "completed");

  return (
    <div className="space-y-6">
      {/* Pending */}
      {pending.length > 0 && (
        <section>
          <h3 className="mb-3 text-sm font-semibold text-amber-800">
            Pendientes ({pending.length})
          </h3>
          <ul className="space-y-3">
            {pending.map((order) => (
              <li key={order.id}>
                <div className="rounded-2xl border bg-amber-50 p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-medium text-gray-900">
                        {order.location}
                      </h3>
                      <p className="mt-1 line-clamp-1 text-sm text-gray-500">
                        {order.description}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <StatusBadge status={order.status} />
                        {order.sheet_number && (
                          <span className="text-xs text-gray-400">
                            Planilla #{order.sheet_number}
                          </span>
                        )}
                        <span className="text-xs text-gray-400">
                          {new Date(order.created_at).toLocaleDateString("es-BO")}
                        </span>
                      </div>
                    </div>
                  </div>
                  <form action={startOrder.bind(null, order.id)} className="mt-3">
                    <button
                      type="submit"
                      className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-green-700"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="6 3 20 12 6 21 6 3"/></svg>
                      Empezar
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* In Progress */}
      {inProgress.length > 0 && (
        <section>
          <h3 className="mb-3 text-sm font-semibold text-blue-800">
            En Progreso ({inProgress.length})
          </h3>
          <ul className="space-y-3">
            {inProgress.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/work-orders/${order.id}`}
                  className="block rounded-2xl border bg-white p-4 shadow-sm transition hover:shadow-md"
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
                        <StatusBadge status={order.status} />
                        {order.sheet_number && (
                          <span className="text-xs text-gray-400">
                            Planilla #{order.sheet_number}
                          </span>
                        )}
                        <span className="text-xs text-gray-400">
                          {new Date(order.created_at).toLocaleDateString("es-BO")}
                        </span>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1 text-sm font-medium text-blue-600">
                      Ver
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Completed */}
      {completed.length > 0 && (
        <section>
          <h3 className="mb-3 text-sm font-semibold text-gray-600">
            Completadas ({completed.length})
          </h3>
          <ul className="space-y-3">
            {completed.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/work-orders/${order.id}`}
                  className="block rounded-2xl border bg-gray-50 p-4 shadow-sm transition hover:shadow-md"
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
                        <StatusBadge status={order.status} />
                        {order.sheet_number && (
                          <span className="text-xs text-gray-400">
                            Planilla #{order.sheet_number}
                          </span>
                        )}
                        <span className="text-xs text-gray-400">
                          {new Date(order.created_at).toLocaleDateString("es-BO")}
                        </span>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1 text-sm font-medium text-blue-600">
                      Ver
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
