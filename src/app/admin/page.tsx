import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { AdminHeader } from "./AdminHeader";
import { BottomNav } from "@/components/BottomNav";
import AllOrdersTable from "./all-orders-table";

export default async function AdminPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") redirect("/dashboard");

  const { data: { session } } = await supabase.auth.getSession();
  const accessToken = session?.access_token ?? "";

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader displayName={profile.full_name || ""} />
      <main className="mx-auto max-w-6xl px-4 py-6 pb-20">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            Todas las Órdenes de Trabajo
          </h2>
          <Link
            href="/work-orders/new"
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
            Nueva
          </Link>
        </div>
        <Suspense
          fallback={
            <div className="flex min-h-[200px] items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            </div>
          }
        >
          <AllOrdersTable accessToken={accessToken} />
        </Suspense>
      </main>
      <BottomNav isAdmin={true} />
    </div>
  );
}
