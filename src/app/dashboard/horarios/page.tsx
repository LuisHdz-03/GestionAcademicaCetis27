"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface AlumnoData {
  nombre: string;
  matricula: string;
  carrera: string;
}

export default function QrAccessPage() {
  const [alumno, setAlumno] = useState<AlumnoData | null>(null);

  // Función mock que simula un escaneo QR
  const mockScan = () => {
    const mockData: AlumnoData = {
      nombre: "Juan Pérez",
      matricula: "A12345",
      carrera: "Electrónica",
    };
    setAlumno(mockData);
  };

  const vaciarDatos = () => {
    setAlumno(null);
  };

  return (
    <div className="p-6 flex flex-col items-center gap-6">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Escaneo QR de Acceso</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          {/* Botón para simular el escaneo */}
          <Button onClick={mockScan} className="bg-[#691C32] text-white">
            Simular Escaneo QR
          </Button>

          {/* Datos del alumno */}
          {alumno ? (
            <div className="w-full border p-4 rounded-md bg-gray-50">
              <p>
                <strong>Nombre:</strong> {alumno.nombre}
              </p>
              <p>
                <strong>Matrícula:</strong> {alumno.matricula}
              </p>
              <p>
                <strong>Carrera:</strong> {alumno.carrera}
              </p>

              <Button
                variant="destructive"
                className="mt-4"
                onClick={vaciarDatos}
              >
                Vaciar datos
              </Button>
            </div>
          ) : (
            <p className="text-gray-500">Esperando escaneo...</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
