// components/TopBar.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { useState } from "react";
import AddEspeModal from "@/components/common/Modal/AddEspeModal";
import { HiArrowDownTray } from "react-icons/hi2";
import { uploadCsv } from "@/lib/upload";

interface TopBarProps {
  onAddEspecialidad: (data: {
    nombre: string;
    codigo: string;
  }) => Promise<boolean> | Promise<void>;
}

export default function TopBar({ onAddEspecialidad }: TopBarProps) {
  const [openAddEspeModal, setOpenAddEspeModal] = useState(false);

  // Función que se llama cuando se envía el formulario dentro del modal
  const handleAddEspeSubmit = async (data: {
    nombre: string;
    codigo: string;
  }) => {
    const result = await onAddEspecialidad(data);
    setOpenAddEspeModal(false);
  };

  return (
    <div className="mb-6 flex-shrink-0">
      <Card>
        <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-800">
            Gestión de especialidades
          </h1>
          <div className="flex items-center gap-2">
            {/* Botón para cargar especialidades (simulado) */}
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => {
                const input = document.createElement("input");
                input.type = "file";
                input.accept = ".csv, .xlsx";
                input.onchange = async (e: any) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (!confirm(`¿Cargar archivo de especialidades?`)) return;
                  try {
                    const { ok, data } = await uploadCsv(
                      file,
                      "especialidades",
                    );
                    if (ok && data) {
                      alert(
                        ` Éxito: Se procesaron ${data.insertados ?? 0} registros.`,
                      );
                      if ((data.fallidos ?? 0) > 0) {
                        console.warn("Registros fallidos:", data.detalles);
                        alert(
                          `Hubo ${data.fallidos} registros fallidos. Revisa la consola.`,
                        );
                      }
                      window.location.reload();
                    } else {
                      alert(
                        ` Error: ${data?.msg || "Hubo un problema con el archivo"}`,
                      );
                    }
                  } catch (err) {
                    console.error(err);
                    alert(" Error al enviar archivo.");
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
