"use client";

import { useSupabase } from "@/components/SupabaseProvider";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const supabase = useSupabase();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then((response) => {
      const user = response.data.user;
      if (!user) router.replace("/auth/login");
      else setLoading(false);
    });
  }, [router, supabase]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
