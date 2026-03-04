"use client";
import { useState } from "react";
import {
  HiHome,
  HiUsers,
  HiChevronLeft,
  HiChevronRight,
  HiClock,
  HiDocumentText,
} from "react-icons/hi2";
import { FaGraduationCap, FaCheckCircle } from "react-icons/fa";
import { MdQrCodeScanner } from "react-icons/md"; // <-- Nuevo ícono importado
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

export default function Sidebar() {
  const [isExpanded, setIsExpanded] = useState(true);
  const { user } = useAuth();

  // Menú de navegación dinámico basado en el tipo de usuario
  const menuItems = [
    {
      icon: HiHome,
      label: "Dashboard",
      href: "/dashboard",
      roles: ["admin", "administrativo"],
    },
    {
      icon: HiUsers,
      label: "Gestión Comunidad Escolar",
      href: "/dashboard/comunidadEsc",
      roles: ["admin", "administrativo"],
    },
    {
      icon: FaGraduationCap,
      label: "Materias",
      href: "/dashboard/materias",
      roles: ["admin", "administrativo"],
    },
    {
      icon: FaCheckCircle,
      label: "Horarios",
      href: "/dashboard/horarios",
      roles: ["admin", "administrativo"],
    },
    {
      icon: MdQrCodeScanner,
      label: "Escanear QR",
      href: "/dashboard/scan-qr",
      roles: ["guardia", "admin"],
    },
    {
      icon: HiClock,
      label: "Registros de Entrada",
      href: "/dashboard/registros",
      roles: ["admin", "administrativo", "guardia"],
    },
    {
      icon: HiDocumentText,
      label: "Reportes",
      href: "/dashboard/reportes",
      roles: ["admin", "administrativo", "docente"],
    },
  ];

  // 👇 AQUÍ ESTÁ LA MAGIA DEL FILTRADO DE ROLES 👇
  // Solo pasamos los items donde el arreglo "roles" incluya el rol del usuario logueado.
  const itemsPermitidos = menuItems.filter((item) => {
    // Nota: Asegúrate de que en tu BD el rol se llame 'rol' o 'role', y ajústalo aquí si es necesario.
    const rolUsuario = user?.rol?.toLowerCase() || user?.role?.toLowerCase();
    return rolUsuario && item.roles.includes(rolUsuario);
  });

  const sidebarBgClass = "bg-[#691C32]";
  const hoverBgClass = "hover:bg-[#50172A]";
  const textClass = "text-white";
  const mutedTextClass = "text-[#F2D7D5]";

  return (
    <TooltipProvider>
      <div
        className={cn(
          sidebarBgClass,
          "border-r h-screen flex flex-col transition-all duration-300 ease-in-out",
          isExpanded ? "w-64" : "w-16",
        )}
      >
        {/* Header con botón de expansión */}
        <div className="flex items-center justify-between p-4">
          {isExpanded && (
            <div className="flex items-center space-x-3">
              <div className="bg-white rounded-full w-10 h-10 flex items-center justify-center">
                <img
                  src="/images/logoCetis.png"
                  alt="Logo"
                  className="w-8 h-8 object-contain"
                />
              </div>
              <div>
                <h2 className={cn("font-semibold text-sm", textClass)}>
                  CETIS
                </h2>
                <p className={cn("text-xs", mutedTextClass)}>
                  Gestión Académica
                </p>
              </div>
            </div>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className={cn(
              "h-8 w-8 p-0 rounded-md transition-colors duration-150 flex items-center justify-center",
              textClass,
              hoverBgClass,
            )}
            aria-label={isExpanded ? "Contraer sidebar" : "Expandir sidebar"}
          >
            {isExpanded ? (
              <HiChevronLeft size={20} />
            ) : (
              <HiChevronRight size={20} />
            )}
          </Button>
        </div>

        <Separator className="border-[#F2D7D5]" />

        {/* Menu Items (Usando la lista filtrada) */}
        <nav className="flex-1 p-3 space-y-1">
          {itemsPermitidos.map((item, index) => {
            const Icon = item.icon;

            const menuButton = (
              <Button
                key={index}
                variant="ghost"
                asChild
                className={cn(
                  "w-full h-10 rounded-md transition-colors duration-150",
                  isExpanded ? "justify-start px-3" : "justify-center px-0",
                  textClass,
                  hoverBgClass,
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20",
                )}
              >
                <a
                  href={item.href}
                  className={cn(
                    "flex items-center w-full",
                    !isExpanded && "justify-center",
                  )}
                >
                  <span className="h-5 w-5 flex items-center justify-center flex-shrink-0">
                    <Icon size={20} />
                  </span>
                  {isExpanded && (
                    <span className="ml-3 text-sm font-medium transition-all duration-150">
                      {item.label}
                    </span>
                  )}
                </a>
              </Button>
            );

            if (!isExpanded) {
              return (
                <Tooltip key={index} delayDuration={0}>
                  <TooltipTrigger asChild>{menuButton}</TooltipTrigger>
                  <TooltipContent
                    side="right"
                    className="bg-[#691C32] text-white rounded-md shadow-lg px-2 py-1"
                  >
                    <p className="text-sm">{item.label}</p>
                  </TooltipContent>
                </Tooltip>
              );
            }

            return menuButton;
          })}
        </nav>

        <Separator className="border-[#F2D7D5]" />

        {/* Footer con usuario */}
        <div className="p-4">
          <div
            className={cn(
              "flex items-center space-x-3 rounded-md transition-colors duration-150",
            )}
          >
            <Avatar className="h-8 w-8">
              <AvatarImage src={"/images/image.png"} />
              <AvatarFallback className="bg-[#F2D7D5] text-[#691C32]">
                {user?.nombre?.[0] || "U"}
                {user?.apellidoPaterno?.[0] || "A"}
              </AvatarFallback>
            </Avatar>

            {isExpanded && (
              <div className="flex-1 min-w-0">
                <p className={cn("text-sm font-medium truncate", textClass)}>
                  {user?.nombre || "Usuario"} {user?.apellidoPaterno || ""}
                </p>
                <p className={cn("text-xs truncate", mutedTextClass)}>
                  {user?.email || "demo@example.com"}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
