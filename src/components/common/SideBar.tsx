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
  HiQueueList,
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

interface SidebarProps {
  isMobile?: boolean;
  onNavigate?: () => void;
}

export default function Sidebar({
  isMobile = false,
  onNavigate,
}: SidebarProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const { user } = useAuth();
  const expanded = isMobile ? true : isExpanded;

  // Normalización de texto para roles y cargos
  const normalizarTexto = (texto: string) => {
    if (!texto) return "";
    return texto
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toUpperCase()
      .trim();
  };

  const tipoUsuario = normalizarTexto(
    user?.tipoUsuario || (user as any)?.rol || "",
  );
  const cargoUsuario = normalizarTexto(user?.cargo || "");

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

  const tienePermiso = (itemRoles: string[], itemCargos: string[] = []) => {
    if (tipoUsuario === "ADMINISTRATIVO" && cargoUsuario === "PREFECTO") {
      return itemRoles.includes("PREFECTO");
    }
    if (tipoUsuario === "ADMINISTRATIVO") {
      if (!itemRoles.includes("ADMINISTRATIVO")) return false;
      if (itemCargos.length === 0) return true;
      return itemCargos.includes(cargoUsuario);
    }
    return itemRoles.includes(tipoUsuario);
  };

  const menuItems = [
    {
      icon: HiHome,
      label: "Dashboard",
      href: "/dashboard",
      roles: ["ADMINISTRATIVO", "DIRECTIVO"],
      cargos: cargosDirectivos,
    },
    {
      icon: HiUsers,
      label: "Gestión Comunidad",
      href: "/dashboard/comunidadEsc",
      roles: ["ADMINISTRATIVO", "DIRECTIVO"],
      cargos: cargosAdministrativosGrales,
    },
    {
      icon: FaGraduationCap,
      label: "Materias",
      href: "/dashboard/materias",
      roles: ["ADMINISTRATIVO", "DIRECTIVO"],
      cargos: cargosAdministrativosGrales,
    },
    {
      icon: FaCheckCircle,
      label: "Horarios",
      href: "/dashboard/horarios",
      roles: ["ADMINISTRATIVO", "DIRECTIVO"],
      cargos: cargosAdministrativosGrales,
    },
    {
      icon: FaCheckCircle,
      label: "Espacios",
      href: "/dashboard/espacios",
      roles: ["ADMINISTRATIVO", "DIRECTIVO"],
      cargos: cargosAdministrativosGrales,
    },
    {
      icon: MdQrCodeScanner,
      label: "Escanear QR",
      href: "/dashboard/scan-qr",
      roles: ["PREFECTO"],
      cargos: cargosAdministrativosGrales,
    },
    {
      icon: HiClock,
      label: "Registros de Entrada",
      href: "/dashboard/registros",
      roles: ["ADMINISTRATIVO", "DIRECTIVO", "PREFECTO"],
      cargos: cargosAdministrativosGrales,
    },
    {
      icon: HiDocumentText,
      label: "Reportes",
      href: "/dashboard/reportes",
      roles: ["DOCENTE", "ADMINISTRATIVO", "DIRECTIVO", "PREFECTO"],
      cargos: cargosAdministrativosGrales,
    },
    {
      icon: HiQueueList,
      label: "Bitácora",
      href: "/dashboard/bitacora",
      roles: ["ADMINISTRATIVO", "DIRECTIVO"],
      cargos: cargosAdministrativosGrales,
    },
    {
      icon: HiClipboardDocumentCheck,
      label: "Mis Clases",
      href: "/dashboard/mis-clases",
      roles: ["DOCENTE"],
      cargos: [],
    },
  ];

  const itemsPermitidos = menuItems.filter((item) =>
    tienePermiso(item.roles, item.cargos),
  );

  return (
    <TooltipProvider>
      <div
        className={cn(
          "bg-[#691C32] border-r transition-all duration-300 ease-in-out z-40 flex flex-col",
          // CLASES CLAVE: sticky, top-0 y h-screen para que no se mueva al dar scroll
          "sticky top-0 h-screen",
          isMobile ? "w-72 max-w-[85vw]" : expanded ? "w-64" : "w-16",
        )}
      >
        {/* Cabecera del Sidebar */}
        <div className="flex items-center justify-between p-4 flex-shrink-0">
          {expanded && (
            <div className="flex items-center space-x-3 overflow-hidden">
              <div className="bg-white rounded-full min-w-[40px] h-10 flex items-center justify-center">
                <img
                  src="/images/logoCetis.png"
                  alt="Logo"
                  className="w-8 h-8 object-contain"
                />
              </div>
              <div className="min-w-0">
                <h2 className="font-semibold text-sm text-white truncate">
                  CETIS
                </h2>
                <p className="text-xs text-[#F2D7D5] truncate">
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
              "h-8 w-8 p-0 text-white hover:bg-[#50172A]",
              isMobile && "hidden",
            )}
          >
            {expanded ? (
              <HiChevronLeft size={20} />
            ) : (
              <HiChevronRight size={20} />
            )}
          </Button>
        </div>

        <Separator className="bg-[#F2D7D5]/20 flex-shrink-0" />

        {/* Navegación con scroll interno */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
          {itemsPermitidos.map((item, index) => {
            const Icon = item.icon;
            const menuButton = (
              <Button
                key={index}
                variant="ghost"
                asChild
                className={cn(
                  "w-full h-10 rounded-md transition-colors duration-150 text-white hover:bg-[#50172A]",
                  expanded ? "justify-start px-3" : "justify-center px-0",
                )}
              >
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  className="flex items-center w-full"
                >
                  <span className="h-5 w-5 flex items-center justify-center flex-shrink-0">
                    <Icon size={20} />
                  </span>
                  {expanded && (
                    <span className="ml-3 text-sm font-medium">
                      {item.label}
                    </span>
                  )}
                </Link>
              </Button>
            );

            return !expanded ? (
              <Tooltip key={index} delayDuration={0}>
                <TooltipTrigger asChild>{menuButton}</TooltipTrigger>
                <TooltipContent
                  side="right"
                  className="bg-[#691C32] text-white"
                >
                  {item.label}
                </TooltipContent>
              </Tooltip>
            ) : (
              menuButton
            );
          })}
        </nav>

        <Separator className="bg-[#F2D7D5]/20 flex-shrink-0" />

        {/* Perfil de Usuario al final */}
        <div className="p-4 flex-shrink-0">
          <div className="flex items-center space-x-3 rounded-md">
            <Avatar className="h-8 w-8 flex-shrink-0">
              <AvatarImage src={"/images/image.png"} />
              <AvatarFallback className="bg-[#F2D7D5] text-[#691C32]">
                {user?.nombre?.[0]}
                {user?.apellidoPaterno?.[0]}
              </AvatarFallback>
            </Avatar>

            {expanded && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user?.nombre} {user?.apellidoPaterno}
                </p>
                <p className="text-xs text-[#F2D7D5] truncate lowercase first-letter:uppercase">
                  {cargoUsuario || tipoUsuario}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
