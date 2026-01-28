"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import ActionsDropdown from "./ActionsDropdown";
import { Docente, Alumno, Administrador, Grupo } from "@/types/community";

// Tipo base que garantiza que todos tengan id
interface BaseItem {
  id: number;
}

interface DataTableProps {
  activeTab: string;
  data: (Docente | Alumno | Administrador | Grupo)[];
  handleEdit: (item: Docente | Alumno | Administrador | Grupo) => void;
  handleDelete: (item: Docente | Alumno | Administrador | Grupo) => void;
  visibleColumns: string[]; // columnas visibles
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
        return ["Nombre", "Email", "Matrícula", "Especialidad", "Semestre", "Grupo"];
      case "administradores":
        return ["Nombre", "Email", "Cargo", "N° Empleado"];
      case "grupos":
        return ["Código", "Semestre", "Aula", "Especialidad", "Docente", "Materia", "Integrantes"];
      default:
        return [];
    }
  };

  const renderCell = (column: string, item: Docente | Alumno | Administrador | Grupo) => {
    switch (column) {
      case "Nombre": 
        if ('nombre' in item && 'apellidoPaterno' in item) {
          const nombreCompleto = `${item.nombre} ${item.apellidoPaterno} ${item.apellidoMaterno || ''}`.trim();
          return <TableCell key={column}>{nombreCompleto}</TableCell>;
        }
        return <TableCell key={column}></TableCell>;
      case "Email": return <TableCell key={column}>{'email' in item ? item.email : ''}</TableCell>;
      case "Teléfono": return <TableCell key={column}>{(item as Docente).telefono || ''}</TableCell>;
      case "Especialidad": 
        if ('especialidad' in item) {
          return <TableCell key={column}>{item.especialidad}</TableCell>;
        } else if ('especialidadNombre' in item) {
          return <TableCell key={column}>{(item as Grupo).especialidadNombre}</TableCell>;
        }
        return <TableCell key={column}></TableCell>;
      case "N° Empleado": return <TableCell key={column}>{"numeroEmpleado" in item ? item.numeroEmpleado : ""}</TableCell>;
      case "Matrícula": return <TableCell key={column}>{(item as Alumno).matricula || ''}</TableCell>;
      case "Semestre": 
        if ('semestre' in item && 'codigo' in item) {
          // Es un Grupo
          return <TableCell key={column}>{(item as Grupo).semestre}°</TableCell>;
        } else if ('semestre' in item) {
          // Es un Alumno
          return <TableCell key={column}>{(item as Alumno).semestre}°</TableCell>;
        }
        return <TableCell key={column}></TableCell>;
      case "Cargo": return <TableCell key={column}>{(item as Administrador).cargo || ''}</TableCell>;
      case "Código": return <TableCell key={column}>{(item as Grupo).codigo || ''}</TableCell>;
      case "Aula": return <TableCell key={column}>{(item as Grupo).aula || 'N/A'}</TableCell>;
      case "Docente": return <TableCell key={column}>{(item as Grupo).docenteNombre || 'N/A'}</TableCell>;
      case "Materia": return <TableCell key={column}>{(item as Grupo).materiaNombre || 'N/A'}</TableCell>;
      case "Integrantes": return <TableCell key={column}>{(item as Grupo).integrantes || 0}</TableCell>;
      case "Grupo": return <TableCell key={column}>{(item as Alumno).grupo || 'Sin grupo'}</TableCell>;
      default: return null;
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
              <TableHead className="bg-[#691C32] text-white text-center">Acciones</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={allColumns().length + 1} className="text-center py-12 text-gray-500">
                  No se encontraron resultados
                </TableCell>
              </TableRow>
            ) : (
              data.map((item) => (
                <TableRow key={(item as BaseItem).id}>
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
