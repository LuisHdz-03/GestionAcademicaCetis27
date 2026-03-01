"use client";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GrupoFormData } from "@/types/modal";

interface Especialidad {
  id: number;
  nombre: string;
  codigo: string;
}

interface Periodo {
  id: number;
  nombre: string;
  codigo: string;
}

interface Docente {
  id: number;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno?: string;
}

interface Materia {
  id: number;
  nombre: string;
  codigo: string;
}

interface AddGrupoFormProps {
  onSubmit: (data: GrupoFormData) => void;
  especialidades?: Especialidad[];
  docentes?: Docente[];
  materias?: Materia[];
  periodos?: Periodo[];
  initialData?: Partial<GrupoFormData>;
  mode?: "create" | "edit";
}

export default function AddGrupoForm({
  onSubmit,
  especialidades = [],
  docentes = [],
  materias = [],
  periodos = [],
  initialData,
  mode = "create",
}: AddGrupoFormProps) {
  const [formData, setFormData] = useState<GrupoFormData>({
    codigo: initialData?.codigo || "",
    semestre: initialData?.semestre || 1,
    aula: initialData?.aula || "",
    idPeriodo: initialData?.idPeriodo || 0,
    idDocente: initialData?.idDocente || 0,
    idMateria: initialData?.idMateria || 0,
    idEspecialidad: initialData?.idEspecialidad || 0,
    activo: initialData?.activo ?? true,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        codigo: initialData.codigo || "",
        semestre: initialData.semestre || 1,
        aula: initialData.aula || "",
        idPeriodo: initialData.idPeriodo || 0,
        idDocente: initialData.idDocente || 0,
        idMateria: initialData.idMateria || 0,
        idEspecialidad: initialData.idEspecialidad || 0,
        activo: initialData.activo ?? true,
      });
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === "semestre" ? parseInt(value) || 1 : value,
    });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: parseInt(value) });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validar que todos los campos requeridos estén completos
    if (
      !formData.codigo ||
      !formData.semestre ||
      !formData.idPeriodo ||
      !formData.idDocente ||
      !formData.idMateria ||
      !formData.idEspecialidad
    ) {
      alert("Por favor completa todos los campos requeridos");
      return;
    }

    onSubmit(formData);
  };

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      {/* Mensaje informativo */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-3">
        <p className="text-sm text-blue-800">
          <strong>Nota:</strong> Asegúrate de tener periodos, especialidades,
          docentes y materias creados antes de agregar un grupo.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-gray-700 mb-1">Código del Grupo *</Label>
          <Input
            name="codigo"
            value={formData.codigo}
            onChange={handleChange}
            required
            placeholder="Ej: 1A, 2B, 3C"
          />
        </div>
        <div>
          <Label className="text-gray-700 mb-1">Semestre *</Label>
          <Input
            type="number"
            name="semestre"
            value={formData.semestre}
            onChange={handleChange}
            min="1"
            max="12"
            required
          />
        </div>
      </div>

      <div>
        <Label className="text-gray-700 mb-1">Aula</Label>
        <Input
          name="aula"
          value={formData.aula}
          onChange={handleChange}
          placeholder="Ej: A-101, B-205"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-gray-700 mb-1">Período *</Label>
          <Select
            onValueChange={(value) => handleSelectChange("idPeriodo", value)}
            value={
              formData.idPeriodo && formData.idPeriodo > 0
                ? formData.idPeriodo.toString()
                : undefined
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un período" />
            </SelectTrigger>
            <SelectContent>
              {periodos.length === 0 ? (
                <SelectItem value="0" disabled>
                  No hay períodos disponibles
                </SelectItem>
              ) : (
                periodos.map((periodo) => (
                  <SelectItem key={periodo.id} value={periodo.id.toString()}>
                    {periodo.nombre} ({periodo.codigo})
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-gray-700 mb-1">Especialidad *</Label>
          <Select
            onValueChange={(value) =>
              handleSelectChange("idEspecialidad", value)
            }
            value={
              formData.idEspecialidad && formData.idEspecialidad > 0
                ? formData.idEspecialidad.toString()
                : undefined
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona una especialidad" />
            </SelectTrigger>
            <SelectContent>
              {especialidades.length === 0 ? (
                <SelectItem value="0" disabled>
                  No hay especialidades disponibles
                </SelectItem>
              ) : (
                especialidades.map((esp) => (
                  <SelectItem key={esp.id} value={esp.id.toString()}>
                    {esp.nombre} ({esp.codigo})
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-gray-700 mb-1">Docente *</Label>
          <Select
            onValueChange={(value) => handleSelectChange("idDocente", value)}
            value={
              formData.idDocente && formData.idDocente > 0
                ? formData.idDocente.toString()
                : undefined
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un docente" />
            </SelectTrigger>
            <SelectContent>
              {docentes.length === 0 ? (
                <SelectItem value="0" disabled>
                  No hay docentes disponibles
                </SelectItem>
              ) : (
                docentes.map((docente) => (
                  <SelectItem key={docente.id} value={docente.id.toString()}>
                    {docente.nombre} {docente.apellidoPaterno}{" "}
                    {docente.apellidoMaterno || ""}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-gray-700 mb-1">Materia *</Label>
          <Select
            onValueChange={(value) => handleSelectChange("idMateria", value)}
            value={
              formData.idMateria && formData.idMateria > 0
                ? formData.idMateria.toString()
                : undefined
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona una materia" />
            </SelectTrigger>
            <SelectContent>
              {materias.length === 0 ? (
                <SelectItem value="0" disabled>
                  No hay materias disponibles
                </SelectItem>
              ) : (
                materias.map((materia) => (
                  <SelectItem key={materia.id} value={materia.id.toString()}>
                    {materia.nombre} ({materia.codigo})
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button
        type="submit"
        className="w-full bg-[#691C32] hover:bg-[#691C32]/90 text-white mt-4"
      >
        {mode === "edit" ? "Actualizar Grupo" : "Agregar Grupo"}
      </Button>
    </form>
  );
}
