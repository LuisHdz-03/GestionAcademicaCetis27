"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  rolesPermitidos?: string[];
}

export default function ProtectedRoute({
  children,
  rolesPermitidos,
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push("/auth/login");
        return;
      }

      if (rolesPermitidos && rolesPermitidos.length > 0) {
        const rolUsuario = String(
          user?.tipoUsuario || (user as any)?.rol || "",
        ).toUpperCase();
        const rolesNormalizados = rolesPermitidos.map((r) => r.toUpperCase());

        if (!rolesNormalizados.includes(rolUsuario)) {
          router.replace("/dashboard");
        }
      }
    }
  }, [user, isLoading, router, rolesPermitidos]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-[#691C32] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (rolesPermitidos && rolesPermitidos.length > 0) {
    const rolUsuario = String(
      user?.tipoUsuario || (user as any)?.rol || "",
    ).toUpperCase();
    const rolesNormalizados = rolesPermitidos.map((r) => r.toUpperCase());
    if (!rolesNormalizados.includes(rolUsuario)) {
      return null;
    }
  }

  return <>{children}</>;
}
