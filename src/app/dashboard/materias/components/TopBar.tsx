// components/TopBar.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, Plus } from "lucide-react";
import { useState } from "react";
import AddEspeModal from "@/components/common/Modal/AddEspeModal";
import BlockingLoader from "@/components/common/BlockingLoader";
import { HiArrowDownTray } from "react-icons/hi2";
import { downloadTemplate, uploadCsv } from "@/lib/upload";

interface TopBarProps {
  onAddEspecialidad: (data: {
    nombre: string;
    codigo: string;
    descripcion: string;
  }) => Promise<boolean> | Promise<void>;
}

export default function TopBar({ onAddEspecialidad }: TopBarProps) {
  const [openAddEspeModal, setOpenAddEspeModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Función centralizada para subir CSV con overlay de carga
  const enviarArchivoAlBackend = async (file: File) => {
    setIsUploading(true);
    try {
      const { ok, data } = await uploadCsv(file, "especialidades");
      if (ok) {
        const insertados =
          data?.insertados ?? data?.inserted ?? data?.successCount ?? 0;
        const fallidos = data?.fallidos ?? data?.failed ?? 0;
        alert(`Éxito: Se procesaron ${insertados} registros.`);
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
          `Error: ${data?.msg || data?.message || "Hubo un problema con el archivo"}`,
        );
      }
    } catch (error) {
      console.error("Error al enviar archivo:", error);
      alert("Error de conexión con el servidor.");
    } finally {
      setIsUploading(false);
    }
  };

  // Función que se llama cuando se envía el formulario dentro del modal
  const handleAddEspeSubmit = async (data: {
    nombre: string;
    codigo: string;
    descripcion: string;
  }) => {
    await onAddEspecialidad(data);
    setOpenAddEspeModal(false);
  };

  const handleDescargarMachote = async () => {
    try {
      await downloadTemplate("especialidades");
    } catch (error) {
      console.error("Error al descargar plantilla de especialidades:", error);
      alert("Error de conexión al descargar la plantilla.");
    }
  };

  return (
    <div className="mb-6 flex-shrink-0">
      <BlockingLoader
        open={isUploading}
        title="Cargando especialidades..."
        description="Espera mientras se procesa la carga masiva."
      />

      <Card>
        <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-800">
            Gestión de especialidades
          </h1>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              type="button"
              className="flex items-center gap-2"
              onClick={handleDescargarMachote}
            >
              <Download className="w-4 h-4" />
              Descargar Machote
            </Button>

            {/* Botón para cargar especialidades por CSV */}
            <Button
              variant="outline"
              className="flex items-center gap-2"
              disabled={isUploading}
              onClick={() => {
                const input = document.createElement("input");
                input.type = "file";
                input.accept = ".csv, .xlsx";
                input.onchange = () => {
                  const file = input.files?.[0];
                  if (file && confirm(`¿Cargar archivo de especialidades?`)) {
                    enviarArchivoAlBackend(file);
                  }
                };
                input.click();
              }}
            >
              <HiArrowDownTray className="w-4 h-4" />
              Cargar Especialidades
            </Button>

            {/* Botón que abre el modal de añadir especialidad */}
            <Button
              onClick={() => setOpenAddEspeModal(true)}
              className="bg-[#691C32] text-white hover:bg-[#50172A]"
            >
              <Plus className="mr-2 h-4 w-4" />
              Especialidad
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Modal para añadir especialidad */}
      <AddEspeModal
        open={openAddEspeModal}
        onOpenChange={setOpenAddEspeModal}
        onSubmit={handleAddEspeSubmit}
      />
    </div>
  );
}
