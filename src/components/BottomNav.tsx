"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Plus, Shield } from "lucide-react";

export function BottomNav({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname();

  const items = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      show: true,
    },
    {
      href: "/work-orders/new",
      label: "Nueva",
      icon: Plus,
      show: true,
    },
    {
      href: "/admin",
      label: "Admin",
      icon: Shield,
      show: isAdmin,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white shadow-lg">
      <div className="mx-auto flex max-w-lg justify-around py-2">
        {items
          .filter((item) => item.show)
          .map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-0.5 px-4 py-1 text-xs font-medium transition ${
                  isActive ? "text-blue-600" : "text-gray-400 hover:text-gray-600"
                }`}
              >
                <item.icon size={22} />
                {item.label}
              </Link>
            );
          })}
      </div>
    </nav>
  );
}
