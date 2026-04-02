// components/GruposTable.tsx
"use client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";

interface Grupo {
  id?: number;
  codigo: string;
  semestre: number;
  turno?: string;
  aula?: string;
  idMaterias?: number[];
  integrantes: number;
}

interface Props {
  grupos: Grupo[];
  visibleColumns: string[];
  onEdit?: (grupo: Grupo) => void;
  onDelete?: (grupo: Grupo) => void;
}

export default function GruposTable({
  grupos,
  visibleColumns,
  onEdit,
  onDelete,
}: Props) {
  const handleAction = (action: string, grupo: Grupo) => {
    if (action === "Editar" && onEdit) {
      onEdit(grupo);
    } else if (action === "Eliminar" && onDelete) {
      onDelete(grupo);
    }
  };

  return (
    <div className="flex-1 overflow-hidden rounded-md border min-h-0">
      <div className="h-full overflow-auto">
        <Table>
          <TableHeader>
            <TableRow className="sticky top-0 bg-[#691C32]">
              {visibleColumns.includes("Código") && (
                <TableHead className="bg-[#691C32] text-white">
                  Código
                </TableHead>
              )}
              {visibleColumns.includes("Semestre") && (
                <TableHead className="bg-[#691C32] text-white">
                  Semestre
                </TableHead>
              )}
              {visibleColumns.includes("Turno") && (
                <TableHead className="bg-[#691C32] text-white">Turno</TableHead>
              )}
              {visibleColumns.includes("Aula") && (
                <TableHead className="bg-[#691C32] text-white">Aula</TableHead>
              )}
              {visibleColumns.includes("Materias") && (
                <TableHead className="bg-[#691C32] text-white">
                  Materias
                </TableHead>
              )}
              {visibleColumns.includes("Alumnos") && (
                <TableHead className="bg-[#691C32] text-white">
                  Alumnos
                </TableHead>
              )}
              <TableHead className="bg-[#691C32] text-white text-right">
                Acciones
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {grupos.map((grupo) => (
              <TableRow key={grupo.codigo}>
                {visibleColumns.includes("Código") && (
                  <TableCell>{grupo.codigo}</TableCell>
                )}
                {visibleColumns.includes("Semestre") && (
                  <TableCell>{grupo.semestre}</TableCell>
                )}
                {visibleColumns.includes("Turno") && (
                  <TableCell>{grupo.turno || "N/A"}</TableCell>
                )}
                {visibleColumns.includes("Aula") && (
                  <TableCell>{grupo.aula || "Sin aula"}</TableCell>
                )}
                {visibleColumns.includes("Materias") && (
                  <TableCell>{grupo.idMaterias?.length || 0}</TableCell>
                )}
                {visibleColumns.includes("Alumnos") && (
                  <TableCell>{grupo.integrantes}</TableCell>
                )}
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleAction("Editar", grupo)}
                      >
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleAction("Eliminar", grupo)}
                      >
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
