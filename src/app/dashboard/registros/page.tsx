"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Search,
  Calendar as CalendarIcon,
  Download,
  Filter,
  RefreshCw,
} from "lucide-react";
import * as XLSX from "xlsx";
import { useState, useMemo, useEffect } from "react";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/web";

// Tipo para los registros (Adaptado al Backend)
type Registro = {
  id: number;
  estudiante: string;
  numeroControl: string;
  grupo: string;
  fechaHora: string;
  tipo: string;
};

export default function RegistrosPage() {
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Estados para los filtros
  const [busqueda, setBusqueda] = useState("");
  const [filtroGrupo, setFiltroGrupo] = useState("all");
  const [filtroTipo, setFiltroTipo] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().setHours(0, 0, 0, 0)),
    to: new Date(new Date().setHours(23, 59, 59, 999)),
  });

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  };

  const cargarRegistros = async () => {
    setIsLoading(true);
    try {
      // Ajusta la ruta a /accesos o la que hayas definido en el backend
      const res = await fetch(`${API_URL}/accesos`, {
        headers: getAuthHeaders(),
      });

      if (!res.ok) {
        throw new Error("Error al obtener los registros de acceso");
      }

      const data = await res.json();

      // Mapeamos los datos de Prisma a nuestra estructura de la tabla
      const registrosMapeados: Registro[] = data.map((acceso: any) => ({
        id: acceso.idAcceso || acceso.id || Math.random(),
        estudiante:
          `${acceso.alumno?.usuario?.nombre || ""} ${acceso.alumno?.usuario?.apellidoPaterno || ""} ${acceso.alumno?.usuario?.apellidoMaterno || ""}`.trim() ||
          "Desconocido",
        numeroControl: acceso.alumno?.matricula || "S/N",
        grupo: acceso.alumno?.grupo?.nombre || "Sin Grupo",
        fechaHora: acceso.fechaHora,
        tipo: acceso.tipo === "ENTRADA" ? "Entrada" : "Salida",
      }));

      setRegistros(registrosMapeados);
    } catch (error) {
      console.error("Error al cargar accesos:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    cargarRegistros();
  }, []);

  // Obtener grupos únicos para el filtro a partir de los datos reales
  const gruposUnicos = useMemo(() => {
    const grupos = new Set(registros.map((r) => r.grupo));
    return Array.from(grupos).sort();
  }, [registros]);

  // Filtrar registros
  const registrosFiltrados = useMemo(() => {
    return registros.filter((registro) => {
      const cumpleBusqueda =
        registro.estudiante.toLowerCase().includes(busqueda.toLowerCase()) ||
        registro.numeroControl.includes(busqueda);
      const cumpleGrupo =
        filtroGrupo === "all" || registro.grupo === filtroGrupo;
      const cumpleTipo = filtroTipo === "all" || registro.tipo === filtroTipo;

      const fechaRegistro = new Date(registro.fechaHora);
      const cumpleFecha =
        (!dateRange?.from || fechaRegistro >= dateRange.from) &&
        (!dateRange?.to ||
          fechaRegistro <= new Date(dateRange.to.setHours(23, 59, 59, 999)));

      return cumpleBusqueda && cumpleGrupo && cumpleTipo && cumpleFecha;
    });
  }, [busqueda, filtroGrupo, filtroTipo, dateRange, registros]);

  // Función para exportar a Excel
  const exportToExcel = () => {
    if (registrosFiltrados.length === 0) return;

    // Formatear los datos antes de exportar para que se vean bien en Excel
    const dataExportar = registrosFiltrados.map((r) => ({
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
            disabled={registrosFiltrados.length === 0}
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
                    {gruposUnicos.map((grupo) => (
                      <SelectItem key={grupo} value={grupo}>
                        {grupo}
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
                      {registrosFiltrados.length}
                    </span>
                    {" resultado"}
                    {registrosFiltrados.length !== 1 ? "s" : ""}
                    {registrosFiltrados.length !== registros.length && (
                      <span className="text-gray-400">
                        {" "}
                        de {registros.length} total
                      </span>
                    )}
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
                  {registrosFiltrados.length > 0 ? (
                    registrosFiltrados.map((registro) => (
                      <TableRow key={registro.id}>
                        <TableCell className="font-medium">
                          {registro.estudiante}
                        </TableCell>
                        <TableCell>{registro.numeroControl}</TableCell>
                        <TableCell>{registro.grupo}</TableCell>
                        <TableCell>
                          {new Date(registro.fechaHora).toLocaleString("es-MX")}
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
