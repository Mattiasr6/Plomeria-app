"use client";

import { useSupabase } from "@/components/SupabaseProvider";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogIn, UserPlus, Wrench } from "lucide-react";

type Mode = "login" | "register";

export function AuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const supabase = useSupabase();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "register") {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName, phone },
          },
        });
        if (signUpError) throw signUpError;
        router.push("/auth/login?registered=true");
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;

        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .single();

        if (profile?.role === "admin") {
          router.push("/admin");
        } else {
          router.push("/dashboard");
        }
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de autenticación");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-lg">
        {/* Branding */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-blue-100">
            <Wrench className="text-blue-600" size={28} />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Plomería</h1>
          <p className="text-sm text-gray-500">Sistema de Órdenes de Trabajo</p>
        </div>

        <h2 className="mb-2 text-lg font-bold text-gray-900">
          {mode === "login" ? "Iniciar Sesión" : "Registrarse"}
        </h2>
        <p className="mb-6 text-sm text-gray-500">
          {mode === "login"
            ? "Accede a tus órdenes de trabajo"
            : "Crea tu cuenta de plomero"}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Nombre completo
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  placeholder="Ej: Juan Pérez"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  placeholder="Ej: 77712345"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Correo electrónico
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              placeholder="plomero@ejemplo.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Contraseña
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : mode === "login" ? (
              <LogIn size={18} />
            ) : (
              <UserPlus size={18} />
            )}
            {mode === "login" ? "Entrar" : "Crear cuenta"}
          </button>
        </form>

        {mode === "login" && (
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={async () => {
                if (!email) {
                  setError("Ingresa tu correo electrónico primero");
                  return;
                }
                setError("");
                const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
                  redirectTo: `${window.location.origin}/auth/login`,
                });
                if (resetError) {
                  setError(resetError.message);
                } else {
                  setError("Correo de recuperación enviado. Revisa tu bandeja de entrada.");
                }
              }}
              className="text-sm text-gray-500 hover:text-blue-600 hover:underline bg-transparent border-none cursor-pointer"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>
        )}

        <div className="mt-6 text-center text-sm text-gray-500">
          {mode === "login" ? (
            <>
              ¿No tienes cuenta?{" "}
              <button
                onClick={() => { setMode("register"); setError(""); }}
                className="font-medium text-blue-600 hover:underline"
              >
                Registrarse
              </button>
            </>
          ) : (
            <>
              ¿Ya tienes cuenta?{" "}
              <button
                onClick={() => { setMode("login"); setError(""); }}
                className="font-medium text-blue-600 hover:underline"
              >
                Iniciar sesión
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
