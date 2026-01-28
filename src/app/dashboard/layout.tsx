"use client";

import { useAuth } from "@/contexts/AuthContext";
import Sidebar from "@/components/common/SideBar";
import DashboardHeader from "@/components/common/DashboardHeader";
import ProtectedRoute from "@/components/common/ProtectedRoute";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-[#691C32] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando usuario...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // ProtectedRoute se encargará de redirigir
  }

  const usuario = {
    nombreCompleto: `${user.nombre} ${user.apellidoPaterno} ${user.apellidoMaterno || ""}`.trim(),
    tipoUsuario: "Usuario: " + user.tipoUsuario,
  };

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <DashboardHeader
            nombreUsuario={usuario.nombreCompleto}
            tipoUsuario={usuario.tipoUsuario}
            avatarUrl="/images/image.png"
          />
          <main className="flex-1 overflow-auto p-6">{children}</main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
