// components/EspecialidadesList.tsx
"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Especialidad {
  nombre: string;
  codigo: string;
}

interface Props {
  especialidades: Especialidad[];
  selectedEspecialidad: string;
  setSelectedEspecialidad: (codigo: string) => void;
}

export default function EspecialidadesList({
  especialidades,
  selectedEspecialidad,
  setSelectedEspecialidad,
}: Props) {
  return (
    <aside className="w-full lg:w-80 flex-shrink-0">
      <Card className="h-full flex flex-col">
        <CardHeader className="flex-shrink-0">
          <CardTitle className="text-lg">Especialidades</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto">
          <div className="space-y-2">
            {especialidades.map((especialidad) => (
              <Button
                key={especialidad.nombre}
                variant={
                  selectedEspecialidad === especialidad.codigo
                    ? "default"
                    : "outline"
                }
                onClick={() => setSelectedEspecialidad(especialidad.codigo)}
                className={`w-full justify-start rounded-md border h-auto py-4 text-left whitespace-normal focus-visible:ring-2 focus-visible:ring-[#691C32] ${
                  selectedEspecialidad === especialidad.codigo
                    ? "bg-[#691C32] text-white hover:bg-[#691C32]/90"
                    : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                <div className="flex flex-col items-start">
                  <p className="font-semibold break-words">
                    {especialidad.nombre}
                  </p>
                  <p
                    className={`text-sm ${
                      selectedEspecialidad === especialidad.codigo
                        ? "text-red-100"
                        : "text-gray-500"
                    }`}
                  >
                    Código: {especialidad.codigo}
                  </p>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </aside>
  );
}
