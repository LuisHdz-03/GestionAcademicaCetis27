"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  HiEllipsisHorizontal,
  HiPencil,
  HiTrash,
  HiUserGroup,
} from "react-icons/hi2";
import { Docente, Alumno, Admin } from "@/types/community";
import DescargarCredencialButton from "@/components/common/credencial/DescargarCredencialButton";

interface ActionsDropdownProps {
  item: Docente | Alumno | Admin;
  onEdit: (item: Docente | Alumno | Admin) => void;
  onDelete: (item: Docente | Alumno | Admin) => void;
  onEditExtra?: (item: Docente | Alumno | Admin) => void;
  showEditExtra?: boolean;
}

export default function ActionsDropdown({
  item,
  onEdit,
  onDelete,
  onEditExtra,
  showEditExtra = false,
}: ActionsDropdownProps) {
  // Detectamos si es alumno
  const esAlumno = (item as any)?.matricula !== undefined;

  // Preparamos datos del alumno
  const getAlumnoData = () => {
    if (!esAlumno) return null;

    const alumno = item as Alumno;

    return {
      nombre: alumno.usuario?.nombre || "",
      apellidoPaterno: alumno.usuario?.apellidoPaterno || "",
      apellidoMaterno: alumno.usuario?.apellidoMaterno || "",
      curp: alumno.usuario?.curp || "",
      noControl: alumno.matricula,
      fotoUrl: alumno.fotoUrl,

      grupo:
        typeof alumno.grupo === "object"
          ? alumno.grupo?.nombre || ""
          : alumno.grupo || "",

      especialidad: alumno.especialidad || "",
      turno: (alumno as any).turno || "MATUTINO",

      emision: alumno.credencialFechaEmision || undefined,
      vigencia: alumno.credencialFechaExpiracion || undefined,
    };
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <HiEllipsisHorizontal className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        {/* EDITAR */}
        <DropdownMenuItem
          onClick={() => onEdit(item)}
          className="flex items-center gap-2 cursor-pointer"
        >
          <HiPencil className="w-4 h-4" /> Editar
        </DropdownMenuItem>

        {/* EDIT EXTRA */}
        {showEditExtra && onEditExtra && esAlumno && (
          <DropdownMenuItem
            onClick={() => onEditExtra(item)}
            className="flex items-center gap-2 cursor-pointer text-blue-600 focus:text-blue-600"
          >
            <HiUserGroup className="w-4 h-4" /> Editar info adicional
          </DropdownMenuItem>
        )}

        {/* CREDENCIAL */}
        {esAlumno && (
          <>
            <DropdownMenuSeparator />
            <div className="px-2 py-1">
              <DescargarCredencialButton alumno={getAlumnoData() as any} />
            </div>
          </>
        )}

        <DropdownMenuSeparator />

        {/* ELIMINAR */}
        <DropdownMenuItem
          onClick={() => onDelete(item)}
          className="flex items-center gap-2 cursor-pointer text-red-600 focus:text-red-600"
        >
          <HiTrash className="w-4 h-4" /> Eliminar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
