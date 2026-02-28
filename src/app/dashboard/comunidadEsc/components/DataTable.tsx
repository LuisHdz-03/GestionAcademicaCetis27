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
import { Docente, Alumno, Admin, Grupo } from "@/types/community";

// Tipo base que garantiza que todos tengan id
interface BaseItem {
  id: number;
}

interface DataTableProps {
  activeTab: string;
  data: (Docente | Alumno | Admin | Grupo)[];
  handleEdit: (item: Docente | Alumno | Admin | Grupo) => void;
  handleDelete: (item: Docente | Alumno | Admin | Grupo) => void;
  visibleColumns: string[];
}

export default function DataTable({
  activeTab,
  data,
  handleEdit,
  handleDelete,
  visibleColumns,
}: DataTableProps) {
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
      case "grupos":
        return [
          "Código",
          "Semestre",
          "Aula",
          "Especialidad",
          "Docente",
          "Materia",
          "Integrantes",
        ];
      default:
        return [];
    }
  };

  const renderCell = (
    column: string,
    item: Docente | Alumno | Admin | Grupo,
  ) => {
    // Usamos el ID del item + el nombre de la columna para crear una key única por celda
    const cellKey = `${(item as BaseItem).id}-${column}`;

    switch (column) {
      case "Nombre":
        if ("nombre" in item && "apellidoPaterno" in item) {
          const nombreCompleto =
            `${item.nombre} ${item.apellidoPaterno} ${item.apellidoMaterno || ""}`.trim();
          return <TableCell key={cellKey}>{nombreCompleto}</TableCell>;
        }
        return <TableCell key={cellKey}></TableCell>;
      case "Email":
        return (
          <TableCell key={cellKey}>
            {"email" in item ? item.email : ""}
          </TableCell>
        );
      case "Teléfono":
        return (
          <TableCell key={cellKey}>
            {(item as Docente).telefono || ""}
          </TableCell>
        );
      case "Especialidad":
        if ("especialidad" in item) {
          return <TableCell key={cellKey}>{item.especialidad}</TableCell>;
        } else if ("especialidadNombre" in item) {
          return (
            <TableCell key={cellKey}>
              {(item as Grupo).especialidadNombre}
            </TableCell>
          );
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
        if ("semestre" in item && "codigo" in item) {
          return (
            <TableCell key={cellKey}>{(item as Grupo).semestre}°</TableCell>
          );
        } else if ("semestre" in item) {
          return (
            <TableCell key={cellKey}>{(item as Alumno).semestre}°</TableCell>
          );
        }
        return <TableCell key={cellKey}></TableCell>;
      case "Cargo":
        return (
          <TableCell key={cellKey}>{(item as Admin).cargo || ""}</TableCell>
        );
      case "Código":
        return (
          <TableCell key={cellKey}>{(item as Grupo).codigo || ""}</TableCell>
        );
      case "Aula":
        return (
          <TableCell key={cellKey}>{(item as Grupo).aula || "N/A"}</TableCell>
        );
      case "Docente":
        return (
          <TableCell key={cellKey}>
            {(item as Grupo).docenteNombre || "N/A"}
          </TableCell>
        );
      case "Materia":
        return (
          <TableCell key={cellKey}>
            {(item as Grupo).materiaNombre || "N/A"}
          </TableCell>
        );
      case "Integrantes":
        return (
          <TableCell key={cellKey}>
            {(item as Grupo).integrantes || 0}
          </TableCell>
        );
      case "Grupo":
        return (
          <TableCell key={cellKey}>
            {(item as Alumno).grupo || "Sin grupo"}
          </TableCell>
        );
      default:
        return null;
    }
  };

  return (
    <div className="overflow-hidden rounded-md border">
      <div className="h-full overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 z-10">
            <TableRow className="hover:bg-[#691C32]">
              {allColumns()
                .filter((col) => visibleColumns.includes(col))
                .map((col) => (
                  <TableHead key={col} className="bg-[#691C32] text-white">
                    {col}
                  </TableHead>
                ))}
              <TableHead className="bg-[#691C32] text-white text-center">
                Acciones
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {data.length === 0 ? (
              // SOLUCIÓN: Agregada key a la fila de "No resultados"
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
                // SOLUCIÓN: Asegurar que el id se use como key
                <TableRow
                  key={(item as any).id || (item as any).email || Math.random()}
                >
                  {allColumns()
                    .filter((col) => visibleColumns.includes(col))
                    .map((col) => renderCell(col, item))}
                  <TableCell className="text-center">
                    <ActionsDropdown
                      item={item}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
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
