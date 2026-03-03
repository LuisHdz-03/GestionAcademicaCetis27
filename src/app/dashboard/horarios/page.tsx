"use client";

import { useEffect, useState } from "react";
import { useCommunity } from "@/hooks/useCommunity";
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
import { Search, Plus } from "lucide-react";

export default function HorariosPage() {
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
    loading,
  } = useCommunity();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

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

  // buscar horarios en tiempo real
  const clasesFiltradas = clases?.filter((c: any) => {
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
          <Button
            onClick={() => setIsModalOpen(true)}
            className="bg-[#691C32] hover:bg-[#4a1424] text-white flex items-center gap-2"
          >
            <Plus className="w-5 h-5" /> Nueva Asignación
          </Button>
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading && clasesFiltradas?.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center py-8 text-gray-500"
                      >
                        Cargando clases...
                      </TableCell>
                    </TableRow>
                  ) : clasesFiltradas?.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center py-8 text-gray-500"
                      >
                        No se encontraron clases registradas.
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
    </div>
  );
}
