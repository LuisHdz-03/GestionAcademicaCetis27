"use client";
import { useState } from "react";
import {
  HiMagnifyingGlass,
  HiPlus,
  HiTableCells,
  HiArrowDownTray,
  HiArrowUpTray,
} from "react-icons/hi2";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { uploadCsv } from "@/lib/upload";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/web";

interface TopBarProps {
  visibleColumns: string[];
  toggleColumn: (column: string) => void;
  activeTab: string;
  searchTerm: string;
  onSearchChange: (val: string) => void;
  selectedFilter: string;
  onFilterChange: (val: string) => void;
  statusFilter?: string;
  onStatusFilterChange?: (val: string) => void;
  itemsPerPage: number;
  setItemsPerPage: (n: number) => void;
  filters: string[];
  onAddClick: () => void;
}

export default function TopBar({
  visibleColumns,
  toggleColumn,
  activeTab,
  searchTerm,
  onSearchChange,
  selectedFilter,
  onFilterChange,
  statusFilter,
  onStatusFilterChange,
  itemsPerPage,
  setItemsPerPage,
  filters,
  onAddClick,
}: TopBarProps) {
  // Estado para controlar la pantalla de carga
  const [isUploading, setIsUploading] = useState(false);

  const handleDescargarPlantilla = async () => {
    const endpointMap: Record<string, string> = {
      alumnos: "alumnos/plantilla",
      docentes: "docentes/plantilla",
      administradores: "admins/plantilla/excel",
    };
    const endpoint = endpointMap[activeTab];
    if (!endpoint) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/${endpoint}`, {
        method: "GET",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!response.ok) {
        const errorMsg =
          response.status === 403
            ? "No tienes permisos para descargar la plantilla."
            : response.status === 404
              ? "No se encontró la plantilla."
              : "No se pudo descargar la plantilla.";
        alert(errorMsg);
        return;
      }

      const blob = await response.blob();
      const contentDisposition =
        response.headers.get("Content-Disposition") || "";
      const fileNameMatch = contentDisposition.match(
        /filename\*=UTF-8''([^;]+)|filename=\"?([^\";]+)\"?/i,
      );
      const rawFileName =
        fileNameMatch?.[1] ||
        fileNameMatch?.[2] ||
        `plantilla_${activeTab}.xlsx`;
      const fileName = decodeURIComponent(rawFileName);

      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      console.error("Error al descargar plantilla:", error);
      alert("Error de conexión al descargar la plantilla.");
    }
  };

  const enviarArchivoAlBackend = async (file: File) => {
    setIsUploading(true);
    try {
      let endpoint = activeTab;
      if (activeTab === "alumnos") endpoint = "estudiantes";
      if (activeTab === "docentes") endpoint = "docentes";
      if (activeTab === "administradores") endpoint = "administrativos";

      const { ok, data } = await uploadCsv(file, endpoint);

      if (ok) {
        const insertados =
          data?.insertados ?? data?.inserted ?? data?.successCount ?? 0;
        const fallidos = data?.fallidos ?? data?.failed ?? 0;
        alert(` Éxito: Se procesaron ${insertados} registros.`);
        if (fallidos > 0) {
          console.warn(
            "Registros fallidos:",
            data?.detalles ?? data?.errors ?? data?.failedDetails,
          );
          alert(`Hubo ${fallidos} registros fallidos. Revisa la consola.`);
        }
        window.location.reload();
      } else {
        alert(
          ` Error: ${data?.msg || data?.message || "Hubo un problema con el archivo"}`,
        );
      }
    } catch (error) {
      console.error("Error al enviar archivo:", error);
      alert(" Error de conexión con el servidor.");
    } finally {
      setIsUploading(false);
    }
  };

  const allColumns = () => {
    switch (activeTab) {
      case "docentes":
        return ["Nombre", "Email", "Teléfono", "Especialidad", "N° Empleado"];
      case "alumnos":
        return ["Nombre", "Email", "Matrícula", "Especialidad", "Semestre"];
      case "administradores":
        return ["Nombre", "Email", "Cargo", "N° Empleado"];
      default:
        return [];
    }
  };

  return (
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      {/* OVERLAY DE CARGA: Bloquea la pantalla mientras sube */}
      {isUploading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] backdrop-blur-sm">
          <div className="bg-white p-8 rounded-xl shadow-2xl flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-300">
            {/* Spinner animado */}
            <div className="w-14 h-14 border-4 border-[#691C32] border-t-transparent rounded-full animate-spin"></div>
            <div className="text-center">
              <p className="font-bold text-[#691C32] text-xl">
                Procesando información...
              </p>
              <p className="text-gray-500 mt-1">
                Por favor espera, no cierres la página.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* IZQUIERDA: Buscador y Filtros */}
      <div className="flex items-center gap-4 flex-1">
        <div className="relative flex-1 max-w-md">
          <HiMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
            disabled={isUploading}
          />
        </div>

        <Select
          value={selectedFilter}
          onValueChange={onFilterChange}
          disabled={isUploading}
        >
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Filtrar por..." />
          </SelectTrigger>
          <SelectContent>
            {filters.map((f) => (
              <SelectItem key={f} value={f}>
                {f}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {activeTab === "alumnos" && onStatusFilterChange && (
          <Select
            value={statusFilter || "todos"}
            onValueChange={onStatusFilterChange}
            disabled={isUploading}
          >
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="activos">Activos</SelectItem>
              <SelectItem value="inactivos">Inactivos</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      {/* DERECHA: Botones de Acción */}
      <div className="flex items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2" disabled={isUploading}>
              <HiTableCells className="w-4 h-4" /> Columnas
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {allColumns().map((col) => (
              <DropdownMenuCheckboxItem
                key={col}
                checked={visibleColumns.includes(col)}
                onCheckedChange={() => toggleColumn(col)}
              >
                {col}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="outline"
          className="gap-2"
          disabled={isUploading}
          onClick={() => {
            const input = document.createElement("input");
            input.type = "file";
            input.accept = ".csv, .xlsx";
            input.onchange = (e: any) => {
              const file = e.target.files?.[0];
              if (file && confirm(`¿Cargar archivo para ${activeTab}?`)) {
                enviarArchivoAlBackend(file);
              }
            };
            input.click();
          }}
        >
          <HiArrowDownTray className="w-4 h-4" /> Cargar CSV
        </Button>

        {["alumnos", "docentes", "administradores"].includes(activeTab) && (
          <Button
            variant="outline"
            className="gap-2"
            disabled={isUploading}
            onClick={handleDescargarPlantilla}
          >
            <HiArrowUpTray className="w-4 h-4" /> Descargar Machote
          </Button>
        )}

        <Button
          className="bg-[#691C32] hover:bg-[#5a1829] text-white gap-2"
          onClick={onAddClick}
          disabled={isUploading}
        >
          <HiPlus className="w-4 h-4" />
          {activeTab === "docentes"
            ? "Agregar docente"
            : activeTab === "alumnos"
              ? "Agregar alumno"
              : "Agregar administrador"}
        </Button>
      </div>
    </div>
  );
}
