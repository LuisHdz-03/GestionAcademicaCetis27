// src/app/dashboard/registros/page.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Calendar as CalendarIcon, Download, Filter } from "lucide-react";
import * as XLSX from 'xlsx';
import { useState, useMemo } from 'react';
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";

// Tipo para los registros
type Registro = {
  id: number;
  estudiante: string;
  numeroControl: string;
  grupo: string;
  fechaHora: string;
  tipo: string;
};

export default function RegistrosPage() {
  // Datos de ejemplo
  const registrosEjemplo: Registro[] = [
    {
      id: 1,
      estudiante: "Juan Pérez López",
      numeroControl: "20195023",
      grupo: "6AVP",
      fechaHora: "2025-12-29T08:30:45-06:00",
      tipo: "Entrada"
    },
    {
      id: 2,
      estudiante: "María García Sánchez",
      numeroControl: "20195024",
      grupo: "6AVP",
      fechaHora: "2025-12-29T08:25:30-06:00",
      tipo: "Entrada"
    },
    {
      id: 3,
      estudiante: "Carlos Ramírez Pérez",
      numeroControl: "20195025",
      grupo: "6BVP",
      fechaHora: "2025-12-29T08:35:15-06:00",
      tipo: "Entrada"
    }
  ];

  // Estados para los filtros
  const [showFilters, setShowFilters] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [filtroGrupo, setFiltroGrupo] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<string>("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().setHours(0, 0, 0, 0)),
    to: new Date(new Date().setHours(23, 59, 59, 999))
  });

  // Obtener grupos únicos para el filtro
  const gruposUnicos = useMemo(() => {
    const grupos = new Set(registrosEjemplo.map(r => r.grupo));
    return Array.from(grupos).sort();
  }, []);

  // Filtrar registros
  const registrosFiltrados = useMemo(() => {
    return registrosEjemplo.filter(registro => {
      const cumpleBusqueda = registro.estudiante.toLowerCase().includes(busqueda.toLowerCase()) ||
                           registro.numeroControl.includes(busqueda);
      const cumpleGrupo = !filtroGrupo || registro.grupo === filtroGrupo;
      const cumpleTipo = !filtroTipo || registro.tipo === filtroTipo;
      
      const fechaRegistro = new Date(registro.fechaHora);
      const cumpleFecha = (!dateRange?.from || fechaRegistro >= dateRange.from) &&
                         (!dateRange?.to || fechaRegistro <= new Date(dateRange.to.setHours(23, 59, 59, 999)));

      return cumpleBusqueda && cumpleGrupo && cumpleTipo && cumpleFecha;
    });
  }, [busqueda, filtroGrupo, filtroTipo, dateRange]);

  // Función para exportar a Excel
  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(registrosFiltrados);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Registros");
    XLSX.writeFile(wb, `registros_entrada_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Registros de Entrada</h1>
          <p className="text-muted-foreground">
            Visualiza y gestiona los registros de entrada de los estudiantes
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-1"
            onClick={exportToExcel}
          >
            <Download className="h-4 w-4" />
            Exportar a Excel
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="relative w-full md:w-80">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar estudiante o número de control..."
                  className="w-full pl-8"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                />
              </div>
              
              <div className="w-full flex justify-end">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-1"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="h-4 w-4" />
                  {showFilters ? 'Ocultar filtros' : 'Mostrar filtros'}
                </Button>
              </div>
              
              {showFilters && (
                <div className="flex-1 flex flex-wrap gap-2">
                  <div className="flex-1 min-w-[150px]">
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      value={filtroGrupo}
                      onChange={(e) => setFiltroGrupo(e.target.value)}
                    >
                      <option value="">Todos los grupos</option>
                      {gruposUnicos.map(grupo => (
                        <option key={grupo} value={grupo}>{grupo}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex-1 min-w-[150px]">
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      value={filtroTipo}
                      onChange={(e) => setFiltroTipo(e.target.value)}
                    >
                      <option value="">Todos los tipos</option>
                      <option value="Entrada">Entrada</option>
                      <option value="Salida">Salida</option>
                    </select>
                  </div>

                  <div className="flex-1 min-w-[250px]">
                    <DatePickerWithRange 
                      dateRange={dateRange} 
                      onDateRangeChange={setDateRange} 
                    />
                  </div>
                </div>
              )} 
            </div>
          </div>
        </CardHeader>
        <CardContent>
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
                      <TableCell className="font-medium">{registro.estudiante}</TableCell>
                      <TableCell>{registro.numeroControl}</TableCell>
                      <TableCell>{registro.grupo}</TableCell>
                      <TableCell>{new Date(registro.fechaHora).toLocaleString('es-MX')}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          registro.tipo === 'Entrada' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {registro.tipo}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      No se encontraron registros que coincidan con los filtros
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}