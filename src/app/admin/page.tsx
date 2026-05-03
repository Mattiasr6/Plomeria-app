import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Shield, LogOut, Wrench, FileText, Plus, User } from "lucide-react";
import { cacheLife, cacheTag } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { logout } from "@/lib/actions/auth";
import { OrderListSkeleton } from "@/components/OrderListSkeleton";
import { StatusBadge } from "@/components/StatusBadge";
import type { Database } from "@/lib/supabase/types";

type WorkOrder = Database["public"]["Tables"]["work_orders"]["Row"];

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

  const { data: { session } } = await supabase.auth.getSession();
  const accessToken = session?.access_token ?? "";

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-10 border-b bg-white shadow-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Shield className="text-indigo-600" size={24} />
            <h1 className="text-lg font-bold text-gray-900">
              Panel de Administración
            </h1>
          </div>
          <div className="flex items-center gap-3">
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

      <main className="mx-auto max-w-4xl px-4 py-6">
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

        <Suspense fallback={<OrderListSkeleton />}>
          <AdminOrderList accessToken={accessToken} />
        </Suspense>
      </main>
    </div>
  );
}

async function AdminOrderList({ accessToken }: { accessToken: string }) {
  "use cache";
  cacheTag("admin-orders");
  cacheLife("minutes");

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

  type OrderWithProfile = WorkOrder & {
    profile: { full_name: string } | null;
  };

  return (
    <ul className="space-y-3">
      {(orders as unknown as OrderWithProfile[]).map((order) => (
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
                  {order.profile?.full_name && (
                    <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                      <User size={12} />
                      {order.profile.full_name}
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
          </Link>
        </li>
      ))}
    </ul>
  );
}
