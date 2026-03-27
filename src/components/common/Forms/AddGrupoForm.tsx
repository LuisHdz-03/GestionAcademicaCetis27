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

export interface AddGrupoFormProps {
  onSubmit: (data: GrupoFormData) => void;
  especialidades?: Especialidad[];
  docentes?: Docente[];
  materias?: Materia[];
  periodos?: Periodo[];
  initialData?: Partial<GrupoFormData>;
  mode?: "create" | "edit";
  onChangeEspecialidad?: (idEspecialidad: number) => void;
}

export default function AddGrupoForm({
  onSubmit,
  especialidades = [],
  docentes = [],
  materias = [],
  periodos = [],
  initialData,
  mode = "create",
  onChangeEspecialidad,
}: AddGrupoFormProps) {
  const [formData, setFormData] = useState<GrupoFormData>({
    codigo: initialData?.codigo || "",
    semestre: initialData?.semestre || 1,
    turno: initialData?.turno || "MATUTINO",
    aula: initialData?.aula || "",
    idPeriodo: initialData?.idPeriodo || 0,
    idDocente: initialData?.idDocente || 0,
    idMaterias: initialData?.idMaterias || [],
    idEspecialidad: initialData?.idEspecialidad || 0,
    activo: initialData?.activo ?? true,
  });

  // Estado local solo para controlar qué se muestra en el Select de materias
  const [materiaSeleccionadaParcial, setMateriaSeleccionadaParcial] =
    useState<string>("");

  useEffect(() => {
    if (initialData) {
      setFormData({
        codigo: initialData.codigo || "",
        semestre: initialData.semestre || 1,
        turno: initialData.turno || "MATUTINO",
        aula: initialData.aula || "",
        idPeriodo: initialData.idPeriodo || 0,
        idDocente: initialData.idDocente || 0,
        idMaterias: initialData.idMaterias || [],
        idEspecialidad: initialData.idEspecialidad || 0,
        activo: initialData.activo ?? true,
      });
      if (initialData.idEspecialidad && onChangeEspecialidad) {
        onChangeEspecialidad(initialData.idEspecialidad);
      }
    }
  }, [initialData, onChangeEspecialidad]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === "semestre" ? parseInt(value) || 1 : value,
    });
  };

  const handleSelectChange = (name: string, value: string) => {
    const intValue = parseInt(value);

    setFormData((prev) => {
      const updated = { ...prev, [name]: intValue };
      // Si cambia la especialidad, borramos las materias porque ya no coinciden
      if (name === "idEspecialidad") {
        updated.idMaterias = [];
      }
      return updated;
    });

    if (name === "idEspecialidad" && onChangeEspecialidad) {
      onChangeEspecialidad(intValue);
    }
  };

  // Función específica para manejar cuando se agrega una materia a la lista
  const handleAgregarMateria = (value: string) => {
    const id = parseInt(value);
    if (!isNaN(id) && !formData.idMaterias.includes(id)) {
      setFormData((prev) => ({
        ...prev,
        idMaterias: [...prev.idMaterias, id],
      }));
    }
    // Resetear el select para que puedas seguir agregando
    setMateriaSeleccionadaParcial("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.codigo ||
      !formData.semestre ||
      !formData.idPeriodo ||
      !formData.idDocente ||
      !formData.idMaterias ||
      formData.idMaterias.length === 0 ||
      !formData.idEspecialidad
    ) {
      alert(
        "Por favor completa todos los campos requeridos (incluyendo al menos 1 materia)",
      );
      return;
    }
    onSubmit(formData);
  };

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
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

      <div>
        <Label className="text-gray-700 mb-1">Turno *</Label>
        <Select
          onValueChange={(value) =>
            setFormData({ ...formData, turno: value as GrupoFormData["turno"] })
          }
          value={formData.turno}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecciona un turno" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="MATUTINO">Matutino</SelectItem>
            <SelectItem value="VESPERTINO">Vespertino</SelectItem>
            <SelectItem value="MIXTO">Mixto</SelectItem>
          </SelectContent>
        </Select>
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
                periodos.map((periodo) => {
                  const periodId = periodo.id || (periodo as any).idPeriodo;
                  if (!periodId) return null;
                  return (
                    <SelectItem key={periodId} value={periodId.toString()}>
                      <div className="whitespace-normal break-words">
                        {periodo.nombre} ({periodo.codigo})
                      </div>
                    </SelectItem>
                  );
                })
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
                    <div className="whitespace-normal break-words">
                      {esp.nombre} ({esp.codigo})
                    </div>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4">
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

        <div className="mb-4">
          <Label className="text-gray-700 mb-1">Agregar materia *</Label>
          <Select
            value={materiaSeleccionadaParcial} // Vinculado a nuestro estado temporal
            onValueChange={handleAgregarMateria} // Usa la nueva función
            disabled={!formData.idEspecialidad || materias.length === 0}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={
                  !formData.idEspecialidad
                    ? "Selecciona especialidad primero"
                    : "Selecciona una materia"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {materias.length === 0 ? (
                <SelectItem value="0" disabled>
                  {formData.idEspecialidad
                    ? "No hay materias en esta especialidad"
                    : "Selecciona especialidad primero"}
                </SelectItem>
              ) : (
                materias
                  .filter((m) => !formData.idMaterias.includes(m.id)) // Solo mostramos las que NO han sido elegidas
                  .map((materia) => (
                    <SelectItem key={materia.id} value={materia.id.toString()}>
                      {materia.nombre} ({materia.codigo})
                    </SelectItem>
                  ))
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-2">
        <Label className="text-gray-700 mb-1">Materias seleccionadas:</Label>
        <div className="flex flex-wrap gap-2 min-h-[28px] p-2 border rounded-md bg-gray-50">
          {formData.idMaterias.length === 0 ? (
            <span className="text-gray-400 text-sm">
              Ninguna materia seleccionada
            </span>
          ) : (
            formData.idMaterias.map((id) => {
              const mat = materias.find((m) => m.id === id);
              if (!mat) return null;
              return (
                <span
                  key={id}
                  className="bg-white border border-[#691C32]/30 rounded px-2 py-1 text-xs flex items-center gap-1 shadow-sm text-[#691C32] font-medium"
                >
                  {mat.nombre} ({mat.codigo})
                  <button
                    type="button"
                    className="ml-1 text-gray-400 hover:text-red-600 transition-colors bg-gray-100 rounded-full w-4 h-4 flex items-center justify-center"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        idMaterias: formData.idMaterias.filter(
                          (mid) => mid !== id,
                        ),
                      })
                    }
                    aria-label="Quitar materia"
                  >
                    ×
                  </button>
                </span>
              );
            })
          )}
        </div>
      </div>

      <Button
        type="submit"
        className="w-full bg-[#691C32] hover:bg-[#501526] text-white mt-6 transition-colors"
      >
        {mode === "edit" ? "Actualizar Grupo" : "Agregar Grupo"}
      </Button>
    </form>
  );
}
