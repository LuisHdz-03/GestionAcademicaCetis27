"use client";
import { useMemo, useState } from "react";
import { useToast } from "@/hooks/useToast";
import BlockingLoader from "@/components/common/BlockingLoader";
import { downloadTemplate, uploadCsv } from "@/lib/upload";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import useEspacios from "@/hooks/useEspacios";
import { Espacio } from "@/types/community";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import EspacioModal from "@/components/common/Modal/EspacioModal";

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

export default function EspaciosPage() {
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState("");
  const [incluirInactivos, setIncluirInactivos] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  const {
    espacios,
    loading,
    saving,
    editing,
    formData,
    pagina,
    setPagina,
    paginacion,
    setEditing,
    setFormData,
    fetchEspacios,
    onSave,
    onDelete,
  } = useEspacios(tipoFiltro, incluirInactivos);

  const espaciosFiltrados = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return espacios;

    return espacios.filter((e) => {
      return (
        e.nombre.toLowerCase().includes(s) ||
        (e.descripcion || "").toLowerCase().includes(s) ||
        e.tipo.toLowerCase().includes(s)
      );
    });
  }, [espacios, search]);

  const openCreate = () => {
    setEditing(null);
    setFormData({ nombre: "", tipo: "", descripcion: "" });
    setModalOpen(true);
  };

  const handleDescargarMachote = async () => {
    try {
      await downloadTemplate("espacios");
      toast({
        title: "Éxito",
        description: "Descarga iniciada.",
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

  const handleCargarExcel = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".xlsx,.xls";

    input.onchange = async (event) => {
      const target = event.target as HTMLInputElement;
      const file = target.files?.[0];
      if (!file) return;

      setUploading(true);
      try {
        const result = await uploadCsv(file, "espacios");
        const backendMessage =
          result.data?.message || result.data?.mensaje || result.data?.error;

        if (!result.ok) {
          throw new Error(backendMessage || "No se pudo procesar el archivo.");
        }

        toast({
          title: "Éxito",
          description: backendMessage || "Archivo cargado correctamente.",
          variant: "success",
        });

        await fetchEspacios();
      } catch (error) {
        toast({
          title: "Error",
          description: getErrorMessage(error, "No se pudo subir el archivo."),
          variant: "destructive",
        });
      } finally {
        setUploading(false);
      }
    };

    input.click();
  };

  const openEdit = (espacio: Espacio) => {
    setEditing(espacio);
    setFormData({
      nombre: espacio.nombre || "",
      tipo: espacio.tipo,
      descripcion: espacio.descripcion || "",
    });
    setModalOpen(true);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50/50 p-3 sm:p-4 lg:p-6">
      <BlockingLoader
        open={uploading}
        title="Cargando espacios..."
        description="Espera mientras se procesa la carga masiva."
      />

      <Card>
        <CardHeader className="border-b space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="text-2xl sm:text-3xl font-bold text-gray-900">
              Gestión de Espacios
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" onClick={handleDescargarMachote}>
                <Download className="w-4 h-4 mr-2" /> Descargar Machote
              </Button>
              <Button
                variant="outline"
                onClick={handleCargarExcel}
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <Upload className="w-4 h-4 mr-2 animate-spin" /> Cargando...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" /> Cargar Excel
                  </>
                )}
              </Button>
              <Button
                onClick={openCreate}
                className="bg-[#691C32] hover:bg-[#4a1424] text-white"
              >
                Nuevo Espacio
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Input
              placeholder="Buscar por nombre o descripción"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="lg:col-span-2"
            />

            <Input
              placeholder="Filtrar por tipo"
              value={tipoFiltro}
              onChange={(e) => {
                setTipoFiltro(e.target.value);
                setPagina(1);
              }}
            />

            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={incluirInactivos}
                onChange={(e) => {
                  setIncluirInactivos(e.target.checked);
                  setPagina(1);
                }}
              />
              Incluir inactivos
            </label>
          </div>
        </CardHeader>

        <CardContent className="p-3 sm:p-6">
          <div className="overflow-hidden rounded-md border">
            <div className="overflow-auto">
              <Table className="min-w-[760px]">
                <TableHeader>
                  <TableRow className="hover:bg-[#691C32]">
                    <TableHead className="bg-[#691C32] text-white">
                      Nombre
                    </TableHead>
                    <TableHead className="bg-[#691C32] text-white">
                      Tipo
                    </TableHead>
                    <TableHead className="bg-[#691C32] text-white">
                      Descripción
                    </TableHead>
                    <TableHead className="bg-[#691C32] text-white">
                      Estado
                    </TableHead>
                    <TableHead className="bg-[#691C32] text-white text-center">
                      Acciones
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center py-8 text-gray-500"
                      >
                        Cargando espacios...
                      </TableCell>
                    </TableRow>
                  ) : espaciosFiltrados.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center py-8 text-gray-500"
                      >
                        No hay espacios registrados.
                      </TableCell>
                    </TableRow>
                  ) : (
                    espaciosFiltrados.map((espacio) => (
                      <TableRow key={espacio.idEspacio || espacio.id}>
                        <TableCell className="font-medium">
                          {espacio.nombre}
                        </TableCell>
                        <TableCell>{espacio.tipo || "-"}</TableCell>
                        <TableCell>{espacio.descripcion || "-"}</TableCell>
                        <TableCell>
                          {espacio.activo === false ? "Inactivo" : "Activo"}
                        </TableCell>
                        <TableCell className="text-center whitespace-nowrap">
                          <Button
                            variant="outline"
                            size="sm"
                            className="mr-2"
                            onClick={() => openEdit(espacio)}
                          >
                            Editar
                          </Button>
                          {(espacio.activo ?? true) && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => onDelete(espacio)}
                            >
                              Desactivar
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              <div className="flex items-center justify-between mt-4">
                <span className="text-sm text-gray-600">
                  Página {paginacion.paginaActual} de{" "}
                  {paginacion.paginasTotales}
                  {" • "}
                  {paginacion.totalRegistros} registros
                </span>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    disabled={pagina <= 1 || loading}
                    onClick={() => setPagina((p) => p - 1)}
                  >
                    Anterior
                  </Button>

                  <Button
                    variant="outline"
                    disabled={pagina >= paginacion.paginasTotales || loading}
                    onClick={() => setPagina((p) => p + 1)}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <EspacioModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        editing={editing}
        formData={formData}
        setFormData={setFormData}
        saving={saving}
        onSave={onSave}
      />
    </div>
  );
}
