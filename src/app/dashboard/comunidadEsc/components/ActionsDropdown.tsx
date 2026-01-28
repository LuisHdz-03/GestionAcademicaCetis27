"use client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  HiEllipsisHorizontal,
  HiPencil,
  HiTrash,
} from "react-icons/hi2";
import { Docente, Alumno, Administrador } from "@/app/dashboard/comunidadEsc/page";

interface ActionsDropdownProps {
  item: Docente | Alumno | Administrador;
  onEdit: (item: Docente | Alumno | Administrador) => void;
  onDelete: (item: Docente | Alumno | Administrador) => void;
}

export default function ActionsDropdown({
  item,
  onEdit,
  onDelete,
}: ActionsDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <HiEllipsisHorizontal className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem
          onClick={() => onEdit(item)}
          className="flex items-center gap-2 cursor-pointer"
        >
          <HiPencil className="w-4 h-4" /> Editar
        </DropdownMenuItem>
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
