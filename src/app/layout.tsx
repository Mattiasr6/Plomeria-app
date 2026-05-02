import type { Metadata } from "next";
import "./globals.css";
import { SupabaseProvider } from "@/components/SupabaseProvider";

export const metadata: Metadata = {
  title: "Plomería — Órdenes de Trabajo",
  description: "Sistema de registro de trabajos de plomería",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-gray-50 antialiased">
        <SupabaseProvider>{children}</SupabaseProvider>
      </body>
    </html>
  );
}
