"use client";

import { useEffect, useState } from "react";
import { useCommunity } from "@/hooks/useCommunity";
import { useToast } from "@/hooks/useToast";
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

export default function HorariosPage() {
  const { toast } = useToast();
  const {
    grupos,
    materias,
    docentes,
    clases,
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
  const [claseEditar, setClaseEditar] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [uploadingExcel, setUploadingExcel] = useState(false);

  useEffect(() => {
    fetchGrupos();
    fetchMaterias();
    fetchDocentes();
    fetchPeriodos();
    fetchClases();
  }, []);

  const handleAsignarClase = async (data: any) => {
    const exito = await asignarClase(data);
    if (exito) {
      setIsModalOpen(false);
      fetchClases();
    }
  };

  const handleEditarClase = async (data: any) => {
    if (!claseEditar) return;
    const exito = await editarClase(claseEditar.idClase, data);
    if (exito) {
      setIsEditModalOpen(false);
      setClaseEditar(null);
      fetchClases();
    }
  };

  const abrirEditar = (clase: any) => {
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
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo descargar el machote.",
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
        const result = await uploadCsv(file, "clases");
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
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "No se pudo subir el archivo.",
          variant: "destructive",
        });
      } finally {
        setUploadingExcel(false);
      }
    };

    input.click();
  };

  const clasesFiltradas = clases?.filter((c: any) => {
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

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50/50 p-6 flex justify-center items-start">
      <Card className="shadow-md w-full flex flex-col max-h-[85vh]">
        <CardHeader className="flex flex-col sm:flex-row justify-between items-center border-b pb-4 gap-4 shrink-0">
          <CardTitle className="text-3xl font-bold text-gray-900">
            Gestión de Clases y Horarios
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={handleDescargarMachote}>
              <Download className="w-4 h-4 mr-2" /> Descargar Machote
            </Button>
            <Button
              variant="outline"
              onClick={handleCargaMasiva}
              disabled={uploadingExcel}
              className="flex items-center"
            >
              <Upload className="w-4 h-4 mr-2" />
              {uploadingExcel ? "Cargando..." : "Carga Masiva"}
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
          </div>

          {/* Contenedor adaptado exactamente como en DataTable */}
          <div className="flex-1 overflow-hidden rounded-md border">
            <div className="h-full overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 z-10">
                  <TableRow className="hover:bg-[#691C32]">
                    <TableHead className="bg-[#691C32] text-white font-semibold py-3">
                      Grupo
                    </TableHead>
                    <TableHead className="bg-[#691C32] text-white font-semibold py-3">
                      Materia
                    </TableHead>
                    <TableHead className="bg-[#691C32] text-white font-semibold py-3">
                      Docente Titular
                    </TableHead>
                    <TableHead className="bg-[#691C32] text-white font-semibold py-3">
                      Horario
                    </TableHead>
                    <TableHead className="bg-[#691C32] text-white font-semibold py-3 w-20 text-center">
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
                  ) : clasesFiltradas?.length === 0 ? (
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
                    clasesFiltradas?.map((clase: any) => (
                      <TableRow
                        key={clase.idClase}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <TableCell className="font-medium text-[#691C32]">
                          {clase.grupo?.nombre} - {clase.grupo?.turno}
                        </TableCell>
                        <TableCell>{clase.materias?.nombre}</TableCell>
                        <TableCell>
                          {clase.docente?.usuario?.nombre}{" "}
                          {clase.docente?.usuario?.apellidoPaterno}
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {clase.horario || "Sin definir"}
                        </TableCell>
                        <TableCell className="text-center">
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
