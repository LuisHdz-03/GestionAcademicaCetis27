"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Sidebar from "@/components/common/SideBar";
import DashboardHeader from "@/components/common/DashboardHeader";
import ProtectedRoute from "@/components/common/ProtectedRoute";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

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
    nombreCompleto:
      `${user.nombre} ${user.apellidoPaterno} ${user.apellidoMaterno || ""}`.trim(),
    tipoUsuario: "Usuario: " + user.tipoUsuario,
  };

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-gray-50">
        <div className="hidden lg:flex">
          <Sidebar />
        </div>

        {mobileSidebarOpen && (
          <div
            className="fixed inset-0 z-40 flex lg:hidden"
            role="dialog"
            aria-modal="true"
          >
            <button
              type="button"
              className="absolute inset-0 bg-black/50"
              aria-label="Cerrar menú"
              onClick={() => setMobileSidebarOpen(false)}
            />
            <div className="relative z-50">
              <Sidebar
                isMobile
                onNavigate={() => setMobileSidebarOpen(false)}
              />
            </div>
          </div>
        )}

        <div className="flex-1 flex min-w-0 flex-col overflow-hidden">
          <DashboardHeader
            nombreUsuario={usuario.nombreCompleto}
            tipoUsuario={usuario.tipoUsuario}
            avatarUrl="/images/image.png"
            onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
          />
          <main className="flex-1 overflow-auto p-3 sm:p-4 lg:p-6">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
