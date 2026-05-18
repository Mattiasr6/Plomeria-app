import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { DashboardHeader } from "./DashboardHeader";
import { OrderListSkeleton } from "@/components/OrderListSkeleton";
import { BottomNav } from "@/components/BottomNav";
import WorkOrderList from "./work-order-list";

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .maybeSingle();

  const { data: { session } } = await supabase.auth.getSession();
  const accessToken = session?.access_token ?? "";

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader
        displayName={profile?.full_name || ""}
        isAdmin={profile?.role === "admin"}
      />
      <main className="mx-auto max-w-2xl px-4 py-6 pb-20">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            Órdenes de Trabajo
          </h2>
          <Link
            href="/work-orders/new"
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
            Nueva
          </Link>
        </div>
        <Suspense fallback={<OrderListSkeleton />}>
          <WorkOrderList accessToken={accessToken} userId={user.id} />
        </Suspense>
      </main>
      <BottomNav isAdmin={profile?.role === "admin"} />
    </div>
  );
}
