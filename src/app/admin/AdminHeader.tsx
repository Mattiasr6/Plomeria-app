"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Shield, LogOut, LayoutDashboard } from "lucide-react";
import { useSupabase } from "@/components/SupabaseProvider";

export function AdminHeader({
  displayName,
}: {
  displayName: string;
}) {
  const router = useRouter();
  const supabase = useSupabase();

  return (
    <header className="sticky top-0 z-10 border-b bg-white shadow-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <Shield className="text-blue-600" size={24} />
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
          <span className="text-sm text-gray-500">{displayName}</span>
          <button
            onClick={() => {
              supabase.auth.signOut().then(() => {
                router.push("/auth/login");
                router.refresh();
              });
            }}
            className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </header>
  );
}
