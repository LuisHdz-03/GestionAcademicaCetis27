"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Download, RefreshCw } from "lucide-react";
import * as XLSX from "xlsx";
import { useState, useEffect, useRef } from "react";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { useCommunity } from "@/hooks/useCommunity";

const formatFecha = (date?: Date) => {
  if (!date) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function RegistrosPage() {
  const {
    accesos: registros,
    fetchAccesos,
    grupos,
    fetchGrupos,
    pagination,
    loading: isLoading,
  } = useCommunity();

  // Estados para los filtros
  const [busqueda, setBusqueda] = useState("");
  const [debouncedBusqueda, setDebouncedBusqueda] = useState("");
  const [filtroGrupo, setFiltroGrupo] = useState("all");
  const [filtroTipo, setFiltroTipo] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().setHours(0, 0, 0, 0)),
    to: new Date(new Date().setHours(23, 59, 59, 999)),
  });

  // Debounce de búsqueda
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedBusqueda(busqueda);
    }, 400);
    return () => clearTimeout(timeout);
  }, [busqueda]);

  // Carga de grupos (fuente estable, independiente de los accesos filtrados)
  useEffect(() => {
    void fetchGrupos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch de accesos: reacciona a filtros y paginación
  const filtrosKey = `${debouncedBusqueda}|${filtroGrupo}|${filtroTipo}|${formatFecha(dateRange?.from)}|${formatFecha(dateRange?.to)}`;
  const filtrosKeyRef = useRef(filtrosKey);

  const cargarRegistros = async () => {
    try {
      await fetchAccesos(
        currentPage,
        20,
        debouncedBusqueda,
        formatFecha(dateRange?.from),
        formatFecha(dateRange?.to),
        filtroGrupo !== "all" ? filtroGrupo : "",
        filtroTipo !== "all" ? filtroTipo.toUpperCase() : "",
      );
    } catch (error) {
      console.error("Error al cargar accesos:", error);
    }
  };

  useEffect(() => {
    const cambiaronFiltros = filtrosKeyRef.current !== filtrosKey;
    filtrosKeyRef.current = filtrosKey;

    if (cambiaronFiltros && currentPage !== 1) {
      setCurrentPage(1); // el cambio de currentPage disparará este mismo efecto otra vez, ya en página 1
      return;
    }

    void cargarRegistros();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, filtrosKey]);

  // Función para exportar a Excel (exporta lo que está cargado actualmente)
  const exportToExcel = () => {
    if (registros.length === 0) return;

    const dataExportar = registros.map((r) => ({
      Estudiante: r.estudiante,
      "N° Control": r.numeroControl,
      Grupo: r.grupo,
      "Fecha y Hora": new Date(r.fechaHora).toLocaleString("es-MX"),
      "Tipo de Acceso": r.tipo,
    }));

    const ws = XLSX.utils.json_to_sheet(dataExportar);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Registros");
    XLSX.writeFile(
      wb,
      `registros_entrada_${new Date().toISOString().split("T")[0]}.xlsx`,
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Registros de Acceso
          </h1>
          <p className="text-muted-foreground">
            Visualiza y gestiona los registros de entrada y salida de los
            estudiantes
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={cargarRegistros}
            disabled={isLoading}
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
            Actualizar
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={exportToExcel}
            disabled={registros.length === 0}
          >
            <Download className="h-4 w-4" />
            Exportar a Excel
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar estudiante o número de control..."
                  className="w-full pl-8"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 ml-auto">
                <Select value={filtroGrupo} onValueChange={setFiltroGrupo}>
                  <SelectTrigger className="w-44">
                    <SelectValue placeholder="Todos los grupos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los grupos</SelectItem>
                    {grupos.map((g: any) => (
                      <SelectItem key={g.idGrupo ?? g.id} value={g.nombre}>
                        {g.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Todos los tipos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los tipos</SelectItem>
                    <SelectItem value="Entrada">Entrada</SelectItem>
                    <SelectItem value="Salida">Salida</SelectItem>
                  </SelectContent>
                </Select>

                <DatePickerWithRange
                  dateRange={dateRange}
                  onDateRangeChange={setDateRange}
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                {isLoading ? (
                  "Cargando registros..."
                ) : (
                  <>
                    <span className="font-semibold text-gray-700">
                      {registros.length}
                    </span>
                    {" resultado"}
                    {registros.length !== 1 ? "s" : ""} de{" "}
                    {pagination.totalRegistros} total
                  </>
                )}
              </span>
              {(busqueda || filtroGrupo !== "all" || filtroTipo !== "all") && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    setBusqueda("");
                    setFiltroGrupo("all");
                    setFiltroTipo("all");
                  }}
                >
                  Limpiar filtros
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-4 border-[#691C32] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Estudiante</TableHead>
                      <TableHead>N° Control</TableHead>
                      <TableHead>Grupo</TableHead>
                      <TableHead>Fecha y Hora</TableHead>
                      <TableHead>Tipo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {registros.length > 0 ? (
                      registros.map((registro) => (
                        <TableRow key={registro.id}>
                          <TableCell className="font-medium">
                            {registro.estudiante}
                          </TableCell>
                          <TableCell>{registro.numeroControl}</TableCell>
                          <TableCell>{registro.grupo}</TableCell>
                          <TableCell>
                            {new Date(registro.fechaHora).toLocaleString(
                              "es-MX",
                            )}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                registro.tipo === "Entrada"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-orange-100 text-orange-800"
                              }`}
                            >
                              {registro.tipo}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                          No se encontraron registros que coincidan con los
                          filtros
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-between pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  Anterior
                </Button>
                <span className="text-sm text-muted-foreground">
                  Página {pagination.currentPage} de{" "}
                  {pagination.totalPages || 1}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.currentPage >= pagination.totalPages}
                  onClick={() =>
                    setCurrentPage((p) =>
                      Math.min(pagination.totalPages, p + 1),
                    )
                  }
                >
                  Siguiente
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
