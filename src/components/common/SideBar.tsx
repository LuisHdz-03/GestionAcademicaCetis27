"use client";
import { useState } from "react";
import {
  HiHome,
  HiUsers,
  HiChevronLeft,
  HiChevronRight,
  HiClock,
  HiDocumentText,
  HiClipboardDocumentCheck,
} from "react-icons/hi2";
import { FaGraduationCap, FaCheckCircle } from "react-icons/fa";
import { MdQrCodeScanner } from "react-icons/md";
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
import Link from "next/link";

export default function Sidebar() {
  const [isExpanded, setIsExpanded] = useState(true);
  const { user } = useAuth();

  // 1. Función para normalizar texto (limpiar acentos)
  const normalizarTexto = (texto: string) => {
    if (!texto) return "";
    return texto
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toUpperCase()
      .trim();
  };

  // 2. Extraer rol y cargo real de la base de datos
  const tipoUsuario = normalizarTexto(
    user?.tipoUsuario || (user as any)?.rol || "",
  );
  const cargoUsuario = normalizarTexto(user?.cargo || "");

  // 3. Agrupamos los cargos para no repetir código
  const cargosDirectivos = [
    "DIRECTOR",
    "SUBDIRECTORA ACADEMICA",
    "COORDINADOR",
    "COORDINADOR ACADEMICO",
  ];

  const cargosAdministrativosGrales = [
    ...cargosDirectivos,
    "JEFE DE DEPARTAMENTO",
    "SECRETARIO",
  ];

  // 4. Validador de permisos
  const tienePermiso = (itemRoles: string[], itemCargos: string[] = []) => {
    // Si es DOCENTE y la opción permite docentes, pasa directo.
    if (tipoUsuario === "DOCENTE" && itemRoles.includes("DOCENTE")) {
      return true;
    }
    // Si es ADMINISTRATIVO, comprobamos que su cargo esté autorizado para esa opción.
    if (tipoUsuario === "ADMINISTRATIVO" && itemCargos.includes(cargoUsuario)) {
      return true;
    }
    return false;
  };

  // 5. Configuración exacta de Módulos
  const menuItems = [
    {
      icon: HiHome,
      label: "Dashboard",
      href: "/dashboard",
      roles: ["ADMINISTRATIVO"],
      cargos: cargosDirectivos,
    },
    {
      icon: HiUsers,
      label: "Gestión Comunidad",
      href: "/dashboard/comunidadEsc",
      roles: ["ADMINISTRATIVO"],
      cargos: cargosAdministrativosGrales,
    },
    {
      icon: FaGraduationCap,
      label: "Materias",
      href: "/dashboard/materias",
      roles: ["ADMINISTRATIVO"],
      cargos: cargosAdministrativosGrales,
    },
    {
      icon: FaCheckCircle,
      label: "Horarios",
      href: "/dashboard/horarios",
      roles: ["ADMINISTRATIVO"],
      cargos: cargosAdministrativosGrales,
    },
    {
      icon: MdQrCodeScanner,
      label: "Escanear QR",
      href: "/dashboard/scan-qr",
      roles: ["ADMINISTRATIVO"],
      cargos: ["PREFECTO"],
    },
    {
      icon: HiClock,
      label: "Registros de Entrada",
      href: "/dashboard/registros",
      roles: ["ADMINISTRATIVO"],
      cargos: ["PREFECTO", ...cargosAdministrativosGrales],
    },
    {
      icon: HiDocumentText,
      label: "Reportes",
      href: "/dashboard/reportes",
      roles: ["DOCENTE", "ADMINISTRATIVO"],
      cargos: cargosAdministrativosGrales,
    },
    {
      icon: HiClipboardDocumentCheck,
      label: "Mis Clases",
      href: "/dashboard/mis-clases",
      roles: ["DOCENTE"],
      cargos: [],
    },
    {
      icon: HiClipboardDocumentCheck,
      label: "Pase de lista",
      href: "/dashboard/paseLista",
      roles: ["DOCENTE"],
      cargos: [],
    },
  ];

  const itemsPermitidos = menuItems.filter((item) =>
    tienePermiso(item.roles, item.cargos),
  );

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
          >
            {isExpanded ? (
              <HiChevronLeft size={20} />
            ) : (
              <HiChevronRight size={20} />
            )}
          </Button>
        </div>

        <Separator className="border-[#F2D7D5]" />

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
                <Link
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
                </Link>
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
                  {cargoUsuario || tipoUsuario || "Rol no definido"}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
