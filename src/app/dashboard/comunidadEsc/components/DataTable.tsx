"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import ActionsDropdown from "./ActionsDropdown";
import { Docente, Alumno, Admin } from "@/types/community";

// Tipo base que garantiza que todos tengan id
interface BaseItem {
  id?: number;
  idEstudiante?: number;
  idDocente?: number;
  idAdministrativo?: number;
  idUsuario?: number;
  usuario?: {
    nombre?: string;
    apellidoPaterno?: string;
    apellidoMaterno?: string;
    email?: string;
    telefono?: string;
  };
}

interface DataTableProps {
  activeTab: string;
  data: (Docente | Alumno | Admin)[];
  handleEdit: (item: Docente | Alumno | Admin) => void;
  handleDelete: (item: Docente | Alumno | Admin) => void;
  handleEditExtra?: (item: Docente | Alumno | Admin) => void;
  visibleColumns: string[];
}

export default function DataTable({
  activeTab,
  data,
  handleEdit,
  handleDelete,
  handleEditExtra,
  visibleColumns,
}: DataTableProps) {
  const getStableItemId = (item: BaseItem) =>
    item.idEstudiante ||
    item.idDocente ||
    item.idAdministrativo ||
    item.idUsuario ||
    item.id ||
    0;

  const allColumns = () => {
    switch (activeTab) {
      case "docentes":
        return ["Nombre", "Email", "Teléfono", "Especialidad", "N° Empleado"];
      case "alumnos":
        return [
          "Nombre",
          "Email",
          "Matrícula",
          "Especialidad",
          "Semestre",
          "Grupo",
        ];
      case "administradores":
        return ["Nombre", "Email", "Cargo", "N° Empleado"];
      default:
        return [];
    }
  };

  const renderCell = (column: string, item: Docente | Alumno | Admin) => {
    const cellKey = `${getStableItemId(item as BaseItem)}-${column}`;
    const usuario = (item as BaseItem).usuario;
    const nombreCompleto = usuario
      ? `${usuario.nombre || ""} ${usuario.apellidoPaterno || ""} ${usuario.apellidoMaterno || ""}`.trim()
      : "";

    switch (column) {
      case "Nombre":
        return <TableCell key={cellKey}>{nombreCompleto}</TableCell>;
      case "Email":
        return <TableCell key={cellKey}>{usuario?.email || ""}</TableCell>;
      case "Teléfono":
        return <TableCell key={cellKey}>{usuario?.telefono || ""}</TableCell>;
      case "Especialidad":
        if ("especialidad" in item) {
          return <TableCell key={cellKey}>{item.especialidad}</TableCell>;
        }
        return <TableCell key={cellKey}></TableCell>;
      case "N° Empleado":
        return (
          <TableCell key={cellKey}>
            {"numeroEmpleado" in item ? item.numeroEmpleado : ""}
          </TableCell>
        );
      case "Matrícula":
        return (
          <TableCell key={cellKey}>
            {(item as Alumno).matricula || ""}
          </TableCell>
        );
      case "Semestre":
        if ("semestre" in item) {
          return <TableCell key={cellKey}>{(item as any).semestre}°</TableCell>;
        }
        return <TableCell key={cellKey}></TableCell>;
      case "Cargo":
        return (
          <TableCell key={cellKey}>{(item as Admin).cargo || ""}</TableCell>
        );

      case "Grupo": {
        const grupoDato = (item as Alumno).grupo;

        const nombreGrupo =
          typeof grupoDato === "object" && grupoDato !== null
            ? (grupoDato as any).nombre
            : grupoDato;

        return (
          <TableCell key={cellKey}>{nombreGrupo || "Sin grupo"}</TableCell>
        );
      }
      default:
        return null;
    }
  };

  return (
    <div className="overflow-hidden rounded-md border">
      <div className="h-full overflow-auto">
        <Table className="min-w-[860px]">
          <TableHeader className="sticky top-0 z-10">
            <TableRow className="hover:bg-[#691C32]">
              {allColumns()
                .filter((col) => visibleColumns.includes(col))
                .map((col) => (
                  <TableHead
                    key={col}
                    className="bg-[#691C32] text-white whitespace-nowrap"
                  >
                    {col}
                  </TableHead>
                ))}
              <TableHead className="bg-[#691C32] text-white text-center whitespace-nowrap">
                Acciones
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {data.length === 0 ? (
              <TableRow key="no-results-row">
                <TableCell
                  colSpan={allColumns().length + 1}
                  className="text-center py-12 text-gray-500"
                >
                  No se encontraron resultados
                </TableCell>
              </TableRow>
            ) : (
              data.map((item) => (
                <TableRow
                  key={`${getStableItemId(item as BaseItem)}-${(item as BaseItem).usuario?.email || ""}`}
                >
                  {allColumns()
                    .filter((col) => visibleColumns.includes(col))
                    .map((col) => renderCell(col, item))}
                  <TableCell className="text-center whitespace-nowrap">
                    <ActionsDropdown
                      item={item}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      showEditExtra={activeTab === "alumnos"}
                      onEditExtra={handleEditExtra}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
