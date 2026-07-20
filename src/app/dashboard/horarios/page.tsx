"use client";

import { useEffect, useRef, useState } from "react";
import { useCommunity } from "@/hooks/useCommunity";
import { useToast } from "@/hooks/useToast";
import BlockingLoader from "@/components/common/BlockingLoader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import AddClaseModal from "@/components/common/Modal/AddClaseModal";
import { Search, Plus, Pencil } from "lucide-react";
import { Download, Upload } from "lucide-react";
import { downloadTemplate, uploadCsv } from "@/lib/upload";
import Pagination from "@/app/dashboard/comunidadEsc/components/Pagination";

interface ClaseFormData {
  grupoId: number;
  materiaId: number;
  docenteId: number;
  horario: string;
}

interface HorarioObj {
  dia?: string;
  espacio?: string;
  horaInicio?: string;
  horaFin?: string;
}

interface ClaseItem {
  idClase: number;
  horario?: string | HorarioObj;
  periodo?: {
    activo?: boolean;
  };
  grupo?: {
    nombre?: string;
    turno?: string;
  };
  materias?: {
    nombre?: string;
  };
  docente?: {
    usuario?: {
      nombre?: string;
      apellidoPaterno?: string;
    };
  };
}

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

export default function HorariosPage() {
  const { toast } = useToast();
  const {
    grupos,
    materias,
    docentes,
    clases,
    pagination,
    fetchGrupos,
    fetchMaterias,
    fetchDocentes,
    fetchPeriodos,
    fetchClases,
    asignarClase,
    editarClase,
    loading,
  } = useCommunity();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [claseEditar, setClaseEditar] = useState<ClaseItem | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [uploadingExcel, setUploadingExcel] = useState(false);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;
    void Promise.all([
      fetchGrupos(),
      fetchMaterias(),
      fetchDocentes(),
      fetchPeriodos(),
    ]);
  }, [fetchClases, fetchDocentes, fetchGrupos, fetchMaterias, fetchPeriodos]);

  useEffect(() => {
    void fetchClases(currentPage, itemsPerPage);
  }, [fetchClases, currentPage, itemsPerPage]);

  const handleAsignarClase = async (data: ClaseFormData) => {
    const exito = await asignarClase(data);
    if (exito) {
      setIsModalOpen(false);
      await fetchClases();
    }
  };

  const handleEditarClase = async (data: ClaseFormData) => {
    if (!claseEditar) return;
    const exito = await editarClase(claseEditar.idClase, data);
    if (exito) {
      setIsEditModalOpen(false);
      setClaseEditar(null);
      await fetchClases();
    }
  };

  const abrirEditar = (clase: ClaseItem) => {
    setClaseEditar(clase);
    setIsEditModalOpen(true);
  };

  const handleDescargarMachote = async () => {
    try {
      await downloadTemplate("clases");
      toast({
        title: "Machote descargado",
        description:
          "Usa el formato sin IDs (grupo, materia y docente por nombre/código).",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: getErrorMessage(error, "No se pudo descargar el machote."),
        variant: "destructive",
      });
    }
  };

  const handleCargaMasiva = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".xlsx,.xls,.csv";

    input.onchange = async (event) => {
      const target = event.target as HTMLInputElement;
      const file = target.files?.[0];
      if (!file) return;

      setUploadingExcel(true);
      try {
        const result = await uploadCsv(file, "clases/horarios");
        const backendMessage =
          result.data?.message || result.data?.mensaje || result.data?.error;

        if (!result.ok) {
          throw new Error(backendMessage || "No se pudo procesar el archivo.");
        }

        toast({
          title: "Carga masiva completada",
          description:
            backendMessage ||
            "Las clases se cargaron correctamente con formato sin IDs.",
          variant: "success",
        });

        await fetchClases();
      } catch (error) {
        toast({
          title: "Error",
          description: getErrorMessage(error, "No se pudo subir el archivo."),
          variant: "destructive",
        });
      } finally {
        setUploadingExcel(false);
      }
    };

    input.click();
  };

  const clasesFiltradas = (clases as ClaseItem[]).filter((c) => {
    if (!c.periodo || c.periodo.activo === false) {
      return false;
    }
    const buscar = searchTerm.toLowerCase();
    const grupo = c.grupo?.nombre?.toLowerCase() || "";
    const materia = c.materias?.nombre?.toLowerCase() || "";
    const docente =
      `${c.docente?.usuario?.nombre} ${c.docente?.usuario?.apellidoPaterno}`.toLowerCase();

    return (
      grupo.includes(buscar) ||
      materia.includes(buscar) ||
      docente.includes(buscar)
    );
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50/50 p-6 flex justify-center items-start">
      <BlockingLoader
        open={uploadingExcel}
        title="Cargando clases y horarios..."
        description="Espera mientras se procesa la carga masiva."
      />

      <Card className="shadow-md w-full flex flex-col max-h-[85vh]">
        <CardHeader className="flex flex-col sm:flex-row justify-between items-center border-b pb-4 gap-4 shrink-0">
          <CardTitle className="text-3xl font-bold text-gray-900">
            Gestión de Clases y Horarios
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={handleDescargarMachote}>
              <Upload className="w-4 h-4 mr-2" /> Descargar Machote
            </Button>
            <Button
              variant="outline"
              onClick={handleCargaMasiva}
              disabled={uploadingExcel}
              className="flex items-center"
            >
              <Download className="w-4 h-4 mr-2" />
              {uploadingExcel ? "Cargando..." : "Cargar Horarios"}
            </Button>
            <Button
              onClick={() => setIsModalOpen(true)}
              className="bg-[#691C32] hover:bg-[#4a1424] text-white flex items-center gap-2"
            >
              <Plus className="w-5 h-5" /> Nueva Asignación
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6 flex flex-col gap-6 overflow-hidden h-full">
          <div className="flex flex-col md:flex-row justify-between items-center shrink-0">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por Grupo, Materia o Docente..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="mt-3 w-full md:mt-0 md:w-auto">
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm md:w-auto"
              >
                <option value={10}>10 por página</option>
                <option value={20}>20 por página</option>
                <option value={30}>30 por página</option>
              </select>
            </div>
          </div>

          {/* Contenedor adaptado exactamente como en DataTable */}
          <div className="flex-1 min-h-0 overflow-hidden rounded-md border">
            <div className="h-full overflow-x-auto overflow-y-auto">
              <Table className="min-w-[700px]">
                <TableHeader className="sticky top-0 z-10">
                  <TableRow className="hover:bg-[#691C32]">
                    <TableHead className="bg-[#691C32] text-white font-semibold py-3 whitespace-nowrap">
                      Grupo
                    </TableHead>
                    <TableHead className="bg-[#691C32] text-white font-semibold py-3 whitespace-nowrap">
                      Materia
                    </TableHead>
                    <TableHead className="bg-[#691C32] text-white font-semibold py-3 whitespace-nowrap">
                      Docente Titular
                    </TableHead>
                    <TableHead className="bg-[#691C32] text-white font-semibold py-3 whitespace-nowrap">
                      Horario
                    </TableHead>
                    <TableHead className="bg-[#691C32] text-white font-semibold py-3 w-20 text-center whitespace-nowrap">
                      Acciones
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-10">
                        <div className="flex flex-col items-center gap-2 text-gray-500">
                          <div className="w-6 h-6 border-4 border-[#691C32] border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-sm">Cargando clases...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : clasesFiltradas.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center py-8 text-gray-500"
                      >
                        {searchTerm
                          ? `Sin resultados para "${searchTerm}"`
                          : "No se encontraron clases registradas."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    clasesFiltradas.map((clase) => (
                      <TableRow
                        key={clase.idClase}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <TableCell className="font-medium text-[#691C32] whitespace-nowrap">
                          {clase.grupo?.nombre} - {clase.grupo?.turno}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {clase.materias?.nombre}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {clase.docente?.usuario?.nombre}{" "}
                          {clase.docente?.usuario?.apellidoPaterno}
                        </TableCell>
                        <TableCell className="text-gray-600 whitespace-nowrap">
                          {typeof clase.horario === "object" &&
                          clase.horario !== null
                            ? `${clase.horario.dia ?? ""} ${clase.horario.horaInicio ?? ""} - ${clase.horario.horaFin ?? ""}${clase.horario.espacio ? ` (${clase.horario.espacio})` : ""}`.trim() ||
                              "Sin definir"
                            : clase.horario || "Sin definir"}
                        </TableCell>
                        <TableCell className="text-center whitespace-nowrap">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-[#691C32] hover:bg-[#691C32]/10"
                            onClick={() => abrirEditar(clase)}
                            title="Editar clase"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between shrink-0">
            <div className="text-xs text-gray-600 sm:text-sm">
              Mostrando{" "}
              {clases.length === 0
                ? 0
                : (pagination.currentPage - 1) * pagination.limit + 1}
              {" - "}
              {Math.min(
                pagination.currentPage * pagination.limit,
                pagination.totalRegistros,
              )}
              {" de "}
              {pagination.totalRegistros} clases
            </div>
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              setCurrentPage={setCurrentPage}
            />
          </div>
        </CardContent>
      </Card>

      <AddClaseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        grupos={grupos}
        materias={materias}
        docentes={docentes}
        onSubmit={handleAsignarClase}
      />

      <AddClaseModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setClaseEditar(null);
        }}
        grupos={grupos}
        materias={materias}
        docentes={docentes}
        onSubmit={handleEditarClase}
        mode="edit"
        claseEditar={claseEditar}
      />
    </div>
  );
}
