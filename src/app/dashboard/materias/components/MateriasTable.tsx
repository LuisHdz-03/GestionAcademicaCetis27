// components/MateriasTable.tsx
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

interface Materia {
  id?: number;
  nombre: string;
  codigo: string;
  totalHoras: number;
  semestre: number;
}

interface Props {
  materias: Materia[];
  visibleColumns: string[];
  onEdit?: (materia: Materia) => void;
  onDelete?: (materia: Materia) => void;
}

export default function MateriasTable({
  materias,
  visibleColumns,
  onEdit,
  onDelete,
}: Props) {
  const handleAction = (action: string, materia: Materia) => {
    if (action === "Editar" && onEdit) {
      onEdit(materia);
    } else if (action === "Eliminar" && onDelete) {
      onDelete(materia);
    }
  };

  return (
    <div className="flex-1 overflow-hidden rounded-md border min-h-0">
      <div className="h-full overflow-auto">
        <Table>
          <TableHeader>
            <TableRow className="sticky top-0 bg-[#691C32]">
              {visibleColumns.includes("Nombre") && (
                <TableHead className="bg-[#691C32] text-white">
                  Nombre
                </TableHead>
              )}
              {visibleColumns.includes("Código") && (
                <TableHead className="bg-[#691C32] text-white">
                  Código
                </TableHead>
              )}
              {visibleColumns.includes("Total de horas") && (
                <TableHead className="bg-[#691C32] text-white">
                  Total de horas
                </TableHead>
              )}
              {visibleColumns.includes("Semestre") && (
                <TableHead className="bg-[#691C32] text-white">
                  Semestre
                </TableHead>
              )}
              <TableHead className="bg-[#691C32] text-white text-right">
                Acciones
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {/* Aquí agregamos el 'index' para usarlo como respaldo de la key */}
            {materias.map((materia, index) => (
              <TableRow key={materia.id || `materia-${index}`}>
                {visibleColumns.includes("Nombre") && (
                  <TableCell>{materia.nombre}</TableCell>
                )}
                {visibleColumns.includes("Código") && (
                  <TableCell>{materia.codigo}</TableCell>
                )}
                {visibleColumns.includes("Total de horas") && (
                  <TableCell>{materia.totalHoras}</TableCell>
                )}
                {visibleColumns.includes("Semestre") && (
                  <TableCell>{materia.semestre}</TableCell>
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
                        onClick={() => handleAction("Editar", materia)}
                      >
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleAction("Eliminar", materia)}
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
